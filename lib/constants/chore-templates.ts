/**
 * Pre-built chore suggestions organized by room type.
 * Used to populate quick-add suggestions when a user selects a room.
 * Keys match the room_type CHECK constraint values and ROOMS array ids.
 */

export interface ChoreTemplate {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  effortPoints: 1 | 2 | 3;
}

export const CHORE_TEMPLATES: Record<string, ChoreTemplate[]> = {
  kitchen: [
    { name: 'Wash dishes', frequency: 'daily', effortPoints: 1 },
    { name: 'Wipe counters', frequency: 'daily', effortPoints: 1 },
    { name: 'Clean stovetop', frequency: 'weekly', effortPoints: 2 },
    { name: 'Mop floor', frequency: 'weekly', effortPoints: 2 },
    { name: 'Clean oven', frequency: 'monthly', effortPoints: 3 },
  ],
  bathroom: [
    { name: 'Wipe mirror', frequency: 'weekly', effortPoints: 1 },
    { name: 'Clean toilet', frequency: 'weekly', effortPoints: 2 },
    { name: 'Scrub shower', frequency: 'weekly', effortPoints: 2 },
    { name: 'Mop floor', frequency: 'weekly', effortPoints: 2 },
    { name: 'Deep clean', frequency: 'monthly', effortPoints: 3 },
  ],
  living_room: [
    { name: 'Vacuum', frequency: 'weekly', effortPoints: 2 },
    { name: 'Dust surfaces', frequency: 'weekly', effortPoints: 1 },
    { name: 'Clean windows', frequency: 'monthly', effortPoints: 2 },
  ],
  bedroom: [
    { name: 'Make bed', frequency: 'daily', effortPoints: 1 },
    { name: 'Vacuum', frequency: 'weekly', effortPoints: 2 },
    { name: 'Change sheets', frequency: 'weekly', effortPoints: 2 },
    { name: 'Dust', frequency: 'weekly', effortPoints: 1 },
  ],
  laundry: [
    { name: 'Do laundry', frequency: 'weekly', effortPoints: 2 },
    { name: 'Clean lint trap', frequency: 'weekly', effortPoints: 1 },
    { name: 'Wipe machines', frequency: 'monthly', effortPoints: 1 },
  ],
  outdoor: [
    { name: 'Sweep porch', frequency: 'weekly', effortPoints: 1 },
    { name: 'Water plants', frequency: 'daily', effortPoints: 1 },
    { name: 'Mow lawn', frequency: 'weekly', effortPoints: 3 },
    { name: 'Take out trash', frequency: 'daily', effortPoints: 1 },
  ],
  garage: [
    { name: 'Sweep floor', frequency: 'monthly', effortPoints: 1 },
    { name: 'Organize shelves', frequency: 'monthly', effortPoints: 2 },
  ],
  general: [
    { name: 'Take out recycling', frequency: 'weekly', effortPoints: 1 },
    { name: 'Check mail', frequency: 'daily', effortPoints: 1 },
    { name: 'Wipe light switches', frequency: 'monthly', effortPoints: 1 },
  ],
};
