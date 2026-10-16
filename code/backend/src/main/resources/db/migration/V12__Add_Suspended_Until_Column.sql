-- V12: Add suspended_until column to users table and initialize for existing suspended users
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP;

-- Set realistic remaining suspension countdown (approx 6 days, 18 hours 35 minutes)
UPDATE users 
SET suspended_until = NOW() + INTERVAL '6 days 18 hours 35 minutes'
WHERE status = 'SUSPENDED';
