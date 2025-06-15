'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            console.log('Starting migration: Drop DailySchedules table');

            // First check if DailySchedules table exists
            const tables = await queryInterface.showAllTables();
            if (!tables.includes('DailySchedules')) {
                console.log('DailySchedules table does not exist, skipping migration');
                return;
            }

            // Drop the table
            await queryInterface.dropTable('DailySchedules');
            console.log('Successfully dropped DailySchedules table');
        } catch (error) {
            console.error('Error dropping DailySchedules table:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        try {
            console.log('Starting rollback: Recreate DailySchedules table');

            // Check if table already exists
            const tables = await queryInterface.showAllTables();
            if (tables.includes('DailySchedules')) {
                console.log('DailySchedules table already exists, skipping creation');
                return;
            }

            // Recreate the DailySchedules table
            await queryInterface.createTable('DailySchedules', {
                daily_schedule_id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Users',
                        key: 'user_id'
                    }
                },
                device_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Devices',
                        key: 'device_id'
                    }
                },
                led_id: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                on_hour: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                on_minute: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                off_hour: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                off_minute: {
                    type: Sequelize.INTEGER,
                    allowNull: false
                },
                is_active: {
                    type: Sequelize.BOOLEAN,
                    defaultValue: true
                },
                last_applied: {
                    type: Sequelize.DATE,
                    allowNull: true
                },
                created_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                },
                updated_at: {
                    type: Sequelize.DATE,
                    allowNull: false
                }
            });

            // Add unique constraint
            await queryInterface.addConstraint('DailySchedules', {
                fields: ['device_id', 'led_id'],
                type: 'unique',
                name: 'unique_device_led'
            });

            console.log('Successfully recreated DailySchedules table');
        } catch (error) {
            console.error('Error recreating DailySchedules table:', error);
            throw error;
        }
    }
}; 