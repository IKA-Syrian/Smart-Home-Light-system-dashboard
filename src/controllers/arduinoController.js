import serialService from '../services/serialService.js';
import websocketService from '../services/websocketService.js';
import { arduinoConfig, serialCommands, responsePatterns } from '../config/arduinoConfig.js';

class ArduinoController {
    constructor() {
        this.currentParsedStatus = null;
        this.initialize();
    }

    // Initialize Arduino controller
    async initialize() {
        // Set up message callback for serial service
        serialService.setMessageCallback((message) => {
            this.handleArduinoMessage(message);
        });

        // Set up status update callback
        serialService.setStatusUpdateCallback((statusData) => {
            websocketService.broadcastStatus(statusData);
        });

        // Initialize serial service
        await serialService.initialize();
    }

    // Handle incoming Arduino messages
    handleArduinoMessage(message) {
        // If the message is a full status update from Arduino, parse and broadcast
        if (message.startsWith(responsePatterns.STATUS)) {
            this.currentParsedStatus = this.parseArduinoStatus(message);
            websocketService.broadcastStatus(this.currentParsedStatus);
        }
        // If it's an INFO message (like timed schedule expiry), also refresh status
        else if (message.startsWith("INFO:")) {
            setTimeout(() => {
                serialService.requestStatus();
            }, 200); // Slight delay
        }
    }

    // Parse Arduino status string into structured object
    parseArduinoStatus(statusString) {
        const parts = statusString.split(';');
        const status = { pirEnabled: false, leds: [] };

        if (parts[0] !== "STATUS") {
            return { error: "Invalid status format", raw: statusString };
        }

        // Initialize LED status array
        for (let i = 0; i < arduinoConfig.NUM_LEDS; i++) {
            status.leds.push({
                id: i,
                motionActiveConfig: false,
                manualControlActive: false,
                timedScheduleActive: false,
                timedScheduleRemainingSeconds: 0,
                brightness: 0,
                energyToday: 0.0,
                currentPowerW: 0.0
            });
        }

        // Parse status parts
        parts.slice(1).forEach(part => {
            const [keyVal, value] = part.split(':');
            if (!keyVal || value === undefined) return;

            const type = keyVal.length > 1 && isNaN(parseInt(keyVal.charAt(keyVal.length - 1)))
                ? keyVal
                : keyVal.substring(0, keyVal.length - 1);
            const indexIfApplicable = parseInt(keyVal.substring(keyVal.length - 1));

            if (keyVal === "PIR") {
                status.pirEnabled = (value === "1");
            }
            else if (type === "LM" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].motionActiveConfig = (value === "1");
            }
            else if (type === "MC" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].manualControlActive = (value === "1");
            }
            else if (type === "TS" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].timedScheduleActive = (value === "1");
            }
            else if (type === "TR" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].timedScheduleRemainingSeconds = parseInt(value);
                if (parseInt(value) > 0) {
                    status.leds[indexIfApplicable].timedScheduleActive = true;
                }
            }
            else if (type === "B" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].brightness = parseInt(value);
            }
            else if (type === "EN" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].energyToday = parseFloat(value);
            }
            else if (type === "PW" && indexIfApplicable >= 0 && indexIfApplicable < arduinoConfig.NUM_LEDS) {
                status.leds[indexIfApplicable].currentPowerW = parseFloat(value);
            }
        });

        // Calculate power based on brightness if PW fields are missing
        const hasPowerFields = parts.some(part => part.startsWith('PW'));
        if (!hasPowerFields) {
            // Calculate power for each LED based on brightness
            for (let i = 0; i < arduinoConfig.NUM_LEDS; i++) {
                const led = status.leds[i];
                if (led.brightness > 0) {
                    // Constants for LED power calculation
                    const MAX_LED_POWER = 5.0; // Watts at full brightness
                    const powerFactor = led.brightness / 255.0;

                    // Calculate power in Watts
                    led.currentPowerW = powerFactor * MAX_LED_POWER;
                } else {
                    led.currentPowerW = 0;
                }
            }
            console.log('Calculated power values based on LED brightness');
        }

        return status;
    }

    // Send command and handle response
    async sendCommand(commandString, expectedResponsePrefix, isStatusQuery = false) {
        try {
            const arduinoResponse = await serialService.sendCommand(commandString, expectedResponsePrefix);

            // After a successful command that changes state, request the latest full status
            if (!isStatusQuery) {
                setTimeout(() => {
                    serialService.requestStatus();
                }, 100); // Slight delay to allow Arduino to process
            }

            if (isStatusQuery) {
                this.currentParsedStatus = this.parseArduinoStatus(arduinoResponse);
                return this.currentParsedStatus;
            }

            return {
                status: "success",
                message: `Command '${commandString}' acknowledged.`,
                arduinoResponse: arduinoResponse
            };
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // PIR sensor controls
    async enablePIR() {
        return await this.sendCommand(serialCommands.PIR_ENABLE, responsePatterns.PIR_ENABLED);
    }

    async disablePIR() {
        return await this.sendCommand(serialCommands.PIR_DISABLE, responsePatterns.PIR_DISABLED);
    }

    // LED controls
    async setLEDMotionConfig(ledId, active) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const command = `${serialCommands.LED_MOTION_CONFIG}${ledId}${active ? '1' : '0'}`;
        const expectedResponse = `${responsePatterns.LED_MOTION} ${ledId} motion:`;
        return await this.sendCommand(command, expectedResponse);
    }

    async setLEDManualOn(ledId) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const command = `${serialCommands.LED_MANUAL_ON}${ledId}1`;
        const expectedResponse = `CMD: LED ${ledId} ON persistently`;
        return await this.sendCommand(command, expectedResponse);
    }

    async setLEDManualOff(ledId) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const command = `${serialCommands.LED_MANUAL_ON}${ledId}0`;
        const expectedResponse = `CMD: LED ${ledId} OFF persistently`;
        return await this.sendCommand(command, expectedResponse);
    }

    async setLEDBrightness(ledId, level) {
        if (!this.validateLedId(ledId) || !this.validateBrightness(level)) {
            throw new Error("Invalid LED ID or brightness level");
        }

        const command = `${serialCommands.LED_BRIGHTNESS}${ledId}:${level}`;
        const expectedResponse = `CMD: LED ${ledId} brightness ${level}`;
        return await this.sendCommand(command, expectedResponse);
    }

    async setLEDAuto(ledId) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const command = `${serialCommands.LED_AUTO_MODE}${ledId}`;
        const expectedResponse = `${responsePatterns.LED_MOTION} ${ledId} ${responsePatterns.LED_AUTO_MODE}`;
        return await this.sendCommand(command, expectedResponse);
    }

    async setLEDSchedule(ledId, durationSeconds) {
        if (!this.validateLedId(ledId) || !this.validateDuration(durationSeconds)) {
            throw new Error("Invalid LED ID or duration");
        }

        const command = `${serialCommands.LED_SCHEDULE}${ledId}:${durationSeconds}`;
        const expectedResponse = `${responsePatterns.LED_MOTION} ${ledId} ${responsePatterns.LED_MANUAL_ON} for ${durationSeconds}s`;

        const requestTimeUTC = Date.now();
        const result = await this.sendCommand(command, expectedResponse);

        // Add timing information for schedule
        const expectedOffTimeUTC = new Date(requestTimeUTC + (durationSeconds * 1000));
        return {
            ...result,
            ledId,
            durationSeconds,
            expectedOffTimeUTC: expectedOffTimeUTC.toISOString()
        };
    }

    // New methods for daily schedule
    async setDailySchedule(ledId, onHour, onMinute, offHour, offMinute) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        if (!this.validateTime(onHour, onMinute) || !this.validateTime(offHour, offMinute)) {
            throw new Error("Invalid time format. Hours must be 0-23, minutes must be 0-59");
        }

        // Format with padding to ensure 2 digits
        const formattedOnHour = String(onHour).padStart(2, '0');
        const formattedOnMinute = String(onMinute).padStart(2, '0');
        const formattedOffHour = String(offHour).padStart(2, '0');
        const formattedOffMinute = String(offMinute).padStart(2, '0');

        const command = `${serialCommands.DAILY_SCHEDULE}${ledId}${formattedOnHour}${formattedOnMinute}${formattedOffHour}${formattedOffMinute}`;
        const expectedResponse = responsePatterns.DAILY_SCHEDULE_SET;

        const result = await this.sendCommand(command, expectedResponse);

        return {
            ...result,
            ledId,
            dailySchedule: {
                onTime: `${formattedOnHour}:${formattedOnMinute}`,
                offTime: `${formattedOffHour}:${formattedOffMinute}`
            }
        };
    }

    async clearAllSchedules() {
        const command = serialCommands.CLEAR_SCHEDULES;
        const expectedResponse = responsePatterns.SCHEDULES_CLEARED;

        return await this.sendCommand(command, expectedResponse);
    }

    // Get status
    async getStatus() {
        return await this.sendCommand(serialCommands.STATUS_QUERY, responsePatterns.STATUS, true);
    }

    async getLEDStatus(ledId) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const fullStatus = await this.getStatus();

        if (fullStatus.leds && fullStatus.leds[ledId]) {
            return { status: "success", ledStatus: fullStatus.leds[ledId] };
        } else {
            throw new Error(`LED ID ${ledId} not found in parsed status.`);
        }
    }

    // Get LED energy usage
    async getLEDEnergy(ledId) {
        if (!this.validateLedId(ledId)) {
            throw new Error("Invalid LED ID");
        }

        const fullStatus = await this.getStatus();

        if (fullStatus.leds && fullStatus.leds[ledId]) {
            return {
                status: "success",
                ledId,
                energyToday: fullStatus.leds[ledId].energyToday,
                currentPowerW: fullStatus.leds[ledId].currentPowerW
            };
        } else {
            throw new Error(`LED ID ${ledId} not found in parsed status.`);
        }
    }

    // Send reset command for energy counters
    async resetEnergyCounters() {
        const command = 'R'; // Reset energy command
        const expectedResponse = "ACK: Energy counters reset";

        return await this.sendCommand(command, expectedResponse);
    }

    // Get current power consumption
    async getCurrentPower() {
        const command = 'W'; // Power status command
        const expectedResponse = "POWER;";

        // Note: This will return raw data, not parsed. To get parsed data, use getStatus()
        const response = await serialService.sendCommand(command, expectedResponse);

        return {
            status: "success",
            rawPowerData: response
        };
    }

    // Validation helpers
    validateLedId(ledId) {
        return !isNaN(ledId) && ledId >= 0 && ledId < arduinoConfig.NUM_LEDS;
    }

    validateBrightness(level) {
        return typeof level === 'number' && !isNaN(level) && level >= 0 && level <= 255;
    }

    validateDuration(duration) {
        return !isNaN(duration) && duration > 0;
    }

    validateTime(hours, minutes) {
        return !isNaN(hours) && hours >= 0 && hours <= 23 &&
            !isNaN(minutes) && minutes >= 0 && minutes <= 59;
    }

    // Get current status
    getCurrentStatus() {
        return this.currentParsedStatus;
    }

    // Get connection information
    getConnectionInfo() {
        return serialService.getConnectionStatus();
    }

    // Reset Arduino serial connection
    async resetConnection() {
        console.log('Attempting to reset Arduino serial connection...');
        try {
            // Close existing connection if open
            serialService.close();

            // Wait a brief moment for the port to fully close
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Re-initialize the serial service
            await serialService.initialize();

            return {
                status: "success",
                message: "Arduino connection reset initiated. Reconnection in progress."
            };
        } catch (error) {
            console.error('Error resetting Arduino connection:', error);
            throw new Error(`Failed to reset Arduino connection: ${error.message}`);
        }
    }
}

export default new ArduinoController(); 