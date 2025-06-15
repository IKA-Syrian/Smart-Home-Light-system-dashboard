// Test script for LED control and power monitoring
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// Configuration
const PORT_PATH = process.env.ARDUINO_PORT || 'COM5'; // Use the same port as in the app
const BAUD_RATE = 9600;

// Create serial port instance
const port = new SerialPort({ path: PORT_PATH, baudRate: BAUD_RATE });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Helper function to send commands and return promise
const sendCommand = (command) => {
    return new Promise((resolve, reject) => {
        console.log(`Sending command: ${command}`);
        port.write(`${command}\n`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

// Handle port opening
port.on('open', async () => {
    console.log(`Serial port ${PORT_PATH} opened successfully.`);

    try {
        // Wait for Arduino to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get initial status
        console.log('\n1. Getting initial status...');
        await sendCommand('Q');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Turn on LED 0
        console.log('\n2. Turning on LED 0...');
        await sendCommand('S01');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get updated status
        console.log('\n3. Getting updated status...');
        await sendCommand('Q');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set LED 0 to 50% brightness
        console.log('\n4. Setting LED 0 to 50% brightness...');
        await sendCommand('B0:128');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get updated status
        console.log('\n5. Getting updated status...');
        await sendCommand('Q');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Set LED 0 to 25% brightness
        console.log('\n6. Setting LED 0 to 25% brightness...');
        await sendCommand('B0:64');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get updated status
        console.log('\n7. Getting updated status...');
        await sendCommand('Q');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Turn off LED 0
        console.log('\n8. Turning off LED 0...');
        await sendCommand('S00');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get final status
        console.log('\n9. Getting final status...');
        await sendCommand('Q');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Wait for final responses and close
        console.log('\nTest sequence completed. Closing port in 3 seconds...');
        setTimeout(() => {
            port.close(() => {
                console.log('Port closed.');
                process.exit(0);
            });
        }, 3000);

    } catch (error) {
        console.error('Error during test sequence:', error);
        port.close();
        process.exit(1);
    }
});

// Handle errors
port.on('error', (err) => {
    console.error('Serial port error:', err);
    process.exit(1);
});

// Handle data from Arduino
parser.on('data', (data) => {
    console.log(`Arduino: ${data}`);

    // Parse and display status information if this is a status message
    if (data.startsWith('STATUS;')) {
        const parts = data.split(';');

        // Extract brightness and power values for each LED
        console.log('\nExtracted LED Data:');
        const ledData = [];

        for (let i = 0; i < 3; i++) {
            const brightness = parts.find(p => p.startsWith(`B${i}:`))?.split(':')[1] || '0';
            const energy = parts.find(p => p.startsWith(`EN${i}:`))?.split(':')[1] || '0';
            const power = parts.find(p => p.startsWith(`PW${i}:`))?.split(':')[1] || 'N/A';

            ledData.push({ led: i, brightness, energy, power });
        }

        console.table(ledData);
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