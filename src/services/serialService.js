import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { arduinoConfig } from '../config/arduinoConfig.js';

class SerialService {
    constructor() {
        this.serialPort = null;
        this.parser = null;
        this.isPortOpen = false;
        this.lastArduinoMessage = "Awaiting initial Arduino message...";
        this.statusUpdateCallback = null;
        this.messageCallback = null;
    }

    // Initialize serial port connection
    async initialize() {
        if (arduinoConfig.portPath === 'DISABLED') {
            console.log('Arduino functionality disabled via configuration');
            return;
        }

        this.setupSerial();
    }

    setupSerial() {
        console.log(`Attempting to open serial port ${arduinoConfig.portPath}...`);

        this.serialPort = new SerialPort({
            path: arduinoConfig.portPath,
            baudRate: arduinoConfig.baudRate
        });

        this.parser = this.serialPort.pipe(new ReadlineParser({
            delimiter: arduinoConfig.delimiter
        }));

        this.serialPort.on("open", () => {
            this.isPortOpen = true;
            console.log(`Serial port ${arduinoConfig.portPath} open.`);
            this.lastArduinoMessage = "Serial port opened, waiting for Arduino ready...";

            // Request initial status after connection
            setTimeout(() => {
                this.requestStatus();
            }, arduinoConfig.statusRequestDelay);
        });

        this.parser.on('data', (data) => {
            const message = data.toString().trim();
            console.log('Arduino:', message);
            this.lastArduinoMessage = message;

            // Trigger callback for message processing
            if (this.messageCallback) {
                this.messageCallback(message);
            }
        });

        this.serialPort.on('error', (err) => {
            console.error('Serial Port Error: ', err.message);
            this.isPortOpen = false;
            this.lastArduinoMessage = `Serial Port Error: ${err.message}`;

            if (this.statusUpdateCallback) {
                this.statusUpdateCallback({
                    error: "Serial Port Error",
                    message: err.message
                });
            }

            if (!this.serialPort || !this.serialPort.isOpen) {
                console.log(`Attempting to reopen serial port in ${arduinoConfig.reconnectDelay / 1000} seconds due to error...`);
                setTimeout(() => this.setupSerial(), arduinoConfig.reconnectDelay);
            }
        });

        this.serialPort.on('close', () => {
            console.log('Serial port closed.');
            this.isPortOpen = false;
            this.lastArduinoMessage = "Serial port closed.";

            if (this.statusUpdateCallback) {
                this.statusUpdateCallback({ error: "Serial Port Closed" });
            }

            console.log(`Attempting to reopen serial port in ${arduinoConfig.reconnectDelay / 1000} seconds...`);
            setTimeout(() => this.setupSerial(), arduinoConfig.reconnectDelay);
        });
    }

    // Send command to Arduino and wait for specific response
    async sendCommand(commandString, expectedResponsePrefix) {
        if (!this.isPortOpen || !this.serialPort || !this.serialPort.isOpen) {
            throw new Error(`Cannot send command. Serial port ${arduinoConfig.portPath} is not open. Last message: ${this.lastArduinoMessage}`);
        }

        const commandWithNewline = commandString + '\n';

        return new Promise((resolve, reject) => {
            let localParserListener;
            const timer = setTimeout(() => {
                if (localParserListener) {
                    this.parser.removeListener('data', localParserListener);
                }
                reject(new Error(`Timeout: No specific response from Arduino for command '${commandString}' starting with '${expectedResponsePrefix}' within ${arduinoConfig.timeout / 1000}s. Last raw message from Arduino: ${this.lastArduinoMessage}`));
            }, arduinoConfig.timeout);

            localParserListener = (data) => {
                const message = data.toString().trim();
                if (message.startsWith(expectedResponsePrefix)) {
                    clearTimeout(timer);
                    if (localParserListener) {
                        this.parser.removeListener('data', localParserListener);
                    }
                    resolve(message);
                } else if (message.startsWith("Error:")) {
                    clearTimeout(timer);
                    if (localParserListener) {
                        this.parser.removeListener('data', localParserListener);
                    }
                    reject(new Error(`Arduino error: ${message}`));
                }
            };

            this.parser.on('data', localParserListener);

            this.serialPort.write(commandWithNewline, (err) => {
                if (err) {
                    clearTimeout(timer);
                    if (localParserListener) {
                        this.parser.removeListener('data', localParserListener);
                    }
                    return reject(new Error(`Error writing to serial port: ${err.message}`));
                }
                console.log(`Command '${commandString}' sent to Arduino.`);
            });
        });
    }

    // Request status from Arduino
    requestStatus() {
        if (!this.isPortOpen || !this.serialPort || !this.serialPort.isOpen) {
            console.log("Serial port not open, cannot request status.");
            return;
        }

        console.log("Proactively requesting full status from Arduino...");
        this.serialPort.write('Q\n', (err) => {
            if (err) {
                console.error("Error writing 'Q' command:", err.message);
            } else {
                console.log("Sent 'Q' to Arduino to fetch latest status for broadcast.");
            }
        });
    }

    // Set callback for status updates
    setStatusUpdateCallback(callback) {
        this.statusUpdateCallback = callback;
    }

    // Set callback for message processing
    setMessageCallback(callback) {
        this.messageCallback = callback;
    }

    // Close serial port
    close() {
        if (this.serialPort && this.serialPort.isOpen) {
            this.serialPort.close(() => {
                console.log('📡 Serial port closed.');
            });
        }
    }

    // Getters
    getConnectionStatus() {
        return {
            isOpen: this.isPortOpen,
            port: arduinoConfig.portPath,
            lastMessage: this.lastArduinoMessage
        };
    }
}

export default new SerialService(); 