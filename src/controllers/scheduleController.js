import db from '../models/index.js';
import { isValidCronExpression } from '../utils/cronUtils.js';
import redisSchedulerService from '../services/redisSchedulerService.js';
import arduinoController from '../controllers/arduinoController.js';

// Create a new schedule
export const createSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            cron_expression,
            action_type,
            target_device_id,
            target_scene_id,
            action_value_brightness,
            action_value_color_hex,
            is_active,
            action,
            // Daily schedule fields
            device_id,
            led_id,
            on_hour,
            on_minute,
            off_hour,
            off_minute,
            is_daily_schedule
        } = req.body;

        // Check if this is a daily schedule request
        const hasDailyFields = led_id !== undefined &&
            on_hour !== undefined &&
            on_minute !== undefined &&
            off_hour !== undefined &&
            off_minute !== undefined;

        // For daily schedules, we don't require cron_expression
        if (!hasDailyFields && !is_daily_schedule) {
            // For normal schedules, validate cron expression
            if (!cron_expression || !isValidCronExpression(cron_expression)) {
                return res.status(400).json({ message: 'Invalid cron expression format' });
            }
        }

        // Use device_id for daily schedules, target_device_id for regular schedules
        const effectiveDeviceId = hasDailyFields ? device_id : target_device_id;
        if (effectiveDeviceId) {
            const device = await db.Device.findOne({
                where: { device_id: effectiveDeviceId, user_id: userId }
            });
            if (!device) {
                return res.status(400).json({ message: 'Target device not found or unauthorized' });
            }
        }

        if (target_scene_id) {
            const scene = await db.Scene.findOne({
                where: { scene_id: target_scene_id, user_id: userId }
            });
            if (!scene) {
                return res.status(400).json({ message: 'Target scene not found or unauthorized' });
            }
        }

        // Process action if it's an object
        let actionValue = action;
        if (action && typeof action === 'object') {
            actionValue = JSON.stringify(action);
        }

        // Prepare schedule data
        const scheduleData = {
            user_id: userId,
            name,
            cron_expression,
            action_type,
            target_device_id,
            target_scene_id,
            action_value_brightness,
            action_value_color_hex,
            is_active,
            action: actionValue
        };

        // Add daily schedule fields if present
        if (hasDailyFields || is_daily_schedule) {
            scheduleData.is_daily_schedule = true;
            scheduleData.device_id = device_id || target_device_id;
            scheduleData.led_id = led_id;
            scheduleData.on_hour = on_hour;
            scheduleData.on_minute = on_minute;
            scheduleData.off_hour = off_hour;
            scheduleData.off_minute = off_minute;
        }

        const schedule = await db.Schedule.create(scheduleData);

        // If this is a daily schedule, add it to scheduler
        if (hasDailyFields || is_daily_schedule) {
            try {
                // Calculate the next ON and OFF times
                const now = new Date();

                // ON time
                const onTime = new Date(now);
                onTime.setHours(scheduleData.on_hour, scheduleData.on_minute, 0, 0);
                if (onTime < now) {
                    onTime.setDate(onTime.getDate() + 1);
                }

                // OFF time
                const offTime = new Date(now);
                offTime.setHours(scheduleData.off_hour, scheduleData.off_minute, 0, 0);
                if (offTime < now) {
                    offTime.setDate(offTime.getDate() + 1);
                }

                // Check Redis connection status
                const redisStatus = await redisSchedulerService.checkConnection();

                if (redisStatus.connected) {
                    // Schedule the jobs in Redis
                    await redisSchedulerService.scheduleLedOn(
                        scheduleData.led_id,
                        schedule.schedule_id,
                        onTime.getTime()
                    );

                    await redisSchedulerService.scheduleLedOff(
                        scheduleData.led_id,
                        schedule.schedule_id,
                        offTime.getTime()
                    );

                    console.log(`Scheduled daily jobs in Redis for schedule ${schedule.schedule_id}`);
                } else {
                    // Use fallback scheduler directly
                    console.log(`Redis not available, using fallback scheduler for schedule ${schedule.schedule_id}`);

                    // Schedule new jobs with the fallback scheduler
                    const onJobId = `led-${schedule.led_id}-on-${schedule.schedule_id}`;
                    const offJobId = `led-${schedule.led_id}-off-${schedule.schedule_id}`;

                    redisSchedulerService.fallbackScheduler.scheduleJob(
                        onJobId,
                        onTime.getTime(),
                        async () => {
                            console.log(`[Fallback Scheduler] Executing ON job for LED ${schedule.led_id} (Schedule ${schedule.schedule_id})`);
                            try {
                                await arduinoController.setLEDManualOn(schedule.led_id);
                                console.log(`[Fallback Scheduler] Successfully turned ON LED ${schedule.led_id}`);
                            } catch (error) {
                                console.error(`[Fallback Scheduler] Error turning ON LED ${schedule.led_id}:`, error);
                            }
                        }
                    );

                    redisSchedulerService.fallbackScheduler.scheduleJob(
                        offJobId,
                        offTime.getTime(),
                        async () => {
                            console.log(`[Fallback Scheduler] Executing OFF job for LED ${schedule.led_id} (Schedule ${schedule.schedule_id})`);
                            try {
                                await arduinoController.setLEDManualOff(schedule.led_id);
                                console.log(`[Fallback Scheduler] Successfully turned OFF LED ${schedule.led_id}`);
                            } catch (error) {
                                console.error(`[Fallback Scheduler] Error turning OFF LED ${schedule.led_id}:`, error);
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Error scheduling in scheduler:', error);
                // Continue even if scheduling fails
            }
        }

        res.status(201).json({ message: 'Schedule created successfully', scheduleId: schedule.schedule_id });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get a specific schedule by ID
export const getScheduleById = async (req, res) => {
    try {
        const userId = req.user.id;
        const scheduleId = req.params.id;

        const schedule = await db.Schedule.findOne({
            where: { schedule_id: scheduleId, user_id: userId },
            include: [
                {
                    model: db.Device,
                    attributes: ['device_id', 'name', 'type']
                },
                {
                    model: db.Scene,
                    attributes: ['scene_id', 'name']
                }
            ]
        });

        if (schedule) {
            const plainSchedule = schedule.get({ plain: true });

            // Try to parse action if it's a string that looks like JSON
            if (plainSchedule.action && typeof plainSchedule.action === 'string') {
                try {
                    if (plainSchedule.action.startsWith('{') || plainSchedule.action.startsWith('[')) {
                        plainSchedule.action = JSON.parse(plainSchedule.action);
                    }
                } catch (e) {
                    // Keep as string if parsing fails
                    console.warn(`Failed to parse action for schedule ${plainSchedule.schedule_id}: ${e.message}`);
                }
            }

            res.status(200).json(plainSchedule);
        } else {
            res.status(404).json({ message: 'Schedule not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error fetching schedule by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a schedule by ID
export const updateSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const scheduleId = req.params.id;

        // Validate schedule ID
        if (!scheduleId || scheduleId === 'undefined') {
            return res.status(400).json({ message: 'Invalid schedule ID' });
        }

        const scheduleData = { ...req.body };

        // Check if this is a daily schedule update
        const hasDailyFields = scheduleData.led_id !== undefined ||
            scheduleData.on_hour !== undefined ||
            scheduleData.off_hour !== undefined ||
            scheduleData.is_daily_schedule;

        // Only validate cron for non-daily schedules
        if (!hasDailyFields && scheduleData.cron_expression && !isValidCronExpression(scheduleData.cron_expression)) {
            return res.status(400).json({ message: 'Invalid cron expression format' });
        }

        // Mark as daily schedule if daily fields are present
        if (hasDailyFields) {
            scheduleData.is_daily_schedule = true;
        }

        // Ensure action is stored as a string
        if (scheduleData.action && typeof scheduleData.action === 'object') {
            scheduleData.action = JSON.stringify(scheduleData.action);
        }

        // Validate target_device_id or target_scene_id belongs to the user if provided in update data
        if (scheduleData.target_device_id) {
            const device = await db.Device.findOne({
                where: { device_id: scheduleData.target_device_id, user_id: userId }
            });
            if (!device) {
                return res.status(400).json({ message: 'Target device not found or unauthorized' });
            }
        }

        if (scheduleData.target_scene_id) {
            const scene = await db.Scene.findOne({
                where: { scene_id: scheduleData.target_scene_id, user_id: userId }
            });
            if (!scene) {
                return res.status(400).json({ message: 'Target scene not found or unauthorized' });
            }
        }

        const schedule = await db.Schedule.findOne({
            where: { schedule_id: scheduleId, user_id: userId }
        });

        // Update the schedule in the database
        await schedule.update(scheduleData);

        // If this is a daily schedule with time fields, update in Redis
        if (hasDailyFields &&
            schedule.led_id !== undefined &&
            schedule.on_hour !== undefined &&
            schedule.on_minute !== undefined &&
            schedule.off_hour !== undefined &&
            schedule.off_minute !== undefined) {

            try {
                // Calculate the next ON and OFF times
                const now = new Date();

                // ON time
                const onTime = new Date(now);
                onTime.setHours(schedule.on_hour, schedule.on_minute, 0, 0);
                if (onTime < now) {
                    onTime.setDate(onTime.getDate() + 1);
                }

                // OFF time
                const offTime = new Date(now);
                offTime.setHours(schedule.off_hour, schedule.off_minute, 0, 0);
                if (offTime < now) {
                    offTime.setDate(offTime.getDate() + 1);
                }

                // Check Redis connection status
                const redisStatus = await redisSchedulerService.checkConnection();

                if (redisStatus.connected) {
                    // Re-schedule the jobs in Redis
                    await redisSchedulerService.scheduleLedOn(
                        schedule.led_id,
                        schedule.schedule_id,
                        onTime.getTime()
                    );

                    await redisSchedulerService.scheduleLedOff(
                        schedule.led_id,
                        schedule.schedule_id,
                        offTime.getTime()
                    );
                    console.log(`Updated daily jobs in Redis for schedule ${schedule.schedule_id}`);
                } else {
                    // Use fallback scheduler directly
                    console.log(`Redis not available, using fallback scheduler for schedule ${schedule.schedule_id}`);

                    // Cancel any existing jobs for this schedule
                    const onJobId = `led-${schedule.led_id}-on-${schedule.schedule_id}`;
                    const offJobId = `led-${schedule.led_id}-off-${schedule.schedule_id}`;
                    redisSchedulerService.fallbackScheduler.cancelJob(onJobId);
                    redisSchedulerService.fallbackScheduler.cancelJob(offJobId);

                    // Schedule new jobs with the fallback scheduler
                    redisSchedulerService.fallbackScheduler.scheduleJob(
                        onJobId,
                        onTime.getTime(),
                        async () => {
                            console.log(`[Fallback Scheduler] Executing ON job for LED ${schedule.led_id} (Schedule ${schedule.schedule_id})`);
                            try {
                                await arduinoController.setLEDManualOn(schedule.led_id);
                                console.log(`[Fallback Scheduler] Successfully turned ON LED ${schedule.led_id}`);
                            } catch (error) {
                                console.error(`[Fallback Scheduler] Error turning ON LED ${schedule.led_id}:`, error);
                            }
                        }
                    );

                    redisSchedulerService.fallbackScheduler.scheduleJob(
                        offJobId,
                        offTime.getTime(),
                        async () => {
                            console.log(`[Fallback Scheduler] Executing OFF job for LED ${schedule.led_id} (Schedule ${schedule.schedule_id})`);
                            try {
                                await arduinoController.setLEDManualOff(schedule.led_id);
                                console.log(`[Fallback Scheduler] Successfully turned OFF LED ${schedule.led_id}`);
                            } catch (error) {
                                console.error(`[Fallback Scheduler] Error turning OFF LED ${schedule.led_id}:`, error);
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('Error updating schedule in scheduler:', error);
                // Continue even if scheduling fails
            }
        }

        res.json({
            message: 'Schedule updated successfully',
            scheduleId: schedule.schedule_id
        });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a schedule by ID
export const deleteSchedule = async (req, res) => {
    try {
        const userId = req.user.id;
        const scheduleId = req.params.id;

        const schedule = await db.Schedule.findOne({
            where: { schedule_id: scheduleId, user_id: userId }
        });

        if (schedule) {
            // If this is a daily schedule, remove from Redis first
            if (schedule.is_daily_schedule) {
                try {
                    // Remove the jobs from Redis queues by ID
                    const onJobId = `led-${schedule.led_id}-on-${schedule.schedule_id}`;
                    const offJobId = `led-${schedule.led_id}-off-${schedule.schedule_id}`;

                    await redisSchedulerService.ledOnQueue.removeJobs(onJobId);
                    await redisSchedulerService.ledOffQueue.removeJobs(offJobId);

                    console.log(`Removed Redis jobs for schedule ${schedule.schedule_id}`);
                } catch (redisError) {
                    console.error('Error removing schedule from Redis:', redisError);
                    // Continue even if Redis fails
                }
            }

            // Delete the schedule from the database
            await schedule.destroy();

            res.json({ message: 'Schedule deleted successfully' });
        } else {
            res.status(404).json({ message: 'Schedule not found or unauthorized' });
        }
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all schedules for the authenticated user
export const getAllSchedules = async (req, res) => {
    try {
        // Check if user is properly authenticated
        if (!req.user || !req.user.id) {
            console.error('Error in getAllSchedules: Missing user authentication');
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.user.id;
        const { deviceId, sceneId } = req.query;

        // Build where clause
        const whereClause = { user_id: userId };

        // Add filter by deviceId if provided
        if (deviceId) {
            whereClause.device_id = Number(deviceId);
        }

        // Add filter by sceneId if provided
        if (sceneId) {
            whereClause.scene_id = Number(sceneId);
        }

        const schedules = await db.Schedule.findAll({
            where: whereClause,
            include: [
                {
                    model: db.Device,
                    attributes: ['device_id', 'name', 'type']
                },
                {
                    model: db.Scene,
                    attributes: ['scene_id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Process schedules for frontend - try to parse action strings to objects
        const processedSchedules = schedules.map(schedule => {
            const plainSchedule = schedule.get({ plain: true });

            // Try to parse action if it's a string that looks like JSON
            if (plainSchedule.action && typeof plainSchedule.action === 'string') {
                try {
                    if (plainSchedule.action.startsWith('{') || plainSchedule.action.startsWith('[')) {
                        plainSchedule.action = JSON.parse(plainSchedule.action);
                    }
                } catch (e) {
                    // Keep as string if parsing fails
                    console.warn(`Failed to parse action for schedule ${plainSchedule.schedule_id}: ${e.message}`);
                }
            }

            return plainSchedule;
        });

        res.status(200).json(processedSchedules);
    } catch (error) {
        console.error('Error fetching all schedules:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
