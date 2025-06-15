import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Sensor = sequelize.define('Sensor', {
        sensor_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        device_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Devices', // Name of the table
                key: 'device_id'
            }
        },
        type: {
            type: DataTypes.ENUM('temperature', 'humidity', 'motion', 'door_contact', 'light_intensity', 'other'),
            allowNull: false
        },
        value: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        last_read_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Sensors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false // No updated_at column in the schema for Sensors
    });

    return Sensor;
};
