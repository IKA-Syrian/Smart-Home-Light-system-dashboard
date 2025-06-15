import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUser, getAllUsers } from '../controllers/userController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Authenticated routes - Specific routes first
router.get('/profile', authenticate, getUserProfile);
router.put('/profile', authenticate, updateUserProfile);
router.delete('/profile', authenticate, deleteUser);

// Admin routes - Implemented GET for all users
router.get('/', authenticate, isAdmin, getAllUsers);

// --- Swagger Placeholder/Example Routes ---
// These were causing conflicts. If these are to be actual endpoints,
// they need their own controller functions and proper placement to avoid clashes.
// For now, they are commented out or will be shadowed by the implemented routes above.

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Implemented above with auth)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// router.get('/', (req, res) => {
//     res.json({ message: 'Get all users (Placeholder)' });
// });

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (Placeholder - needs implementation if required)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
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
router.get('/:id', (req, res) => { // This should ideally be an implemented route or removed if not used
    // If you need a "get user by ID" endpoint, implement it with a controller:
    // import { getUserByIdController } from '../controllers/userController.js';
    // router.get('/:id', authenticate, getUserByIdController);
    res.status(404).json({ message: `Get user ${req.params.id} - Endpoint not fully implemented` });
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Public /register is implemented above)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists
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
// router.post('/', (req, res) => { // Conflicts with /register if not careful, or should be admin-only
//     // The public user creation is POST /api/users/register
//     res.status(404).json({ message: 'Create user (Placeholder - use /register or implement admin create)' });
// });

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID (Placeholder - /profile is for self-update)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
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
router.put('/:id', (req, res) => { // This should be an implemented route (e.g., admin update user) or removed
    // The self-update is PUT /api/users/profile
    // If for admin updating other users, it needs a controller and auth checks.
    res.status(404).json({ message: `Update user ${req.params.id} (Placeholder - Endpoint not fully implemented)` });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID (Placeholder - /profile is for self-delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
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
router.delete('/:id', (req, res) => { // This should be an implemented route (e.g., admin delete user) or removed
    // The self-delete is DELETE /api/users/profile
    // If for admin deleting other users, it needs a controller and auth checks.
    res.status(404).json({ message: `Delete user ${req.params.id} (Placeholder - Endpoint not fully implemented)` });
});

export default router;
