import bcrypt from 'bcrypt';

export default (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        role: {
            type: DataTypes.ENUM('admin', 'user'),
            allowNull: false,
            defaultValue: 'user',
        },
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        tableName: 'Users',
        timestamps: true, // Sequelize handles createdAt and updatedAt
        createdAt: 'created_at',
        updatedAt: false, // No updatedAt column in your schema for Users
        hooks: {
            beforeCreate: async (user) => {
                // Convert virtual password field to password_hash
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password_hash = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                // Convert virtual password field to password_hash if changed
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password_hash = await bcrypt.hash(user.password, salt);
                }
            },
        },
    });

    // Instance method to validate password
    User.prototype.validatePassword = async function (password) {
        return bcrypt.compare(password, this.password_hash);
    };

    return User;
};
