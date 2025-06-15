// Script to fix device IDs in energy logs
import db from '../src/models/index.js';

async function fixDeviceIds() {
    try {
        console.log('Connecting to database...');

        // Check current device IDs in EnergyLogs
        console.log('\nChecking current device IDs in EnergyLogs...');
        const deviceIdsQuery = `
      SELECT device_id, COUNT(*) as log_count 
      FROM EnergyLogs 
      GROUP BY device_id 
      ORDER BY device_id;
    `;
        const [deviceIds] = await db.sequelize.query(deviceIdsQuery);

        console.log('Current device IDs in EnergyLogs:');
        deviceIds.forEach(row => {
            console.log(`Device ID: ${row.device_id}, Log Count: ${row.log_count}`);
        });

        // Check if there are devices with ID > 3
        const highIdLogs = deviceIds.filter(row => row.device_id > 3);

        if (highIdLogs.length === 0) {
            console.log('\nNo high device IDs found in EnergyLogs. No fix needed.');
            return;
        }

        // Check available devices
        console.log('\nChecking available devices...');
        const devices = await db.Device.findAll({ order: [['device_id', 'ASC']] });

        console.log('Available devices:');
        devices.forEach(device => {
            console.log(`Device ID: ${device.device_id}, Name: ${device.name}, Type: ${device.type}`);
        });

        // Find or create target device with ID 1
        let targetDevice;
        targetDevice = devices.find(d => d.device_id === 1);

        if (!targetDevice) {
            console.log('\nNo device with ID 1 found. Creating a new one...');

            // Find a user to associate with the device
            const user = await db.User.findOne();

            if (!user) {
                console.error('No users found in the database');
                return;
            }

            // Create the device
            targetDevice = await db.Device.create({
                device_id: 1,
                name: 'Arduino Controller',
                type: 'arduino',
                status: 'active',
                user_id: user.user_id
            });

            console.log(`Created new device with ID ${targetDevice.device_id}`);
        }

        // Confirm before proceeding
        console.log(`\nWill update all high device ID logs to use device ID ${targetDevice.device_id}`);
        console.log('Processing...');

        // Update all logs with high device IDs to use the target device ID
        for (const highId of highIdLogs.map(row => row.device_id)) {
            const updateQuery = `
        UPDATE EnergyLogs 
        SET device_id = ${targetDevice.device_id}, 
            user_id = ${targetDevice.user_id}
        WHERE device_id = ${highId};
      `;

            const [updatedRows] = await db.sequelize.query(updateQuery);
            console.log(`Updated ${updatedRows} logs from device ID ${highId} to ${targetDevice.device_id}`);
        }

        // Check if there are any other devices with ID > 3 that should be removed
        const highIdDevices = devices.filter(d => d.device_id > 3 && d.type === 'arduino');

        if (highIdDevices.length > 0) {
            console.log('\nRemoving high ID Arduino devices...');

            for (const device of highIdDevices) {
                await device.destroy();
                console.log(`Deleted device with ID ${device.device_id}`);
            }
        }

        // Verify the fix
        console.log('\nVerifying the fix...');
        const [updatedDeviceIds] = await db.sequelize.query(deviceIdsQuery);

        console.log('Updated device IDs in EnergyLogs:');
        updatedDeviceIds.forEach(row => {
            console.log(`Device ID: ${row.device_id}, Log Count: ${row.log_count}`);
        });

        console.log('\nFix completed successfully.');
    } catch (error) {
        console.error('Error fixing device IDs:', error);
    } finally {
        // Close the database connection
        await db.sequelize.close();
        process.exit(0);
    }
}

// Run the fix
fixDeviceIds(); 