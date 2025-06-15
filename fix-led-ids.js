// Script to fix LED ID issues in the database
import dotenv from 'dotenv';
import db from './src/models/index.js';

dotenv.config();

async function fixLedIds() {
    try {
        console.log('Starting LED ID fix process...');

        // Get all schedules
        const schedules = await db.Schedule.findAll();

        console.log(`Found ${schedules.length} schedules in the database.`);

        let fixedCount = 0;

        // Check and fix each schedule
        for (const schedule of schedules) {
            const ledId = Number(schedule.led_id);

            // Check if LED ID is invalid (outside the range 0-2)
            if (isNaN(ledId) || ledId < 0 || ledId > 2) {
                console.log(`Found invalid LED ID ${schedule.led_id} for schedule ${schedule.schedule_id}`);

                // Fix the LED ID by setting it to a valid value (0, 1, or 2)
                // Choose based on the schedule ID to distribute evenly
                const newLedId = schedule.schedule_id % 3; // This will give 0, 1, or 2

                console.log(`Updating schedule ${schedule.schedule_id} LED ID from ${schedule.led_id} to ${newLedId}`);

                // Update the schedule in the database
                await schedule.update({ led_id: newLedId });

                fixedCount++;
            }
        }

        console.log(`Fixed ${fixedCount} schedules with invalid LED IDs.`);

        if (fixedCount > 0) {
            console.log('You should now run fix-schedules.js to apply the updated schedules to the Arduino.');
        } else {
            console.log('No invalid LED IDs found. All schedules have valid LED IDs (0, 1, or 2).');
        }

    } catch (error) {
        console.error('Error fixing LED IDs:', error);
    } finally {
        // Close database connection
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run the script
fixLedIds(); 