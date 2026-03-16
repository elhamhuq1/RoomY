/**
 * Room taxonomy for chore organization.
 * Ordered logically from most-used to least-used.
 * Icons reference Ionicons names used with @expo/vector-icons.
 * IDs match the room_type CHECK constraint in the rooms table migration.
 */

export interface RoomInfo {
  id: string;
  label: string;
  icon: string;
}

export const ROOMS: RoomInfo[] = [
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant' },
  { id: 'bathroom', label: 'Bathroom', icon: 'water' },
  { id: 'living_room', label: 'Living Room', icon: 'tv' },
  { id: 'bedroom', label: 'Bedroom', icon: 'bed' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt' },
  { id: 'outdoor', label: 'Outdoor', icon: 'leaf' },
  { id: 'garage', label: 'Garage', icon: 'car' },
  { id: 'general', label: 'General', icon: 'grid' },
];

/** Lookup map keyed by room id for O(1) access. */
export const ROOM_MAP: Record<string, RoomInfo> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r])
) as Record<string, RoomInfo>;
