import db from '../models/index.js';

// Get all event logs (admin only or filtered)
export const getAllEventLogs = async (req, res) => {
    try {
        const { limit = 50, offset = 0, event_type, device_id, sensor_id } = req.query;

        // Build where clause
        const whereClause = {};

        // If the user is not an admin, enforce filtering by their user_id
        if (req.user.role !== 'admin') {
            whereClause.user_id = req.user.id;
        } else if (req.query.user_id) {
            whereClause.user_id = req.query.user_id;
        }

        // Add other filters
        if (event_type) whereClause.event_type = event_type;
        if (device_id) whereClause.device_id = device_id;
        if (sensor_id) whereClause.sensor_id = sensor_id;

        const logs = await db.EventLog.findAll({
            where: whereClause,
            include: [
                {
                    model: db.User,
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: db.Device,
                    attributes: ['device_id', 'name', 'type'],
                    required: false
                },
                {
                    model: db.Sensor,
                    attributes: ['sensor_id', 'name', 'type'],
                    required: false
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching event logs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific event log by ID (primarily for admin or debugging)
export const getEventLogById = async (req, res) => {
    try {
        const logId = req.params.id;

        const log = await db.EventLog.findByPk(logId, {
            include: [
                {
                    model: db.User,
                    attributes: ['user_id', 'username', 'email']
                },
                {
                    model: db.Device,
                    attributes: ['device_id', 'name', 'type'],
                    required: false
                },
                {
                    model: db.Sensor,
                    attributes: ['sensor_id', 'name', 'type'],
                    required: false
                }
            ]
        });

        if (log) {
            // If user is not admin, check if they have rights to this log (e.g. if it's their user_id)
            if (req.user.role !== 'admin' && log.user_id !== req.user.id) {
                return res.status(403).json({ message: 'Forbidden: You do not have access to this log.' });
            }
            res.status(200).json(log);
        } else {
            res.status(404).json({ message: 'Event log not found' });
        }
    } catch (error) {
        console.error('Error fetching event log by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
