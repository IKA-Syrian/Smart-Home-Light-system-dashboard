// Test script for debugging schedule application
import dotenv from 'dotenv';
import ArduinoController from './src/controllers/arduinoController.js';
import db from './src/models/index.js';

dotenv.config();

// Function to sleep for the specified milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSchedules() {
    try {
        console.log('Testing schedule functionality...');

        // Wait for the serial connection to be established
        console.log('Waiting for serial connection to be established...');
        await sleep(3000); // Wait 3 seconds for connection to initialize

        // 1. Clear all schedules first
        console.log('Clearing all schedules...');
        await ArduinoController.clearAllSchedules();
        console.log('All schedules cleared.');

        // 2. Get all active schedules from the database
        const schedules = await db.Schedule.findAll({
            where: { is_active: true },
            order: [['led_id', 'ASC']]
        });

        console.log(`Found ${schedules.length} active schedules in the database.`);

        // 3. Print schedule details
        schedules.forEach((schedule, index) => {
            console.log(`Schedule ${index + 1}:`);
            console.log(`  ID: ${schedule.schedule_id}`);
            console.log(`  LED ID: ${schedule.led_id}`);
            console.log(`  On Time: ${schedule.on_hour}:${schedule.on_minute}`);
            console.log(`  Off Time: ${schedule.off_hour}:${schedule.off_minute}`);
            console.log(`  Is Active: ${schedule.is_active}`);
            console.log(`  Is Daily Schedule: ${schedule.is_daily_schedule}`);
        });

        // 4. Apply each schedule individually and check for errors
        console.log('\nApplying each schedule individually:');
        for (const schedule of schedules) {
            try {
                console.log(`Applying schedule ${schedule.schedule_id} for LED ${schedule.led_id}...`);
                const result = await ArduinoController.setDailySchedule(
                    schedule.led_id,
                    schedule.on_hour,
                    schedule.on_minute,
                    schedule.off_hour,
                    schedule.off_minute
                );
                console.log('Success:', result);
            } catch (error) {
                console.error(`Error applying schedule ${schedule.schedule_id}:`, error.message);

                // Try to debug the LED ID issue
                console.log(`Debugging LED ID ${schedule.led_id}:`);
                console.log(`  Is number: ${!isNaN(schedule.led_id)}`);
                console.log(`  Value: ${schedule.led_id}`);
                console.log(`  Type: ${typeof schedule.led_id}`);

                // Check if validation would pass
                const isValid = !isNaN(schedule.led_id) &&
                    schedule.led_id >= 0 &&
                    schedule.led_id < 3; // NUM_LEDS = 3
                console.log(`  Would validation pass: ${isValid}`);
            }
        }

        // 5. Get current Arduino status
        console.log('\nGetting current Arduino status...');
        const status = await ArduinoController.getStatus();
        console.log('Current Arduino status:', JSON.stringify(status, null, 2));

    } catch (error) {
        console.error('Error in test script:', error);
    } finally {
        // Close database connection
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run the test
testSchedules(); 