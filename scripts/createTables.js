import db from '../src/models/index.js';

console.log('Creating tables directly...');

async function createTables() {
    try {
        // Test database connection
        await db.sequelize.authenticate();
        console.log('Database connection successful');

        // Check existing tables
        const queryInterface = db.sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        console.log('Existing tables:', tables);

        // Create DailySchedules table
        if (!tables.map(t => t.toString().toLowerCase()).includes('dailyschedules')) {
            console.log('Creating DailySchedules table...');
            await queryInterface.createTable('DailySchedules', {
                daily_schedule_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                user_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Users',
                        key: 'user_id'
                    },
                    onDelete: 'CASCADE'
                },
                device_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Devices',
                        key: 'device_id'
                    },
                    onDelete: 'CASCADE'
                },
                led_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    comment: 'The LED ID on the Arduino (0-2)'
                },
                on_hour: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false
                },
                on_minute: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false
                },
                off_hour: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false
                },
                off_minute: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false
                },
                is_active: {
                    type: db.Sequelize.DataTypes.BOOLEAN,
                    defaultValue: true
                },
                last_applied: {
                    type: db.Sequelize.DataTypes.DATE,
                    allowNull: true
                },
                created_at: {
                    type: db.Sequelize.DataTypes.DATE,
                    allowNull: false,
                    defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updated_at: {
                    type: db.Sequelize.DataTypes.DATE,
                    allowNull: false,
                    defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
                }
            });

            // Add unique constraint
            await queryInterface.addIndex('DailySchedules', ['device_id', 'led_id'], {
                unique: true
            });

            console.log('✅ DailySchedules table created successfully');
        } else {
            console.log('DailySchedules table already exists');
        }

        // Create EnergyLogs table
        if (!tables.map(t => t.toString().toLowerCase()).includes('energylogs')) {
            console.log('Creating EnergyLogs table...');
            await queryInterface.createTable('EnergyLogs', {
                energy_log_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true
                },
                user_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Users',
                        key: 'user_id'
                    },
                    onDelete: 'CASCADE'
                },
                device_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'Devices',
                        key: 'device_id'
                    },
                    onDelete: 'CASCADE'
                },
                led_id: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    comment: 'The LED ID on the Arduino (0-2)'
                },
                energy_wh: {
                    type: db.Sequelize.DataTypes.FLOAT,
                    allowNull: false,
                    comment: 'Energy consumed in Watt-hours'
                },
                log_date: {
                    type: db.Sequelize.DataTypes.DATEONLY,
                    allowNull: false,
                    comment: 'Date of the energy record (YYYY-MM-DD)'
                },
                log_hour: {
                    type: db.Sequelize.DataTypes.INTEGER,
                    allowNull: false,
                    comment: 'Hour of the energy record (0-23)'
                },
                created_at: {
                    type: db.Sequelize.DataTypes.DATE,
                    allowNull: false,
                    defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updated_at: {
                    type: db.Sequelize.DataTypes.DATE,
                    allowNull: false,
                    defaultValue: db.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
                }
            });

            // Add indexes
            await queryInterface.addIndex('EnergyLogs', ['device_id', 'led_id', 'log_date']);
            await queryInterface.addIndex('EnergyLogs', ['user_id', 'log_date']);

            console.log('✅ EnergyLogs table created successfully');
        } else {
            console.log('EnergyLogs table already exists');
        }

        console.log('All done! Closing connection...');
    } catch (error) {
        console.error('Error creating tables:', error);
        console.error(error.stack);
    } finally {
        await db.sequelize.close();
        console.log('Database connection closed');
    }
}

createTables(); 