const migration = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('DailySchedules', {
            daily_schedule_id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'user_id'
                },
                onDelete: 'CASCADE'
            },
            device_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Devices',
                    key: 'device_id'
                },
                onDelete: 'CASCADE'
            },
            led_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'The LED ID on the Arduino (0-2)'
            },
            on_hour: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 23
                }
            },
            on_minute: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 59
                }
            },
            off_hour: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 23
                }
            },
            off_minute: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 59
                }
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            last_applied: {
                type: Sequelize.DATE,
                allowNull: true,
                comment: 'Timestamp when this schedule was last applied to the Arduino'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // Add unique constraint
        await queryInterface.addIndex('DailySchedules', ['device_id', 'led_id'], {
            unique: true
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('DailySchedules');
    }
};

export default migration; 