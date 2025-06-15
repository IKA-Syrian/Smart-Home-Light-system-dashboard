import express from 'express';
import { createScene, getSceneById, updateScene, deleteScene, getAllScenes, addDeviceToScene, removeDeviceFromScene, getDevicesInScene, activateScene } from '../controllers/sceneController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All scene routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/scenes:
 *   get:
 *     summary: Get all scenes
 *     tags: [Scenes]
 *     responses:
 *       200:
 *         description: List of all scenes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Scene'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllScenes);

/**
 * @swagger
 * /api/scenes/{id}:
 *   get:
 *     summary: Get scene by ID
 *     tags: [Scenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scene ID
 *     responses:
 *       200:
 *         description: Scene found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scene'
 *       404:
 *         description: Scene not found
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
router.get('/:id', getSceneById);

/**
 * @swagger
 * /api/scenes:
 *   post:
 *     summary: Create a new scene
 *     tags: [Scenes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Scene name
 *               description:
 *                 type: string
 *                 description: Scene description
 *               actions:
 *                 type: object
 *                 description: Actions to perform when scene is activated
 *                 example:
 *                   devices:
 *                     - id: 1
 *                       action: "turn_on"
 *                     - id: 2
 *                       action: "set_brightness"
 *                       value: 75
 *     responses:
 *       201:
 *         description: Scene created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scene'
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
router.post('/', createScene);

/**
 * @swagger
 * /api/scenes/{id}:
 *   put:
 *     summary: Update scene by ID
 *     tags: [Scenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scene ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Scene name
 *               description:
 *                 type: string
 *                 description: Scene description
 *               actions:
 *                 type: object
 *                 description: Actions to perform when scene is activated
 *     responses:
 *       200:
 *         description: Scene updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scene'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Scene not found
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
router.put('/:id', updateScene);

/**
 * @swagger
 * /api/scenes/{id}/activate:
 *   post:
 *     summary: Activate a scene
 *     tags: [Scenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scene ID
 *     responses:
 *       200:
 *         description: Scene activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scene activated successfully
 *                 sceneId:
 *                   type: integer
 *                 actionsExecuted:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Scene not found
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
router.post('/:id/activate', activateScene);

/**
 * @swagger
 * /api/scenes/{id}:
 *   delete:
 *     summary: Delete scene by ID
 *     tags: [Scenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scene ID
 *     responses:
 *       200:
 *         description: Scene deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Scene deleted successfully
 *       404:
 *         description: Scene not found
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
router.delete('/:id', deleteScene);

// Routes for managing devices within a scene
router.post('/:id/devices', addDeviceToScene);
router.delete('/:id/devices/:deviceId', removeDeviceFromScene);
router.get('/:id/devices', getDevicesInScene);

export default router;
