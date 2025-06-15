import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const EnergyLog = sequelize.define('EnergyLog', {
        energy_log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'user_id'
            }
        },
        device_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Devices',
                key: 'device_id'
            }
        },
        led_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'The LED ID on the Arduino (0-2)'
        },
        energy_wh: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Energy consumed in Watt-hours'
        },
        current_power_w: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0,
            comment: 'Current power consumption in Watts'
        },
        log_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Date of the energy record (YYYY-MM-DD)'
        },
        log_hour: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 23
            },
            comment: 'Hour of the energy record (0-23)'
        },
        log_minute: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 59
            },
            comment: 'Minute of the energy record (0-59)'
        }
    }, {
        tableName: 'EnergyLogs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['device_id', 'led_id', 'log_date']
            },
            {
                fields: ['user_id', 'log_date']
            }
        ]
    });

    return EnergyLog;
}; 