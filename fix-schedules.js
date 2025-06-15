// Script to fix and apply all schedules
import dotenv from 'dotenv';
import db from './src/models/index.js';
import arduinoController from './src/controllers/arduinoController.js';

dotenv.config();

async function fixAndApplySchedules() {
    try {
        console.log('Starting schedule fix and apply process...');

        // 1. Get all active schedules
        const schedules = await db.Schedule.findAll({
            where: { is_active: true },
            order: [['led_id', 'ASC']]
        });

        console.log(`Found ${schedules.length} active schedules in the database.`);

        if (schedules.length === 0) {
            console.log('No active schedules found. Exiting.');
            return;
        }

        // 2. Clear all schedules from Arduino
        try {
            console.log('Clearing all schedules from Arduino...');
            await arduinoController.clearAllSchedules();
            console.log('All schedules cleared successfully.');
        } catch (error) {
            console.error('Error clearing schedules:', error.message);
            console.log('Continuing with schedule application...');
        }

        // 3. Apply each schedule individually
        console.log('\nApplying schedules to Arduino:');
        let successCount = 0;

        for (const schedule of schedules) {
            try {
                // Ensure LED ID is valid (0, 1, or 2)
                const ledId = Number(schedule.led_id);
                if (isNaN(ledId) || ledId < 0 || ledId > 2) {
                    console.error(`Invalid LED ID ${schedule.led_id} for schedule ${schedule.schedule_id}. Skipping.`);
                    continue;
                }

                console.log(`Applying schedule ${schedule.schedule_id} for LED ${ledId}...`);

                // Apply schedule to Arduino
                await arduinoController.setDailySchedule(
                    ledId,
                    schedule.on_hour,
                    schedule.on_minute,
                    schedule.off_hour,
                    schedule.off_minute
                );

                // Update last_applied timestamp
                await schedule.update({ last_applied: new Date() });

                console.log(`Successfully applied schedule ${schedule.schedule_id}.`);
                successCount++;
            } catch (error) {
                console.error(`Error applying schedule ${schedule.schedule_id}:`, error.message);
            }
        }

        console.log(`\nApplied ${successCount} of ${schedules.length} schedules.`);

        // 4. Get current Arduino status
        try {
            console.log('\nGetting current Arduino status...');
            const status = await arduinoController.getStatus();
            console.log('Current Arduino status:', JSON.stringify(status, null, 2));
        } catch (error) {
            console.error('Error getting Arduino status:', error.message);
        }

    } catch (error) {
        console.error('Error in fix and apply script:', error);
    } finally {
        // Close database connection
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run the script
fixAndApplySchedules(); 