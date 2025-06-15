import cron from 'node-cron';
import db from '../models/index.js';
import arduinoController from '../controllers/arduinoController.js';

class SchedulerService {
    constructor() {
        this.jobs = [];
        this.isInitialized = false;
        this.minuteCounter = 0; // Add a counter to track minutes
    }

    initialize() {
        if (this.isInitialized) {
            console.log('Scheduler service already initialized');
            return;
        }

        console.log('Initializing scheduler service...');

        // Ensure the database has the current_power_w column
        this.ensurePowerColumnExists()
            .then(() => {
                // Schedule tasks
                this.scheduleEnergyDataRecording();
                this.scheduleDailySchedulesApplication();

                console.log('Scheduler service initialized');
            })
            .catch(error => {
                console.error('Error initializing scheduler service:', error);
            });

        // Record energy data immediately at startup after a short delay
        setTimeout(async () => {
            console.log('Recording initial energy data at startup...');
            try {
                await this.recordEnergyData();
            } catch (error) {
                console.error('Error recording initial energy data:', error);
            }
        }, 5000); // 5 seconds delay to allow system to initialize

        // Set up a simple interval as a backup to ensure it runs every minute
        this.backupInterval = setInterval(async () => {
            this.minuteCounter++;
            console.log(`Backup minute counter: ${this.minuteCounter}`);

            try {
                await this.recordEnergyData();
            } catch (error) {
                console.error('Error in backup energy data recording:', error);
            }
        }, 60000); // Every 60 seconds
    }

    // Ensure current_power_w column exists in EnergyLogs table
    async ensurePowerColumnExists() {
        try {
            console.log('Checking if required columns exist in EnergyLogs table...');

            // Check if the columns exist
            const columnCheckQuery = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_NAME = 'EnergyLogs' 
                AND COLUMN_NAME IN ('current_power_w', 'log_minute')
            `;

            const [results] = await db.sequelize.query(columnCheckQuery);

            // Check for current_power_w column
            const hasPowerColumn = results.some(row => row.COLUMN_NAME === 'current_power_w');

            // Check for log_minute column
            const hasMinuteColumn = results.some(row => row.COLUMN_NAME === 'log_minute');

            if (hasPowerColumn && hasMinuteColumn) {
                console.log('All required columns already exist in EnergyLogs table.');
                return;
            }

            if (!hasPowerColumn) {
                console.log('Adding current_power_w column to EnergyLogs table...');

                // Add the column
                const addPowerColumnQuery = `
                    ALTER TABLE EnergyLogs 
                    ADD COLUMN current_power_w FLOAT DEFAULT 0 
                    COMMENT 'Current power consumption in Watts'
                `;

                await db.sequelize.query(addPowerColumnQuery);
                console.log('Successfully added current_power_w column to EnergyLogs table.');
            }

            if (!hasMinuteColumn) {
                console.log('Adding log_minute column to EnergyLogs table...');

                // Add the column
                const addMinuteColumnQuery = `
                    ALTER TABLE EnergyLogs 
                    ADD COLUMN log_minute INT DEFAULT 0 
                    COMMENT 'Minute of the energy record (0-59)'
                `;

                await db.sequelize.query(addMinuteColumnQuery);
                console.log('Successfully added log_minute column to EnergyLogs table.');
            }
        } catch (error) {
            console.error('Error ensuring columns exist:', error);
            // Continue even if there's an error - the application can still run
        }
    }

    // Schedule energy data recording every minute
    scheduleEnergyDataRecording() {
        // Run every minute to populate data faster
        const job = cron.schedule('* * * * *', async () => {
            console.log('Running scheduled energy data recording task (cron)');
            try {
                await this.recordEnergyData();
            } catch (error) {
                console.error('Error in scheduled energy data recording:', error);
            }
        });

        this.jobs.push({
            name: 'Energy data recording',
            job,
            schedule: '* * * * *',
            description: 'Record energy data from Arduino every minute'
        });

        console.log('Scheduled energy data recording task (every minute)');
    }

    // Schedule daily schedules application at system startup and midnight
    scheduleDailySchedulesApplication() {
        // Apply all daily schedules at midnight
        const job = cron.schedule('0 0 * * *', async () => {
            console.log('Running scheduled daily schedules application task');
            try {
                await this.applyDailySchedules();
            } catch (error) {
                console.error('Error in scheduled daily schedules application:', error);
            }
        });

        this.jobs.push({
            name: 'Daily schedules application',
            job,
            schedule: '0 0 * * *',
            description: 'Apply all daily schedules at midnight'
        });

        console.log('Scheduled daily schedules application task (midnight)');

        // Also apply schedules at startup after a short delay
        setTimeout(async () => {
            console.log('Applying daily schedules at startup');
            try {
                await this.applyDailySchedules();
            } catch (error) {
                console.error('Error applying daily schedules at startup:', error);
            }
        }, 10000); // 10 seconds delay to allow system to initialize
    }

    // Record energy data from Arduino
    async recordEnergyData() {
        try {
            console.log('Recording energy data from Arduino...');

            // Get current Arduino status
            const arduinoStatus = await arduinoController.getStatus();

            if (!arduinoStatus || !arduinoStatus.leds) {
                console.error('Invalid energy data received from Arduino');
                return;
            }

            // Try to get Arduino devices from database
            let devices = [];
            try {
                // First, try to get any existing Arduino devices
                devices = await db.Device.findAll({
                    where: {
                        type: 'arduino'
                    }
                });

                console.log(`Found ${devices.length} Arduino devices in database`);

                // If no Arduino devices found, try looking for existing devices by ID
                if (devices.length === 0) {
                    const existingDeviceIds = [1, 2, 3]; // Try these IDs first
                    for (const id of existingDeviceIds) {
                        const device = await db.Device.findByPk(id);
                        if (device) {
                            console.log(`Found existing device with ID ${id}`);
                            devices.push(device);
                            break; // Use the first device found
                        }
                    }
                }

                // If still no devices, try to get any device
                if (devices.length === 0) {
                    devices = await db.Device.findAll({
                        limit: 1
                    });
                    console.log(`Found ${devices.length} devices (any type) in database`);
                }
            } catch (error) {
                console.error('Error finding Arduino devices:', error);
            }

            if (devices.length === 0) {
                console.log('No devices found in the database, creating default device');
                // Create a default Arduino device if none exists
                try {
                    const defaultUser = await db.User.findOne();
                    if (defaultUser) {
                        console.log(`Found default user with ID ${defaultUser.user_id}`);

                        // Check if device ID 1 exists - if not, we'll use this ID
                        const existingDevice = await db.Device.findByPk(1);

                        if (existingDevice) {
                            console.log(`Device with ID 1 already exists, using this device`);
                            devices.push(existingDevice);
                        } else {
                            // Try to create an Arduino device with ID 1
                            try {
                                const defaultDevice = await db.Device.create({
                                    device_id: 1, // Set explicit ID
                                    name: 'Arduino Controller',
                                    type: 'arduino',
                                    status: 'active',
                                    user_id: defaultUser.user_id
                                });
                                console.log(`Created default Arduino device with ID ${defaultDevice.device_id}`);
                                devices.push(defaultDevice);
                            } catch (arduinoDeviceError) {
                                console.error('Error creating Arduino device:', arduinoDeviceError);

                                // Fallback to create with auto-generated ID
                                try {
                                    const fallbackDevice = await db.Device.create({
                                        name: 'Arduino Controller (Fallback)',
                                        type: 'arduino',
                                        status: 'active',
                                        user_id: defaultUser.user_id
                                    });
                                    console.log(`Created fallback Arduino device with ID ${fallbackDevice.device_id}`);
                                    devices.push(fallbackDevice);
                                } catch (fallbackDeviceError) {
                                    console.error('Error creating fallback device:', fallbackDeviceError);
                                    return;
                                }
                            }
                        }
                    } else {
                        console.error('No users found in the database to create default device');
                        return;
                    }
                } catch (createError) {
                    console.error('Error creating default Arduino device:', createError);
                    return;
                }
            }

            // Current date and hour for the log
            const now = new Date();
            const logDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const logHour = now.getHours();
            const logMinute = now.getMinutes(); // Also track minutes for more frequent updates

            console.log(`Using device: ID=${devices[0].device_id}, Name=${devices[0].name}, Type=${devices[0].type}`);

            // Record energy data for each device and LED
            for (const device of devices) {
                for (const led of arduinoStatus.leds) {
                    // Get energy data - accumulated energy (Wh) and current power (W)
                    const energyValue = led.energyToday !== undefined ? led.energyToday : 0;

                    // Calculate power based on brightness if PW field is missing or zero
                    let powerValue = led.currentPowerW;
                    if (!powerValue || powerValue === 0) {
                        // Simple power calculation based on brightness (0-255)
                        // Assuming full brightness (255) is 5W for a typical LED
                        const MAX_LED_POWER = 5.0; // Watts at full brightness
                        powerValue = led.brightness > 0 ? (led.brightness / 255.0) * MAX_LED_POWER : 0;
                    }

                    // Display both accumulated energy and current power in logs
                    const isActive = led.brightness > 0; // Consider active based on brightness
                    const statusIndicator = isActive ? "ACTIVE" : "OFF";

                    try {
                        // Create a unique identifier for this minute's log
                        const logIdentifier = `${logDate}-${logHour}-${logMinute}-${device.device_id}-${led.id}`;

                        // Always create a new record for each energy data point
                        await db.EnergyLog.create({
                            user_id: device.user_id,
                            device_id: device.device_id,
                            led_id: led.id,
                            energy_wh: energyValue,
                            current_power_w: powerValue, // Add current power to the log
                            log_date: logDate,
                            log_hour: logHour,
                            log_minute: logMinute // Add minute field for more granular tracking
                        });

                        console.log(`Created energy log for device ${device.device_id}, LED ${led.id}: ${energyValue} Wh, ${powerValue} W (${statusIndicator}) (${logIdentifier})`);
                    } catch (logError) {
                        console.error(`Error recording energy log for device ${device.device_id}, LED ${led.id}:`, logError);
                    }
                }
            }

            console.log('Energy data recording completed');
        } catch (error) {
            console.error('Error recording energy data:', error);
            throw error;
        }
    }

    // Apply all daily schedules
    async applyDailySchedules() {
        try {
            console.log('Applying all daily schedules...');

            // Check if the is_daily_schedule column exists
            let whereClause = { is_active: true };

            try {
                // Try to check if the column exists using a query
                await db.Schedule.findOne({
                    where: { is_daily_schedule: true },
                    limit: 1
                });
                // If no error, the column exists
                whereClause.is_daily_schedule = true;
            } catch (error) {
                console.log('is_daily_schedule column does not exist yet, using only is_active filter');
                // If error, the column doesn't exist, so we only use is_active
            }

            // Get all active daily schedules
            const activeSchedules = await db.Schedule.findAll({
                where: whereClause,
                order: [['device_id', 'ASC'], ['led_id', 'ASC']]
            });

            if (activeSchedules.length === 0) {
                console.log('No active daily schedules found');
                return;
            }

            console.log(`Found ${activeSchedules.length} active daily schedules to apply`);

            // First clear all schedules
            try {
                await arduinoController.clearAllSchedules();
                console.log('Cleared all schedules from Arduino');
            } catch (error) {
                console.error('Error clearing schedules:', error);
                throw error;
            }

            // Apply each schedule
            const results = [];

            for (const schedule of activeSchedules) {
                try {
                    if (schedule.led_id === undefined ||
                        schedule.on_hour === undefined ||
                        schedule.on_minute === undefined ||
                        schedule.off_hour === undefined ||
                        schedule.off_minute === undefined) {
                        console.log(`Skipping schedule ${schedule.schedule_id} due to missing required fields`);
                        continue;
                    }

                    const result = await arduinoController.setDailySchedule(
                        schedule.led_id,
                        schedule.on_hour,
                        schedule.on_minute,
                        schedule.off_hour,
                        schedule.off_minute
                    );

                    // Update last_applied timestamp
                    await schedule.update({ last_applied: new Date() });

                    results.push({
                        schedule_id: schedule.schedule_id,
                        led_id: schedule.led_id,
                        result: 'success',
                        details: result
                    });

                    console.log(`Applied daily schedule ${schedule.schedule_id} for LED ${schedule.led_id}`);
                } catch (error) {
                    console.error(`Error applying schedule ${schedule.schedule_id}:`, error);

                    results.push({
                        schedule_id: schedule.schedule_id,
                        led_id: schedule.led_id,
                        result: 'error',
                        error: error.message
                    });
                }
            }

            const successCount = results.filter(r => r.result === 'success').length;
            console.log(`Successfully applied ${successCount} of ${results.length} schedules`);

            return results;
        } catch (error) {
            console.error('Error applying daily schedules:', error);
            throw error;
        }
    }

    // Get all scheduled jobs
    getJobs() {
        return this.jobs;
    }

    // Stop all jobs
    stopAll() {
        this.jobs.forEach(job => {
            job.job.stop();
        });

        // Also clear the backup interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }

        console.log('Stopped all scheduled jobs');
    }
}

// Create and export a singleton instance to ensure it stays alive
const schedulerServiceInstance = new SchedulerService();
export default schedulerServiceInstance; 