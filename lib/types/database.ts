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

export interface GroceryItem {
  id: string;
  household_id: string;
  name: string;
  quantity: number;
  is_checked: boolean;
  trip_id: string | null;
  archived_at: string | null;
  created_by: string;
  created_at: string;
}

export interface GroceryTrip {
  id: string;
  household_id: string;
  total_amount: number;
  expense_id: string | null;
  paid_by: string;
  created_by: string;
  completed_at: string;
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
      grocery_items: {
        Row: GroceryItem;
        Insert: Omit<GroceryItem, "id" | "created_at" | "is_checked" | "trip_id" | "archived_at"> & {
          id?: string;
          created_at?: string;
          is_checked?: boolean;
          quantity?: number;
          trip_id?: string | null;
          archived_at?: string | null;
        };
        Update: Partial<Omit<GroceryItem, "id">>;
      };
      grocery_trips: {
        Row: GroceryTrip;
        Insert: Omit<GroceryTrip, "id" | "completed_at" | "expense_id"> & {
          id?: string;
          completed_at?: string;
          expense_id?: string | null;
        };
        Update: Partial<Omit<GroceryTrip, "id">>;
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
      complete_grocery_trip: {
        Args: {
          p_household_id: string;
          p_total_amount: number;
          p_paid_by: string;
          p_split_user_ids: string[];
          p_created_by: string;
        };
        Returns: { trip_id: string; expense_id: string };
      };
    };
  };
}
