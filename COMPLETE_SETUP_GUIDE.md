# 🏠 Complete IoT Project Setup Guide

## 🎯 What We've Built

A complete IoT ecosystem with:
- **3 Smart Rooms**: Living Room 🛋️, Bedroom 🛏️, Kitchen 🍳
- **3 Arduino LEDs**: One per room with full control
- **1 PIR Sensor**: Motion detection for automation
- **React Frontend**: Beautiful real-time dashboard
- **RESTful API**: Complete CRUD with Swagger documentation
- **WebSocket**: Real-time status updates
- **Database**: Sample data with users, devices, scenes, schedules

## 🚀 Quick Start (3 Steps)

### 1. Prerequisites Setup
```bash
# Install Node.js (if not installed)
# Download from: https://nodejs.org/

# Clone or ensure you're in the project directory
cd iot-project

# Install dependencies
npm install
```

### 2. Database Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=iot_project

# Arduino Configuration  
ARDUINO_PORT=COM3

# Server Configuration
PORT=3000
JWT_SECRET=your-secret-key
```

### 3. Start the Project
```bash
# Option A: Automated startup (recommended)
npm run setup

# Option B: Manual steps
npm run seed    # Create sample data
npm start      # Start server
```

## 🏠 Project Architecture

```
🏠 IoT Project
├── 🔧 Backend API (Node.js + Express)
│   ├── 📡 Arduino Integration
│   │   ├── Serial Communication
│   │   ├── LED Control (3 LEDs)
│   │   └── PIR Sensor Management
│   ├── 🌐 WebSocket Server
│   │   ├── Real-time Updates
│   │   └── Status Broadcasting
│   ├── 📚 Swagger API Docs
│   │   ├── Interactive Testing
│   │   └── Complete Documentation
│   └── 🗄️ Database Models
│       ├── Users, Rooms, Devices
│       ├── Sensors, Scenes, Schedules
│       └── Event Logs
├── 🎨 Frontend Dashboard (React + TypeScript)
│   ├── 🎮 Arduino Control Panel
│   │   ├── Individual LED Control
│   │   ├── Master Controls
│   │   ├── PIR Sensor Management
│   │   └── Real-time Status
│   ├── 🔄 WebSocket Integration
│   │   ├── Auto-reconnection
│   │   └── Live Updates
│   └── 🎯 User Interface
│       ├── Room-based Navigation
│       ├── Brightness Controls
│       └── Advanced Features
└── 🌱 Sample Data
    ├── 3 Test Users
    ├── 3 Smart Rooms
    ├── 4 IoT Devices
    ├── 5 Sensors
    ├── 4 Automation Scenes
    └── 4 Scheduled Tasks
```

## 💡 LED & Room Mapping

| Room | LED ID | Arduino Pin | Features |
|------|--------|-------------|----------|
| 🛋️ Living Room | LED 0 | Pin 9 | Motion, Manual, Brightness, Scheduling |
| 🛏️ Bedroom | LED 1 | Pin 10 | Motion, Manual, Brightness, Scheduling |
| 🍳 Kitchen | LED 2 | Pin 11 | Motion, Manual, Brightness, Scheduling |
| 📡 PIR Sensor | - | Pin 2 | Global Motion Detection |

## 🌐 API Endpoints

### 📱 Frontend Access
- **Arduino Dashboard**: http://localhost:3000/arduino
- **Main Dashboard**: http://localhost:3000/dashboard
- **API Documentation**: http://localhost:3000/api-docs

### 🤖 Arduino Control API
```bash
# PIR Sensor Control
POST /arduino/pir/enable
POST /arduino/pir/disable

# LED Control (replace {id} with 0, 1, or 2)
POST /arduino/leds/{id}/manual/on
POST /arduino/leds/{id}/manual/off
POST /arduino/leds/{id}/brightness     # Body: {"level": 0-255}
POST /arduino/leds/{id}/auto
POST /arduino/leds/{id}/schedule       # Body: {"duration_seconds": 30}
POST /arduino/leds/{id}/motionconfig   # Body: {"active": true}

# Status & Monitoring
GET /arduino/status
GET /arduino/leds/{id}/status
GET /arduino/connection
GET /health
```

### 🏠 IoT Management API
```bash
# Core Resources
GET /api/rooms
GET /api/devices
GET /api/sensors
GET /api/scenes
GET /api/schedules
GET /api/eventlogs

# Authentication
POST /api/users/login
POST /api/users/register
```

## 🎮 Frontend Features

### 📱 Arduino Dashboard (`/arduino`)
1. **System Status Panel**
   - WebSocket connection status
   - Arduino connection status
   - PIR sensor status
   - Serial port information

2. **PIR Sensor Control**
   - Enable/disable motion detection
   - Global motion sensor management

3. **Master Controls**
   - Control all LEDs simultaneously
   - Master brightness slider
   - Turn all on/off

4. **Individual Room Control** (3 cards)
   - Room-specific LED control
   - Brightness slider (0-255)
   - ON/OFF/AUTO buttons
   - Advanced controls:
     - Motion detection config
     - Timer scheduling
     - Real-time status

5. **Real-time Features**
   - Live status updates via WebSocket
   - Loading states for all operations
   - Error handling with user feedback
   - Auto-reconnection

## 🌱 Sample Data Overview

### 👥 Users (Login Credentials)
- **Admin**: admin@iot-project.com / admin123
- **User**: user1@iot-project.com / user123  
- **Demo**: demo@iot-project.com / demo123

### 🏠 Rooms & Devices
```
🛋️ Living Room
├── 💡 LED Controller (LED 0)
├── 📡 PIR Motion Sensor
└── 🌡️ Temperature Sensor

🛏️ Bedroom  
├── 💡 LED Controller (LED 1)
└── 💡 Light Level Sensor

🍳 Kitchen
├── 💡 LED Controller (LED 2)
└── 💡 Light Level Sensor
```

### 🎬 Automation Scenes
1. **Evening Ambiance** - Dim lighting for relaxation
2. **Bright Work Mode** - Full brightness for activities
3. **Night Mode** - Very dim lighting for nighttime
4. **All Off** - Turn off all lights

### ⏰ Scheduled Tasks
1. **Morning Routine** (7:00 AM) - Bright mode + enable PIR
2. **Evening Routine** (7:00 PM) - Evening ambiance
3. **Night Routine** (10:00 PM) - Night mode
4. **Weekend Mode** (9:00 AM weekends) - Bright mode

## 🔧 Available Commands

```bash
# Quick Setup
npm run setup              # Full setup with database seeding
npm run setup:force        # Force recreate database tables

# Development
npm start                  # Start server
npm run dev               # Start in development mode
npm test                  # Run API tests

# Database
npm run seed              # Seed database with sample data
npm run seed:force        # Force recreate and seed

# Utilities
npm run quick-start       # Install + seed + start
```

## 🎯 Usage Examples

### 1. Control LEDs via API
```bash
# Turn on Living Room LED (LED 0)
curl -X POST http://localhost:3000/arduino/leds/0/manual/on

# Set Bedroom LED (LED 1) to 50% brightness
curl -X POST http://localhost:3000/arduino/leds/1/brightness \
  -H "Content-Type: application/json" \
  -d '{"level": 128}'

# Enable PIR sensor
curl -X POST http://localhost:3000/arduino/pir/enable

# Get full system status
curl http://localhost:3000/arduino/status
```

### 2. Frontend Usage
1. Visit http://localhost:3000/arduino
2. Check system status in the top panel
3. Use master controls for all LEDs
4. Control individual rooms with dedicated cards
5. Toggle advanced features per room

### 3. WebSocket Real-time Updates
```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Arduino status update:', data);
};
```

## 🛠️ Hardware Setup (Arduino)

### Required Components
- Arduino Uno/Nano
- 3 LEDs + 3 resistors (220Ω)
- 1 PIR sensor (HC-SR501)
- Breadboard and jumper wires

### Wiring Diagram
```
Arduino Connections:
├── LED 0 (Living Room)  → Pin 9  + GND via 220Ω resistor
├── LED 1 (Bedroom)      → Pin 10 + GND via 220Ω resistor
├── LED 2 (Kitchen)      → Pin 11 + GND via 220Ω resistor
├── PIR Sensor VCC       → 5V
├── PIR Sensor GND       → GND
└── PIR Sensor OUT       → Pin 2
```

## 🚨 Troubleshooting

### Common Issues & Solutions

1. **Database Connection Failed**
   ```bash
   # Check MySQL is running
   # Verify credentials in .env file
   npm run seed:force  # Recreate database
   ```

2. **Arduino Not Connecting**
   ```bash
   # Check USB connection
   # Update ARDUINO_PORT in .env
   # Try different ports: COM3, COM4 (Windows) or /dev/ttyUSB0 (Linux)
   ```

3. **Frontend Not Loading**
   ```bash
   # Ensure backend is running on port 3000
   # Check browser console for errors
   # Verify API endpoints respond: curl http://localhost:3000/health
   ```

4. **WebSocket Connection Issues**
   ```bash
   # Check firewall settings
   # Ensure port 3000 is available
   # Check browser developer tools
   ```

### Debug Commands
```bash
# Check system health
curl http://localhost:3000/health

# Test Arduino connection
curl http://localhost:3000/arduino/connection

# View API documentation
open http://localhost:3000/api-docs
```

## 📚 Documentation Files

- **SWAGGER_SETUP.md** - Complete API documentation guide
- **ARDUINO_README.md** - Arduino hardware setup details
- **FRONTEND_SETUP.md** - Frontend development guide
- **PERFORMANCE_SUMMARY.md** - Performance optimization tips

## 🎉 Success Checklist

After running `npm run setup`, you should have:

- ✅ Server running on http://localhost:3000
- ✅ Database with sample data (3 rooms, 4 devices, 3 users)
- ✅ Arduino dashboard at http://localhost:3000/arduino
- ✅ Swagger docs at http://localhost:3000/api-docs
- ✅ WebSocket connection for real-time updates
- ✅ Full LED control functionality
- ✅ PIR sensor management
- ✅ Scene and schedule automation

## 🚀 What's Next?

1. **Connect your Arduino** with 3 LEDs and PIR sensor
2. **Visit the dashboard** at http://localhost:3000/arduino
3. **Test LED controls** using the beautiful interface
4. **Explore the API** with Swagger at /api-docs
5. **Customize scenes** and schedules for your needs

---

**🎊 Congratulations!** You now have a fully functional IoT smart home system with 3 room LED simulation, real-time dashboard, and comprehensive API! 

Start controlling your LEDs at: **http://localhost:3000/arduino** 🚀 