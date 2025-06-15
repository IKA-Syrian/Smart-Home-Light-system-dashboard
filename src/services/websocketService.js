import WebSocket, { WebSocketServer } from 'ws';

class WebSocketService {
    constructor() {
        this.wss = null;
        this.currentStatus = null;
    }

    // Initialize WebSocket server
    initialize(server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws) => {
            console.log('Client connected via WebSocket');

            // Send current status to newly connected client
            if (this.currentStatus) {
                ws.send(JSON.stringify({
                    type: 'statusUpdate',
                    payload: this.currentStatus
                }));
            }

            ws.on('message', (message) => {
                console.log('Received WebSocket message:', message.toString());
                // Handle incoming messages from clients if needed
                this.handleClientMessage(ws, message);
            });

            ws.on('close', () => {
                console.log('Client disconnected via WebSocket');
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        console.log('WebSocket server initialized');
    }

    // Handle messages from WebSocket clients
    handleClientMessage(ws, message) {
        try {
            const data = JSON.parse(message.toString());
            console.log('Processing WebSocket message:', data);

            switch (data.type) {
                case 'requestStatus':
                    console.log('Client requested status update');
                    if (this.currentStatus) {
                        ws.send(JSON.stringify({
                            type: 'statusUpdate',
                            payload: this.currentStatus
                        }));
                    }
                    break;

                case 'controlDevice':
                    this.handleDeviceControl(ws, data.payload);
                    break;

                case 'setDailySchedule':
                    this.handleDailySchedule(ws, data.payload);
                    break;

                case 'clearSchedules':
                    this.handleClearSchedules(ws);
                    break;

                case 'requestEnergyData':
                    this.handleEnergyDataRequest(ws, data.payload);
                    break;

                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;

                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    // Handle device control messages
    async handleDeviceControl(ws, payload) {
        if (!payload) {
            console.error('Missing payload in controlDevice message');
            return;
        }

        console.log('Device control request:', payload);

        try {
            // Import the Arduino controller dynamically to avoid circular dependencies
            const arduinoController = (await import('../controllers/arduinoController.js')).default;

            // Extract parameters from payload
            const { ledId, command, brightness } = payload;

            if (ledId === undefined || ledId === null || !command) {
                console.error('Missing required parameters in controlDevice message');
                ws.send(JSON.stringify({
                    type: 'controlResponse',
                    success: false,
                    error: 'Missing required parameters',
                    originalCommand: payload
                }));
                return;
            }

            let result;

            // Process different commands
            switch (command) {
                case 'turnOn':
                    result = await arduinoController.setLEDManualOn(ledId);
                    break;

                case 'turnOff':
                    result = await arduinoController.setLEDManualOff(ledId);
                    break;

                case 'setBrightness':
                    if (brightness === undefined) {
                        throw new Error('Missing brightness parameter');
                    }
                    result = await arduinoController.setLEDBrightness(ledId, brightness);
                    break;

                case 'setAuto':
                    result = await arduinoController.setLEDAuto(ledId);
                    break;

                default:
                    throw new Error(`Unknown command: ${command}`);
            }

            // Send success response
            ws.send(JSON.stringify({
                type: 'controlResponse',
                success: true,
                ledId,
                command,
                result
            }));

        } catch (error) {
            console.error('Error processing device control:', error);

            // Send error response
            ws.send(JSON.stringify({
                type: 'controlResponse',
                success: false,
                error: error.message,
                originalCommand: payload
            }));
        }
    }

    // Handle daily schedule requests
    async handleDailySchedule(ws, payload) {
        if (!payload) {
            console.error('Missing payload in setDailySchedule message');
            return;
        }

        console.log('Daily schedule request:', payload);

        try {
            // Import the Arduino controller dynamically to avoid circular dependencies
            const arduinoController = (await import('../controllers/arduinoController.js')).default;

            // Extract parameters from payload
            const { ledId, onHour, onMinute, offHour, offMinute } = payload;

            if (ledId === undefined || onHour === undefined || onMinute === undefined ||
                offHour === undefined || offMinute === undefined) {
                console.error('Missing required parameters in setDailySchedule message');
                ws.send(JSON.stringify({
                    type: 'scheduleResponse',
                    success: false,
                    error: 'Missing required parameters',
                    originalCommand: payload
                }));
                return;
            }

            const result = await arduinoController.setDailySchedule(ledId, onHour, onMinute, offHour, offMinute);

            // Send success response
            ws.send(JSON.stringify({
                type: 'scheduleResponse',
                success: true,
                ledId,
                result
            }));

        } catch (error) {
            console.error('Error processing daily schedule:', error);

            // Send error response
            ws.send(JSON.stringify({
                type: 'scheduleResponse',
                success: false,
                error: error.message,
                originalCommand: payload
            }));
        }
    }

    // Handle clear schedules request
    async handleClearSchedules(ws) {
        try {
            // Import the Arduino controller dynamically to avoid circular dependencies
            const arduinoController = (await import('../controllers/arduinoController.js')).default;

            const result = await arduinoController.clearAllSchedules();

            // Send success response
            ws.send(JSON.stringify({
                type: 'scheduleResponse',
                success: true,
                action: 'clearAll',
                result
            }));

        } catch (error) {
            console.error('Error clearing schedules:', error);

            // Send error response
            ws.send(JSON.stringify({
                type: 'scheduleResponse',
                success: false,
                action: 'clearAll',
                error: error.message
            }));
        }
    }

    // Handle energy data requests
    async handleEnergyDataRequest(ws, payload) {
        try {
            // Import the Arduino controller dynamically to avoid circular dependencies
            const arduinoController = (await import('../controllers/arduinoController.js')).default;

            // Get full status to extract energy data
            const fullStatus = await arduinoController.getStatus();

            if (!fullStatus || !fullStatus.leds) {
                throw new Error('Failed to retrieve LED status');
            }

            const energyData = fullStatus.leds.map(led => ({
                ledId: led.id,
                energyToday: led.energyToday
            }));

            const totalEnergy = energyData.reduce((sum, led) => sum + led.energyToday, 0);

            // Send energy data
            ws.send(JSON.stringify({
                type: 'energyData',
                success: true,
                energyData,
                totalEnergyToday: totalEnergy,
                timestamp: new Date().toISOString()
            }));

        } catch (error) {
            console.error('Error processing energy data request:', error);

            // Send error response
            ws.send(JSON.stringify({
                type: 'energyData',
                success: false,
                error: error.message
            }));
        }
    }

    // Broadcast status to all connected clients
    broadcastStatus(statusData) {
        if (!statusData || !this.wss) return;

        this.currentStatus = statusData;
        const dataString = JSON.stringify({
            type: 'statusUpdate',
            payload: statusData
        });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(dataString);
                } catch (error) {
                    console.error('Error sending to WebSocket client:', error);
                }
            }
        });

        console.log("Broadcasted status to WebSocket clients.");
    }

    // Broadcast custom message to all clients
    broadcast(type, payload) {
        if (!this.wss) return;

        const dataString = JSON.stringify({ type, payload });

        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(dataString);
                } catch (error) {
                    console.error('Error broadcasting to WebSocket client:', error);
                }
            }
        });

        console.log(`Broadcasted ${type} to WebSocket clients.`);
    }

    // Get connection statistics
    getStats() {
        if (!this.wss) return { connected: 0 };

        return {
            connected: this.wss.clients.size,
            clients: Array.from(this.wss.clients).map((client, index) => ({
                id: index,
                readyState: client.readyState,
                readyStateText: this.getReadyStateText(client.readyState)
            }))
        };
    }

    // Get readable ready state
    getReadyStateText(readyState) {
        switch (readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    // Close WebSocket server
    close() {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                client.close();
            });
            this.wss.close();
            console.log('WebSocket server closed');
        }
    }
}

export default new WebSocketService(); 