-- Database Migration: Add automatic booking completion fields
-- Run this SQL to add the required fields for the automatic booking system

-- Add new columns to bookings table for automatic completion system
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS points_released boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Create indexes for better performance on cron job queries
CREATE INDEX IF NOT EXISTS idx_bookings_auto_complete 
ON bookings(status, end_time) 
WHERE status = 'confirmed' AND cancelled_at IS NULL AND refunded_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_points_release 
ON bookings(status, completed_at, points_released) 
WHERE status = 'completed' AND points_released = false AND refunded_at IS NULL AND disputed = false;

-- Add comments to document the new fields
COMMENT ON COLUMN bookings.completed_at IS 'Timestamp when booking was automatically completed';
COMMENT ON COLUMN bookings.points_released IS 'Whether BlkPoints have been released for this booking';
COMMENT ON COLUMN bookings.disputed IS 'Whether this booking is under dispute';
COMMENT ON COLUMN bookings.refunded_at IS 'Timestamp when booking was refunded';
COMMENT ON COLUMN bookings.cancelled_at IS 'Timestamp when booking was cancelled';

-- Update existing bookings to have proper timestamps if they're already completed
UPDATE bookings 
SET completed_at = updated_at 
WHERE status = 'completed' AND completed_at IS NULL;

-- Ensure all existing bookings have points_released set to false initially
UPDATE bookings 
SET points_released = false 
WHERE points_released IS NULL;
