# Arduino Controller - Refactored File Structure

This document explains the refactored Arduino controller implementation with improved file organization and modularity.

## 📁 File Structure

```
src/
├── config/
│   └── arduinoConfig.js          # Arduino configuration and constants
├── controllers/
│   └── arduinoController.js      # Arduino business logic and command processing
├── middleware/
│   └── arduinoMiddleware.js       # Arduino-specific middleware
├── routes/
│   └── arduinoRoutes.js          # Arduino API endpoints
└── services/
    ├── serialService.js          # Serial port communication
    └── websocketService.js       # WebSocket real-time updates
```

## 🔧 Components Overview

### 1. **Arduino Configuration** (`src/config/arduinoConfig.js`)
- Centralized configuration for Arduino settings
- Serial commands and response patterns
- Environment variable support

### 2. **Serial Service** (`src/services/serialService.js`)
- Handles all serial port communication
- Automatic reconnection on errors
- Command queuing and response handling

### 3. **WebSocket Service** (`src/services/websocketService.js`)
- Real-time status broadcasting
- Client connection management
- Message handling (ping/pong, status updates)

### 4. **Arduino Controller** (`src/controllers/arduinoController.js`)
- Business logic for Arduino operations
- Status parsing and validation
- Command orchestration

### 5. **Arduino Routes** (`src/routes/arduinoRoutes.js`)
- RESTful API endpoints
- Input validation and error handling
- Response formatting

### 6. **Arduino Middleware** (`src/middleware/arduinoMiddleware.js`)
- Error handling specific to Arduino operations
- Request logging for debugging
- Input validation helpers

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file:
```env
ARDUINO_PORT=COM3
# or ARDUINO_PORT=DISABLED to disable Arduino features
```

### 3. Start the Server
```bash
npm start
```

## 📡 API Endpoints

### PIR Sensor Control
```bash
# Enable PIR sensor
POST /arduino/pir/enable

# Disable PIR sensor
POST /arduino/pir/disable
```

### LED Control
```bash
# Configure motion detection for LED
POST /arduino/leds/:id/motionconfig
Content-Type: application/json
{"active": true}

# Manual LED control
POST /arduino/leds/:id/manual/on
POST /arduino/leds/:id/manual/off

# Set LED brightness (0-255)
POST /arduino/leds/:id/brightness
Content-Type: application/json
{"level": 128}

# Set LED to auto mode
POST /arduino/leds/:id/auto

# Schedule LED for specific duration
POST /arduino/leds/:id/schedule
Content-Type: application/json
{"duration_seconds": 300}
```

### Status and Monitoring
```bash
# Get full system status
GET /arduino/status

# Get specific LED status
GET /arduino/leds/:id/status

# Get current cached status (fast)
GET /arduino/status/current

# Get connection info
GET /arduino/connection
```

## 🔌 WebSocket Real-time Updates

Connect to `ws://localhost:3000` to receive real-time status updates.

### Message Types
- `statusUpdate`: Arduino status changes
- `requestStatus`: Request current status
- `ping`/`pong`: Connection keepalive

### Example WebSocket Usage
```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'statusUpdate') {
        console.log('Arduino Status:', data.payload);
    }
};

// Request current status
ws.send(JSON.stringify({type: 'requestStatus'}));
```

## 🛠️ Configuration Options

### Environment Variables
- `ARDUINO_PORT`: Serial port path (default: COM3)
- `PORT`: Server port (default: 3000)
- `SKIP_DB_SYNC`: Skip database sync for faster startup

### Arduino Config (`src/config/arduinoConfig.js`)
- `baudRate`: Serial communication speed (default: 9600)
- `timeout`: Command response timeout (default: 7000ms)
- `reconnectDelay`: Auto-reconnect delay (default: 5000ms)
- `NUM_LEDS`: Number of LEDs (default: 3)

## 🔍 Health Check and Monitoring

```bash
# System health check
GET /health

# API documentation
GET /api/docs
```

The health check includes:
- Database connection status
- Arduino connection status
- WebSocket client count
- Memory usage
- Uptime

## 📈 Benefits of Refactored Structure

1. **Modularity**: Each component has a single responsibility
2. **Maintainability**: Easy to modify individual components
3. **Testability**: Components can be unit tested independently
4. **Scalability**: Easy to add new features or Arduino devices
5. **Error Isolation**: Errors are contained within specific modules
6. **Code Reusability**: Services can be reused across different controllers

## 🐛 Debugging

### Enable Arduino Request Logging
The middleware automatically logs all Arduino API requests. Check console output for:
- Request paths and methods
- Request bodies
- Error messages
- Connection status

### Common Issues

1. **Serial Port Not Found**
   - Check if Arduino is connected
   - Verify correct port in environment variable
   - Ensure port permissions (Linux/Mac)

2. **Connection Timeouts**
   - Check Arduino sketch is running
   - Verify baud rate matches (9600)
   - Try manual Arduino reset

3. **WebSocket Connection Issues**
   - Ensure firewall allows port 3000
   - Check if other services are using the port

## 🔧 Extending the System

### Adding New Arduino Commands
1. Add command constants to `src/config/arduinoConfig.js`
2. Implement method in `src/controllers/arduinoController.js`
3. Add route endpoint in `src/routes/arduinoRoutes.js`

### Adding New Sensors
1. Extend status parsing in controller
2. Add new API endpoints
3. Update WebSocket message types if needed

This refactored structure provides a solid foundation for expanding the Arduino control system while maintaining clean, maintainable code. 