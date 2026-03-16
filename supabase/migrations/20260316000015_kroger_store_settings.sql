-- Add Kroger store columns to household_settings.
-- Stores the selected Kroger location for product search so users
-- don't have to re-select their store on each search session.

ALTER TABLE household_settings
  ADD COLUMN kroger_location_id TEXT DEFAULT NULL;

ALTER TABLE household_settings
  ADD COLUMN kroger_location_name TEXT DEFAULT NULL;
