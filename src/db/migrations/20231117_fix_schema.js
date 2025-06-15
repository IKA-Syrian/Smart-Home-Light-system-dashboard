'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            console.log('Starting migration: Fix Schema');

            // Check if is_daily_schedule column exists in Schedules table
            const scheduleColumns = await queryInterface.describeTable('Schedules');
            if (!scheduleColumns.is_daily_schedule) {
                console.log('Adding is_daily_schedule column to Schedules table');
                await queryInterface.addColumn('Schedules', 'is_daily_schedule', {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                });
            }

            // Add other missing columns if they don't exist
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
                    console.log(`Adding ${column.name} column to Schedules table`);
                    await queryInterface.addColumn('Schedules', column.name, {
                        type: column.type,
                        allowNull: column.allowNull
                    });
                }
            }

            // Update Device type ENUM
            try {
                console.log('Updating Device.type ENUM to include arduino');
                await queryInterface.sequelize.query(
                    "ALTER TABLE Devices MODIFY COLUMN type ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other', 'arduino') NOT NULL"
                );
            } catch (error) {
                console.error('Error updating Device.type ENUM:', error.message);
                // Continue even if this fails, as we have fallback mechanisms
            }

            console.log('Migration completed successfully');
        } catch (error) {
            console.error('Error during migration:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            console.log('Starting rollback: Fix Schema');

            // Remove added columns from Schedules table
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
                try {
                    console.log(`Removing ${column} column from Schedules table`);
                    await queryInterface.removeColumn('Schedules', column);
                } catch (error) {
                    console.error(`Error removing ${column} column:`, error.message);
                }
            }

            // Revert Device type ENUM
            try {
                console.log('Reverting Device.type ENUM');
                await queryInterface.sequelize.query(
                    "ALTER TABLE Devices MODIFY COLUMN type ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other') NOT NULL"
                );
            } catch (error) {
                console.error('Error reverting Device.type ENUM:', error.message);
            }

            console.log('Rollback completed');
        } catch (error) {
            console.error('Error during rollback:', error);
            throw error;
        }
    }
}; 