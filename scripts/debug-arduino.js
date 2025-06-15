// Debug script for Arduino communication
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Configuration
const PORT_PATH = process.env.ARDUINO_PORT || 'COM5'; // Use the same port as in the app
const BAUD_RATE = 9600;

// Create serial port instance
const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Handle port opening
port.on('open', () => {
    console.log(`Serial port ${PORT_PATH} opened successfully.`);
    console.log('Sending status query command (Q) to Arduino...');

    // Send status query after a short delay
    setTimeout(() => {
        port.write('Q\n', (err) => {
            if (err) {
                console.error('Error writing to port:', err);
            } else {
                console.log('Status query sent. Waiting for response...');
            }
        });
    }, 1000);
});

// Handle errors
port.on('error', (err) => {
    console.error('Serial port error:', err);
});

// Handle data from Arduino
parser.on('data', (data) => {
    console.log('Received raw data:', data);

    // If it's a status message, parse it
    if (data.startsWith('STATUS;')) {
        console.log('\nParsing status message:');
        const parts = data.split(';');

        // Log each part for debugging
        parts.forEach((part, index) => {
            if (part) {
                console.log(`  Part ${index}: ${part}`);
            }
        });

        // Check if PW fields exist
        const pwFields = parts.filter(part => part.startsWith('PW'));
        console.log('\nPower fields found:', pwFields.length > 0 ? pwFields.join(', ') : 'None');

        // After receiving status, close the port
        setTimeout(() => {
            console.log('\nClosing port...');
            port.close();
        }, 1000);
    }
});

// Exit handler
process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    if (port.isOpen) {
        port.close();
    }
    process.exit(0);
}); 