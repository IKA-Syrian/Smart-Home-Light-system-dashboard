import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IoT Project API with Arduino Controller',
      version: '1.0.0',
      description: 'A comprehensive API for IoT device management and Arduino control system',
      contact: {
        name: 'IoT Project Team',
        email: 'support@iot-project.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.iot-project.com',
        description: 'Production server',
      },
      {
        url: "https://iot-ahmad-iau.loca.lt",
        description: "Production",
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // User Schemas
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the user',
            },
            username: {
              type: 'string',
              description: 'The username of the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'The email of the user',
            },
            password: {
              type: 'string',
              description: 'The password of the user',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        UserInput: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'The username of the user',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'The email of the user',
            },
            password: {
              type: 'string',
              description: 'The password of the user',
            },
          },
        },

        // Room Schemas
        Room: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the room',
            },
            name: {
              type: 'string',
              description: 'The name of the room',
            },
            description: {
              type: 'string',
              description: 'The description of the room',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Device Schemas
        Device: {
          type: 'object',
          required: ['name', 'type', 'roomId'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the device',
            },
            name: {
              type: 'string',
              description: 'The name of the device',
            },
            type: {
              type: 'string',
              description: 'The type of the device',
            },
            status: {
              type: 'string',
              enum: ['online', 'offline', 'error'],
              description: 'The status of the device',
            },
            roomId: {
              type: 'integer',
              description: 'The room ID where the device is located',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Sensor Schemas
        Sensor: {
          type: 'object',
          required: ['name', 'type', 'deviceId'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the sensor',
            },
            name: {
              type: 'string',
              description: 'The name of the sensor',
            },
            type: {
              type: 'string',
              description: 'The type of the sensor',
            },
            value: {
              type: 'string',
              description: 'The current value of the sensor',
            },
            unit: {
              type: 'string',
              description: 'The unit of measurement',
            },
            deviceId: {
              type: 'integer',
              description: 'The device ID the sensor belongs to',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Scene Schemas
        Scene: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the scene',
            },
            name: {
              type: 'string',
              description: 'The name of the scene',
            },
            description: {
              type: 'string',
              description: 'The description of the scene',
            },
            actions: {
              type: 'object',
              description: 'The actions to perform when scene is activated',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Schedule Schemas
        Schedule: {
          type: 'object',
          required: ['name', 'cronExpression'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the schedule',
            },
            name: {
              type: 'string',
              description: 'The name of the schedule',
            },
            cronExpression: {
              type: 'string',
              description: 'The cron expression for scheduling',
            },
            actions: {
              type: 'object',
              description: 'The actions to perform when schedule triggers',
            },
            active: {
              type: 'boolean',
              description: 'Whether the schedule is active',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },

        // Event Log Schemas
        EventLog: {
          type: 'object',
          required: ['eventType', 'description'],
          properties: {
            id: {
              type: 'integer',
              description: 'The auto-generated id of the event log',
            },
            eventType: {
              type: 'string',
              description: 'The type of the event',
            },
            description: {
              type: 'string',
              description: 'The description of the event',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata for the event',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
          },
        },

        // Arduino Schemas
        ArduinoStatus: {
          type: 'object',
          properties: {
            pirEnabled: {
              type: 'boolean',
              description: 'Whether PIR sensor is enabled',
            },
            leds: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/LEDStatus',
              },
              description: 'Array of LED status objects',
            },
          },
        },

        LEDStatus: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'LED ID (0, 1, or 2)',
            },
            motionActiveConfig: {
              type: 'boolean',
              description: 'Whether motion detection is configured',
            },
            manualControlActive: {
              type: 'boolean',
              description: 'Whether manual control is active',
            },
            timedScheduleActive: {
              type: 'boolean',
              description: 'Whether timed schedule is active',
            },
            timedScheduleRemainingSeconds: {
              type: 'integer',
              description: 'Remaining seconds for timed schedule',
            },
            brightness: {
              type: 'integer',
              minimum: 0,
              maximum: 255,
              description: 'LED brightness level',
            },
          },
        },

        ArduinoConnection: {
          type: 'object',
          properties: {
            isOpen: {
              type: 'boolean',
              description: 'Whether serial connection is open',
            },
            port: {
              type: 'string',
              description: 'Serial port path',
            },
            lastMessage: {
              type: 'string',
              description: 'Last message received from Arduino',
            },
          },
        },

        LEDBrightnessInput: {
          type: 'object',
          required: ['level'],
          properties: {
            level: {
              type: 'integer',
              minimum: 0,
              maximum: 255,
              description: 'LED brightness level (0-255)',
            },
          },
        },

        LEDMotionConfigInput: {
          type: 'object',
          required: ['active'],
          properties: {
            active: {
              type: 'boolean',
              description: 'Whether to enable motion detection',
            },
          },
        },

        LEDScheduleInput: {
          type: 'object',
          required: ['duration_seconds'],
          properties: {
            duration_seconds: {
              type: 'integer',
              minimum: 1,
              description: 'Duration in seconds for LED schedule',
            },
          },
        },

        // Common Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
          },
        },

        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'unhealthy'],
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
            database: {
              type: 'object',
              properties: {
                connected: {
                  type: 'boolean',
                },
                responseTime: {
                  type: 'string',
                },
              },
            },
            arduino: {
              $ref: '#/components/schemas/ArduinoConnection',
            },
            websocket: {
              type: 'object',
              properties: {
                connected: {
                  type: 'integer',
                },
                clients: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
            uptime: {
              type: 'number',
            },
            memory: {
              type: 'object',
            },
          },
        },

        // Daily Schedule Schema
        DailyScheduleInput: {
          type: 'object',
          required: ['onHour', 'onMinute', 'offHour', 'offMinute'],
          properties: {
            onHour: {
              type: 'integer',
              minimum: 0,
              maximum: 23,
              description: 'Hour to turn ON (0-23)',
            },
            onMinute: {
              type: 'integer',
              minimum: 0,
              maximum: 59,
              description: 'Minute to turn ON (0-59)',
            },
            offHour: {
              type: 'integer',
              minimum: 0,
              maximum: 23,
              description: 'Hour to turn OFF (0-23)',
            },
            offMinute: {
              type: 'integer',
              minimum: 0,
              maximum: 59,
              description: 'Minute to turn OFF (0-59)',
            },
          },
        },

        DailyScheduleResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            message: {
              type: 'string',
              example: 'Command acknowledged.',
            },
            arduinoResponse: {
              type: 'string',
              example: 'ACK: Daily schedule set for LED0',
            },
            ledId: {
              type: 'integer',
              example: 0,
            },
            dailySchedule: {
              type: 'object',
              properties: {
                onTime: {
                  type: 'string',
                  example: '05:30',
                },
                offTime: {
                  type: 'string',
                  example: '07:30',
                },
              },
            },
          },
        },

        // Energy response schemas
        EnergyResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            ledId: {
              type: 'integer',
              example: 0,
            },
            energyToday: {
              type: 'number',
              format: 'float',
              example: 1.25,
              description: 'Energy consumed today in Wh',
            },
          },
        },

        AllEnergyResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'success',
            },
            energyData: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ledId: {
                    type: 'integer',
                    example: 0,
                  },
                  energyToday: {
                    type: 'number',
                    format: 'float',
                    example: 1.25,
                    description: 'Energy consumed today in Wh',
                  },
                },
              },
            },
            totalEnergyToday: {
              type: 'number',
              format: 'float',
              example: 3.75,
              description: 'Total energy consumed by all LEDs today in Wh',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Rooms',
        description: 'Room management operations',
      },
      {
        name: 'Devices',
        description: 'Device management operations',
      },
      {
        name: 'Sensors',
        description: 'Sensor management operations',
      },
      {
        name: 'Scenes',
        description: 'Scene management operations',
      },
      {
        name: 'Schedules',
        description: 'Schedule management operations',
      },
      {
        name: 'Event Logs',
        description: 'Event logging operations',
      },
      {
        name: 'Arduino PIR',
        description: 'Arduino PIR sensor control',
      },
      {
        name: 'Arduino LEDs',
        description: 'Arduino LED control operations',
      },
      {
        name: 'Arduino Status',
        description: 'Arduino status and monitoring',
      },
      {
        name: 'System',
        description: 'System health and monitoring',
      },
    ],
  },
  apis: ['./src/routes/*.js', './index.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);
export default specs; 