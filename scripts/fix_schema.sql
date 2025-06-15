-- Add is_daily_schedule column if it doesn't exist
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS is_daily_schedule BOOLEAN NOT NULL DEFAULT FALSE;
-- Add other missing columns for daily schedules if they don't exist
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS led_id INT NULL;
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS on_hour INT NULL;
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS on_minute INT NULL;
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS off_hour INT NULL;
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS off_minute INT NULL;
ALTER TABLE Schedules
ADD COLUMN IF NOT EXISTS last_applied DATETIME NULL;
-- Update Device type ENUM to include arduino
ALTER TABLE Devices
MODIFY COLUMN type ENUM(
        'light',
        'thermostat',
        'security_camera',
        'smart_plug',
        'other',
        'arduino'
    ) NOT NULL;