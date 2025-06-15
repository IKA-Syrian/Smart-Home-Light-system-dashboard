import db from '../models/index.js';

// Create a new scene
export const createScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        const scene = await db.Scene.create({ user_id: userId, name });
        res.status(201).json({ message: 'Scene created successfully', sceneId: scene.scene_id });
    } catch (error) {
        console.error('Error creating scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific scene by ID
export const getSceneById = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;

        const scene = await db.Scene.findOne({
            where: { scene_id: sceneId, user_id: userId },
            include: [
                {
                    model: db.Device,
                    through: {
                        attributes: ['is_on', 'brightness', 'color_hex']
                    },
                    attributes: ['device_id', 'name', 'type']
                }
            ]
        });

        if (scene) {
            res.status(200).json(scene);
        } else {
            res.status(404).json({ message: 'Scene not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching scene by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a scene by ID
export const updateScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;
        const sceneData = req.body;

        const [updatedRowsCount] = await db.Scene.update(sceneData, {
            where: { scene_id: sceneId, user_id: userId }
        });

        if (updatedRowsCount > 0) {
            res.status(200).json({ message: 'Scene updated successfully' });
        } else {
            res.status(400).json({ message: 'Failed to update scene or unauthorized' });
        }
    } catch (error) {
        console.error('Error updating scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a scene by ID
export const deleteScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;

        const deletedRowsCount = await db.Scene.destroy({
            where: { scene_id: sceneId, user_id: userId }
        });

        if (deletedRowsCount > 0) {
            res.status(200).json({ message: 'Scene deleted successfully' });
        } else {
            res.status(400).json({ message: 'Failed to delete scene or unauthorized' });
        }
    } catch (error) {
        console.error('Error deleting scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all scenes for the authenticated user
export const getAllScenes = async (req, res) => {
    try {
        const userId = req.user.id;
        const scenes = await db.Scene.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: db.Device,
                    through: {
                        attributes: ['is_on', 'brightness', 'color_hex']
                    },
                    attributes: ['device_id', 'name', 'type']
                }
            ],
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(scenes);
    } catch (error) {
        console.error('Error fetching all scenes:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add a device to a scene
export const addDeviceToScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;
        const { device_id, is_on, brightness, color_hex } = req.body;

        // Check if the scene belongs to the user
        const scene = await db.Scene.findOne({
            where: { scene_id: sceneId, user_id: userId }
        });
        if (!scene) {
            return res.status(404).json({ message: 'Scene not found or unauthorized' });
        }

        // Check if the device belongs to the user
        const device = await db.Device.findOne({
            where: { device_id: device_id, user_id: userId }
        });
        if (!device) {
            return res.status(400).json({ message: 'Device not found or unauthorized' });
        }

        // Add device to scene through junction table
        await db.Scene_Device_Settings.create({
            scene_id: sceneId,
            device_id: device_id,
            is_on: is_on,
            brightness: brightness,
            color_hex: color_hex
        });

        res.status(200).json({ message: 'Device added to scene successfully' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Device is already in this scene' });
        }
        console.error('Error adding device to scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Remove a device from a scene
export const removeDeviceFromScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;
        const deviceId = req.params.deviceId;

        // Check if the scene belongs to the user
        const scene = await db.Scene.findOne({
            where: { scene_id: sceneId, user_id: userId }
        });
        if (!scene) {
            return res.status(404).json({ message: 'Scene not found or unauthorized' });
        }

        const deletedRowsCount = await db.Scene_Device_Settings.destroy({
            where: { scene_id: sceneId, device_id: deviceId }
        });

        if (deletedRowsCount > 0) {
            res.status(200).json({ message: 'Device removed from scene successfully' });
        } else {
            res.status(400).json({ message: 'Device not found in scene' });
        }
    } catch (error) {
        console.error('Error removing device from scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get devices in a scene
export const getDevicesInScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;

        // Check if the scene belongs to the user
        const scene = await db.Scene.findOne({
            where: { scene_id: sceneId, user_id: userId },
            include: [
                {
                    model: db.Device,
                    through: {
                        attributes: ['is_on', 'brightness', 'color_hex']
                    },
                    attributes: ['device_id', 'name', 'type', 'status']
                }
            ]
        });

        if (!scene) {
            return res.status(404).json({ message: 'Scene not found or unauthorized' });
        }

        res.status(200).json(scene.Devices);
    } catch (error) {
        console.error('Error fetching devices in scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Activate a scene
export const activateScene = async (req, res) => {
    try {
        const userId = req.user.id;
        const sceneId = req.params.id;

        // Get the scene with its devices
        const scene = await db.Scene.findOne({
            where: { scene_id: sceneId, user_id: userId },
            include: [
                {
                    model: db.Device,
                    through: {
                        attributes: ['is_on', 'brightness', 'color_hex']
                    },
                    attributes: ['device_id', 'name', 'type']
                }
            ]
        });

        if (!scene) {
            return res.status(404).json({ message: 'Scene not found or unauthorized' });
        }

        // Apply scene settings to each device
        const updatePromises = scene.Devices.map(device => {
            const settings = device.Scene_Device_Settings;
            return db.Device.update({
                is_on: settings.is_on,
                brightness: settings.brightness,
                color_hex: settings.color_hex
            }, {
                where: { device_id: device.device_id }
            });
        });

        await Promise.all(updatePromises);

        // Log the scene activation
        await db.EventLog.create({
            user_id: userId,
            event_type: 'scene_activated',
            description: `Scene "${scene.name}" was activated`,
            metadata: JSON.stringify({ scene_id: sceneId, scene_name: scene.name })
        });

        res.status(200).json({ message: 'Scene activated successfully' });
    } catch (error) {
        console.error('Error activating scene:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
