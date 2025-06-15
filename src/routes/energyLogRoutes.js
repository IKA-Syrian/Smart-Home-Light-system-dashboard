import express from 'express';
import energyLogController from '../controllers/energyLogController.js';

const router = express.Router();

/**
 * @swagger
 * /api/energy:
 *   get:
 *     summary: Get all energy logs with pagination
 *     tags: [Energy]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Energy logs retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/', energyLogController.getAllEnergyLogs);

/**
 * @swagger
 * /api/energy/record:
 *   post:
 *     summary: Record energy data from Arduino
 *     tags: [Energy]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, device_id]
 *             properties:
 *               user_id:
 *                 type: integer
 *               device_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Energy data recorded successfully
 *       400:
 *         description: Invalid input parameters
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.post('/record', energyLogController.recordEnergyData);

/**
 * @swagger
 * /api/energy/current:
 *   get:
 *     summary: Get current energy usage from Arduino
 *     tags: [Energy]
 *     responses:
 *       200:
 *         description: Current energy data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/current', energyLogController.getCurrentEnergyData);

/**
 * @swagger
 * /api/energy/devices/{deviceId}/leds/{ledId}:
 *   get:
 *     summary: Get energy data for a specific LED for a date range
 *     tags: [Energy]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: ledId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *       400:
 *         description: Missing date parameters
 *       500:
 *         description: Server error
 */
router.get('/devices/:deviceId/leds/:ledId', energyLogController.getLedEnergyData);

/**
 * @swagger
 * /api/energy/devices/{deviceId}:
 *   get:
 *     summary: Get energy data for all LEDs of a device for a date range
 *     tags: [Energy]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *       400:
 *         description: Missing date parameters
 *       500:
 *         description: Server error
 */
router.get('/devices/:deviceId', energyLogController.getDeviceEnergyData);

/**
 * @swagger
 * /api/energy/users/{userId}:
 *   get:
 *     summary: Get energy data for all devices of a user for a date range
 *     tags: [Energy]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *       400:
 *         description: Missing date parameters
 *       500:
 *         description: Server error
 */
router.get('/users/:userId', energyLogController.getUserEnergyData);

/**
 * @swagger
 * /api/energy/recent:
 *   get:
 *     summary: Get energy data for the last 60 minutes
 *     tags: [Energy]
 *     responses:
 *       200:
 *         description: Recent energy data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/recent', energyLogController.getRecentEnergyData);

/**
 * @swagger
 * /api/energy/recent/devices/{deviceId}:
 *   get:
 *     summary: Get energy data for the last 60 minutes for a specific device
 *     tags: [Energy]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Recent energy data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/recent/devices/:deviceId', energyLogController.getRecentEnergyData);

/**
 * @swagger
 * /api/energy/recent/devices/{deviceId}/leds/{ledId}:
 *   get:
 *     summary: Get energy data for the last 60 minutes for a specific LED
 *     tags: [Energy]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: true
 *       - in: path
 *         name: ledId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Recent energy data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/recent/devices/:deviceId/leds/:ledId', energyLogController.getRecentEnergyData);

export default router; 