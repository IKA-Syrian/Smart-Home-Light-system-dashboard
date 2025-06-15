import express from 'express';
import { getAllEventLogs, getEventLogById } from '../controllers/eventLogController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/eventlogs:
 *   get:
 *     summary: Get all event logs
 *     tags: [Event Logs]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of event logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of event logs to skip for pagination
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events before this date
 *     responses:
 *       200:
 *         description: List of event logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventLog'
 *                 total:
 *                   type: integer
 *                   description: Total number of events
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       400:
 *         description: Invalid query parameters
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
router.get('/', getAllEventLogs);

/**
 * @swagger
 * /api/eventlogs/{id}:
 *   get:
 *     summary: Get event log by ID
 *     tags: [Event Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event log ID
 *     responses:
 *       200:
 *         description: Event log found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventLog'
 *       404:
 *         description: Event log not found
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
router.get('/:id', getEventLogById);

// Future: POST /api/eventlogs - Could be used for manual log injection if needed (admin only)
// router.post('/', authenticate, isAdmin, createEventLog); // Example if manual creation is needed

/**
 * @swagger
 * /api/eventlogs:
 *   post:
 *     summary: Create a new event log
 *     tags: [Event Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventType
 *               - description
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Type of the event
 *                 example: device_status_change
 *               description:
 *                 type: string
 *                 description: Description of the event
 *                 example: Device temperature sensor went offline
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the event
 *                 example:
 *                   deviceId: 123
 *                   previousStatus: online
 *                   newStatus: offline
 *                   roomId: 5
 *     responses:
 *       201:
 *         description: Event log created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventLog'
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
router.post('/', (req, res) => {
    res.json({ message: 'Create event log', data: req.body });
});

/**
 * @swagger
 * /api/eventlogs/{id}:
 *   put:
 *     summary: Update event log by ID
 *     tags: [Event Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventType:
 *                 type: string
 *                 description: Type of the event
 *               description:
 *                 type: string
 *                 description: Description of the event
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the event
 *     responses:
 *       200:
 *         description: Event log updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventLog'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event log not found
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
router.put('/:id', (req, res) => {
    res.json({ message: `Update event log ${req.params.id}`, data: req.body });
});

/**
 * @swagger
 * /api/eventlogs/{id}:
 *   delete:
 *     summary: Delete event log by ID
 *     tags: [Event Logs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event log ID
 *     responses:
 *       200:
 *         description: Event log deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event log deleted successfully
 *       404:
 *         description: Event log not found
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
router.delete('/:id', (req, res) => {
    res.json({ message: `Delete event log ${req.params.id}` });
});

/**
 * @swagger
 * /api/eventlogs/bulk/delete:
 *   delete:
 *     summary: Bulk delete event logs
 *     tags: [Event Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of event log IDs to delete
 *               olderThan:
 *                 type: string
 *                 format: date-time
 *                 description: Delete all events older than this date
 *               eventType:
 *                 type: string
 *                 description: Delete all events of this type
 *     responses:
 *       200:
 *         description: Event logs deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event logs deleted successfully
 *                 deletedCount:
 *                   type: integer
 *                   description: Number of event logs deleted
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
router.delete('/bulk/delete', (req, res) => {
    res.json({ message: 'Bulk delete event logs', data: req.body });
});

export default router;
