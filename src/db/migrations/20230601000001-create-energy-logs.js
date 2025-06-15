const migration = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('EnergyLogs', {
            energy_log_id: {
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
            energy_wh: {
                type: Sequelize.FLOAT,
                allowNull: false,
                comment: 'Energy consumed in Watt-hours'
            },
            log_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                comment: 'Date of the energy record (YYYY-MM-DD)'
            },
            log_hour: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 23
                },
                comment: 'Hour of the energy record (0-23)'
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

        // Add indexes
        await queryInterface.addIndex('EnergyLogs', ['device_id', 'led_id', 'log_date']);
        await queryInterface.addIndex('EnergyLogs', ['user_id', 'log_date']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('EnergyLogs');
    }
};

export default migration; 