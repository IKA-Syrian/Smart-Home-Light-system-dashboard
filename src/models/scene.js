import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Scene = sequelize.define('Scene', {
        scene_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users', // Name of the table
                key: 'user_id'
            }
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'Scenes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return Scene;
};
