# Swagger API Documentation Setup

This document provides comprehensive documentation for the Swagger API implementation in the IoT Project.

## 📁 File Structure

```
src/
├── config/
│   └── swagger.js                 # Swagger configuration with all schemas
├── routes/
│   ├── userRoutes.js             # User management endpoints with Swagger docs
│   ├── roomRoutes.js             # Room management endpoints with Swagger docs
│   ├── deviceRoutes.js           # Device management endpoints with Swagger docs
│   ├── sensorRoutes.js           # Sensor management endpoints with Swagger docs
│   ├── sceneRoutes.js            # Scene management endpoints with Swagger docs
│   ├── scheduleRoutes.js         # Schedule management endpoints with Swagger docs
│   ├── eventLogRoutes.js         # Event log endpoints with Swagger docs
│   └── arduinoRoutes.js          # Arduino controller endpoints with Swagger docs
package.json                      # Updated with Swagger dependencies
index.js                          # Server setup with Swagger UI middleware
```

## 🔧 Dependencies Added

The following dependencies have been added to support Swagger documentation:

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

## 📚 API Documentation Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api-docs` | Interactive Swagger UI documentation |
| `/api/docs` | JSON API information and endpoint listing |
| `/health` | System health check with all service statuses |

## 🏷️ API Tags & Organization

The API is organized into the following tag categories:

### Core IoT Management
- **Users** - User authentication and profile management
- **Rooms** - Room creation and management
- **Devices** - Device registration and control
- **Sensors** - Sensor data and monitoring
- **Scenes** - Automation scene management
- **Schedules** - Scheduled task management
- **Event Logs** - System event tracking and logging

### Arduino Integration
- **Arduino PIR** - Motion sensor control and configuration
- **Arduino LEDs** - LED lighting control and automation
- **Arduino Status** - Real-time Arduino system monitoring

### System Management
- **System** - Health checks and API information

## 🔗 Complete API Endpoints

### User Management (`/api/users`)
- `GET /` - Get all users
- `GET /{id}` - Get user by ID
- `POST /` - Create new user
- `PUT /{id}` - Update user
- `DELETE /{id}` - Delete user

### Room Management (`/api/rooms`)
- `GET /` - Get all rooms
- `GET /{id}` - Get room by ID
- `POST /` - Create new room
- `PUT /{id}` - Update room
- `DELETE /{id}` - Delete room
- `GET /{id}/devices` - Get devices in room
- `GET /{id}/sensors` - Get sensors in room

### Device Management (`/api/devices`)
- `GET /` - Get all devices
- `GET /{id}` - Get device by ID
- `POST /` - Create new device
- `PUT /{id}` - Update device
- `PATCH /{id}/state` - Update device state
- `DELETE /{id}` - Delete device

### Sensor Management (`/api/sensors`)
- `GET /` - Get all sensors
- `GET /{id}` - Get sensor by ID
- `POST /` - Create new sensor
- `PUT /{id}` - Update sensor
- `PATCH /{id}/value` - Update sensor value
- `DELETE /{id}` - Delete sensor

### Scene Management (`/api/scenes`)
- `GET /` - Get all scenes
- `GET /{id}` - Get scene by ID
- `POST /` - Create new scene
- `PUT /{id}` - Update scene
- `POST /{id}/activate` - Activate scene
- `DELETE /{id}` - Delete scene

### Schedule Management (`/api/schedules`)
- `GET /` - Get all schedules
- `GET /{id}` - Get schedule by ID
- `POST /` - Create new schedule
- `PUT /{id}` - Update schedule
- `PATCH /{id}/toggle` - Toggle schedule status
- `DELETE /{id}` - Delete schedule

### Event Log Management (`/api/eventlogs`)
- `GET /` - Get all event logs (with filtering)
- `GET /{id}` - Get event log by ID
- `POST /` - Create new event log
- `PUT /{id}` - Update event log
- `DELETE /{id}` - Delete event log
- `DELETE /bulk/delete` - Bulk delete event logs

### Arduino PIR Control (`/arduino/pir`)
- `POST /enable` - Enable PIR motion sensor
- `POST /disable` - Disable PIR motion sensor

### Arduino LED Control (`/arduino/leds`)
- `POST /{id}/motionconfig` - Configure LED motion detection
- `POST /{id}/manual/on` - Turn LED on manually
- `POST /{id}/manual/off` - Turn LED off manually
- `POST /{id}/brightness` - Set LED brightness (0-255)
- `POST /{id}/auto` - Enable LED auto mode
- `POST /{id}/schedule` - Schedule LED for duration
- `GET /{id}/status` - Get specific LED status

### Arduino Status Monitoring (`/arduino`)
- `GET /status` - Get full Arduino system status
- `GET /status/current` - Get cached Arduino status (fast)
- `GET /connection` - Get Arduino connection info

### System Endpoints
- `GET /` - Welcome message
- `GET /health` - System health check
- `GET /api/docs` - API information and endpoints

## 🔐 Authentication & Security

### Bearer Token Authentication
Most endpoints require JWT authentication using the `bearerAuth` security scheme:

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### Security Implementation
- **Users, Rooms, Devices, Sensors, Scenes**: Require authentication
- **Arduino APIs**: No authentication required (hardware interface)
- **System endpoints**: Public access for monitoring

## 📊 Data Schemas

### Core Entity Schemas
- **User** - User account information
- **Room** - Physical room/location data
- **Device** - IoT device information
- **Sensor** - Sensor data and readings
- **Scene** - Automation scene configuration
- **Schedule** - Scheduled task definitions
- **EventLog** - System event records

### Arduino-Specific Schemas
- **ArduinoStatus** - Complete Arduino system state
- **LEDStatus** - Individual LED status and configuration
- **ArduinoConnection** - Serial connection information
- **LEDBrightnessInput** - LED brightness control input
- **LEDMotionConfigInput** - Motion detection configuration
- **LEDScheduleInput** - LED scheduling parameters

### Common Response Schemas
- **SuccessResponse** - Standard success response format
- **ErrorResponse** - Standard error response format
- **HealthCheck** - System health status information

## 🚀 Usage Examples

### Access Swagger UI
```
http://localhost:3000/api-docs
```

### Get API Information
```bash
curl http://localhost:3000/api/docs
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Arduino LED Control Example
```bash
# Turn on LED 0 manually
curl -X POST http://localhost:3000/arduino/leds/0/manual/on

# Set LED 1 brightness to 128
curl -X POST http://localhost:3000/arduino/leds/1/brightness \
  -H "Content-Type: application/json" \
  -d '{"level": 128}'

# Get Arduino status
curl http://localhost:3000/arduino/status
```

## 🎯 Features

### Interactive Documentation
- **Try It Out** functionality for all endpoints
- Real-time request/response testing
- Parameter validation and examples
- Schema exploration and validation

### Comprehensive Coverage
- All routes documented with complete request/response schemas
- Input validation specifications
- Error response documentation
- Query parameter documentation with examples

### Real-time Integration
- WebSocket status updates documented
- Arduino real-time communication explained
- Health monitoring endpoints for system status

### Developer Experience
- Clear endpoint organization by functional area
- Consistent schema definitions and reuse
- Detailed parameter descriptions and examples
- Status code documentation with explanations

## 🔧 Configuration

### Swagger Configuration (`src/config/swagger.js`)
- OpenAPI 3.0.0 specification
- Server definitions for development and production
- Complete schema definitions for all data types
- Security scheme definitions
- Tag organization for logical grouping

### Server Integration (`index.js`)
- Swagger UI middleware configuration
- Custom CSS for improved appearance
- Authorization persistence
- Explorer mode enabled for enhanced usability

## 📱 WebSocket Documentation

Real-time communication is documented with:
- WebSocket connection URL: `ws://localhost:3000`
- Message types: `statusUpdate`, `requestStatus`, `ping`, `pong`
- Arduino status broadcasting
- Client connection management

The Swagger documentation provides a complete reference for integrating with both the REST API and real-time WebSocket features of the IoT Project. 