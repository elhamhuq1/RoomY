// TypeScript types for all database tables
// Matches column names from supabase/migrations/00001_foundation.sql

export interface Profile {
  id: string;
  display_name: string;
  venmo_username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  invite_code_expires_at: string;
  max_members: number;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: "creator" | "member";
  joined_at: string;
}

export interface HouseholdSettings {
  household_id: string;
  expenses_enabled: boolean;
  groceries_enabled: boolean;
  chores_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Expense {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}

export interface Settlement {
  id: string;
  household_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  created_by: string;
  created_at: string;
}

export interface GroceryList {
  id: string;
  household_id: string;
  name: string;
  status: "active" | "shopping" | "completed";
  shopper_id: string | null;
  total_amount: number | null;
  expense_id: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
}

export interface GroceryItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  notes: string | null;
  is_checked: boolean;
  checked_by: string | null;
  added_by: string;
  created_at: string;
}

export interface Chore {
  id: string;
  household_id: string;
  name: string;
  description: string | null;
  effort_points: number;
  recurrence: "daily" | "weekly" | "biweekly" | "monthly" | "once";
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChoreAssignment {
  id: string;
  chore_id: string;
  assigned_to: string;
  due_date: string;
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

// Supabase Database type for client generic
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      households: {
        Row: Household;
        Insert: Omit<Household, "id" | "created_at" | "invite_code_expires_at"> & {
          id?: string;
          invite_code?: string;
          invite_code_expires_at?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Household, "id">>;
      };
      household_members: {
        Row: HouseholdMember;
        Insert: Omit<HouseholdMember, "id" | "joined_at" | "role"> & {
          id?: string;
          role?: "creator" | "member";
          joined_at?: string;
        };
        Update: Partial<Omit<HouseholdMember, "id">>;
      };
      household_settings: {
        Row: HouseholdSettings;
        Insert: Omit<
          HouseholdSettings,
          "expenses_enabled" | "groceries_enabled" | "chores_enabled" | "updated_at"
        > & {
          expenses_enabled?: boolean;
          groceries_enabled?: boolean;
          chores_enabled?: boolean;
          updated_at?: string;
        };
        Update: Partial<Omit<HouseholdSettings, "household_id">>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Expense, "id">>;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, "id"> & {
          id?: string;
        };
        Update: Partial<Omit<ExpenseSplit, "id">>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Settlement, "id">>;
      };
      grocery_lists: {
        Row: GroceryList;
        Insert: Omit<GroceryList, "id" | "created_at" | "status" | "name"> & {
          id?: string;
          name?: string;
          status?: "active" | "shopping" | "completed";
          created_at?: string;
        };
        Update: Partial<Omit<GroceryList, "id">>;
      };
      grocery_items: {
        Row: GroceryItem;
        Insert: Omit<GroceryItem, "id" | "created_at" | "quantity" | "is_checked"> & {
          id?: string;
          quantity?: number;
          is_checked?: boolean;
          created_at?: string;
        };
        Update: Partial<Omit<GroceryItem, "id">>;
      };
      chores: {
        Row: Chore;
        Insert: Omit<Chore, "id" | "created_at" | "updated_at" | "effort_points" | "recurrence" | "is_active"> & {
          id?: string;
          effort_points?: number;
          recurrence?: "daily" | "weekly" | "biweekly" | "monthly" | "once";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Chore, "id">>;
      };
      chore_assignments: {
        Row: ChoreAssignment;
        Insert: Omit<ChoreAssignment, "id" | "created_at" | "status"> & {
          id?: string;
          status?: "pending" | "completed" | "skipped";
          created_at?: string;
        };
        Update: Partial<Omit<ChoreAssignment, "id">>;
      };
    };
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      join_household_by_code: {
        Args: { code: string };
        Returns: {
          household_id: string;
          household_name: string;
          member_count: number;
        };
      };
      get_household_balances: {
        Args: { p_household_id: string };
        Returns: { user_id: string; net_amount: number }[];
      };
    };
  };
}
