// Test script for debugging Redis scheduler
import dotenv from 'dotenv';
import redisSchedulerService from './src/services/redisSchedulerService.js';
import arduinoController from './src/controllers/arduinoController.js';

dotenv.config();

// Function to sleep for the specified milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRedisScheduler() {
    try {
        console.log('Testing Redis scheduler functionality...');

        // Wait for connections to initialize
        console.log('Waiting for connections to initialize...');
        await sleep(3000);

        // Check Redis connection
        console.log('Checking Redis connection...');
        const redisStatus = await redisSchedulerService.checkConnection();
        console.log('Redis connection status:', redisStatus);

        if (!redisStatus.connected) {
            console.log('Redis is not connected. Using fallback scheduler.');
            console.log('Testing fallback scheduler...');
        } else {
            console.log('Redis is connected. Testing Redis scheduler...');
        }

        // Get current time
        const now = new Date();
        console.log('Current time:', now.toLocaleTimeString());

        // Schedule a test job for 5 seconds in the future
        const testTime = new Date(now.getTime() + 5000); // 5 seconds from now
        console.log('Scheduling test job for:', testTime.toLocaleTimeString());

        // Create a test schedule
        const ledId = 0;
        const scheduleId = 9999; // Test ID

        // Schedule turn ON
        console.log(`Scheduling LED ${ledId} to turn ON in 5 seconds...`);
        await redisSchedulerService.scheduleLedOn(ledId, scheduleId, testTime.getTime());

        // Schedule turn OFF 10 seconds later
        const offTime = new Date(now.getTime() + 15000); // 15 seconds from now
        console.log(`Scheduling LED ${ledId} to turn OFF in 15 seconds...`);
        await redisSchedulerService.scheduleLedOff(ledId, scheduleId, offTime.getTime());

        // Check pending jobs
        console.log('Checking pending jobs...');
        const pendingJobs = await redisSchedulerService.getPendingJobs();
        console.log('Pending jobs:', JSON.stringify(pendingJobs, null, 2));

        // Wait for jobs to execute
        console.log('Waiting for jobs to execute...');
        console.log('LED should turn ON in 5 seconds and OFF in 15 seconds...');

        // Wait for 20 seconds to observe both events
        for (let i = 0; i < 20; i++) {
            await sleep(1000);
            console.log(`Elapsed: ${i + 1} seconds`);

            // Every 5 seconds, check Arduino status
            if ((i + 1) % 5 === 0) {
                try {
                    const status = await arduinoController.getStatus();
                    console.log(`LED ${ledId} status:`,
                        status.leds[ledId].brightness > 0 ? 'ON' : 'OFF',
                        `(Brightness: ${status.leds[ledId].brightness})`
                    );
                } catch (error) {
                    console.error('Error getting Arduino status:', error.message);
                }
            }
        }

        // Check if any events were recorded
        console.log('Done! Check if LED turned ON and then OFF as expected.');

    } catch (error) {
        console.error('Error in test script:', error);
    } finally {
        console.log('Testing complete. Shutting down...');

        // Close Redis connection
        await redisSchedulerService.close();
        process.exit(0);
    }
}

// Run the test
testRedisScheduler(); 