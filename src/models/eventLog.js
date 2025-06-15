import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const EventLog = sequelize.define('EventLog', {
        log_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null if system-generated event
            references: {
                model: 'Users', // Name of the table
                key: 'user_id'
            }
        }, device_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null if not device-specific
            references: {
                model: 'Devices', // Name of the table
                key: 'device_id'
            }
        },
        sensor_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null if not sensor-specific
            references: {
                model: 'Sensors',
                key: 'sensor_id'
            }
        },
        event_type: {
            type: DataTypes.STRING(50),
            allowNull: false // e.g., 'device_added', 'login_failed', 'scene_activated'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'Event_Logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false // No updated_at column in the schema for Event_Logs
    });

    return EventLog;
};
