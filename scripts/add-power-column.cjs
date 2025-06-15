// Migration script to add current_power_w column to EnergyLogs table
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Get the config file path
const configPath = path.join(__dirname, '../.sequelizerc');
let configFile = './config/database.js';

if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const configMatches = configContent.match(/config: path.resolve\('(.+?)'\)/);
    if (configMatches) {
        configFile = configMatches[1];
    }
}

// Load the database config manually using JSON
let dbConfig;
try {
    // Try to load from config/database.js (simplified)
    const configFilePath = path.join(__dirname, '..', 'config', 'database.js');
    if (fs.existsSync(configFilePath)) {
        const configFileContent = fs.readFileSync(configFilePath, 'utf8');
        // Extract the configuration object using regex
        const configMatch = configFileContent.match(/export const dbConfig = ({[\s\S]*?});/);
        if (configMatch && configMatch[1]) {
            // Parse the configuration object
            const configString = configMatch[1]
                .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
                .replace(/'/g, '"');          // Replace single quotes with double quotes
            dbConfig = JSON.parse(configString);
        }
    }
} catch (error) {
    console.error('Error loading database config:', error);
    process.exit(1);
}

// Fallback to hardcoded config if needed
if (!dbConfig) {
    console.log('Using fallback database configuration');
    dbConfig = {
        database: 'iot_project',
        username: 'root',
        password: '',
        host: 'localhost',
        dialect: 'mysql'
    };
}

async function addPowerColumn() {
    console.log('Starting migration to add current_power_w column to EnergyLogs table...');
    console.log('Using database config:', JSON.stringify(dbConfig, null, 2));

    // Create Sequelize instance
    const sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
            host: dbConfig.host,
            dialect: dbConfig.dialect,
            logging: false
        }
    );

    try {
        // Check connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Check if the column already exists
        const [results] = await sequelize.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'EnergyLogs' 
            AND COLUMN_NAME = 'current_power_w'
        `);

        if (results.length > 0) {
            console.log('The current_power_w column already exists in EnergyLogs table.');
            await sequelize.close();
            return;
        }

        // Add the column
        await sequelize.query(`
            ALTER TABLE EnergyLogs 
            ADD COLUMN current_power_w FLOAT DEFAULT 0 
            COMMENT 'Current power consumption in Watts'
        `);

        console.log('Successfully added current_power_w column to EnergyLogs table.');

        // Close the connection
        await sequelize.close();
        console.log('Database connection closed.');
    } catch (error) {
        console.error('Error during migration:', error);
        try {
            await sequelize.close();
        } catch (closeError) {
            console.error('Error closing database connection:', closeError);
        }
        process.exit(1);
    }
}

// Run the migration
addPowerColumn(); 