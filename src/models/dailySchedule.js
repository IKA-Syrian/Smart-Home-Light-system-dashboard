import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const DailySchedule = sequelize.define('DailySchedule', {
        daily_schedule_id: {
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
        on_hour: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 23
            }
        },
        on_minute: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 59
            }
        },
        off_hour: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 23
            }
        },
        off_minute: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 0,
                max: 59
            }
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        last_applied: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when this schedule was last applied to the Arduino'
        }
    }, {
        tableName: 'DailySchedules',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                unique: true,
                fields: ['device_id', 'led_id']
            }
        ]
    });

    return DailySchedule;
}; 