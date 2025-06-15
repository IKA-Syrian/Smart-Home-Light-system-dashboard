import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read database configuration from .sequelizerc if it exists
let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'iot_platform'
};

try {
    // Try to read .sequelizerc to get the config path
    const sequelizeRcPath = path.join(__dirname, '..', '.sequelizerc');
    if (fs.existsSync(sequelizeRcPath)) {
        const sequelizeRcContent = fs.readFileSync(sequelizeRcPath, 'utf8');

        // Extract the config path using regex
        const configPathMatch = sequelizeRcContent.match(/config:\s*path\.resolve\(['"](.*)['"]/);
        if (configPathMatch && configPathMatch[1]) {
            const configPath = path.join(__dirname, '..', configPathMatch[1]);

            if (fs.existsSync(configPath)) {
                // Read the config file
                const configContent = fs.readFileSync(configPath, 'utf8');

                // Parse the config
                const configJson = JSON.parse(configContent);
                if (configJson.development) {
                    dbConfig = {
                        host: configJson.development.host || dbConfig.host,
                        user: configJson.development.username || dbConfig.user,
                        password: configJson.development.password || dbConfig.password,
                        database: configJson.development.database || dbConfig.database
                    };
                    console.log('Loaded database configuration from sequelize config');
                }
            }
        }
    }
} catch (error) {
    console.error('Error reading sequelize config:', error);
    console.log('Using default or environment database configuration');
}

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'fix_schema.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL content into individual statements
const sqlStatements = sqlContent
    .split(';')
    .map(statement => statement.trim())
    .filter(statement => statement.length > 0);

async function executeSQL() {
    let connection;

    try {
        console.log('Connecting to database...');
        console.log(`Database: ${dbConfig.database} on ${dbConfig.host}`);

        // Create the connection
        connection = await mysql.createConnection(dbConfig);

        console.log('Connected to database successfully');

        // Execute each SQL statement
        for (const statement of sqlStatements) {
            console.log(`Executing: ${statement}`);
            await connection.execute(statement);
            console.log('Statement executed successfully');
        }

        console.log('All SQL statements executed successfully');

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