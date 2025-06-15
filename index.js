import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpecs from './src/config/swagger.js';
import userRoutes from './src/routes/userRoutes.js';
import roomRoutes from './src/routes/roomRoutes.js';
import deviceRoutes from './src/routes/deviceRoutes.js';
import sensorRoutes from './src/routes/sensorRoutes.js';
import sceneRoutes from './src/routes/sceneRoutes.js';
import scheduleRoutes from './src/routes/scheduleRoutes.js';
import eventLogRoutes from './src/routes/eventLogRoutes.js';
import arduinoRoutes from './src/routes/arduinoRoutes.js';
import energyLogRoutes from './src/routes/energyLogRoutes.js';
import db from './src/models/index.js';
import websocketService from './src/services/websocketService.js';
import schedulerService from './src/services/schedulerService.js';
import redisSchedulerService from './src/services/redisSchedulerService.js';
import arduinoController from './src/controllers/arduinoController.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create an HTTP server for Express
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket service
websocketService.initialize(server);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IoT Project API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
    },
}));

// IoT API Routes
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/scenes', sceneRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/eventlogs', eventLogRoutes);
app.use('/api/energy', energyLogRoutes);

// Arduino Routes
app.use('/arduino', arduinoRoutes);

// API Arduino Routes (for frontend)
app.use('/api/arduino', arduinoRoutes);

// Legacy Arduino Routes (for backward compatibility)
app.use('/pir', arduinoRoutes);
app.use('/leds', arduinoRoutes);
app.use('/status', arduinoRoutes);

// Static files
app.use(express.static('public'));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: IoT API with Arduino Controller is running!
 */
app.get('/', (req, res) => {
    res.send('IoT API with Arduino Controller is running!');
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       500:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health', async (req, res) => {
    try {
        const start = Date.now();
        await db.sequelize.authenticate();
        const dbResponseTime = Date.now() - start;

        const arduinoConnection = arduinoController.getConnectionInfo();
        const websocketStats = websocketService.getStats();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                connected: true,
                responseTime: `${dbResponseTime}ms`
            },
            arduino: {
                portOpen: arduinoConnection.isOpen,
                port: arduinoConnection.port,
                lastMessage: arduinoConnection.lastMessage
            },
            websocket: {
                connected: websocketStats.connected,
                clients: websocketStats.clients
            },
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API documentation endpoint info
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API documentation information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                 websocket:
 *                   type: object
 */
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'IoT API with Arduino Controller',
        version: '1.0.0',
        endpoints: {
            iot_api: {
                users: '/api/users',
                rooms: '/api/rooms',
                devices: '/api/devices',
                sensors: '/api/sensors',
                scenes: '/api/scenes',
                schedules: '/api/schedules',
                eventlogs: '/api/eventlogs'
            },
            arduino_api: {
                pir: {
                    enable: 'POST /arduino/pir/enable',
                    disable: 'POST /arduino/pir/disable'
                },
                leds: {
                    motion_config: 'POST /arduino/leds/:id/motionconfig',
                    manual_on: 'POST /arduino/leds/:id/manual/on',
                    manual_off: 'POST /arduino/leds/:id/manual/off',
                    brightness: 'POST /arduino/leds/:id/brightness',
                    auto_mode: 'POST /arduino/leds/:id/auto',
                    schedule: 'POST /arduino/leds/:id/schedule',
                    daily_schedule: 'POST /arduino/leds/:id/dailyschedule',
                    status: 'GET /arduino/leds/:id/status',
                    energy: 'GET /arduino/leds/:id/energy'
                },
                schedules: {
                    clear: 'POST /arduino/schedules/clear'
                },
                energy: {
                    all: 'GET /arduino/energy'
                },
                status: {
                    full_status: 'GET /arduino/status',
                    current_status: 'GET /arduino/status/current',
                    connection: 'GET /arduino/connection'
                }
            },
            system: {
                health: 'GET /health',
                docs: 'GET /api/docs',
                swagger: 'GET /api-docs'
            }
        },
        websocket: {
            url: `ws://localhost:${port}`,
            message_types: [
                'statusUpdate',
                'requestStatus',
                'controlDevice',
                'setDailySchedule',
                'clearSchedules',
                'requestEnergyData',
                'ping',
                'pong'
            ]
        }
    });
});

// Optimized database connection and server startup
async function startServer() {
    try {
        console.log('🔌 Connecting to database...');

        // Test the connection first (faster than sync)
        await db.sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Run migrations for consistent schema management
        try {
            // Run migrations using our migration script
            console.log('📋 Running database migrations...');

            // Import the helper script dynamically
            const runMigrationsModule = await import('./scripts/runMigrations.js');

            // Access the default export function
            const runMigrations = runMigrationsModule.default || runMigrationsModule;

            // Call it with 'up' command
            await runMigrations('up');
            console.log('✅ Database migrations applied successfully.');
        } catch (migrationError) {
            console.error('⚠️ Migration error:', migrationError.message);
            console.log('⚠️ Falling back to basic sync...');

            // Only sync if necessary (check if tables exist)
            const queryInterface = db.sequelize.getQueryInterface();
            const tables = await queryInterface.showAllTables();

            if (tables.length === 0) {
                console.log('📋 No tables found. Creating database schema...');
                await db.sequelize.sync({ force: true });
                console.log('✅ Database schema created successfully.');
            } else {
                console.log('📊 Database tables already exist. Skipping sync for better performance.');
            }
        }

        // Initialize scheduler service
        schedulerService.initialize();

        // Initialize Redis scheduler and load all schedules
        try {
            console.log('Initializing Redis scheduler service...');
            // Use the improved initialization method
            const initResult = await redisSchedulerService.initialize();
            if (initResult) {
                console.log('Redis scheduler initialized successfully');
            } else {
                console.log('Redis scheduler initialization failed, using fallback scheduler');
                // Even if Redis fails, still apply schedules using the standard scheduler
                await schedulerService.applyDailySchedules();
            }
        } catch (redisError) {
            console.error('Error initializing Redis scheduler:', redisError.message);
            console.log('Continuing without Redis scheduler - schedules will still work via node-cron');
            // Ensure schedules are still applied
            await schedulerService.applyDailySchedules();
        }

        // Start the server using the HTTP server (not just Express)
        server.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`📡 API endpoint: http://localhost:${port}`);
            console.log(`🏥 Health check: http://localhost:${port}/health`);
            console.log(`📖 API docs: http://localhost:${port}/api/docs`);
            console.log(`📚 Swagger UI: http://localhost:${port}/api-docs`);
            console.log(`🔌 WebSocket server: ws://localhost:${port}`);
            console.log(`🤖 Arduino API: http://localhost:${port}/arduino`);

            console.log(`⚡ Startup completed in ${Date.now() - startTime}ms`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);

        // If connection fails, try creating tables
        if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeAccessDeniedError') {
            console.log('🔄 Retrying with database sync...');
            try {
                await db.sequelize.sync({ force: false, alter: false });
                console.log('✅ Database synchronized as fallback.');

                server.listen(port, () => {
                    console.log(`🚀 Server running on port ${port} (fallback mode)`);
                    console.log(`⚠️  Warning: Started in fallback mode after connection issues`);
                });
            } catch (syncError) {
                console.error('❌ Fallback sync failed:', syncError.message);
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    }
}

const startTime = Date.now();
startServer();

// SIGINT handler for graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Gracefully shutting down...');

    // Close WebSocket server
    websocketService.close();

    // Close Arduino connection
    if (arduinoController.getConnectionInfo().isOpen) {
        console.log('📡 Closing Arduino connection...');
        // Note: serialService.close() is called internally by arduinoController
    }

    process.exit(0);
});