import db from '../models/index.js'; // Updated import

// Create a new room
export const createRoom = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from authenticated request
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        const newRoom = await db.Room.create({ user_id: userId, name });
        res.status(201).json({ message: 'Room created successfully', room: newRoom });
    } catch (error) {
        console.error('Error creating room:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific room by ID
export const getRoomById = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomId = req.params.id;

        const room = await db.Room.findOne({
            where: { room_id: roomId, user_id: userId },
            // Optionally include associated devices and sensors if needed directly here
            // include: [
            //   { model: db.Device, as: 'devices' }, // Ensure alias matches association if set
            //   { model: db.Sensor, as: 'sensors' }  // Ensure alias matches association if set
            // ]
        });

        if (room) {
            res.status(200).json(room);
        } else {
            res.status(404).json({ message: 'Room not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching room by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a room by ID
export const updateRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomId = req.params.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Room name is required for update' });
        }

        const [affectedRows] = await db.Room.update(
            { name },
            { where: { room_id: roomId, user_id: userId } }
        );

        if (affectedRows > 0) {
            const updatedRoom = await db.Room.findOne({ where: { room_id: roomId, user_id: userId } });
            res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
        } else {
            // Check if the room exists but name was the same or room not found/unauthorized
            const roomExists = await db.Room.findOne({ where: { room_id: roomId, user_id: userId } });
            if (!roomExists) {
                return res.status(404).json({ message: 'Room not found or unauthorized' });
            }
            res.status(400).json({ message: 'Failed to update room, no changes made, or unauthorized' });
        }
    } catch (error) {
        console.error('Error updating room:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a room by ID
export const deleteRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomId = req.params.id;

        const affectedRows = await db.Room.destroy({
            where: { room_id: roomId, user_id: userId }
        });

        if (affectedRows > 0) {
            res.status(200).json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ message: 'Room not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        // Handle potential foreign key constraint errors if not handled by ON DELETE CASCADE/SET NULL
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(409).json({ message: 'Cannot delete room as it may contain devices or sensors. Please remove them first or ensure they can be disassociated.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all rooms for the authenticated user
export const getAllRooms = async (req, res) => {
    try {
        const userId = req.user.id;
        const rooms = await db.Room.findAll({ where: { user_id: userId } });
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching all rooms:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get devices in a specific room
export const getDevicesInRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomId = req.params.id;

        // Check if the room belongs to the user
        const room = await db.Room.findOne({ where: { room_id: roomId, user_id: userId } });
        if (!room) {
            return res.status(404).json({ message: 'Room not found or unauthorized' });
        }

        const devices = await db.Device.findAll({ where: { room_id: roomId, user_id: userId } });
        res.status(200).json(devices);
    } catch (error) {
        console.error('Error fetching devices in room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get sensors in a specific room
export const getSensorsInRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const roomId = req.params.id;

        // Check if the room belongs to the user
        const room = await db.Room.findOne({ where: { room_id: roomId, user_id: userId } });
        if (!room) {
            return res.status(404).json({ message: 'Room not found or unauthorized' });
        }
        // Assuming Sensor model has user_id and room_id as per schema and model definitions
        const sensors = await db.Sensor.findAll({ where: { room_id: roomId, user_id: userId } });
        res.status(200).json(sensors);
    } catch (error) {
        console.error('Error fetching sensors in room:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
