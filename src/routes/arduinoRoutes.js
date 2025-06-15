import express from 'express';
import arduinoController from '../controllers/arduinoController.js';

const router = express.Router();

/**
 * @swagger
 * /arduino/pir/enable:
 *   post:
 *     summary: Enable PIR sensor
 *     tags: [Arduino PIR]
 *     responses:
 *       200:
 *         description: PIR sensor enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       503:
 *         description: Service unavailable - Arduino communication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/pir/enable', async (req, res) => {
    try {
        const result = await arduinoController.enablePIR();
        res.json(result);
    } catch (error) {
        res.status(503).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/pir/disable:
 *   post:
 *     summary: Disable PIR sensor
 *     tags: [Arduino PIR]
 *     responses:
 *       200:
 *         description: PIR sensor disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       503:
 *         description: Service unavailable - Arduino communication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/pir/disable', async (req, res) => {
    try {
        const result = await arduinoController.disablePIR();
        res.json(result);
    } catch (error) {
        res.status(503).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/motionconfig:
 *   post:
 *     summary: Configure motion detection for LED
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LEDMotionConfigInput'
 *     responses:
 *       200:
 *         description: LED motion configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/motionconfig', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const { active } = req.body;

        if (isNaN(ledId) || typeof active !== "boolean") {
            return res.status(400).json({
                status: "error",
                message: "Invalid input. LED ID must be a number and active must be a boolean."
            });
        }

        const result = await arduinoController.setLEDMotionConfig(ledId, active);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/manual/on:
 *   post:
 *     summary: Turn LED on manually
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED turned on successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/manual/on', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.setLEDManualOn(ledId);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/manual/off:
 *   post:
 *     summary: Turn LED off manually
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED turned off successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/manual/off', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.setLEDManualOff(ledId);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/brightness:
 *   post:
 *     summary: Set LED brightness level
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LEDBrightnessInput'
 *     responses:
 *       200:
 *         description: LED brightness set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/brightness', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const { level } = req.body;

        if (isNaN(ledId) || typeof level !== 'number' || isNaN(level) || level < 0 || level > 255) {
            return res.status(400).json({
                status: "error",
                message: "Invalid input. LED ID must be a number and level must be a number between 0-255."
            });
        }

        const result = await arduinoController.setLEDBrightness(ledId, level);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/auto:
 *   post:
 *     summary: Enable LED auto mode (motion-activated)
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED auto mode enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/auto', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.setLEDAuto(ledId);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/schedule:
 *   post:
 *     summary: Schedule LED for specific duration
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LEDScheduleInput'
 *     responses:
 *       200:
 *         description: LED scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     ledId:
 *                       type: integer
 *                     durationSeconds:
 *                       type: integer
 *                     expectedOffTimeUTC:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/schedule', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const { duration_seconds } = req.body;
        const duration = parseInt(duration_seconds);

        if (isNaN(ledId) || isNaN(duration) || duration <= 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid input. LED ID and duration_seconds must be positive numbers."
            });
        }

        const result = await arduinoController.setLEDSchedule(ledId, duration);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/dailyschedule:
 *   post:
 *     summary: Set a daily schedule for LED
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyScheduleInput'
 *     responses:
 *       200:
 *         description: Daily schedule set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyScheduleResponse'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/leds/:id/dailyschedule', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const { onHour, onMinute, offHour, offMinute } = req.body;

        if (isNaN(ledId) || isNaN(onHour) || isNaN(onMinute) || isNaN(offHour) || isNaN(offMinute)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid input. All parameters must be numbers."
            });
        }

        const result = await arduinoController.setDailySchedule(ledId, onHour, onMinute, offHour, offMinute);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/schedules/clear:
 *   post:
 *     summary: Clear all daily schedules
 *     tags: [Arduino LEDs]
 *     responses:
 *       200:
 *         description: All schedules cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error clearing schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/schedules/clear', async (req, res) => {
    try {
        const result = await arduinoController.clearAllSchedules();
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/energy:
 *   get:
 *     summary: Get energy usage for an LED
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnergyResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/leds/:id/energy', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.getLEDEnergy(ledId);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/energy:
 *   get:
 *     summary: Get energy usage for all LEDs
 *     tags: [Arduino LEDs]
 *     responses:
 *       200:
 *         description: Energy data for all LEDs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AllEnergyResponse'
 *       400:
 *         description: Error retrieving energy data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/energy', async (req, res) => {
    try {
        const fullStatus = await arduinoController.getStatus();

        if (!fullStatus || !fullStatus.leds) {
            return res.status(400).json({
                status: "error",
                message: "Failed to retrieve LED status"
            });
        }

        const energyData = fullStatus.leds.map(led => ({
            ledId: led.id,
            energyToday: led.energyToday
        }));

        const totalEnergy = energyData.reduce((sum, led) => sum + led.energyToday, 0);

        res.json({
            status: "success",
            energyData,
            totalEnergyToday: totalEnergy
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/status:
 *   get:
 *     summary: Get full Arduino system status
 *     tags: [Arduino Status]
 *     responses:
 *       200:
 *         description: Arduino status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 parsedStatus:
 *                   $ref: '#/components/schemas/ArduinoStatus'
 *       503:
 *         description: Service unavailable - Arduino communication error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status', async (req, res) => {
    try {
        const status = await arduinoController.getStatus();
        res.json({
            status: 'success',
            data: status
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/leds/{id}/status:
 *   get:
 *     summary: Get specific LED status
 *     tags: [Arduino Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 ledStatus:
 *                   $ref: '#/components/schemas/LEDStatus'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: LED not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/leds/:id/status', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.getLEDStatus(ledId);
        res.json(result);
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/connection:
 *   get:
 *     summary: Get Arduino connection information
 *     tags: [Arduino Status]
 *     responses:
 *       200:
 *         description: Connection information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 connection:
 *                   $ref: '#/components/schemas/ArduinoConnection'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/connection', (req, res) => {
    const connectionInfo = arduinoController.getConnectionInfo();
    res.json({
        status: 'success',
        data: connectionInfo
    });
});

/**
 * @swagger
 * /arduino/status/current:
 *   get:
 *     summary: Get current cached Arduino status (fast)
 *     tags: [Arduino Status]
 *     responses:
 *       200:
 *         description: Current status retrieved from cache
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: success
 *                     parsedStatus:
 *                       $ref: '#/components/schemas/ArduinoStatus'
 *                 - type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: info
 *                     message:
 *                       type: string
 *                       example: No status available yet. Please request fresh status.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status/current', (req, res) => {
    try {
        const currentStatus = arduinoController.getCurrentStatus();
        if (currentStatus) {
            res.json({
                status: "success",
                parsedStatus: currentStatus
            });
        } else {
            res.json({
                status: "info",
                message: "No status available yet. Please request fresh status."
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id:
 *   get:
 *     summary: Get specific LED status
 *     tags: [Arduino Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 ledStatus:
 *                   $ref: '#/components/schemas/LEDStatus'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: LED not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/led/:id', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.getLEDStatus(ledId);
        res.json(result);
    } catch (error) {
        res.status(404).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/energy:
 *   get:
 *     summary: Get energy usage for an LED
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: Energy data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnergyResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/led/:id/energy', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);

        if (isNaN(ledId)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid LED ID."
            });
        }

        const result = await arduinoController.getLEDEnergy(ledId);
        res.json(result);
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/power:
 *   get:
 *     summary: Get current power consumption
 *     tags: [Arduino LEDs]
 *     responses:
 *       200:
 *         description: Current power consumption retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PowerResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/power', async (req, res) => {
    try {
        const powerData = await arduinoController.getCurrentPower();
        res.json(powerData);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/reset-energy:
 *   post:
 *     summary: Reset energy counters
 *     tags: [Arduino LEDs]
 *     responses:
 *       200:
 *         description: Energy counters reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-energy', async (req, res) => {
    try {
        const result = await arduinoController.resetEnergyCounters();
        res.json({
            status: 'success',
            message: 'Energy counters reset successfully',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/motion/:status:
 *   post:
 *     summary: Set LED motion activation
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [on, off]
 *         description: LED motion activation status
 *     responses:
 *       200:
 *         description: LED motion activation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/motion/:status', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const active = req.params.status === 'on';

        const result = await arduinoController.setLEDMotionConfig(ledId, active);

        res.json({
            status: 'success',
            message: `LED ${ledId} motion activation ${active ? 'enabled' : 'disabled'}`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/on:
 *   post:
 *     summary: Turn LED on manually
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED turned on successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/on', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const result = await arduinoController.setLEDManualOn(ledId);

        res.json({
            status: 'success',
            message: `LED ${ledId} turned on`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/off:
 *   post:
 *     summary: Turn LED off manually
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED turned off successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/off', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const result = await arduinoController.setLEDManualOff(ledId);

        res.json({
            status: 'success',
            message: `LED ${ledId} turned off`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/brightness/:level:
 *   post:
 *     summary: Set LED brightness level
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 255
 *         description: LED brightness level
 *     responses:
 *       200:
 *         description: LED brightness set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID or level
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/brightness/:level', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const level = parseInt(req.params.level);

        const result = await arduinoController.setLEDBrightness(ledId, level);

        res.json({
            status: 'success',
            message: `LED ${ledId} brightness set to ${level}`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/auto:
 *   post:
 *     summary: Enable LED auto mode (motion-activated)
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     responses:
 *       200:
 *         description: LED auto mode enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/auto', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const result = await arduinoController.setLEDAuto(ledId);

        res.json({
            status: 'success',
            message: `LED ${ledId} set to auto mode`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/schedule/:duration:
 *   post:
 *     summary: Schedule LED for specific duration
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *       - in: path
 *         name: duration
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: LED schedule duration in seconds
 *     responses:
 *       200:
 *         description: LED scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid LED ID or duration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/schedule/:duration', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const duration = parseInt(req.params.duration);

        const result = await arduinoController.setLEDSchedule(ledId, duration);

        res.json({
            status: 'success',
            message: `LED ${ledId} scheduled for ${duration} seconds`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/led/:id/daily-schedule:
 *   post:
 *     summary: Set a daily schedule for LED
 *     tags: [Arduino LEDs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 2
 *         description: LED ID (0, 1, or 2)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyScheduleInput'
 *     responses:
 *       200:
 *         description: Daily schedule set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyScheduleResponse'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/led/:id/daily-schedule', async (req, res) => {
    try {
        const ledId = parseInt(req.params.id);
        const { onHour, onMinute, offHour, offMinute } = req.body;

        if (isNaN(onHour) || isNaN(onMinute) || isNaN(offHour) || isNaN(offMinute)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid time format. All values must be numbers.'
            });
        }

        const result = await arduinoController.setDailySchedule(
            ledId,
            parseInt(onHour),
            parseInt(onMinute),
            parseInt(offHour),
            parseInt(offMinute)
        );

        res.json({
            status: 'success',
            message: `Daily schedule set for LED ${ledId}`,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/clear-schedules:
 *   post:
 *     summary: Clear all daily schedules
 *     tags: [Arduino LEDs]
 *     responses:
 *       200:
 *         description: All schedules cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Error clearing schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/clear-schedules', async (req, res) => {
    try {
        const result = await arduinoController.clearAllSchedules();

        res.json({
            status: 'success',
            message: 'All schedules cleared',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/schedules/apply:
 *   post:
 *     summary: Apply all active schedules to the Arduino
 *     tags: [Arduino Schedules]
 *     responses:
 *       200:
 *         description: Schedules applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Error applying schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/schedules/apply', async (req, res) => {
    try {
        // Use the scheduler service to apply all schedules
        const schedulerService = (await import('../services/schedulerService.js')).default;
        const results = await schedulerService.applyDailySchedules();

        res.json({
            status: "success",
            message: "All schedules applied successfully",
            data: results
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/schedules/clear:
 *   post:
 *     summary: Clear all schedules from Arduino
 *     tags: [Arduino Schedules]
 *     responses:
 *       200:
 *         description: Schedules cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Error clearing schedules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/schedules/clear', async (req, res) => {
    try {
        const result = await arduinoController.clearAllSchedules();

        res.json({
            status: "success",
            message: "All schedules cleared successfully",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

/**
 * @swagger
 * /arduino/schedules/debug:
 *   get:
 *     summary: Get debug information about scheduled jobs
 *     tags: [Arduino Schedules]
 *     responses:
 *       200:
 *         description: Debug information about scheduled jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Error getting scheduler debug info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/schedules/debug', async (req, res) => {
    try {
        // Import services
        const redisSchedulerService = (await import('../services/redisSchedulerService.js')).default;
        const schedulerService = (await import('../services/schedulerService.js')).default;

        // Get Redis scheduler info
        const redisStatus = await redisSchedulerService.checkConnection();
        const pendingJobs = await redisSchedulerService.getPendingJobs();

        // Get job dates in local timezone for easier debugging
        const formatJobs = (jobs) => {
            return Array.isArray(jobs) ? jobs.map(job => {
                // Ensure all job data is safe to stringify
                const safeJob = {
                    id: job.id || 'unknown',
                    data: job.data || {},
                    timestamp: job.timestamp ? new Date(job.timestamp).toLocaleString() : 'N/A',
                    timeUntilExecution: job.timestamp ?
                        Math.floor((new Date(job.timestamp).getTime() - Date.now()) / 1000) + ' seconds' :
                        'N/A',
                    delay: job.delay || 0,
                    jobId: job.jobId || 'unknown'
                };

                // No circular references here
                return safeJob;
            }) : [];
        };

        // Create safe version of scheduler jobs
        const formatSchedulerJobs = (jobs) => {
            if (!Array.isArray(jobs)) return [];

            return jobs.map(job => ({
                name: job.name || 'unknown',
                schedule: job.schedule || 'unknown',
                description: job.description || '',
                // Exclude any potential circular references
                nextInvocation: job.nextInvocation ? job.nextInvocation.toLocaleString() : 'N/A'
            }));
        };

        // Current date and time in local format
        const now = new Date();

        const result = {
            status: "success",
            currentTime: now.toLocaleString(),
            timestamp: now.getTime(),
            redis: {
                connected: redisStatus.connected,
                message: redisStatus.message,
                status: pendingJobs.status,
                onJobs: formatJobs(pendingJobs.onJobs),
                offJobs: formatJobs(pendingJobs.offJobs),
                fallbackJobs: formatJobs(pendingJobs.jobs || [])
            },
            scheduler: {
                initialized: schedulerService.isInitialized,
                jobs: formatSchedulerJobs(schedulerService.getJobs())
            },
            databaseSchedules: await getActiveSchedules()
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

// Helper function to get all active schedules
async function getActiveSchedules() {
    try {
        // Get database instance
        const db = (await import('../models/index.js')).default;

        // Get all active schedules
        const schedules = await db.Schedule.findAll({
            where: {
                is_active: true
            },
            order: [['led_id', 'ASC']]
        });

        return schedules.map(s => {
            // Format on and off times for readability
            const onTime = `${String(s.on_hour).padStart(2, '0')}:${String(s.on_minute).padStart(2, '0')}`;
            const offTime = `${String(s.off_hour).padStart(2, '0')}:${String(s.off_minute).padStart(2, '0')}`;

            // Calculate when it would next run
            const now = new Date();
            const onDateTime = new Date();
            onDateTime.setHours(s.on_hour, s.on_minute, 0, 0);
            if (onDateTime < now) {
                onDateTime.setDate(onDateTime.getDate() + 1);
            }

            const offDateTime = new Date();
            offDateTime.setHours(s.off_hour, s.off_minute, 0, 0);
            if (offDateTime < now) {
                offDateTime.setDate(offDateTime.getDate() + 1);
            }

            return {
                id: s.schedule_id,
                ledId: s.led_id,
                deviceId: s.device_id,
                onTime,
                offTime,
                isDailySchedule: s.is_daily_schedule,
                isActive: s.is_active,
                nextOnTime: onDateTime.toLocaleString(),
                nextOffTime: offDateTime.toLocaleString(),
                lastApplied: s.last_applied ? new Date(s.last_applied).toLocaleString() : 'Never',
                timeUntilNextOn: Math.floor((onDateTime.getTime() - now.getTime()) / 1000) + ' seconds',
                timeUntilNextOff: Math.floor((offDateTime.getTime() - now.getTime()) / 1000) + ' seconds'
            };
        });
    } catch (error) {
        console.error('Error getting active schedules:', error);
        return { error: error.message };
    }
}

/**
 * @swagger
 * /arduino/reset:
 *   post:
 *     summary: Reset Arduino serial connection
 *     tags: [Arduino System]
 *     responses:
 *       200:
 *         description: Arduino connection reset attempted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       503:
 *         description: Service unavailable - Arduino reset failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset', async (req, res) => {
    try {
        const result = await arduinoController.resetConnection();
        res.json(result);
    } catch (error) {
        res.status(503).json({
            status: "error",
            message: error.message
        });
    }
});

export default router; 