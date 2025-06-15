import express from 'express';
import { createSchedule, getScheduleById, updateSchedule, deleteSchedule, getAllSchedules } from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';
import redisSchedulerService from '../services/redisSchedulerService.js';

const router = express.Router();

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of all schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticate, getAllSchedules);

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticate, getScheduleById);

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cronExpression
 *             properties:
 *               name:
 *                 type: string
 *                 description: Schedule name
 *               cronExpression:
 *                 type: string
 *                 description: Cron expression for scheduling
 *                 example: "0 8 * * *"
 *               actions:
 *                 type: object
 *                 description: Actions to perform when schedule triggers
 *                 example:
 *                   devices:
 *                     - id: 1
 *                       action: "turn_on"
 *                   scenes:
 *                     - id: 2
 *               active:
 *                 type: boolean
 *                 description: Whether the schedule is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, createSchedule);

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Update schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Schedule name
 *               cronExpression:
 *                 type: string
 *                 description: Cron expression for scheduling
 *               actions:
 *                 type: object
 *                 description: Actions to perform when schedule triggers
 *               active:
 *                 type: boolean
 *                 description: Whether the schedule is active
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Schedule'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', authenticate, updateSchedule);

/**
 * @swagger
 * /api/schedules/{id}/toggle:
 *   patch:
 *     summary: Toggle schedule active status
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Schedule status toggled successfully
 *                 schedule:
 *                   $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: Schedule not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/toggle', authenticate, (req, res) => {
    res.json({ message: `Toggle schedule ${req.params.id}` });
});

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Schedule deleted successfully
 */
router.delete('/:id', authenticate, deleteSchedule);

// New Redis scheduler endpoints with authentication
/**
 * @swagger
 * /schedules/redis/reload:
 *   post:
 *     summary: Reload all active schedules into Redis
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: Schedules loaded into Redis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 scheduledJobs:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.post('/redis/reload', authenticate, async (req, res) => {
    try {
        const scheduledJobs = await redisSchedulerService.scheduleAllDailySchedules();
        res.json({
            message: `Successfully scheduled ${scheduledJobs.length} jobs in Redis`,
            scheduledJobs
        });
    } catch (error) {
        console.error('Error loading schedules into Redis:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /schedules/redis/jobs:
 *   get:
 *     summary: Get all pending Redis scheduled jobs
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of pending jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 */
router.get('/redis/jobs', authenticate, async (req, res) => {
    try {
        const jobs = await redisSchedulerService.getPendingJobs();
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching Redis jobs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /schedules/redis/clear:
 *   post:
 *     summary: Clear all Redis scheduled jobs
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: All jobs cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/redis/clear', authenticate, async (req, res) => {
    try {
        await redisSchedulerService.clearAllJobs();
        res.json({ message: 'All Redis scheduled jobs cleared' });
    } catch (error) {
        console.error('Error clearing Redis jobs:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
