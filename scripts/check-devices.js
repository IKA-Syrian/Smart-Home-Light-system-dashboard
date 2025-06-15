// Script to check device information in the database
import db from '../src/models/index.js';

async function checkDevices() {
    try {
        console.log('Connecting to database...');

        // Check devices
        console.log('\n--- DEVICES ---');
        const devices = await db.Device.findAll();
        if (devices.length === 0) {
            console.log('No devices found in the database.');
        } else {
            devices.forEach(device => {
                console.log(`Device ID: ${device.device_id}, Name: ${device.name}, Type: ${device.type}, User ID: ${device.user_id}`);
            });
        }

        // Get a count of energy logs by device
        console.log('\n--- ENERGY LOGS COUNT BY DEVICE ---');
        const logCountQuery = `
      SELECT device_id, COUNT(*) as log_count 
      FROM EnergyLogs 
      GROUP BY device_id 
      ORDER BY device_id;
    `;
        const [logCounts] = await db.sequelize.query(logCountQuery);

        if (logCounts.length === 0) {
            console.log('No energy logs found in the database.');
        } else {
            logCounts.forEach(count => {
                console.log(`Device ID: ${count.device_id}, Log Count: ${count.log_count}`);
            });
        }

        // Get count of energy logs by LED for each device
        console.log('\n--- ENERGY LOGS COUNT BY DEVICE AND LED ---');
        const ledLogCountQuery = `
      SELECT device_id, led_id, COUNT(*) as log_count 
      FROM EnergyLogs 
      GROUP BY device_id, led_id 
      ORDER BY device_id, led_id;
    `;
        const [ledLogCounts] = await db.sequelize.query(ledLogCountQuery);

        if (ledLogCounts.length === 0) {
            console.log('No energy logs found in the database.');
        } else {
            ledLogCounts.forEach(count => {
                console.log(`Device ID: ${count.device_id}, LED ID: ${count.led_id}, Log Count: ${count.log_count}`);
            });
        }

        // Get latest log for each device
        console.log('\n--- LATEST ENERGY LOGS BY DEVICE ---');
        const latestLogsQuery = `
      SELECT * 
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY device_id, led_id ORDER BY log_date DESC, log_hour DESC) as rn
        FROM EnergyLogs
      ) as t
      WHERE rn = 1
      ORDER BY device_id, led_id;
    `;
        const [latestLogs] = await db.sequelize.query(latestLogsQuery);

        if (latestLogs.length === 0) {
            console.log('No energy logs found in the database.');
        } else {
            latestLogs.forEach(log => {
                console.log(`Device ID: ${log.device_id}, LED ID: ${log.led_id}, Energy: ${log.energy_wh}Wh, Power: ${log.current_power_w || 'N/A'}W, Date: ${log.log_date}, Hour: ${log.log_hour}`);
            });
        }

        console.log('\nCheck completed successfully.');
    } catch (error) {
        console.error('Error checking devices:', error);
    } finally {
        // Close the database connection
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run the check
checkDevices(); 