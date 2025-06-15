import db from '../models/index.js'; // Updated import

// Create a new device
export const createDevice = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const { room_id, name, type, status, is_on, brightness, color_hex } = req.body;

        // Validate required fields
        if (!name || !type) {
            return res.status(400).json({ message: 'Device name and type are required' });
        }

        // Optional: Check if room_id belongs to the user if provided
        if (room_id) {
            const room = await db.Room.findOne({ where: { room_id: room_id, user_id: userId } });
            if (!room) {
                return res.status(400).json({ message: 'Room not found or unauthorized' });
            }
        }

        const newDevice = await db.Device.create({
            user_id: userId,
            room_id: room_id || null, // Ensure room_id can be null if not provided
            name,
            type,
            status,
            is_on,
            brightness,
            color_hex,
        });

        res.status(201).json({ message: 'Device created successfully', device: newDevice });
    } catch (error) {
        console.error('Error creating device:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific device by ID
export const getDeviceById = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const deviceId = req.params.id;

        const device = await db.Device.findOne({
            where: { device_id: deviceId, user_id: userId },
            // include: [db.Room] // Optionally include associated room
        });

        if (device) {
            res.status(200).json(device);
        } else {
            res.status(404).json({ message: 'Device not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching device by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a device by ID
export const updateDevice = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const deviceId = req.params.id;
        const { room_id, name, type, status, is_on, brightness, color_hex } = req.body;

        // Optional: Check if room_id belongs to the user if provided in update data
        if (room_id) {
            const room = await db.Room.findOne({ where: { room_id: room_id, user_id: userId } });
            if (!room) {
                return res.status(400).json({ message: 'Room not found or unauthorized for assignment' });
            }
        }

        const updateData = {};
        if (room_id !== undefined) updateData.room_id = room_id; // Allow setting room_id to null
        if (name) updateData.name = name;
        if (type) updateData.type = type;
        if (status) updateData.status = status;
        if (is_on !== undefined) updateData.is_on = is_on;
        if (brightness !== undefined) updateData.brightness = brightness;
        if (color_hex) updateData.color_hex = color_hex;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        const [affectedRows] = await db.Device.update(updateData, {
            where: { device_id: deviceId, user_id: userId }
        });

        if (affectedRows > 0) {
            const updatedDevice = await db.Device.findOne({ where: { device_id: deviceId, user_id: userId } });
            res.status(200).json({ message: 'Device updated successfully', device: updatedDevice });
        } else {
            const deviceExists = await db.Device.findOne({ where: { device_id: deviceId, user_id: userId } });
            if (!deviceExists) {
                return res.status(404).json({ message: 'Device not found or unauthorized' });
            }
            res.status(400).json({ message: 'Failed to update device, no changes made, or unauthorized' });
        }
    } catch (error) {
        console.error('Error updating device:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update device state (on/off, brightness, color)
export const updateDeviceState = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const deviceId = req.params.id;
        const { is_on, brightness, color_hex, status } = req.body;

        const stateData = {};
        if (is_on !== undefined) stateData.is_on = is_on;
        if (brightness !== undefined) stateData.brightness = brightness; // Allow 0 for brightness
        if (color_hex) stateData.color_hex = color_hex;
        if (status) stateData.status = status;

        if (Object.keys(stateData).length === 0) {
            return res.status(400).json({ message: 'No state data provided' });
        }

        const [affectedRows] = await db.Device.update(stateData, {
            where: { device_id: deviceId, user_id: userId }
        });

        if (affectedRows > 0) {
            const updatedDevice = await db.Device.findOne({ where: { device_id: deviceId, user_id: userId } });
            res.status(200).json({ message: 'Device state updated successfully', device: updatedDevice });
        } else {
            const deviceExists = await db.Device.findOne({ where: { device_id: deviceId, user_id: userId } });
            if (!deviceExists) {
                return res.status(404).json({ message: 'Device not found or unauthorized' });
            }
            res.status(400).json({ message: 'Failed to update device state, no changes made, or unauthorized' });
        }
    } catch (error) {
        console.error('Error updating device state:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a device by ID
export const deleteDevice = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to id
        const deviceId = req.params.id;

        const affectedRows = await db.Device.destroy({
            where: { device_id: deviceId, user_id: userId }
        });

        if (affectedRows > 0) {
            res.status(200).json({ message: 'Device deleted successfully' });
        } else {
            res.status(404).json({ message: 'Device not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error deleting device:', error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Cannot delete device as it may be associated with other records (e.g., sensors, schedules). Remove associations first.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all devices for the authenticated user
export const getAllDevices = async (req, res) => {
    try {
        const userId = req.user.id;
        const { roomId, type } = req.query;

        const whereClause = { user_id: userId };
        if (roomId) {
            whereClause.room_id = roomId;
        }
        if (type) {
            whereClause.type = type;
        }

        const devices = await db.Device.findAll({
            where: whereClause,
            // include: [db.Room] // Optionally include associated room
        });
        // Return devices array directly
        res.status(200).json(devices);
    } catch (error) {
        console.error('Error fetching all devices:', error);
        // Consistent error response structure
        res.status(500).json({ message: 'Internal server error' });
    }
};
