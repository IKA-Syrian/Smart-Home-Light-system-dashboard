// Arduino middleware for error handling and logging

export const arduinoErrorHandler = (err, req, res, next) => {
    console.error('Arduino Error:', err.message);
    
    // Check if it's an Arduino-specific error
    if (err.message.includes('Serial Port') || err.message.includes('Arduino')) {
        return res.status(503).json({
            status: 'error',
            message: 'Arduino communication error',
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }
    
    // Pass to next error handler if not Arduino-related
    next(err);
};

export const arduinoRequestLogger = (req, res, next) => {
    // Log Arduino API requests
    if (req.path.startsWith('/arduino') || req.path.startsWith('/pir') || 
        req.path.startsWith('/leds') || req.path.startsWith('/status')) {
        console.log(`Arduino API: ${req.method} ${req.path} - ${new Date().toISOString()}`);
        
        // Log request body for POST requests (excluding sensitive data)
        if (req.method === 'POST' && req.body) {
            console.log('Request body:', req.body);
        }
    }
    
    next();
};

export const validateLedId = (req, res, next) => {
    const ledId = parseInt(req.params.id);
    
    if (isNaN(ledId) || ledId < 0 || ledId >= 3) { // NUM_LEDS = 3
        return res.status(400).json({
            status: 'error',
            message: 'Invalid LED ID. Must be 0, 1, or 2.',
            receivedId: req.params.id
        });
    }
    
    req.ledId = ledId; // Store parsed LED ID for use in route handlers
    next();
}; 