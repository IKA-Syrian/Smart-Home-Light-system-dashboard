import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Device = sequelize.define('Device', {
        device_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, room_id: {
            type: DataTypes.INTEGER,
            allowNull: true, // Changed to allow null since we want SET NULL on delete
            references: {
                model: 'Rooms',
                key: 'room_id'
            }
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'user_id'
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other', 'arduino'),
            allowNull: false
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        is_on: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        brightness: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: true,
            validate: {
                min: 0,
                max: 100
            }
        },
        color_hex: {
            type: DataTypes.STRING(7), // #RRGGBB
            allowNull: true,
            validate: {
                is: /^#[0-9A-F]{6}$/i
            }
        }
    }, {
        tableName: 'Devices',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Device;
};
