import express from 'express';
import dailyScheduleController from '../controllers/dailyScheduleController.js';

const router = express.Router();

/**
 * @swagger
 * /api/dailyschedules:
 *   post:
 *     summary: Create a new daily schedule
 *     tags: [Daily Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, device_id, led_id, on_hour, on_minute, off_hour, off_minute]
 *             properties:
 *               user_id:
 *                 type: integer
 *               device_id:
 *                 type: integer
 *               led_id:
 *                 type: integer
 *               on_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               on_minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *               off_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               off_minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *     responses:
 *       201:
 *         description: Daily schedule created successfully
 *       200:
 *         description: Daily schedule updated successfully
 *       400:
 *         description: Invalid input parameters
 *       404:
 *         description: Device not found
 *       500:
 *         description: Server error
 */
router.post('/', dailyScheduleController.createDailySchedule);

/**
 * @swagger
 * /api/dailyschedules/users/{userId}:
 *   get:
 *     summary: Get all daily schedules for a user
 *     tags: [Daily Schedules]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Daily schedules retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/users/:userId', dailyScheduleController.getUserDailySchedules);

/**
 * @swagger
 * /api/dailyschedules/devices/{deviceId}:
 *   get:
 *     summary: Get all daily schedules for a device
 *     tags: [Daily Schedules]
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Daily schedules retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/devices/:deviceId', dailyScheduleController.getDeviceDailySchedules);

/**
 * @swagger
 * /api/dailyschedules/{scheduleId}:
 *   get:
 *     summary: Get a specific daily schedule
 *     tags: [Daily Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Daily schedule retrieved successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.get('/:scheduleId', dailyScheduleController.getDailySchedule);

/**
 * @swagger
 * /api/dailyschedules/{scheduleId}:
 *   put:
 *     summary: Update a daily schedule
 *     tags: [Daily Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               on_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               on_minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *               off_hour:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 23
 *               off_minute:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 59
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Daily schedule updated successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.put('/:scheduleId', dailyScheduleController.updateDailySchedule);

/**
 * @swagger
 * /api/dailyschedules/{scheduleId}:
 *   delete:
 *     summary: Delete a daily schedule
 *     tags: [Daily Schedules]
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Daily schedule deleted successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.delete('/:scheduleId', dailyScheduleController.deleteDailySchedule);

/**
 * @swagger
 * /api/dailyschedules/apply:
 *   post:
 *     summary: Apply all active schedules to the Arduino
 *     tags: [Daily Schedules]
 *     responses:
 *       200:
 *         description: Schedules applied successfully
 *       500:
 *         description: Server error
 */
router.post('/apply', dailyScheduleController.applyAllSchedules);

/**
 * @swagger
 * /api/dailyschedules/clear:
 *   post:
 *     summary: Clear all schedules from Arduino
 *     tags: [Daily Schedules]
 *     responses:
 *       200:
 *         description: Schedules cleared successfully
 *       500:
 *         description: Server error
 */
router.post('/clear', dailyScheduleController.clearAllSchedules);

export default router; 