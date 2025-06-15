// Fix schema script - add missing columns to Schedules table
import mysql from 'mysql2/promise';

// Define SQL statements
const SQL_STATEMENTS = [
    // Add is_daily_schedule column if it doesn't exist
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS is_daily_schedule BOOLEAN NOT NULL DEFAULT FALSE`,

    // Add other missing columns for daily schedules if they don't exist
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS led_id INT NULL`,
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS on_hour INT NULL`,
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS on_minute INT NULL`,
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS off_hour INT NULL`,
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS off_minute INT NULL`,
    `ALTER TABLE Schedules ADD COLUMN IF NOT EXISTS last_applied DATETIME NULL`,

    // Update Device type ENUM to include arduino
    `ALTER TABLE Devices MODIFY COLUMN type ENUM('light', 'thermostat', 'security_camera', 'smart_plug', 'other', 'arduino') NOT NULL`
];

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dbtools_iot_test',
};

async function executeSQL() {
    let connection;

    try {
        console.log('Connecting to database...');
        console.log(`Database: ${DB_CONFIG.database} on ${DB_CONFIG.host}`);

        // Create the connection
        connection = await mysql.createConnection(DB_CONFIG);

        console.log('Connected to database successfully');

        // Execute each SQL statement
        for (const statement of SQL_STATEMENTS) {
            console.log(`Executing: ${statement}`);
            try {
                await connection.execute(statement);
                console.log('Statement executed successfully');
            } catch (statementError) {
                console.error(`Error executing statement: ${statementError.message}`);
            }
        }

        console.log('All SQL statements processed');

    } catch (error) {
        console.error('Error executing SQL:', error);
    } finally {
        if (connection) {
            try {
                await connection.end();
                console.log('Database connection closed');
            } catch (closeError) {
                console.error('Error closing connection:', closeError);
            }
        }
    }
}

// Execute the function
executeSQL(); 