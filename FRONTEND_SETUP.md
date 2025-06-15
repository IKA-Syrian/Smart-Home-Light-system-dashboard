# 🏠 IoT Project - Complete Setup Guide

A comprehensive IoT system with **3 LEDs across 3 rooms** featuring real-time control, WebSocket communication, and a beautiful React frontend.

## 🎯 Project Overview

This project simulates a smart home with:
- **3 Rooms**: Living Room, Bedroom, Kitchen
- **3 LEDs**: One LED controller per room (LED 0, 1, 2)
- **1 PIR Sensor**: Motion detection for automation
- **Real-time Dashboard**: React frontend with live updates
- **RESTful API**: Complete CRUD operations with Swagger docs
- **WebSocket**: Real-time status updates

## 🚀 Quick Start

### Option 1: Automatic Setup
```bash
npm run setup
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Seed database with sample data
npm run seed

# Start the server
npm start
```

### Option 3: Force Reset (Clean slate)
```bash
npm run setup:force  # Recreates database tables
```

## 📁 Project Structure

```
iot-project/
├── 🔧 Backend (Node.js + Express)
│   ├── index.js                     # Main server
│   ├── src/
│   │   ├── controllers/             # Business logic
│   │   │   └── arduinoController.js # Arduino control logic
│   │   ├── services/                # Service layer
│   │   │   ├── serialService.js     # Arduino communication
│   │   │   └── websocketService.js  # Real-time updates
│   │   ├── routes/                  # API endpoints
│   │   │   └── arduinoRoutes.js     # Arduino API routes
│   │   ├── config/
│   │   │   ├── swagger.js           # API documentation
│   │   │   └── arduinoConfig.js     # Arduino settings
│   │   └── models/                  # Database models
│   └── scripts/
│       ├── seedDatabase.js          # Sample data generator
│       └── startProject.js          # Automated startup
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   └── ArduinoDashboard.tsx # Main Arduino interface
│   │   ├── services/
│   │   │   ├── arduinoService.ts    # Arduino API client
│   │   │   └── websocketService.ts  # WebSocket client
│   │   ├── hooks/
│   │   │   └── useArduino.ts        # Arduino state management
│   │   └── App.tsx                  # Main app with routes
└── 📚 Documentation
    ├── SWAGGER_SETUP.md             # API documentation guide
    ├── ARDUINO_README.md            # Arduino setup guide
    └── FRONTEND_SETUP.md            # This file
```

## 🏠 Room & LED Configuration

| Room | LED ID | Device Type | Features |
|------|--------|-------------|----------|
| 🛋️ Living Room | LED 0 | LED_CONTROLLER | Motion, Manual, Scheduling, Brightness |
| 🛏️ Bedroom | LED 1 | LED_CONTROLLER | Motion, Manual, Scheduling, Brightness |
| 🍳 Kitchen | LED 2 | LED_CONTROLLER | Motion, Manual, Scheduling, Brightness |
| 📡 Living Room | PIR | MOTION_SENSOR | Global motion detection |

## 🔗 API Endpoints

### 🚀 System Endpoints
- `GET /` - Welcome message
- `GET /health` - System health check
- `GET /api-docs` - Interactive Swagger documentation
- `GET /api/docs` - API information

### 🤖 Arduino Control
- `POST /arduino/pir/enable` - Enable PIR sensor
- `POST /arduino/pir/disable` - Disable PIR sensor
- `POST /arduino/leds/{id}/manual/on` - Turn LED on
- `POST /arduino/leds/{id}/manual/off` - Turn LED off
- `POST /arduino/leds/{id}/brightness` - Set brightness (0-255)
- `POST /arduino/leds/{id}/auto` - Enable auto mode
- `POST /arduino/leds/{id}/schedule` - Schedule LED
- `GET /arduino/status` - Get full Arduino status
- `GET /arduino/connection` - Check Arduino connection

### 🏠 IoT Management
- `GET /api/rooms` - List all rooms
- `GET /api/devices` - List all devices
- `GET /api/sensors` - List all sensors
- `GET /api/scenes` - List all scenes
- `GET /api/schedules` - List all schedules

## 🎮 Frontend Features

### 📱 Arduino Dashboard (`/arduino`)
- **Real-time LED Control**: Individual room control
- **Master Controls**: Control all LEDs simultaneously
- **PIR Sensor Management**: Enable/disable motion detection
- **Brightness Control**: 0-255 range with sliders
- **Advanced Features**: Motion config, scheduling, auto mode
- **Live Status**: Real-time WebSocket updates
- **Connection Monitoring**: Arduino & WebSocket status

### 🔄 Real-time Features
- **WebSocket Connection**: Live status updates
- **Auto Reconnection**: Handles disconnections gracefully
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback for all operations

## 🌱 Sample Data

The seed script creates:

### 👥 Users (3)
- **Admin**: admin@iot-project.com / admin123
- **User**: user1@iot-project.com / user123
- **Demo**: demo@iot-project.com / demo123

### 🏠 Rooms (3)
- **Living Room**: Main area with LED lighting control
- **Bedroom**: Master bedroom with automated lighting
- **Kitchen**: Kitchen area with smart lighting

### 🔌 Devices (4)
- **Living Room LED Controller** (LED 0)
- **Bedroom LED Controller** (LED 1)
- **Kitchen LED Controller** (LED 2)
- **PIR Motion Sensor** (Global)

### 📡 Sensors (5)
- Motion detection, light levels, temperature

### 🎬 Scenes (4)
- **Evening Ambiance**: Dim lighting
- **Bright Work Mode**: Full brightness
- **Night Mode**: Very dim lighting
- **All Off**: Turn off all lights

### ⏰ Schedules (4)
- **Morning Routine**: 7:00 AM daily
- **Evening Routine**: 7:00 PM daily
- **Night Routine**: 10:00 PM daily
- **Weekend Mode**: 9:00 AM weekends

## 🚀 Usage Examples

### Start the Project
```bash
# Quick start with automatic setup
npm run setup

# Or manual steps
npm install
npm run seed
npm start
```

### API Testing
```bash
# Check system health
curl http://localhost:3000/health

# Control Living Room LED (LED 0)
curl -X POST http://localhost:3000/arduino/leds/0/manual/on

# Set brightness to 50%
curl -X POST http://localhost:3000/arduino/leds/0/brightness \
  -H "Content-Type: application/json" \
  -d '{"level": 128}'

# Get Arduino status
curl http://localhost:3000/arduino/status
```

### Frontend Access
- **Main Dashboard**: http://localhost:3000/dashboard
- **Arduino Control**: http://localhost:3000/arduino
- **API Documentation**: http://localhost:3000/api-docs

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=iot_project

# Arduino
ARDUINO_PORT=COM3  # Windows
# ARDUINO_PORT=/dev/ttyUSB0  # Linux
# ARDUINO_PORT=/dev/tty.usbmodem1411  # macOS

# Server
PORT=3000
JWT_SECRET=your-jwt-secret

# Performance
SKIP_DB_SYNC=false  # Set to true for faster startup
```

### Arduino Hardware Setup
1. Connect 3 LEDs to pins 9, 10, 11
2. Connect PIR sensor to pin 2
3. Connect Arduino to computer via USB
4. Update ARDUINO_PORT in .env file

## 🛠️ Development Workflow

### Backend Development
```bash
# Start backend only
npm start

# Run tests
npm test

# Reset database
npm run seed:force
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev  # Starts development server
```

### API Documentation
```bash
# View Swagger docs
open http://localhost:3000/api-docs

# Get API info
curl http://localhost:3000/api/docs
```

## 🔍 Monitoring & Debugging

### Health Check
```bash
curl http://localhost:3000/health
```

### WebSocket Testing
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
ws.send(JSON.stringify({ type: 'requestStatus' }));
```

### Arduino Connection
```bash
# Check Arduino connection
curl http://localhost:3000/arduino/connection

# View serial port info
curl http://localhost:3000/arduino/status
```

## 🚨 Troubleshooting

### Common Issues

1. **Arduino not connecting**
   - Check ARDUINO_PORT in .env
   - Verify Arduino is connected via USB
   - Try different serial ports

2. **Database connection failed**
   - Check MySQL is running
   - Verify database credentials in .env
   - Run `npm run seed:force` to recreate tables

3. **WebSocket connection issues**
   - Check firewall settings
   - Verify port 3000 is available
   - Check browser console for errors

4. **Frontend not loading**
   - Check if backend is running on port 3000
   - Verify API endpoints are accessible
   - Check browser network tab

### Log Locations
- **Server logs**: Console output
- **Arduino logs**: Check serial communication messages
- **Browser logs**: Developer tools console

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000/api-docs
- **Arduino Setup**: See ARDUINO_README.md
- **Swagger Guide**: See SWAGGER_SETUP.md
- **Performance**: See PERFORMANCE_SUMMARY.md

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test with `npm test`
5. Submit pull request

---

## 🎉 You're Ready!

Your IoT project is now set up with:
- ✅ 3 LEDs across 3 rooms
- ✅ Real-time WebSocket communication
- ✅ Beautiful React dashboard
- ✅ Complete API with Swagger docs
- ✅ Sample data for testing
- ✅ Arduino hardware integration

Visit http://localhost:3000/arduino to start controlling your LEDs! 🚀 