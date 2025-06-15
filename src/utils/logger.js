// Logger utility for better debugging
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDir();

        // Define log files
        this.schedulerLogPath = path.join(this.logDir, 'scheduler.log');
        this.redisLogPath = path.join(this.logDir, 'redis-scheduler.log');
        this.arduinoLogPath = path.join(this.logDir, 'arduino.log');
        this.apiLogPath = path.join(this.logDir, 'api.log');

        // Initialize timestamps
        this.lastLogTimes = {
            scheduler: Date.now(),
            redis: Date.now(),
            arduino: Date.now(),
            api: Date.now(),
        };
    }

    // Ensure log directory exists
    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
            console.log(`Created log directory: ${this.logDir}`);
        }
    }

    // Format log message
    formatLogMessage(message, data = null, elapsed = null) {
        const timestamp = new Date().toISOString();
        let logMsg = `[${timestamp}] ${message}`;

        if (elapsed !== null) {
            logMsg += ` (${elapsed}ms)`;
        }

        if (data) {
            let dataStr;
            try {
                if (typeof data === 'object') {
                    dataStr = JSON.stringify(data);
                } else {
                    dataStr = String(data);
                }
                logMsg += `\n${dataStr}`;
            } catch (error) {
                logMsg += `\n[Unable to stringify data: ${error.message}]`;
            }
        }

        return logMsg + '\n';
    }

    // Write to log file
    writeLog(filePath, message, data = null, type = 'info') {
        try {
            // Format message with timestamp
            const logMsg = this.formatLogMessage(message, data);

            // Append to log file
            fs.appendFileSync(filePath, logMsg);

            // Also log to console with color coding based on type
            let consoleMethod = console.log;
            let prefix = '';

            switch (type) {
                case 'error':
                    consoleMethod = console.error;
                    prefix = '\x1b[31m[ERROR]\x1b[0m ';
                    break;
                case 'warn':
                    consoleMethod = console.warn;
                    prefix = '\x1b[33m[WARN]\x1b[0m ';
                    break;
                case 'debug':
                    prefix = '\x1b[36m[DEBUG]\x1b[0m ';
                    break;
                default:
                    prefix = '\x1b[32m[INFO]\x1b[0m ';
            }

            consoleMethod(`${prefix}${message}`);
            if (data) {
                try {
                    consoleMethod(typeof data === 'object' ? data : String(data));
                } catch (e) {
                    consoleMethod('[Data not printable]');
                }
            }
        } catch (error) {
            console.error(`Error writing to log file ${filePath}:`, error);
        }
    }

    // Log scheduler-related messages
    scheduler(message, data = null, type = 'info') {
        const now = Date.now();
        const elapsed = now - this.lastLogTimes.scheduler;
        this.lastLogTimes.scheduler = now;

        this.writeLog(this.schedulerLogPath, `[SCHEDULER] ${message}`, data, type);
        return elapsed;
    }

    // Log Redis scheduler-related messages
    redis(message, data = null, type = 'info') {
        const now = Date.now();
        const elapsed = now - this.lastLogTimes.redis;
        this.lastLogTimes.redis = now;

        this.writeLog(this.redisLogPath, `[REDIS] ${message}`, data, type);
        return elapsed;
    }

    // Log Arduino-related messages
    arduino(message, data = null, type = 'info') {
        const now = Date.now();
        const elapsed = now - this.lastLogTimes.arduino;
        this.lastLogTimes.arduino = now;

        this.writeLog(this.arduinoLogPath, `[ARDUINO] ${message}`, data, type);
        return elapsed;
    }

    // Log API-related messages
    api(message, data = null, type = 'info') {
        const now = Date.now();
        const elapsed = now - this.lastLogTimes.api;
        this.lastLogTimes.api = now;

        this.writeLog(this.apiLogPath, `[API] ${message}`, data, type);
        return elapsed;
    }

    // Helper methods for each log level
    error(category, message, data = null) {
        switch (category) {
            case 'scheduler': this.scheduler(message, data, 'error'); break;
            case 'redis': this.redis(message, data, 'error'); break;
            case 'arduino': this.arduino(message, data, 'error'); break;
            case 'api': this.api(message, data, 'error'); break;
            default: console.error(`[${category.toUpperCase()}] ${message}`, data);
        }
    }

    warn(category, message, data = null) {
        switch (category) {
            case 'scheduler': this.scheduler(message, data, 'warn'); break;
            case 'redis': this.redis(message, data, 'warn'); break;
            case 'arduino': this.arduino(message, data, 'warn'); break;
            case 'api': this.api(message, data, 'warn'); break;
            default: console.warn(`[${category.toUpperCase()}] ${message}`, data);
        }
    }

    debug(category, message, data = null) {
        switch (category) {
            case 'scheduler': this.scheduler(message, data, 'debug'); break;
            case 'redis': this.redis(message, data, 'debug'); break;
            case 'arduino': this.arduino(message, data, 'debug'); break;
            case 'api': this.api(message, data, 'debug'); break;
            default: console.log(`[DEBUG:${category.toUpperCase()}] ${message}`, data);
        }
    }
}

// Create and export singleton logger instance
const logger = new Logger();
export default logger; 