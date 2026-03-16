-- Add category column to grocery_items for department-based organization
ALTER TABLE grocery_items
  ADD COLUMN category TEXT NOT NULL DEFAULT 'other';

-- Index for efficient grouping queries by category within a household
CREATE INDEX idx_grocery_items_category ON grocery_items (household_id, category);
