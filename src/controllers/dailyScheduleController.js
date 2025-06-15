import db from '../models/index.js';
import arduinoController from './arduinoController.js';

// Helper function to check if is_daily_schedule column exists
async function hasIsDailyScheduleColumn() {
    try {
        await db.Schedule.findOne({
            where: { is_daily_schedule: true },
            limit: 1
        });
        return true;
    } catch (error) {
        return false;
    }
}

class DailyScheduleController {
    // Create a new daily schedule
    async createDailySchedule(req, res) {
        try {
            const { user_id, device_id, led_id, on_hour, on_minute, off_hour, off_minute } = req.body;

            // Validate input
            if (!user_id || !device_id || led_id === undefined ||
                on_hour === undefined || on_minute === undefined ||
                off_hour === undefined || off_minute === undefined) {
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

            // Apply schedule to Arduino first
            let arduinoResult;
            try {
                arduinoResult = await arduinoController.setDailySchedule(
                    led_id, on_hour, on_minute, off_hour, off_minute
                );
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: `Failed to apply schedule to Arduino: ${error.message}`
                });
            }

            // Create a new schedule in database
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let scheduleData = {
                user_id,
                device_id,
                led_id,
                on_hour,
                on_minute,
                off_hour,
                off_minute,
                is_active: true,
                last_applied: new Date()
            };

            // Add is_daily_schedule if the column exists
            if (hasIsDailySchedule) {
                scheduleData.is_daily_schedule = true;
            }

            // Create a new schedule
            const schedule = await db.Schedule.create(scheduleData);

            return res.status(201).json({
                status: 'success',
                message: 'Daily schedule created',
                data: {
                    schedule: schedule.toJSON(),
                    arduinoResult
                }
            });
        } catch (error) {
            console.error('Error creating daily schedule:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to create daily schedule: ${error.message}`
            });
        }
    }

    // Get all daily schedules for a user
    async getUserDailySchedules(req, res) {
        try {
            const { userId } = req.params;
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { user_id: userId };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const schedules = await db.Schedule.findAll({
                where: whereClause,
                include: [
                    {
                        model: db.Device,
                        attributes: ['device_id', 'name', 'type']
                    }
                ],
                order: [
                    ['device_id', 'ASC'],
                    ['led_id', 'ASC']
                ]
            });

            return res.json({
                status: 'success',
                data: schedules
            });
        } catch (error) {
            console.error('Error fetching user daily schedules:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch daily schedules: ${error.message}`
            });
        }
    }

    // Get all daily schedules for a device
    async getDeviceDailySchedules(req, res) {
        try {
            const { deviceId } = req.params;
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { device_id: deviceId };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const schedules = await db.Schedule.findAll({
                where: whereClause,
                order: [['led_id', 'ASC']]
            });

            return res.json({
                status: 'success',
                data: schedules
            });
        } catch (error) {
            console.error('Error fetching device daily schedules:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch device daily schedules: ${error.message}`
            });
        }
    }

    // Get a specific daily schedule
    async getDailySchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { schedule_id: scheduleId };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const schedule = await db.Schedule.findOne({
                where: whereClause,
                include: [
                    {
                        model: db.Device,
                        attributes: ['device_id', 'name', 'type']
                    }
                ]
            });

            if (!schedule) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Schedule not found'
                });
            }

            return res.json({
                status: 'success',
                data: schedule
            });
        } catch (error) {
            console.error('Error fetching daily schedule:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to fetch daily schedule: ${error.message}`
            });
        }
    }

    // Update a daily schedule
    async updateDailySchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const { on_hour, on_minute, off_hour, off_minute, is_active } = req.body;
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { schedule_id: scheduleId };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const schedule = await db.Schedule.findOne({
                where: whereClause
            });

            if (!schedule) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Schedule not found'
                });
            }

            // Update schedule in Arduino first if schedule is active
            let arduinoResult = null;
            if (is_active !== false) {
                try {
                    arduinoResult = await arduinoController.setDailySchedule(
                        schedule.led_id,
                        on_hour !== undefined ? on_hour : schedule.on_hour,
                        on_minute !== undefined ? on_minute : schedule.on_minute,
                        off_hour !== undefined ? off_hour : schedule.off_hour,
                        off_minute !== undefined ? off_minute : schedule.off_minute
                    );
                } catch (error) {
                    return res.status(500).json({
                        status: 'error',
                        message: `Failed to update schedule on Arduino: ${error.message}`
                    });
                }
            }

            // Update schedule in database
            const updateFields = {};
            if (on_hour !== undefined) updateFields.on_hour = on_hour;
            if (on_minute !== undefined) updateFields.on_minute = on_minute;
            if (off_hour !== undefined) updateFields.off_hour = off_hour;
            if (off_minute !== undefined) updateFields.off_minute = off_minute;
            if (is_active !== undefined) updateFields.is_active = is_active;

            if (Object.keys(updateFields).length > 0) {
                updateFields.last_applied = new Date();
                await schedule.update(updateFields);
            }

            return res.json({
                status: 'success',
                message: 'Daily schedule updated',
                data: {
                    schedule: schedule.toJSON(),
                    arduinoResult
                }
            });
        } catch (error) {
            console.error('Error updating daily schedule:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to update daily schedule: ${error.message}`
            });
        }
    }

    // Delete a daily schedule
    async deleteDailySchedule(req, res) {
        try {
            const { scheduleId } = req.params;
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { schedule_id: scheduleId };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const schedule = await db.Schedule.findOne({
                where: whereClause
            });

            if (!schedule) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Schedule not found'
                });
            }

            // Clear schedule from Arduino
            try {
                await arduinoController.clearDailySchedule(schedule.led_id);
            } catch (error) {
                console.error(`Error clearing schedule from Arduino: ${error.message}`);
                // Continue with database deletion even if Arduino call fails
            }

            // Delete from database
            await schedule.destroy();

            return res.json({
                status: 'success',
                message: 'Daily schedule deleted'
            });
        } catch (error) {
            console.error('Error deleting daily schedule:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to delete daily schedule: ${error.message}`
            });
        }
    }

    // Apply all daily schedules
    async applyAllSchedules(req, res) {
        try {
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();

            let whereClause = { is_active: true };
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            // Get all active daily schedules
            const activeSchedules = await db.Schedule.findAll({
                where: whereClause,
                order: [['device_id', 'ASC'], ['led_id', 'ASC']]
            });

            if (activeSchedules.length === 0) {
                return res.json({
                    status: 'success',
                    message: 'No active daily schedules found',
                    data: { count: 0 }
                });
            }

            // First clear all schedules
            try {
                await arduinoController.clearAllSchedules();
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: `Failed to clear schedules: ${error.message}`
                });
            }

            // Apply each schedule
            const results = [];
            let successCount = 0;

            for (const schedule of activeSchedules) {
                try {
                    // Skip schedules missing required fields
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

                    successCount++;
                } catch (error) {
                    results.push({
                        schedule_id: schedule.schedule_id,
                        led_id: schedule.led_id,
                        result: 'error',
                        error: error.message
                    });
                }
            }

            return res.json({
                status: 'success',
                message: `Applied ${successCount} of ${results.length} schedules`,
                data: { results, count: results.length, successCount }
            });
        } catch (error) {
            console.error('Error applying daily schedules:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to apply daily schedules: ${error.message}`
            });
        }
    }

    // Clear all daily schedules
    async clearAllSchedules(req, res) {
        try {
            // Clear all schedules from Arduino
            try {
                await arduinoController.clearAllSchedules();
            } catch (error) {
                return res.status(500).json({
                    status: 'error',
                    message: `Failed to clear schedules from Arduino: ${error.message}`
                });
            }

            // Deactivate all schedules in database
            const hasIsDailySchedule = await hasIsDailyScheduleColumn();
            let whereClause = {};
            if (hasIsDailySchedule) {
                whereClause.is_daily_schedule = true;
            }

            const result = await db.Schedule.update(
                { is_active: false },
                { where: whereClause }
            );

            return res.json({
                status: 'success',
                message: 'All daily schedules cleared',
                data: { count: result[0] }
            });
        } catch (error) {
            console.error('Error clearing daily schedules:', error);
            return res.status(500).json({
                status: 'error',
                message: `Failed to clear daily schedules: ${error.message}`
            });
        }
    }
}

export default new DailyScheduleController(); 