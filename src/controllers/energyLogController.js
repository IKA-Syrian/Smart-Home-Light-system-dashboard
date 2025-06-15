import db from '../models/index.js';
import { Op } from 'sequelize';
import arduinoController from './arduinoController.js';

class EnergyLogController {
    // Record energy data from Arduino
    async recordEnergyData(req, res) {
        try {
            const { user_id, device_id } = req.body;

            // Validate input
            if (!user_id || !device_id) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required fields'
                });
            }

            // Check if device exists
            const device = await db.Device.findByPk(device_id);
            if (!device) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Device not found'
                });
            }

            // Check if the device belongs to the user
            if (device.user_id !== user_id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Device does not belong to this user'
                });
            }

            // Get current energy data from Arduino
            let arduinoStatus;
            try {
                arduinoStatus = await arduinoController.getStatus();
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: `Failed to get energy data from Arduino: ${error.message}`
                });
            }

            if (!arduinoStatus || !arduinoStatus.leds) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Invalid energy data received from Arduino'
                });
            }

            // Current date and hour for the log
            const now = new Date();
            const logDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const logHour = now.getHours();

            // Record energy data for each LED
            const energyLogs = [];

            for (const led of arduinoStatus.leds) {
                // Check if we already have a record for this hour
                const existingLog = await db.EnergyLog.findOne({
                    where: {
                        device_id,
                        led_id: led.id,
                        log_date: logDate,
                        log_hour: logHour
                    }
                });

                if (existingLog) {
                    // Update existing record
                    await existingLog.update({
                        energy_wh: led.energyToday
                    });

                    energyLogs.push(existingLog);
                } else {
                    // Create new record
                    const newLog = await db.EnergyLog.create({
                        user_id,
                        device_id,
                        led_id: led.id,
                        energy_wh: led.energyToday,
                        log_date: logDate,
                        log_hour: logHour
                    });

                    energyLogs.push(newLog);
                }
            }

            return res.status(200).json({
                status: 'success',
                message: 'Energy data recorded',
                data: {
                    logs: energyLogs,
                    arduinoStatus
                }
            });
        } catch (error) {
            console.error('Error recording energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to record energy data: ${error.message}`
            });
        }
    }

    // Get energy data for a specific LED for a date range
    async getLedEnergyData(req, res) {
        try {
            const { deviceId, ledId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Start date and end date are required'
                });
            }

            const logs = await db.EnergyLog.findAll({
                where: {
                    device_id: deviceId,
                    led_id: ledId,
                    log_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [
                    ['log_date', 'ASC'],
                    ['log_hour', 'ASC']
                ]
            });

            // Calculate daily totals
            const dailyTotals = {};

            logs.forEach(log => {
                const date = log.log_date;
                if (!dailyTotals[date]) {
                    dailyTotals[date] = 0;
                }
                dailyTotals[date] += parseFloat(log.energy_wh);
            });

            // Calculate total for the entire period
            const totalEnergy = Object.values(dailyTotals).reduce((sum, value) => sum + value, 0);

            return res.json({
                status: 'success',
                data: {
                    device_id: parseInt(deviceId),
                    led_id: parseInt(ledId),
                    hourly_logs: logs,
                    daily_totals: dailyTotals,
                    total_energy_wh: totalEnergy,
                    start_date: startDate,
                    end_date: endDate
                }
            });
        } catch (error) {
            console.error('Error fetching LED energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch energy data: ${error.message}`
            });
        }
    }

    // Get energy data for all LEDs of a device for a date range
    async getDeviceEnergyData(req, res) {
        try {
            const { deviceId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Start date and end date are required'
                });
            }

            const logs = await db.EnergyLog.findAll({
                where: {
                    device_id: deviceId,
                    log_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                order: [
                    ['led_id', 'ASC'],
                    ['log_date', 'ASC'],
                    ['log_hour', 'ASC']
                ]
            });

            // Calculate daily totals by LED
            const ledDailyTotals = {};
            const deviceDailyTotals = {};

            logs.forEach(log => {
                const date = log.log_date;
                const ledId = log.led_id;

                if (!ledDailyTotals[ledId]) {
                    ledDailyTotals[ledId] = {};
                }

                if (!ledDailyTotals[ledId][date]) {
                    ledDailyTotals[ledId][date] = 0;
                }

                if (!deviceDailyTotals[date]) {
                    deviceDailyTotals[date] = 0;
                }

                const energyValue = parseFloat(log.energy_wh);
                ledDailyTotals[ledId][date] += energyValue;
                deviceDailyTotals[date] += energyValue;
            });

            // Calculate total for the entire period
            const totalEnergy = Object.values(deviceDailyTotals).reduce((sum, value) => sum + value, 0);

            // Calculate per-LED totals
            const ledTotals = {};
            Object.keys(ledDailyTotals).forEach(ledId => {
                ledTotals[ledId] = Object.values(ledDailyTotals[ledId]).reduce((sum, value) => sum + value, 0);
            });

            return res.json({
                status: 'success',
                data: {
                    device_id: parseInt(deviceId),
                    hourly_logs: logs,
                    led_daily_totals: ledDailyTotals,
                    device_daily_totals: deviceDailyTotals,
                    led_totals: ledTotals,
                    total_energy_wh: totalEnergy,
                    start_date: startDate,
                    end_date: endDate
                }
            });
        } catch (error) {
            console.error('Error fetching device energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch energy data: ${error.message}`
            });
        }
    }

    // Get energy data for all devices of a user for a date range
    async getUserEnergyData(req, res) {
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Start date and end date are required'
                });
            }

            const logs = await db.EnergyLog.findAll({
                where: {
                    user_id: userId,
                    log_date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [
                    {
                        model: db.Device,
                        attributes: ['device_id', 'name', 'type']
                    }
                ],
                order: [
                    ['device_id', 'ASC'],
                    ['led_id', 'ASC'],
                    ['log_date', 'ASC'],
                    ['log_hour', 'ASC']
                ]
            });

            // Calculate daily totals by device
            const deviceDailyTotals = {};
            const userDailyTotals = {};

            logs.forEach(log => {
                const date = log.log_date;
                const deviceId = log.device_id;

                if (!deviceDailyTotals[deviceId]) {
                    deviceDailyTotals[deviceId] = {};
                }

                if (!deviceDailyTotals[deviceId][date]) {
                    deviceDailyTotals[deviceId][date] = 0;
                }

                if (!userDailyTotals[date]) {
                    userDailyTotals[date] = 0;
                }

                const energyValue = parseFloat(log.energy_wh);
                deviceDailyTotals[deviceId][date] += energyValue;
                userDailyTotals[date] += energyValue;
            });

            // Calculate total for the entire period
            const totalEnergy = Object.values(userDailyTotals).reduce((sum, value) => sum + value, 0);

            // Calculate per-device totals
            const deviceTotals = {};
            Object.keys(deviceDailyTotals).forEach(deviceId => {
                deviceTotals[deviceId] = Object.values(deviceDailyTotals[deviceId]).reduce((sum, value) => sum + value, 0);
            });

            return res.json({
                status: 'success',
                data: {
                    user_id: parseInt(userId),
                    device_daily_totals: deviceDailyTotals,
                    user_daily_totals: userDailyTotals,
                    device_totals: deviceTotals,
                    total_energy_wh: totalEnergy,
                    start_date: startDate,
                    end_date: endDate
                }
            });
        } catch (error) {
            console.error('Error fetching user energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch energy data: ${error.message}`
            });
        }
    }

    // Get current energy usage from Arduino
    async getCurrentEnergyData(req, res) {
        try {
            // Get current energy data from Arduino
            const arduinoStatus = await arduinoController.getStatus();

            if (!arduinoStatus || !arduinoStatus.leds) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Invalid energy data received from Arduino'
                });
            }

            // Format the energy data
            const energyData = arduinoStatus.leds.map(led => ({
                led_id: led.id,
                energy_today_wh: led.energyToday
            }));

            // Calculate total energy
            const totalEnergy = energyData.reduce((sum, led) => sum + led.energy_today_wh, 0);

            return res.json({
                status: 'success',
                data: {
                    energy_data: energyData,
                    total_energy_today_wh: totalEnergy,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error fetching current energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch current energy data: ${error.message}`
            });
        }
    }

    // Get energy data for the last 60 minutes
    async getRecentEnergyData(req, res) {
        try {
            const { deviceId, ledId } = req.params;

            // Calculate time 60 minutes ago
            const now = new Date();
            const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);

            // Format dates for query
            const currentDate = now.toISOString().split('T')[0];
            const previousDate = sixtyMinutesAgo.toISOString().split('T')[0];

            // Get current hour and minute
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const previousHour = sixtyMinutesAgo.getHours();
            const previousMinute = sixtyMinutesAgo.getMinutes();

            // Build the where clause
            let whereClause = {
                log_date: {
                    [Op.between]: [previousDate, currentDate]
                },
                log_minute: {
                    [Op.ne]: null // Ensure log_minute exists
                }
            };

            // Add device_id if provided
            if (deviceId) {
                whereClause.device_id = deviceId;
            }

            // Add led_id if provided
            if (ledId) {
                whereClause.led_id = ledId;
            }

            // Get logs with minute granularity
            const logs = await db.EnergyLog.findAll({
                where: whereClause,
                include: [
                    {
                        model: db.Device,
                        attributes: ['device_id', 'name', 'type']
                    }
                ],
                order: [
                    ['log_date', 'ASC'],
                    ['log_hour', 'ASC'],
                    ['log_minute', 'ASC']
                ]
            });

            // Filter logs to only include the last 60 minutes
            const filteredLogs = logs.filter(log => {
                const logTime = new Date(`${log.log_date}T${log.log_hour.toString().padStart(2, '0')}:${log.log_minute?.toString().padStart(2, '0') || '00'}:00`);
                return logTime >= sixtyMinutesAgo;
            });

            // Group by minute for display
            const minuteData = {};
            filteredLogs.forEach(log => {
                const timestamp = `${log.log_hour.toString().padStart(2, '0')}:${log.log_minute?.toString().padStart(2, '0') || '00'}`;

                if (!minuteData[timestamp]) {
                    minuteData[timestamp] = {
                        timestamp,
                        energy_wh: 0,
                        power_w: 0,
                        device_count: 0,
                        led_count: 0
                    };
                }

                // Add energy and power values
                const energyWh = parseFloat(log.energy_wh || 0);
                const powerW = parseFloat(log.current_power_w || 0);

                minuteData[timestamp].energy_wh += energyWh;
                minuteData[timestamp].power_w += powerW;
                minuteData[timestamp].device_count++;
                minuteData[timestamp].led_count++;
            });

            // Convert to array and sort by timestamp
            const minuteDataArray = Object.values(minuteData).sort((a, b) => {
                return a.timestamp.localeCompare(b.timestamp);
            });

            // Calculate total energy and power
            const totalEnergyWh = filteredLogs.reduce((sum, log) => sum + parseFloat(log.energy_wh || 0), 0);
            const totalPowerW = filteredLogs.reduce((sum, log) => sum + parseFloat(log.current_power_w || 0), 0);
            const uniqueDevices = new Set(filteredLogs.map(log => log.device_id)).size;
            const uniqueLeds = new Set(filteredLogs.map(log => `${log.device_id}-${log.led_id}`)).size;

            return res.json({
                status: 'success',
                data: {
                    minute_data: minuteDataArray,
                    total_energy_wh: totalEnergyWh,
                    total_power_w: totalPowerW,
                    unique_devices: uniqueDevices,
                    unique_leds: uniqueLeds,
                    start_time: sixtyMinutesAgo.toISOString(),
                    end_time: now.toISOString()
                }
            });
        } catch (error) {
            console.error('Error fetching recent energy data:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch recent energy data: ${error.message}`
            });
        }
    }

    // Get all energy logs with pagination
    async getAllEnergyLogs(req, res) {
        try {
            const { page = 1, limit = 20, startDate, endDate } = req.query;

            // Parse pagination parameters
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;

            // Build where clause
            let whereClause = {};

            // Add date range if provided
            if (startDate && endDate) {
                whereClause.log_date = {
                    [Op.between]: [startDate, endDate]
                };
            }

            // Query with pagination
            const { count, rows } = await db.EnergyLog.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: db.Device,
                        attributes: ['device_id', 'name', 'type']
                    }
                ],
                order: [
                    ['log_date', 'DESC'],
                    ['log_hour', 'DESC']
                ],
                limit: limitNum,
                offset: offset
            });

            // Calculate total pages
            const totalPages = Math.ceil(count / limitNum);

            // Group data by day
            const dailyData = {};
            rows.forEach(log => {
                const date = log.log_date;
                if (!dailyData[date]) {
                    dailyData[date] = {
                        date,
                        totalEnergyWh: 0,
                        devices: {}
                    };
                }

                const deviceId = log.device_id;
                if (!dailyData[date].devices[deviceId]) {
                    dailyData[date].devices[deviceId] = {
                        deviceId,
                        deviceName: log.Device?.name || `Device ${deviceId}`,
                        totalEnergyWh: 0,
                        leds: {}
                    };
                }

                const ledId = log.led_id;
                if (!dailyData[date].devices[deviceId].leds[ledId]) {
                    dailyData[date].devices[deviceId].leds[ledId] = {
                        ledId,
                        totalEnergyWh: 0
                    };
                }

                const energyWh = parseFloat(log.energy_wh || 0);
                dailyData[date].devices[deviceId].leds[ledId].totalEnergyWh += energyWh;
                dailyData[date].devices[deviceId].totalEnergyWh += energyWh;
                dailyData[date].totalEnergyWh += energyWh;
            });

            // Convert to array and sort by date (newest first)
            const dailyDataArray = Object.values(dailyData).sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            // Convert device objects to arrays
            dailyDataArray.forEach(day => {
                day.devices = Object.values(day.devices);
                day.devices.forEach(device => {
                    device.leds = Object.values(device.leds);
                });
            });

            return res.json({
                status: 'success',
                data: {
                    logs: dailyDataArray,
                    pagination: {
                        total: count,
                        page: pageNum,
                        limit: limitNum,
                        totalPages
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching all energy logs:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch energy logs: ${error.message}`
            });
        }
    }
}

export default new EnergyLogController(); 