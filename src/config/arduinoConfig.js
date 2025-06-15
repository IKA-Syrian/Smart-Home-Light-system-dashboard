import dotenv from 'dotenv';

dotenv.config();

export const arduinoConfig = {
    portPath: process.env.ARDUINO_PORT || 'COM3',
    baudRate: 9600,
    delimiter: '\r\n',
    timeout: 7000,
    reconnectDelay: 5000,
    statusRequestDelay: 1000,
    NUM_LEDS: 3
};

export const serialCommands = {
    PIR_ENABLE: 'E',
    PIR_DISABLE: 'D',
    STATUS_QUERY: 'Q',
    LED_MOTION_CONFIG: 'C',
    LED_MANUAL_ON: 'S',
    LED_BRIGHTNESS: 'B',
    LED_AUTO_MODE: 'A',
    LED_SCHEDULE: 'T',
    DAILY_SCHEDULE: 'T',
    CLEAR_SCHEDULES: 'C'
};

export const responsePatterns = {
    PIR_ENABLED: "PIR Enabled",
    PIR_DISABLED: "PIR Disabled",
    STATUS: "STATUS;",
    LED_MOTION: "CMD: LED",
    LED_MANUAL_ON: "Manually ON",
    LED_MANUAL_OFF: "Manually OFF",
    LED_BRIGHTNESS_SET: "Brightness SET to:",
    LED_AUTO_MODE: "Auto Mode (Motion Active)",
    ERROR: "Error:",
    SCHEDULES_CLEARED: "ACK: schedules cleared",
    DAILY_SCHEDULE_SET: "ACK: Daily schedule set for LED"
}; 