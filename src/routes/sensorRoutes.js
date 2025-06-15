import express from 'express';
import { createSensor, getSensorById, updateSensor, recordSensorReading, deleteSensor, getAllSensors, getSensorReadingHistory } from '../controllers/sensorController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All sensor routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/sensors:
 *   get:
 *     summary: Get all sensors
 *     tags: [Sensors]
 *     responses:
 *       200:
 *         description: List of all sensors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sensor'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllSensors);

/**
 * @swagger
 * /api/sensors/{id}:
 *   get:
 *     summary: Get sensor by ID
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       404:
 *         description: Sensor not found
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
router.get('/:id', getSensorById);

/**
 * @swagger
 * /api/sensors:
 *   post:
 *     summary: Create a new sensor
 *     tags: [Sensors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - deviceId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sensor name
 *               type:
 *                 type: string
 *                 description: Sensor type (e.g., temperature, humidity, motion)
 *               value:
 *                 type: string
 *                 description: Current sensor value
 *               unit:
 *                 type: string
 *                 description: Unit of measurement
 *               deviceId:
 *                 type: integer
 *                 description: Device ID the sensor belongs to
 *     responses:
 *       201:
 *         description: Sensor created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
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
router.post('/', createSensor);

/**
 * @swagger
 * /api/sensors/{id}:
 *   put:
 *     summary: Update sensor by ID
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sensor name
 *               type:
 *                 type: string
 *                 description: Sensor type
 *               value:
 *                 type: string
 *                 description: Current sensor value
 *               unit:
 *                 type: string
 *                 description: Unit of measurement
 *               deviceId:
 *                 type: integer
 *                 description: Device ID the sensor belongs to
 *     responses:
 *       200:
 *         description: Sensor updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sensor not found
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
router.put('/:id', updateSensor);

/**
 * @swagger
 * /api/sensors/{id}/value:
 *   patch:
 *     summary: Update sensor value
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sensor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: string
 *                 description: New sensor value
 *               unit:
 *                 type: string
 *                 description: Unit of measurement (optional)
 *     responses:
 *       200:
 *         description: Sensor value updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sensor'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Sensor not found
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
router.patch('/:id/value', recordSensorReading);

/**
 * @swagger
 * /api/sensors/{id}:
 *   delete:
 *     summary: Delete sensor by ID
 *     tags: [Sensors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sensor ID
 *     responses:
 *       200:
 *         description: Sensor deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sensor deleted successfully
 *       404:
 *         description: Sensor not found
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
router.delete('/:id', deleteSensor);

// Route for sensor reading history
router.get('/:id/history', getSensorReadingHistory);

export default router;
