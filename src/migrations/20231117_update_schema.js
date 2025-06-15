'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            console.log('Starting migration: Update schema');

            // 1. Update Device.type field to include 'arduino' type
            console.log('Updating Device.type ENUM to include arduino...');
            await queryInterface.sequelize.query(
                "ALTER TABLE Devices MODIFY COLUMN type ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other', 'arduino');"
            );

            // 2. Add is_daily_schedule column to Schedules table if it doesn't exist
            console.log('Adding is_daily_schedule column to Schedules table...');
            const scheduleColumns = await queryInterface.describeTable('Schedules');

            if (!scheduleColumns.is_daily_schedule) {
                await queryInterface.addColumn('Schedules', 'is_daily_schedule', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                });
            }

            // 3. Add other missing columns to Schedules table for daily schedules
            const columnsToAdd = [
                { name: 'led_id', type: Sequelize.INTEGER, allowNull: true },
                { name: 'on_hour', type: Sequelize.INTEGER, allowNull: true },
                { name: 'on_minute', type: Sequelize.INTEGER, allowNull: true },
                { name: 'off_hour', type: Sequelize.INTEGER, allowNull: true },
                { name: 'off_minute', type: Sequelize.INTEGER, allowNull: true },
                { name: 'last_applied', type: Sequelize.DATE, allowNull: true }
            ];

            for (const column of columnsToAdd) {
                if (!scheduleColumns[column.name]) {
                    console.log(`Adding ${column.name} column to Schedules table...`);
                    await queryInterface.addColumn('Schedules', column.name, {
                        type: column.type,
                        allowNull: column.allowNull
                    });
                }
            }

            console.log('Migration completed successfully');
        } catch (error) {
            console.error('Error during migration:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            console.log('Starting rollback: Revert schema changes');

            // 1. Revert Device.type ENUM
            console.log('Reverting Device.type ENUM...');
            await queryInterface.sequelize.query(
                "ALTER TABLE Devices MODIFY COLUMN type ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other');"
            );

            // 2. Drop columns added to Schedules table
            const columnsToRemove = [
                'is_daily_schedule',
                'led_id',
                'on_hour',
                'on_minute',
                'off_hour',
                'off_minute',
                'last_applied'
            ];

            for (const column of columnsToRemove) {
                console.log(`Removing ${column} column from Schedules table...`);
                await queryInterface.removeColumn('Schedules', column);
            }

            console.log('Rollback completed successfully');
        } catch (error) {
            console.error('Error during rollback:', error);
            throw error;
        }
    }
}; 