# 🚀 Arduino LED Control - Demo Mode Guide

## 🎯 Two Access Methods

Your Arduino LED control system now has **two access points**:

### 1. 🔓 **Demo Mode** (No Login Required)
- **URL**: http://localhost:8081/arduino-demo
- **Features**: Full Arduino hardware control with simulated room data
- **Authentication**: None required
- **Data**: 3 hardcoded demo rooms (Living Room, Bedroom, Kitchen)
- **Arduino Control**: ✅ Full hardware control (PIR, 3 LEDs, WebSocket)

### 2. 🔐 **Full Access** (Login Required)
- **URL**: http://localhost:8081/arduino  
- **Features**: Arduino control + real database integration
- **Authentication**: Required (admin@iot-project.com / admin123)
- **Data**: Real rooms and devices from database
- **Arduino Control**: ✅ Full hardware control + CRUD operations

## 🎮 Demo Mode Features

### ✅ **Working Arduino Controls**
- **3 LED Controllers**: Living Room (LED 0), Bedroom (LED 1), Kitchen (LED 2)
- **PIR Motion Sensor**: Enable/disable motion detection
- **Master Controls**: Control all LEDs simultaneously
- **Individual Controls**: Per-room LED management
- **Advanced Features**: Motion config, scheduling, auto mode
- **Real-time Updates**: WebSocket communication with Arduino

### 🎨 **Demo Interface**
- **Status Panel**: WebSocket, Arduino, PIR status indicators
- **Demo Notification**: Clear indication of demo mode
- **Hardware Info**: Arduino port, connection status, last message
- **Error Handling**: Arduino communication errors
- **Navigation**: Easy switch to full access mode

## 🔧 **Hardware Setup**

```
Arduino Connections:
├── LED 0 (Living Room)  → Pin 9  + GND via 220Ω resistor
├── LED 1 (Bedroom)      → Pin 10 + GND via 220Ω resistor  
├── LED 2 (Kitchen)      → Pin 11 + GND via 220Ω resistor
├── PIR Sensor VCC       → 5V
├── PIR Sensor GND       → GND
└── PIR Sensor OUT       → Pin 2
```

## 🚀 **Quick Start**

### Option 1: Demo Mode (No Setup)
```bash
# Just visit the demo URL
http://localhost:8081/arduino-demo
```

### Option 2: Full Features
```bash
# 1. Make sure backend is running
npm start  # In project root

# 2. Visit full access URL and login
http://localhost:8081/arduino
# Login: admin@iot-project.com / admin123
```

## 🎯 **Use Cases**

### 🧪 **Demo Mode Perfect For:**
- **Quick Testing**: Test Arduino controls without login
- **Demonstrations**: Show functionality to others
- **Development**: Test hardware without database
- **Public Access**: Let anyone try the interface

### 🏢 **Full Mode Perfect For:**
- **Real Usage**: Manage actual rooms and devices
- **Data Persistence**: Save room configurations
- **User Management**: Multiple user accounts
- **Full IoT Features**: Scenes, schedules, automation

## 🔄 **Technical Details**

### Demo Mode Implementation:
- **Component**: `ArduinoDashboardStandalone.tsx`
- **Dependencies**: Only `useArduino` hook
- **Authentication**: Completely bypassed
- **Data Source**: Hardcoded room array
- **Arduino API**: Direct hardware communication

### Full Mode Implementation:
- **Component**: `ArduinoDashboard.tsx`  
- **Dependencies**: `useArduino` + `useRoomsAndDevices` hooks
- **Authentication**: Required with JWT tokens
- **Data Source**: Live database API
- **Arduino API**: Hardware + database integration

## 🌐 **URLs Summary**

| Feature | URL | Login Required | Data Source |
|---------|-----|----------------|-------------|
| **Demo Mode** | `/arduino-demo` | ❌ No | Hardcoded |
| **Full Access** | `/arduino` | ✅ Yes | Database |
| **Login Page** | `/login` | ❌ No | - |
| **API Docs** | `http://localhost:3000/api-docs` | ❌ No | - |
| **Backend Health** | `http://localhost:3000/health` | ❌ No | - |

## 🎉 **Success!**

You now have a **complete Arduino LED control system** with:
- ✅ **Demo access** for anyone to try
- ✅ **Full access** for authenticated users  
- ✅ **Real hardware control** in both modes
- ✅ **No logout issues** in demo mode
- ✅ **Seamless switching** between modes

Visit **http://localhost:8081/arduino-demo** to start controlling your LEDs! 🚀 