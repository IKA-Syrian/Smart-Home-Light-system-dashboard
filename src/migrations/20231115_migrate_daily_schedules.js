'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            console.log('Starting migration: DailySchedules to Schedules');

            // First check if DailySchedules table exists
            const tables = await queryInterface.showAllTables();
            if (!tables.includes('DailySchedules')) {
                console.log('DailySchedules table does not exist, skipping migration');
                return;
            }

            // Get all records from DailySchedules table
            const dailySchedules = await queryInterface.sequelize.query(
                'SELECT * FROM DailySchedules',
                { type: Sequelize.QueryTypes.SELECT }
            );

            console.log(`Found ${dailySchedules.length} daily schedules to migrate`);

            // Insert records into Schedules table with is_daily_schedule = true
            if (dailySchedules.length > 0) {
                const scheduleRecords = dailySchedules.map(schedule => ({
                    user_id: schedule.user_id,
                    device_id: schedule.device_id,
                    led_id: schedule.led_id,
                    on_hour: schedule.on_hour,
                    on_minute: schedule.on_minute,
                    off_hour: schedule.off_hour,
                    off_minute: schedule.off_minute,
                    is_active: schedule.is_active,
                    last_applied: schedule.last_applied,
                    is_daily_schedule: true,
                    created_at: schedule.created_at || new Date(),
                    updated_at: schedule.updated_at || new Date()
                }));

                await queryInterface.bulkInsert('Schedules', scheduleRecords);
                console.log(`Migrated ${scheduleRecords.length} records to Schedules table`);
            }

            console.log('Migration completed successfully');
        } catch (error) {
            console.error('Error during migration:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            console.log('Rolling back migration: Schedules to DailySchedules');

            // Delete all records with is_daily_schedule = true from Schedules table
            await queryInterface.bulkDelete('Schedules', { is_daily_schedule: true });
            console.log('Deleted migrated records from Schedules table');

            console.log('Rollback completed successfully');
        } catch (error) {
            console.error('Error during rollback:', error);
            throw error;
        }
    }
}; 