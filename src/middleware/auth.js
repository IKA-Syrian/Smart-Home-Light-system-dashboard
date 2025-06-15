import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to verify JWT token
export const authenticate = (req, res, next) => {
    console.log('[Auth Middleware] Entered for path:', req.originalUrl);
    console.log('[Auth Middleware] Headers:', JSON.stringify(req.headers));
    try {
        const authHeader = req.headers.authorization;
        console.log('[Auth Middleware] Auth Header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[Auth Middleware] Failed: No/Invalid Auth Header. Path:', req.originalUrl);
            return res.status(401).json({ message: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        console.log('[Auth Middleware] Token extracted:', token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token decoded successfully:', JSON.stringify(decoded));

        // Add user info to request object
        req.user = {
            id: decoded.userId,
            role: decoded.role
        };
        console.log('[Auth Middleware] Attached req.user:', JSON.stringify(req.user), '. Path:', req.originalUrl);

        next();
    } catch (error) {
        console.error('[Auth Middleware] Error during authentication. Path:', req.originalUrl, 'Error:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
    }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Admin access required' });
    }
};

// Middleware to check if user is accessing their own resources
export const isResourceOwner = (req, res, next) => {
    // Extract resource userId from request - implementation depends on route
    const resourceUserId = parseInt(req.resourceUserId);

    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
        next();
    } else {
        return res.status(403).json({ message: 'Unauthorized access to this resource' });
    }
};
