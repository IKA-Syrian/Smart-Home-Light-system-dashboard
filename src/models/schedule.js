import { DataTypes } from 'sequelize';

// Helper function to validate cron expression
const isValidCronExpression = (cronExpression) => {
    if (!cronExpression) return false;

    // Basic format validation (5 parts)
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return false;

    // Minutes (0-59)
    if (!/^(\*|\d+)$/.test(parts[0])) return false;
    if (parts[0] !== '*' && (parseInt(parts[0]) < 0 || parseInt(parts[0]) > 59)) return false;

    // Hours (0-23)
    if (!/^(\*|\d+)$/.test(parts[1])) return false;
    if (parts[1] !== '*' && (parseInt(parts[1]) < 0 || parseInt(parts[1]) > 23)) return false;

    // Day of month (1-31)
    if (parts[2] !== '*') return false;

    // Month (1-12)
    if (parts[3] !== '*') return false;

    // Day of week (0-6, 0=Sunday)
    if (parts[4] !== '*') {
        const days = parts[4].split(',');
        for (const day of days) {
            if (!/^\d+$/.test(day) || parseInt(day) < 0 || parseInt(day) > 6) {
                return false;
            }
        }
    }

    return true;
};

export default (sequelize) => {
    const Schedule = sequelize.define('Schedule', {
        schedule_id: {
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
            allowNull: true, // Can be null if the schedule targets a scene instead
            references: {
                model: 'Devices',
                key: 'device_id'
            }
        },
        scene_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Can be null if the schedule targets a device instead
            references: {
                model: 'Scenes',
                key: 'scene_id'
            }
        },
        cron_expression: {
            type: DataTypes.STRING(100),
            allowNull: true, // Can be null for daily schedules
            validate: {
                isValidCronWhenProvided(value) {
                    if (value && !isValidCronExpression(value)) {
                        throw new Error('Invalid cron expression format');
                    }
                }
            }
        },
        action: {
            type: DataTypes.STRING(255),
            allowNull: true // e.g., 'turn_on', 'set_brightness:50' or JSON string
        },
        // Fields for daily schedules
        is_daily_schedule: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Flag to identify daily schedules vs regular schedules'
        },
        led_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'The LED ID on the Arduino (0-2) for daily schedules'
        },
        on_hour: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 23
            },
            comment: 'Hour to turn on (for daily schedules)'
        },
        on_minute: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 59
            },
            comment: 'Minute to turn on (for daily schedules)'
        },
        off_hour: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 23
            },
            comment: 'Hour to turn off (for daily schedules)'
        },
        off_minute: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 59
            },
            comment: 'Minute to turn off (for daily schedules)'
        },
        last_applied: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'Timestamp when this schedule was last applied'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'Schedules',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                // Index for daily schedules but not unique
                fields: ['device_id', 'led_id'],
                where: {
                    is_daily_schedule: true
                }
            }
        ]
    });

    return Schedule;
};
