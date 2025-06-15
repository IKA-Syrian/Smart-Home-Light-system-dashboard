import db from '../models/index.js'; // Updated import

// Create a new sensor
export const createSensor = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const { device_id, type, value } = req.body;

        // Validate required fields
        if (!device_id || !type) {
            return res.status(400).json({ message: 'Device ID and sensor type are required' });
        }

        // Check if device belongs to the user
        const device = await db.Device.findOne({ where: { device_id: device_id, user_id: userId } });
        if (!device) {
            return res.status(400).json({ message: 'Device not found or unauthorized' });
        }

        const newSensor = await db.Sensor.create({
            device_id,
            type,
            value,
            last_read_at: new Date()
        });

        res.status(201).json({ message: 'Sensor created successfully', sensor: newSensor });
    } catch (error) {
        console.error('Error creating sensor:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific sensor by ID
export const getSensorById = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const sensorId = req.params.id;

        const sensor = await db.Sensor.findOne({
            where: { sensor_id: sensorId },
            include: [{
                model: db.Device,
                where: { user_id: userId },
                attributes: ['device_id', 'name', 'room_id'] // Only include relevant device info
            }]
        });

        if (sensor) {
            res.status(200).json(sensor);
        } else {
            res.status(404).json({ message: 'Sensor not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching sensor by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a sensor by ID
export const updateSensor = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const sensorId = req.params.id;
        const { device_id, type, value } = req.body;

        // Check if the sensor exists and belongs to user (via device)
        const sensor = await db.Sensor.findOne({
            where: { sensor_id: sensorId },
            include: [{
                model: db.Device,
                where: { user_id: userId }
            }]
        });

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found or unauthorized' });
        }

        // If device_id is being changed, check if new device belongs to user
        if (device_id && device_id !== sensor.device_id) {
            const newDevice = await db.Device.findOne({ where: { device_id: device_id, user_id: userId } });
            if (!newDevice) {
                return res.status(400).json({ message: 'New device not found or unauthorized' });
            }
        }

        const updateData = {};
        if (device_id) updateData.device_id = device_id;
        if (type) updateData.type = type;
        if (value !== undefined) updateData.value = value;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        const [affectedRows] = await db.Sensor.update(updateData, {
            where: { sensor_id: sensorId }
        });

        if (affectedRows > 0) {
            const updatedSensor = await db.Sensor.findByPk(sensorId, { include: [db.Device] });
            res.status(200).json({ message: 'Sensor updated successfully', sensor: updatedSensor });
        } else {
            res.status(400).json({ message: 'Failed to update sensor, no changes made' });
        }
    } catch (error) {
        console.error('Error updating sensor:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Record a sensor reading
export const recordSensorReading = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const sensorId = req.params.id;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ message: 'Sensor value is required' });
        }

        // Check if sensor exists and belongs to user (via device)
        const sensor = await db.Sensor.findOne({
            where: { sensor_id: sensorId },
            include: [{
                model: db.Device,
                where: { user_id: userId }
            }]
        });

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found or unauthorized' });
        }

        const [affectedRows] = await db.Sensor.update(
            { value: value, last_read_at: new Date() },
            { where: { sensor_id: sensorId } }
        );

        if (affectedRows > 0) {
            // Optionally log this event
            await db.EventLog.create({
                user_id: userId,
                device_id: sensor.device_id,
                sensor_id: sensorId,
                event_type: 'sensor_reading',
                description: `Sensor reading recorded: ${value}`
            });

            res.status(200).json({ message: 'Sensor reading recorded successfully' });
        } else {
            res.status(400).json({ message: 'Failed to record sensor reading' });
        }
    } catch (error) {
        console.error('Error recording sensor reading:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a sensor by ID
export const deleteSensor = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const sensorId = req.params.id;

        // Check if sensor exists and belongs to user (via device)
        const sensor = await db.Sensor.findOne({
            where: { sensor_id: sensorId },
            include: [{
                model: db.Device,
                where: { user_id: userId }
            }]
        });

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found or unauthorized' });
        }

        const affectedRows = await db.Sensor.destroy({
            where: { sensor_id: sensorId }
        });

        if (affectedRows > 0) {
            res.status(200).json({ message: 'Sensor deleted successfully' });
        } else {
            res.status(404).json({ message: 'Sensor not found' });
        }
    } catch (error) {
        console.error('Error deleting sensor:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Cannot delete sensor as it may be associated with other records. Remove associations first.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all sensors for the authenticated user
export const getAllSensors = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deviceId, type } = req.query;

        const includeOptions = {
            model: db.Device,
            where: { user_id: userId },
            attributes: ['device_id', 'name', 'room_id']
        };

        if (deviceId) {
            includeOptions.where.device_id = deviceId;
        }

        const whereClause = {};
        if (type) {
            whereClause.type = type;
        }

        const sensors = await db.Sensor.findAll({
            where: whereClause,
            include: [includeOptions]
        });
        res.status(200).json(sensors);
    } catch (error) {
        console.error('Error fetching all sensors:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get sensor reading history (this would require a separate readings table in a real app)
export const getSensorReadingHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const sensorId = req.params.id;
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;

        // Check if sensor exists and belongs to user
        const sensor = await db.Sensor.findOne({
            where: { sensor_id: sensorId },
            include: [{
                model: db.Device,
                where: { user_id: userId }
            }]
        });

        if (!sensor) {
            return res.status(404).json({ message: 'Sensor not found or unauthorized' });
        }

        // For now, return the current sensor value - in a real app you'd have a separate readings table
        res.status(200).json({
            sensor_id: sensorId,
            current_value: sensor.value,
            last_read_at: sensor.last_read_at,
            message: 'Historical readings would require a separate readings table for full implementation'
        });
    } catch (error) {
        console.error('Error fetching sensor reading history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
