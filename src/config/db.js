// Database connection configuration
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
        pool: {
            max: 10,          // Increased connection pool
            min: 2,           // Keep minimum connections
            acquire: 20000,   // Connection acquire timeout
            idle: 5000        // Connection idle timeout
        },
        dialectOptions: {
            connectTimeout: 20000,    // 20 seconds connection timeout
            // Removed invalid options for MySQL2
        },
        define: {
            freezeTableName: true,    // Prevent table name pluralization
            underscored: false,       // Don't convert camelCase to snake_case
            charset: 'utf8mb4',       // Support full UTF-8
            collate: 'utf8mb4_general_ci'
        },
        retry: {
            match: [
                /ETIMEDOUT/,
                /EHOSTUNREACH/,
                /ECONNRESET/,
                /ECONNREFUSED/,
                /ESOCKETTIMEDOUT/,
                /EPIPE/,
                /EAI_AGAIN/,
                /SequelizeConnectionError/,
                /SequelizeConnectionRefusedError/,
                /SequelizeHostNotFoundError/,
                /SequelizeHostNotReachableError/,
                /SequelizeInvalidConnectionError/,
                /SequelizeConnectionTimedOutError/
            ],
            max: 3
        }
    }
);

export default sequelize;
