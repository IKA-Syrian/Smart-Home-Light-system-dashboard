import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

export default (sequelize, DataTypes) => {
    const Room = sequelize.define('Room', {
        room_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'user_id',
            },
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    },
        {
            tableName: 'Rooms',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
        });
    return Room;
};
