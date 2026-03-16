/**
 * Department taxonomy for grocery item categorization.
 * Ordered in typical store-walk order.
 * Icons reference Ionicons names used with @expo/vector-icons.
 */

export interface DepartmentInfo {
  id: string;
  label: string;
  icon: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  { id: 'produce', label: 'Produce', icon: 'leaf' },
  { id: 'dairy', label: 'Dairy', icon: 'water' },
  { id: 'meat', label: 'Meat', icon: 'flame' },
  { id: 'frozen', label: 'Frozen', icon: 'snow' },
  { id: 'bakery', label: 'Bakery', icon: 'pizza' },
  { id: 'beverages', label: 'Beverages', icon: 'cafe' },
  { id: 'snacks', label: 'Snacks', icon: 'fast-food' },
  { id: 'pantry', label: 'Pantry', icon: 'cube' },
  { id: 'household', label: 'Household', icon: 'home' },
  { id: 'other', label: 'Other', icon: 'grid' },
];

/** Lookup map keyed by department id for O(1) access. */
export const DEPARTMENT_MAP: Record<string, DepartmentInfo> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d])
) as Record<string, DepartmentInfo>;
