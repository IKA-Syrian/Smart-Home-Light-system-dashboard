/**
 * Validates if a string is a valid cron expression
 * @param {string} cronExpression - The cron expression to validate
 * @returns {boolean} - Whether the expression is valid
 */
export const isValidCronExpression = (cronExpression) => {
    if (!cronExpression) return false;

    // Basic format validation (5 parts)
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) return false;

    // Minutes (0-59)
    if (!/^(\*|\d+)$/.test(parts[0])) return false;
    if (parts[0] !== '*' && (parseInt(parts[0]) < 0 || parseInt(parts[0]) > 59)) return false;

    // Hours (0-23)
    if (!/^(\*|\d+)$/.test(parts[1])) return false;
    if (parts[1] !== '*' && (parseInt(parts[1]) < 0 || parseInt(parts[1]) > 23)) return false;

    // Day of month (1-31)
    if (parts[2] !== '*') return false;

    // Month (1-12)
    if (parts[3] !== '*') return false;

    // Day of week (0-6, 0=Sunday)
    if (parts[4] !== '*') {
        const days = parts[4].split(',');
        for (const day of days) {
            if (!/^\d+$/.test(day) || parseInt(day) < 0 || parseInt(day) > 6) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Calculates the next occurrence time for a daily schedule
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {Date} - The next occurrence time
 */
export const calculateNextOccurrence = (hour, minute) => {
    const now = new Date();
    const nextTime = new Date(now);

    nextTime.setHours(hour, minute, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
};

/**
 * Format time as HH:MM
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {string} - Formatted time string (HH:MM)
 */
export const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}; 