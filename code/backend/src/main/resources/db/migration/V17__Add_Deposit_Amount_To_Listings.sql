-- V17: Add deposit_amount column to listings for student rental contracts
ALTER TABLE listings ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12, 2);

