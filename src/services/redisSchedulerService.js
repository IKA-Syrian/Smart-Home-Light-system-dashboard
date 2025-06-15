import Queue from 'bull';
import db from '../models/index.js';
import arduinoController from '../controllers/arduinoController.js';
import logger from '../utils/logger.js';
import nodeCron from 'node-cron';

// Add a fallback scheduler that doesn't rely on Redis
class FallbackScheduler {
    constructor() {
        this.jobs = new Map();
        logger.redis('Fallback Scheduler initialized');
    }

    scheduleJob(id, timestamp, callback) {
        // Cancel any existing job with this ID
        this.cancelJob(id);

        const now = Date.now();
        const delay = Math.max(0, timestamp - now);

        if (delay <= 0) {
            // Execute immediately if the time has already passed
            logger.redis(`Executing job ${id} immediately (scheduled time already passed)`, {
                scheduledTime: new Date(timestamp).toLocaleString(),
                currentTime: new Date().toLocaleString()
            });
            callback();
            return id;
        }

        logger.redis(`Scheduling job ${id} to run in ${Math.floor(delay / 1000)} seconds`, {
            scheduledTime: new Date(timestamp).toLocaleString(),
            delayMs: delay
        });

        // Schedule the job
        const timerId = setTimeout(() => {
            logger.redis(`Executing job ${id}`, { timestamp: new Date().toLocaleString() });
            callback();
            this.jobs.delete(id);
        }, delay);

        // Store the job
        this.jobs.set(id, {
            id,
            timestamp,
            timerId,
            callback
        });

        return id;
    }

    cancelJob(id) {
        const job = this.jobs.get(id);
        if (job) {
            clearTimeout(job.timerId);
            this.jobs.delete(id);
            logger.redis(`Cancelled job ${id}`);
            return true;
        }
        return false;
    }

    cancelAllJobs() {
        let count = 0;
        for (const [id, job] of this.jobs.entries()) {
            clearTimeout(job.timerId);
            this.jobs.delete(id);
            count++;
        }
        logger.redis(`Cancelled all ${count} jobs`);
        return count;
    }

    getPendingJobs() {
        const jobs = [];
        for (const [id, job] of this.jobs.entries()) {
            jobs.push({
                id,
                timestamp: new Date(job.timestamp),
                remainingMs: job.timestamp - Date.now()
            });
        }
        return jobs;
    }
}

class RedisSchedulerService {
    constructor() {
        this.isRedisAvailable = false;
        // Create fallback scheduler
        this.fallbackScheduler = new FallbackScheduler();

        try {
            // Create queues for different types of jobs
            this.ledOnQueue = new Queue('led-on-jobs', {
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD || '',
                    // Add connection options to handle errors better
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: false,
                    reconnectOnError: (err) => {
                        logger.error('redis', 'Redis connection error:', err.message);
                        return false; // Don't auto-reconnect on auth errors
                    }
                },
                defaultJobOptions: {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            });

            this.ledOffQueue = new Queue('led-off-jobs', {
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379,
                    password: process.env.REDIS_PASSWORD || '',
                    // Add connection options to handle errors better
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: false,
                    reconnectOnError: (err) => {
                        logger.error('redis', 'Redis connection error:', err.message);
                        return false; // Don't auto-reconnect on auth errors
                    }
                },
                defaultJobOptions: {
                    removeOnComplete: true,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            });

            // Initialize the processor functions
            this.initializeProcessors();
            this.isRedisAvailable = true;
            logger.redis('Successfully connected to Redis');
        } catch (error) {
            logger.error('redis', 'Failed to initialize Redis queues:', error.message);
            logger.redis('Using fallback scheduler instead');
            this.isRedisAvailable = false;
        }
    }

    // Initialize the queue processors
    initializeProcessors() {
        if (!this.isRedisAvailable) return;

        try {
            // Process LED ON jobs
            this.ledOnQueue.process(async (job) => {
                const { ledId, scheduleId } = job.data;
                logger.redis(`Processing LED ON job for LED ${ledId} (Schedule ${scheduleId})`, {
                    jobId: job.id,
                    timestamp: new Date().toLocaleString(),
                    jobData: job.data
                });

                try {
                    // Turn the LED on
                    const result = await arduinoController.setLEDManualOn(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'ON',
                            result
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`Successfully turned ON LED ${ledId} for schedule ${scheduleId}`, {
                        result,
                        timestamp: new Date().toLocaleString()
                    });
                    return { success: true, message: `LED ${ledId} turned ON`, result };
                } catch (error) {
                    logger.error('redis', `Error turning ON LED ${ledId}:`, error.message);
                    throw new Error(`Failed to turn ON LED ${ledId}: ${error.message}`);
                }
            });

            // Process LED OFF jobs
            this.ledOffQueue.process(async (job) => {
                const { ledId, scheduleId } = job.data;
                logger.redis(`Processing LED OFF job for LED ${ledId} (Schedule ${scheduleId})`, {
                    jobId: job.id,
                    timestamp: new Date().toLocaleString(),
                    jobData: job.data
                });

                try {
                    // Turn the LED off
                    const result = await arduinoController.setLEDManualOff(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'OFF',
                            result
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`Successfully turned OFF LED ${ledId} for schedule ${scheduleId}`, {
                        result,
                        timestamp: new Date().toLocaleString()
                    });
                    return { success: true, message: `LED ${ledId} turned OFF`, result };
                } catch (error) {
                    logger.error('redis', `Error turning OFF LED ${ledId}:`, error.message);
                    throw new Error(`Failed to turn OFF LED ${ledId}: ${error.message}`);
                }
            });

            // Handle completed jobs
            this.ledOnQueue.on('completed', (job, result) => {
                logger.redis(`LED ON job ${job.id} completed with result:`, JSON.stringify(result));
            });

            this.ledOffQueue.on('completed', (job, result) => {
                logger.redis(`LED OFF job ${job.id} completed with result:`, JSON.stringify(result));
            });

            // Handle failed jobs
            this.ledOnQueue.on('failed', (job, error) => {
                logger.error('redis', `LED ON job ${job.id} failed:`, error.message);
                // Add retry logic if needed
            });

            this.ledOffQueue.on('failed', (job, error) => {
                logger.error('redis', `LED OFF job ${job.id} failed:`, error.message);
                // Add retry logic if needed
            });

            // Handle Redis errors
            this.ledOnQueue.on('error', (error) => {
                logger.error('redis', 'LED ON queue error:', error.message);
                this.isRedisAvailable = false;
            });

            this.ledOffQueue.on('error', (error) => {
                logger.error('redis', 'LED OFF queue error:', error.message);
                this.isRedisAvailable = false;
            });

            // Add stalled job handling
            this.ledOnQueue.on('stalled', (jobId) => {
                logger.warn('redis', `LED ON job ${jobId} stalled - will be reprocessed`);
            });

            this.ledOffQueue.on('stalled', (jobId) => {
                logger.warn('redis', `LED OFF job ${jobId} stalled - will be reprocessed`);
            });

            // Set up periodic check for overdue jobs (every 5 seconds instead of 10)
            this.overdueJobCheckInterval = setInterval(() => this.checkForOverdueJobs(), 5000);

            // Set up more frequent check for immediate jobs (every 1 second)
            this.immediateJobCheckInterval = setInterval(() => this.checkForImmediateJobs(), 1000);

            // Set up health check interval (every 30 seconds)
            this.healthCheckInterval = setInterval(() => this.performHealthCheck(), 30000);
        } catch (error) {
            logger.error('redis', 'Error setting up processors:', error.message);
            this.isRedisAvailable = false;
        }
    }

    // New method to check for overdue jobs and manually process them if needed
    async checkForOverdueJobs() {
        if (!this.isRedisAvailable) return;

        try {
            const now = Date.now();

            // Check ON jobs in all possible states
            const onJobs = await this.ledOnQueue.getJobs(['delayed', 'waiting', 'active']);
            for (const job of onJobs) {
                if (!job || !job.opts) continue; // Skip if job or job.opts is null

                const processTime = job.opts.timestamp || (job.opts.delay ? Date.now() + job.opts.delay : null);
                if (!processTime) continue; // Skip if we can't determine the process time

                // If job is overdue by more than 2 seconds
                if (processTime < now - 2000) {
                    logger.warn('redis', `Found overdue ON job ${job.id} for LED ${job.data?.ledId}, executing now`, {
                        jobId: job.id,
                        scheduledTime: new Date(processTime).toLocaleString(),
                        currentTime: new Date().toLocaleString(),
                        overdueBySecs: Math.floor((now - processTime) / 1000)
                    });

                    // Force execute the job
                    await this.forceExecuteJob(this.ledOnQueue, job.id, true);
                }
            }

            // Check OFF jobs in all possible states
            const offJobs = await this.ledOffQueue.getJobs(['delayed', 'waiting', 'active']);
            for (const job of offJobs) {
                if (!job || !job.opts) continue; // Skip if job or job.opts is null

                const processTime = job.opts.timestamp || (job.opts.delay ? Date.now() + job.opts.delay : null);
                if (!processTime) continue; // Skip if we can't determine the process time

                // If job is overdue by more than 2 seconds
                if (processTime < now - 2000) {
                    logger.warn('redis', `Found overdue OFF job ${job.id} for LED ${job.data?.ledId}, executing now`, {
                        jobId: job.id,
                        scheduledTime: new Date(processTime).toLocaleString(),
                        currentTime: new Date().toLocaleString(),
                        overdueBySecs: Math.floor((now - processTime) / 1000)
                    });

                    // Force execute the job
                    await this.forceExecuteJob(this.ledOffQueue, job.id, false);
                }
            }
        } catch (error) {
            logger.error('redis', 'Error checking for overdue jobs:', error.message);
        }
    }

    // New method to check for jobs that need to run immediately
    async checkForImmediateJobs() {
        if (!this.isRedisAvailable) return;

        try {
            const now = Date.now();

            // Check for jobs that should run within the next 2 seconds
            const onJobs = await this.ledOnQueue.getJobs(['delayed']);
            for (const job of onJobs) {
                if (!job || !job.opts) continue; // Skip if job or job.opts is null

                const processTime = job.opts.timestamp || (job.opts.delay ? Date.now() + job.opts.delay : null);
                if (!processTime) continue; // Skip if we can't determine the process time

                // If job should run within 2 seconds
                if (processTime <= now + 2000) {
                    logger.info('redis', `Found immediate ON job ${job.id} for LED ${job.data?.ledId}, promoting to waiting`, {
                        jobId: job.id,
                        scheduledTime: new Date(processTime).toLocaleString(),
                        currentTime: new Date().toLocaleString(),
                        timeUntilExecution: Math.floor((processTime - now) / 1000) + ' seconds'
                    });

                    // Promote the job to waiting state for immediate execution
                    await this.promoteJob(this.ledOnQueue, job.id);
                }
            }

            // Check for OFF jobs that should run within the next 2 seconds
            const offJobs = await this.ledOffQueue.getJobs(['delayed']);
            for (const job of offJobs) {
                if (!job || !job.opts) continue; // Skip if job or job.opts is null

                const processTime = job.opts.timestamp || (job.opts.delay ? Date.now() + job.opts.delay : null);
                if (!processTime) continue; // Skip if we can't determine the process time

                // If job should run within 2 seconds
                if (processTime <= now + 2000) {
                    logger.info('redis', `Found immediate OFF job ${job.id} for LED ${job.data?.ledId}, promoting to waiting`, {
                        jobId: job.id,
                        scheduledTime: new Date(processTime).toLocaleString(),
                        currentTime: new Date().toLocaleString(),
                        timeUntilExecution: Math.floor((processTime - now) / 1000) + ' seconds'
                    });

                    // Promote the job to waiting state for immediate execution
                    await this.promoteJob(this.ledOffQueue, job.id);
                }
            }
        } catch (error) {
            logger.error('redis', 'Error checking for immediate jobs:', error.message);
        }
    }

    // Schedule a job to turn an LED on at a specific time
    async scheduleLedOn(ledId, scheduleId, timestamp) {
        if (!this.isRedisAvailable) {
            logger.redis(`Redis not available, using fallback scheduler for LED ${ledId} ON`, {
                ledId,
                scheduleId,
                scheduledTime: new Date(timestamp).toLocaleString()
            });

            // Use fallback scheduler
            const jobId = `led-${ledId}-on-${scheduleId}`;
            return this.fallbackScheduler.scheduleJob(jobId, timestamp, async () => {
                try {
                    logger.redis(`[Fallback] Turning ON LED ${ledId} for schedule ${scheduleId}`, {
                        time: new Date().toLocaleString()
                    });
                    const result = await arduinoController.setLEDManualOn(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'ON',
                            result,
                            scheduler: 'fallback'
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`[Fallback] Successfully turned ON LED ${ledId} for schedule ${scheduleId}`, {
                        result,
                        ledId,
                        scheduleId
                    });
                } catch (error) {
                    logger.error('redis', `[Fallback] Error turning ON LED ${ledId}:`, error.message);
                }
            });
        }

        try {
            const jobId = `led-${ledId}-on-${scheduleId}`;
            const now = Date.now();
            const delay = Math.max(0, timestamp - now);
            const scheduledTime = new Date(timestamp);

            logger.redis(`Scheduling LED ${ledId} ON at ${scheduledTime.toLocaleString()} (in ${Math.floor(delay / 1000)}s)`, {
                jobId,
                ledId,
                scheduleId,
                delay,
                scheduledTime,
                currentTime: new Date()
            });

            // Remove any existing job with the same ID
            await this.ledOnQueue.removeJobs(jobId);
            logger.redis(`Removed any existing ON jobs with ID ${jobId}`);

            // If the job should run immediately or very soon (within 1 second), use minimal delay
            // and execute immediately after scheduling
            const useDelay = delay <= 1000 ? 100 : delay;
            const shouldExecuteImmediately = delay <= 1000;

            // Add the new job with high priority if it's due soon
            const job = await this.ledOnQueue.add(
                { ledId, scheduleId },
                {
                    jobId,
                    delay: useDelay,
                    timestamp: timestamp,
                    removeOnComplete: true,
                    attempts: 3,
                    priority: delay <= 5000 ? 1 : undefined // Higher priority for imminent jobs
                }
            );

            // If the job is due immediately or very soon, try to promote it from delayed to waiting
            if (shouldExecuteImmediately) {
                logger.redis(`Job ${jobId} is due immediately, promoting and executing manually`, {
                    scheduledTime: scheduledTime.toLocaleString(),
                    currentTime: new Date().toLocaleString()
                });

                // First try to promote it
                await this.promoteJob(this.ledOnQueue, jobId);

                // Also execute it manually to ensure it runs
                try {
                    const result = await arduinoController.setLEDManualOn(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED_IMMEDIATE',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'ON',
                            result
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`Manually executed immediate ON job for LED ${ledId}`, {
                        result,
                        jobId: job.id,
                        scheduledTime: scheduledTime.toLocaleString()
                    });

                    // Remove the job since we executed it manually
                    await job.remove();
                } catch (error) {
                    logger.error('redis', `Error executing immediate ON job for LED ${ledId}:`, error.message);
                }
            }

            logger.redis(`Successfully scheduled LED ${ledId} to turn ON`, {
                jobId: job.id,
                scheduledTime: scheduledTime.toLocaleString(),
                delayMs: useDelay
            });
            return job;
        } catch (error) {
            logger.error('redis', `Error scheduling LED ${ledId} ON:`, error.message);
            this.isRedisAvailable = false;

            // Fall back to the fallback scheduler
            return this.scheduleLedOn(ledId, scheduleId, timestamp);
        }
    }

    // Schedule a job to turn an LED off at a specific time
    async scheduleLedOff(ledId, scheduleId, timestamp) {
        if (!this.isRedisAvailable) {
            logger.redis(`Redis not available, using fallback scheduler for LED ${ledId} OFF`, {
                ledId,
                scheduleId,
                scheduledTime: new Date(timestamp).toLocaleString()
            });

            // Use fallback scheduler
            const jobId = `led-${ledId}-off-${scheduleId}`;
            return this.fallbackScheduler.scheduleJob(jobId, timestamp, async () => {
                try {
                    logger.redis(`[Fallback] Turning OFF LED ${ledId} for schedule ${scheduleId}`, {
                        time: new Date().toLocaleString()
                    });
                    const result = await arduinoController.setLEDManualOff(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'OFF',
                            result,
                            scheduler: 'fallback'
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`[Fallback] Successfully turned OFF LED ${ledId} for schedule ${scheduleId}`, {
                        result,
                        ledId,
                        scheduleId
                    });
                } catch (error) {
                    logger.error('redis', `[Fallback] Error turning OFF LED ${ledId}:`, error.message);
                }
            });
        }

        try {
            const jobId = `led-${ledId}-off-${scheduleId}`;
            const now = Date.now();
            const delay = Math.max(0, timestamp - now);
            const scheduledTime = new Date(timestamp);

            logger.redis(`Scheduling LED ${ledId} OFF at ${scheduledTime.toLocaleString()} (in ${Math.floor(delay / 1000)}s)`, {
                jobId,
                ledId,
                scheduleId,
                delay,
                scheduledTime,
                currentTime: new Date()
            });

            // Remove any existing job with the same ID
            await this.ledOffQueue.removeJobs(jobId);
            logger.redis(`Removed any existing OFF jobs with ID ${jobId}`);

            // If the job should run immediately or very soon (within 1 second), use minimal delay
            // and execute immediately after scheduling
            const useDelay = delay <= 1000 ? 100 : delay;
            const shouldExecuteImmediately = delay <= 1000;

            // Add the new job with high priority if it's due soon
            const job = await this.ledOffQueue.add(
                { ledId, scheduleId },
                {
                    jobId,
                    delay: useDelay,
                    timestamp: timestamp,
                    removeOnComplete: true,
                    attempts: 3,
                    priority: delay <= 5000 ? 1 : undefined // Higher priority for imminent jobs
                }
            );

            // If the job is due immediately or very soon, try to promote it from delayed to waiting
            if (shouldExecuteImmediately) {
                logger.redis(`Job ${jobId} is due immediately, promoting and executing manually`, {
                    scheduledTime: scheduledTime.toLocaleString(),
                    currentTime: new Date().toLocaleString()
                });

                // First try to promote it
                await this.promoteJob(this.ledOffQueue, jobId);

                // Also execute it manually to ensure it runs
                try {
                    const result = await arduinoController.setLEDManualOff(ledId);

                    // Log the execution
                    await db.EventLog.create({
                        event_type: 'SCHEDULE_EXECUTED_IMMEDIATE',
                        event_data: JSON.stringify({
                            scheduleId,
                            ledId,
                            action: 'OFF',
                            result
                        }),
                        timestamp: new Date()
                    });

                    logger.redis(`Manually executed immediate OFF job for LED ${ledId}`, {
                        result,
                        jobId: job.id,
                        scheduledTime: scheduledTime.toLocaleString()
                    });

                    // Remove the job since we executed it manually
                    await job.remove();
                } catch (error) {
                    logger.error('redis', `Error executing immediate OFF job for LED ${ledId}:`, error.message);
                }
            }

            logger.redis(`Successfully scheduled LED ${ledId} to turn OFF`, {
                jobId: job.id,
                scheduledTime: scheduledTime.toLocaleString(),
                delayMs: useDelay
            });
            return job;
        } catch (error) {
            logger.error('redis', `Error scheduling LED ${ledId} OFF:`, error.message);
            this.isRedisAvailable = false;

            // Fall back to the fallback scheduler
            return this.scheduleLedOff(ledId, scheduleId, timestamp);
        }
    }

    // Helper method to promote a job from delayed to waiting state
    async promoteJob(queue, jobId) {
        try {
            logger.redis(`Attempting to promote job ${jobId} to waiting state`);

            // First try the standard approach
            const job = await queue.getJob(jobId);
            if (!job) {
                logger.warn('redis', `Cannot promote job ${jobId}: job not found`);
                return false;
            }

            // Get the job state
            const jobState = await job.getState();
            logger.redis(`Job ${jobId} current state: ${jobState}`);

            if (jobState === 'delayed') {
                // This uses Bull's internal method to promote a job
                await queue.client.zrem(queue.toKey('delayed'), jobId);
                await queue.client.lpush(queue.toKey('waiting'), jobId);
                logger.redis(`Successfully promoted job ${jobId} to waiting state`);

                // Force Bull to check for new jobs immediately
                await queue.client.publish(queue.toKey('wait'), 'force-check');

                return true;
            } else if (jobState === 'waiting' || jobState === 'active') {
                logger.redis(`Job ${jobId} is already in ${jobState} state, no need to promote`);
                return true;
            } else {
                logger.warn('redis', `Cannot promote job ${jobId} from state ${jobState}`);
                return false;
            }
        } catch (error) {
            logger.error('redis', `Error promoting job ${jobId}:`, error.message);
            return false;
        }
    }

    // New method to forcefully execute a job immediately
    async forceExecuteJob(queue, jobId, isOnJob = true) {
        try {
            logger.redis(`Forcefully executing job ${jobId}`);

            const job = await queue.getJob(jobId);
            if (!job) {
                logger.warn('redis', `Cannot force execute job ${jobId}: job not found`);
                return false;
            }

            const { ledId, scheduleId } = job.data;

            // Execute the appropriate action based on job type
            let result;
            if (isOnJob) {
                result = await arduinoController.setLEDManualOn(ledId);
                logger.redis(`Force executed ON job for LED ${ledId}`, { result });
            } else {
                result = await arduinoController.setLEDManualOff(ledId);
                logger.redis(`Force executed OFF job for LED ${ledId}`, { result });
            }

            // Log the execution
            await db.EventLog.create({
                event_type: 'SCHEDULE_EXECUTED_FORCE',
                event_data: JSON.stringify({
                    scheduleId,
                    ledId,
                    action: isOnJob ? 'ON' : 'OFF',
                    result
                }),
                timestamp: new Date()
            });

            // Remove the job to prevent double execution
            await job.remove();

            return true;
        } catch (error) {
            logger.error('redis', `Error force executing job ${jobId}:`, error.message);
            return false;
        }
    }

    // Schedule all daily schedules from the database
    async scheduleAllDailySchedules() {
        if (!this.isRedisAvailable) {
            logger.redis('Redis not available, skipping scheduling');
            return [];
        }

        try {
            logger.redis('Scheduling all daily schedules...');

            // Get all active daily schedules
            const schedules = await db.Schedule.findAll({
                where: {
                    is_active: true,
                    is_daily_schedule: true
                }
            });

            if (schedules.length === 0) {
                logger.redis('No active daily schedules found');
                return [];
            }

            logger.redis(`Found ${schedules.length} active daily schedules`);

            const now = new Date();
            const scheduledJobs = [];

            for (const schedule of schedules) {
                // Check if we need to handle legacy schedules with missing fields differently
                let hasLegacyScheduleFormat = !schedule.led_id;
                let hasRequiredFields = false;

                // Check if schedule has legacy onTime/offTime format
                if (schedule.onTime && schedule.offTime) {
                    hasRequiredFields = true;
                }
                // Check if schedule has onHour/onMinute/offHour/offMinute format
                else if (schedule.on_hour !== undefined && schedule.on_minute !== undefined &&
                    schedule.off_hour !== undefined && schedule.off_minute !== undefined) {
                    hasRequiredFields = true;
                }

                if (!hasRequiredFields) {
                    logger.warn('redis', `Skipping schedule ${schedule.schedule_id} due to missing required fields`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        onHour: schedule.on_hour,
                        onMinute: schedule.on_minute,
                        offHour: schedule.off_hour,
                        offMinute: schedule.off_minute
                    });
                    continue;
                }

                logger.redis(`Processing schedule ${schedule.schedule_id} for LED ${schedule.led_id}`, {
                    schedule: {
                        id: schedule.schedule_id,
                        ledId: schedule.led_id,
                        onTime: `${schedule.on_hour}:${schedule.on_minute}`,
                        offTime: `${schedule.off_hour}:${schedule.off_minute}`,
                    }
                });

                // Calculate ON time for today
                const onTime = new Date(now);
                onTime.setHours(schedule.on_hour, schedule.on_minute, 0, 0);

                // Calculate OFF time for today
                const offTime = new Date(now);
                offTime.setHours(schedule.off_hour, schedule.off_minute, 0, 0);

                // If the time has already passed today, schedule it for tomorrow
                if (onTime < now) {
                    onTime.setDate(onTime.getDate() + 1);
                    logger.redis(`ON time already passed today, scheduling for tomorrow: ${onTime.toLocaleString()}`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        originalTime: `${schedule.on_hour}:${schedule.on_minute}`,
                        adjustedTime: onTime.toLocaleString()
                    });
                } else {
                    logger.redis(`Scheduling ON time for today: ${onTime.toLocaleString()}`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        timeRemaining: Math.floor((onTime.getTime() - now.getTime()) / 1000) + ' seconds'
                    });
                }

                // If the OFF time has already passed today, schedule it for tomorrow
                if (offTime < now) {
                    offTime.setDate(offTime.getDate() + 1);
                    logger.redis(`OFF time already passed today, scheduling for tomorrow: ${offTime.toLocaleString()}`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        originalTime: `${schedule.off_hour}:${schedule.off_minute}`,
                        adjustedTime: offTime.toLocaleString()
                    });
                } else {
                    logger.redis(`Scheduling OFF time for today: ${offTime.toLocaleString()}`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        timeRemaining: Math.floor((offTime.getTime() - now.getTime()) / 1000) + ' seconds'
                    });
                }

                // IMPORTANT: Check if off time is before on time (meaning it spans midnight)
                if (offTime < onTime) {
                    // If the off time is earlier in the day than the on time, it means the off time
                    // should be the next day (schedule spans midnight)
                    offTime.setDate(offTime.getDate() + 1);
                    logger.redis(`Schedule spans midnight, adjusting OFF time to next day: ${offTime.toLocaleString()}`, {
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        adjustedTime: offTime.toLocaleString()
                    });
                }

                // Schedule the ON job
                const onJob = await this.scheduleLedOn(schedule.led_id, schedule.schedule_id, onTime.getTime());

                // Schedule the OFF job
                const offJob = await this.scheduleLedOff(schedule.led_id, schedule.schedule_id, offTime.getTime());

                if (onJob || offJob) {
                    scheduledJobs.push({
                        scheduleId: schedule.schedule_id,
                        ledId: schedule.led_id,
                        onJobId: onJob?.id,
                        offJobId: offJob?.id,
                        onTime: onTime,
                        offTime: offTime
                    });

                    // Update last_scheduled timestamp
                    await schedule.update({ last_applied: now });
                    logger.redis(`Updated last_applied timestamp for schedule ${schedule.schedule_id}`);
                }
            }

            logger.redis(`Successfully scheduled ${scheduledJobs.length} daily schedules`);
            return scheduledJobs;
        } catch (error) {
            logger.error('redis', 'Error scheduling daily schedules:', error.message);
            this.isRedisAvailable = false;
            return [];
        }
    }

    // Get all pending jobs
    async getPendingJobs() {
        if (!this.isRedisAvailable) {
            const fallbackJobs = this.fallbackScheduler.getPendingJobs();
            logger.redis('Retrieved pending jobs from fallback scheduler', { count: fallbackJobs.length });
            return {
                status: 'fallback',
                jobs: fallbackJobs
            };
        }

        try {
            logger.redis('Fetching pending jobs from Redis...');

            // Get jobs from the ON queue
            const onJobs = await this.ledOnQueue.getJobs(['waiting', 'active', 'delayed']);

            // Get jobs from the OFF queue
            const offJobs = await this.ledOffQueue.getJobs(['waiting', 'active', 'delayed']);

            logger.redis('Retrieved pending jobs', {
                onJobs: onJobs.length,
                offJobs: offJobs.length,
                total: onJobs.length + offJobs.length
            });

            // Format the jobs for display, avoiding circular references
            const formattedOnJobs = onJobs.map(job => ({
                id: job.id,
                data: job.data,
                timestamp: job.opts.timestamp ? new Date(job.opts.timestamp) : new Date(Date.now() + job.opts.delay),
                // Exclude circular references like stacktrace
                delay: job.opts.delay,
                jobId: job.opts.jobId
            }));

            const formattedOffJobs = offJobs.map(job => ({
                id: job.id,
                data: job.data,
                timestamp: job.opts.timestamp ? new Date(job.opts.timestamp) : new Date(Date.now() + job.opts.delay),
                // Exclude circular references like stacktrace
                delay: job.opts.delay,
                jobId: job.opts.jobId
            }));

            return {
                status: 'connected',
                onJobs: formattedOnJobs,
                offJobs: formattedOffJobs
            };
        } catch (error) {
            logger.error('redis', 'Error getting pending jobs:', error.message);
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    // Clear all scheduled jobs
    async clearAllJobs() {
        if (!this.isRedisAvailable) {
            const count = this.fallbackScheduler.cancelAllJobs();
            logger.redis(`Cleared ${count} jobs from fallback scheduler`);
            return { fallbackJobs: count, onJobs: 0, offJobs: 0 };
        }

        try {
            logger.redis('Clearing all scheduled jobs from Redis...');

            // Clear the ON queue
            const onJobs = await this.ledOnQueue.getJobs(['waiting', 'active', 'delayed']);
            for (const job of onJobs) {
                await job.remove();
            }

            // Clear the OFF queue
            const offJobs = await this.ledOffQueue.getJobs(['waiting', 'active', 'delayed']);
            for (const job of offJobs) {
                await job.remove();
            }

            logger.redis('All scheduled jobs cleared', {
                onJobs: onJobs.length,
                offJobs: offJobs.length,
                total: onJobs.length + offJobs.length
            });

            return { onJobs: onJobs.length, offJobs: offJobs.length };
        } catch (error) {
            logger.error('redis', 'Error clearing all jobs:', error.message);
            return { error: error.message, onJobs: 0, offJobs: 0 };
        }
    }

    // Close the Redis scheduler
    async close() {
        try {
            // Clear all intervals
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }

            if (this.overdueJobCheckInterval) {
                clearInterval(this.overdueJobCheckInterval);
            }

            if (this.immediateJobCheckInterval) {
                clearInterval(this.immediateJobCheckInterval);
            }

            // Stop the cron job
            if (this.scheduleExecutionCron) {
                this.scheduleExecutionCron.stop();
                logger.redis('Schedule execution cron job stopped');
            }

            // Close the queues
            if (this.isRedisAvailable) {
                await this.ledOnQueue.close();
                await this.ledOffQueue.close();
                logger.redis('Redis queues closed');
            }

            return true;
        } catch (error) {
            logger.error('redis', 'Error closing Redis scheduler:', error.message);
            return false;
        }
    }

    // Check Redis connection status
    async checkConnection() {
        if (!this.isRedisAvailable) {
            return { connected: false, message: 'Redis not available' };
        }

        try {
            // Try a simple operation to check connection
            await this.ledOnQueue.getJobCounts();
            return { connected: true, message: 'Redis connected' };
        } catch (error) {
            this.isRedisAvailable = false;
            return { connected: false, message: `Redis error: ${error.message}` };
        }
    }

    // Initialize all schedules
    async initialize() {
        try {
            logger.redis('Initializing Redis Scheduler...');

            // Check connection first
            const connectionStatus = await this.checkConnection();
            if (!connectionStatus.connected) {
                logger.warn('redis', `Not connected to Redis: ${connectionStatus.message}`);
                logger.redis('Using fallback scheduler instead');
                return false;
            }

            // Clear existing jobs
            logger.redis('Clearing existing jobs...');
            const clearedJobs = await this.clearAllJobs();
            logger.redis(`Cleared ${clearedJobs.onJobs + clearedJobs.offJobs} existing jobs`);

            // Schedule all daily jobs
            logger.redis('Scheduling all daily jobs...');
            const jobs = await this.scheduleAllDailySchedules();
            logger.redis(`Successfully scheduled ${jobs.length} jobs`);

            // Set up health check interval
            this.healthCheckInterval = setInterval(() => {
                this.performHealthCheck();
            }, 30000); // Check every 30 seconds

            // Set up check for overdue jobs
            this.overdueJobCheckInterval = setInterval(() => {
                this.checkForOverdueJobs();
            }, 5000); // Check every 5 seconds

            // Set up check for immediate jobs
            this.immediateJobCheckInterval = setInterval(() => {
                this.checkForImmediateJobs();
            }, 1000); // Check every 1 second

            // Set up the schedule execution cron job
            this.setupScheduleExecutionCron();

            logger.redis('Initialization complete');
            return true;
        } catch (error) {
            logger.error('redis', 'Initialization error:', error.message);
            this.isRedisAvailable = false;
            return false;
        }
    }

    // New method to perform health checks on the Redis connection and job processors
    async performHealthCheck() {
        try {
            logger.debug('redis', 'Performing Redis scheduler health check');

            // Check if Redis is available
            if (!this.isRedisAvailable) {
                logger.warn('redis', 'Redis is marked as unavailable, attempting to reconnect');

                try {
                    // Try to ping Redis
                    await this.ledOnQueue.client.ping();

                    // If we get here, Redis is responding
                    logger.info('redis', 'Redis connection restored');
                    this.isRedisAvailable = true;

                    // Re-initialize processors if needed
                    if (!this.overdueJobCheckInterval || !this.immediateJobCheckInterval) {
                        logger.info('redis', 'Re-initializing job processors');
                        this.initializeProcessors();
                    }
                } catch (error) {
                    logger.error('redis', 'Redis reconnection failed:', error.message);
                    return;
                }
            }

            // Check if queues are responsive
            try {
                // Try to get job counts as a basic check
                const onCounts = await this.ledOnQueue.getJobCounts();
                const offCounts = await this.ledOffQueue.getJobCounts();

                logger.debug('redis', 'Queue health check passed', {
                    onQueueCounts: onCounts,
                    offQueueCounts: offCounts
                });

                // Check for any stalled jobs that need recovery
                if (onCounts.active > 0) {
                    const activeJobs = await this.ledOnQueue.getJobs(['active']);
                    for (const job of activeJobs) {
                        const processTime = job.processedOn;
                        if (processTime && (Date.now() - processTime) > 30000) { // 30 seconds stalled
                            logger.warn('redis', `Found stalled active ON job ${job.id}, attempting recovery`);
                            await this.forceExecuteJob(this.ledOnQueue, job.id, true);
                        }
                    }
                }

                if (offCounts.active > 0) {
                    const activeJobs = await this.ledOffQueue.getJobs(['active']);
                    for (const job of activeJobs) {
                        const processTime = job.processedOn;
                        if (processTime && (Date.now() - processTime) > 30000) { // 30 seconds stalled
                            logger.warn('redis', `Found stalled active OFF job ${job.id}, attempting recovery`);
                            await this.forceExecuteJob(this.ledOffQueue, job.id, false);
                        }
                    }
                }

            } catch (error) {
                logger.error('redis', 'Queue health check failed:', error.message);

                // Try to recover
                logger.warn('redis', 'Attempting to recover from queue failure');
                this.isRedisAvailable = false;

                // Close existing connections
                try {
                    await this.ledOnQueue.close();
                    await this.ledOffQueue.close();
                } catch (closeError) {
                    logger.error('redis', 'Error closing queues:', closeError.message);
                }

                // Recreate queues
                try {
                    // Create queues for different types of jobs
                    this.ledOnQueue = new Queue('led-on-jobs', {
                        redis: {
                            host: process.env.REDIS_HOST || 'localhost',
                            port: process.env.REDIS_PORT || 6379,
                            password: process.env.REDIS_PASSWORD || '',
                            maxRetriesPerRequest: 3,
                            enableReadyCheck: false
                        },
                        defaultJobOptions: {
                            removeOnComplete: true,
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 2000,
                            },
                        },
                    });

                    this.ledOffQueue = new Queue('led-off-jobs', {
                        redis: {
                            host: process.env.REDIS_HOST || 'localhost',
                            port: process.env.REDIS_PORT || 6379,
                            password: process.env.REDIS_PASSWORD || '',
                            maxRetriesPerRequest: 3,
                            enableReadyCheck: false
                        },
                        defaultJobOptions: {
                            removeOnComplete: true,
                            attempts: 3,
                            backoff: {
                                type: 'exponential',
                                delay: 2000,
                            },
                        },
                    });

                    // Re-initialize processors
                    this.initializeProcessors();
                    this.isRedisAvailable = true;
                    logger.info('redis', 'Successfully recovered Redis queues');
                } catch (recreateError) {
                    logger.error('redis', 'Failed to recreate queues:', recreateError.message);
                }
            }
        } catch (error) {
            logger.error('redis', 'Health check error:', error.message);
        }
    }

    // Set up a cron job to check and execute schedules every minute
    setupScheduleExecutionCron() {
        try {
            // Run every minute
            this.scheduleExecutionCron = nodeCron.schedule('* * * * *', async () => {
                logger.redis('Running scheduled execution check');

                try {
                    if (!this.isRedisAvailable) {
                        logger.redis('Redis not available, skipping scheduled execution check');
                        return;
                    }

                    // Get current time
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

                    // Get all active daily schedules
                    const schedules = await db.Schedule.findAll({
                        where: {
                            is_active: true,
                            is_daily_schedule: true
                        }
                    });

                    logger.redis(`Checking ${schedules.length} schedules for execution at ${currentTimeString}`);

                    for (const schedule of schedules) {
                        // Check if this schedule should be executed now (ON time)
                        if (schedule.onTime === currentTimeString ||
                            (schedule.on_hour === currentHour && schedule.on_minute === currentMinute)) {

                            logger.redis(`Schedule ${schedule.id} ON time matches current time ${currentTimeString}`, {
                                scheduleId: schedule.id,
                                ledId: schedule.ledId,
                                onTime: schedule.onTime || `${schedule.on_hour}:${schedule.on_minute}`
                            });

                            // Execute ON action immediately
                            try {
                                const result = await arduinoController.setLEDManualOn(schedule.ledId);
                                logger.redis(`Direct execution: Turned ON LED ${schedule.ledId} for schedule ${schedule.id}`, {
                                    result,
                                    timestamp: now.toLocaleString()
                                });

                                // Update last applied timestamp
                                await db.Schedule.update(
                                    { last_applied: now },
                                    { where: { id: schedule.id } }
                                );

                                // Log the execution
                                await db.EventLog.create({
                                    event_type: 'SCHEDULE_EXECUTED',
                                    event_data: JSON.stringify({
                                        scheduleId: schedule.id,
                                        ledId: schedule.ledId,
                                        action: 'ON',
                                        method: 'direct_cron',
                                        result
                                    }),
                                    timestamp: now
                                });
                            } catch (error) {
                                logger.error('redis', `Error executing ON action for schedule ${schedule.id}:`, error.message);
                            }
                        }

                        // Check if this schedule should be executed now (OFF time)
                        if (schedule.offTime === currentTimeString ||
                            (schedule.off_hour === currentHour && schedule.off_minute === currentMinute)) {

                            logger.redis(`Schedule ${schedule.id} OFF time matches current time ${currentTimeString}`, {
                                scheduleId: schedule.id,
                                ledId: schedule.ledId,
                                offTime: schedule.offTime || `${schedule.off_hour}:${schedule.off_minute}`
                            });

                            // Execute OFF action immediately
                            try {
                                const result = await arduinoController.setLEDManualOff(schedule.ledId);
                                logger.redis(`Direct execution: Turned OFF LED ${schedule.ledId} for schedule ${schedule.id}`, {
                                    result,
                                    timestamp: now.toLocaleString()
                                });

                                // Update last applied timestamp
                                await db.Schedule.update(
                                    { last_applied: now },
                                    { where: { id: schedule.id } }
                                );

                                // Log the execution
                                await db.EventLog.create({
                                    event_type: 'SCHEDULE_EXECUTED',
                                    event_data: JSON.stringify({
                                        scheduleId: schedule.id,
                                        ledId: schedule.ledId,
                                        action: 'OFF',
                                        method: 'direct_cron',
                                        result
                                    }),
                                    timestamp: now
                                });
                            } catch (error) {
                                logger.error('redis', `Error executing OFF action for schedule ${schedule.id}:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    logger.error('redis', 'Error in schedule execution cron:', error.message);
                }
            });

            logger.redis('Schedule execution cron job set up successfully');
        } catch (error) {
            logger.error('redis', 'Error setting up schedule execution cron:', error.message);
        }
    }
}

// Create and export a singleton instance
const redisSchedulerService = new RedisSchedulerService();
export default redisSchedulerService; 