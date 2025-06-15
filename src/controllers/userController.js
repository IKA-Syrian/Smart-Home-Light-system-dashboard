import db from '../models/index.js'; // Updated import
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

// Register a new user
export const registerUser = async (req, res) => {
    try {
        const { username, password, email, role } = req.body;        // Check if user already exists
        const existingUser = await db.User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists'
            });
        }// For some reason our hooks aren't working as expected, so let's directly set the password_hash
        // Generate a hash for the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt); const newUser = await db.User.create({
            username,
            password_hash: passwordHash,
            email,
            role
        });

        // Generate JWT token for the new user
        const token = jwt.sign(
            { userId: newUser.user_id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Return both token and user data (excluding password hash)
        const userData = {
            user_id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            created_at: newUser.created_at,
            updated_at: newUser.updated_at,
            last_login_at: null
        };

        res.status(201).json({
            success: true,
            data: { token, user: userData },
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Error registering user:', error);        // Check for Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Login user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;        // Find user by email instead of username
        const user = await db.User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Validate password
        const isMatch = await user.validatePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Update last login time
        await db.User.update({ last_login_at: new Date() }, { where: { user_id: user.user_id } });        // Generate JWT token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role }, // Corrected to userId
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Return both token and user data (excluding password hash)
        const userData = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            created_at: user.created_at,
            updated_at: user.updated_at,
            last_login_at: new Date()
        };

        res.status(200).json({
            success: true,
            data: { token, user: userData },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Get user profile (requires authentication)
export const getUserProfile = async (req, res) => {
    console.log('[getUserProfile Controller] Entered. Path:', req.originalUrl);
    console.log('[getUserProfile Controller] req.user from auth middleware:', JSON.stringify(req.user));
    try {
        // User ID is available from the authenticated request
        const userId = req.user.id; // Corrected to req.user.id
        console.log('[getUserProfile Controller] Attempting to find user with ID:', userId);

        const user = await db.User.findByPk(userId, {
            attributes: { exclude: ['password_hash'] } // Exclude password hash
        });

        if (!user) {
            console.log('[getUserProfile Controller] User not found in DB for ID:', userId);
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        console.log('[getUserProfile Controller] User found, sending success response. User:', JSON.stringify(user));
        res.status(200).json({
            success: true,
            data: user,
            message: 'User profile retrieved successfully'
        });
    } catch (error) {
        console.error('[getUserProfile Controller] Error fetching user profile. Path:', req.originalUrl, 'Error:', error.message, 'Stack:', error.stack);
        console.error('[getUserProfile Controller] req.user at time of error:', JSON.stringify(req.user));
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};

// Update user profile (requires authentication)
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to req.user.id
        const { email, currentPassword, newPassword } = req.body; const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const updateData = {};
        if (email) {
            updateData.email = email;
        }        // If newPassword is provided, currentPassword must also be provided and correct
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is required to change password'
                });
            }
            const isMatch = await user.validatePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Incorrect current password'
                });
            }

            // Directly hash the new password since hooks aren't working
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(newPassword, salt);
            updateData.password_hash = passwordHash;
        } else if (currentPassword && !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password is required if current password is provided'
            });
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No update data provided'
            });
        }

        const [affectedRows] = await db.User.update(updateData, {
            where: { user_id: userId },
            individualHooks: true // Ensure beforeUpdate hook is triggered for password hashing
        });

        if (affectedRows > 0) {
            const updatedUser = await db.User.findByPk(userId, {
                attributes: { exclude: ['password_hash'] }
            });
            res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'User profile updated successfully'
            });
        } else {
            // This case might happen if the data provided is the same as existing data,
            // or if the user was not found (though we check this earlier).
            res.status(400).json({
                success: false,
                error: 'Failed to update user profile or no changes made'
            });
        }
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({ message: 'Validation error', errors: messages });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete user (requires authentication)
export const deleteUser = async (req, res) => {
    try {
        const userId = req.user.id; // Corrected to req.user.id

        const affectedRows = await db.User.destroy({ where: { user_id: userId } });

        if (affectedRows > 0) {
            res.status(200).json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found or already deleted' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await db.User.findAll({
            attributes: { exclude: ['password_hash'] } // Exclude password hash
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
