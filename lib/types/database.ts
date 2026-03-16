// TypeScript types for all database tables
// Matches column names from supabase/migrations/00001_foundation.sql

export interface Profile {
  id: string;
  display_name: string;
  venmo_username: string | null;
  avatar_url: string | null;
  expo_push_token: string | null;
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
  kroger_location_id: string | null;
  kroger_location_name: string | null;
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
  unit_price: number | null;
  source: string;
  category: string;
  assigned_to: string | null;
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

export interface Chore {
  id: string;
  household_id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
  custom_interval_days: number | null;
  rotation_order: string[];
  current_assignee_index: number;
  current_assignee: string | null;
  next_due_at: string;
  last_completed_at: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface ChoreCompletion {
  id: string;
  chore_id: string;
  completed_by: string;
  completed_at: string;
  is_disputed: boolean;
  disputed_by: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  is_reverted: boolean;
  reverted_at: string | null;
}

export interface ChoreSwapRequest {
  id: string;
  chore_id: string;
  requested_by: string;
  requested_to: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  resolved_at: string | null;
}

export interface NotificationPreferences {
  user_id: string;
  expenses_enabled: boolean;
  chores_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Supabase Database type for client generic
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at" | "expo_push_token"> & {
          created_at?: string;
          updated_at?: string;
          expo_push_token?: string | null;
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
          "expenses_enabled" | "groceries_enabled" | "chores_enabled" | "updated_at" | "kroger_location_id" | "kroger_location_name"
        > & {
          expenses_enabled?: boolean;
          groceries_enabled?: boolean;
          chores_enabled?: boolean;
          updated_at?: string;
          kroger_location_id?: string | null;
          kroger_location_name?: string | null;
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
        Insert: Omit<GroceryItem, "id" | "created_at" | "is_checked" | "trip_id" | "archived_at" | "unit_price" | "source" | "category" | "assigned_to"> & {
          id?: string;
          created_at?: string;
          is_checked?: boolean;
          quantity?: number;
          trip_id?: string | null;
          archived_at?: string | null;
          unit_price?: number | null;
          source?: string;
          category?: string;
          assigned_to?: string | null;
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
      chores: {
        Row: Chore;
        Insert: Omit<Chore, "id" | "created_at" | "is_active" | "last_completed_at"> & {
          id?: string;
          created_at?: string;
          is_active?: boolean;
          last_completed_at?: string | null;
        };
        Update: Partial<Omit<Chore, "id">>;
      };
      chore_completions: {
        Row: ChoreCompletion;
        Insert: Omit<ChoreCompletion, "id" | "completed_at" | "is_disputed" | "is_reverted"> & {
          id?: string;
          completed_at?: string;
          is_disputed?: boolean;
          disputed_by?: string | null;
          disputed_at?: string | null;
          dispute_reason?: string | null;
          is_reverted?: boolean;
          reverted_at?: string | null;
        };
        Update: Partial<Omit<ChoreCompletion, "id">>;
      };
      chore_swap_requests: {
        Row: ChoreSwapRequest;
        Insert: Omit<ChoreSwapRequest, "id" | "created_at" | "status" | "resolved_at"> & {
          id?: string;
          created_at?: string;
          status?: "pending" | "accepted" | "declined";
          resolved_at?: string | null;
        };
        Update: Partial<Omit<ChoreSwapRequest, "id">>;
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: Omit<NotificationPreferences, "created_at" | "updated_at"> & {
          expenses_enabled?: boolean;
          chores_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<NotificationPreferences, "user_id">>;
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
      get_balances_for_user: {
        Args: { p_household_id: string; p_user_id: string };
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
      complete_grocery_trip_with_receipt: {
        Args: {
          p_household_id: string;
          p_total_amount: number;
          p_paid_by: string;
          p_split_user_ids: string[];
          p_created_by: string;
          p_item_prices?: unknown;
          p_item_assignments?: unknown;
        };
        Returns: { trip_id: string; expense_id: string; split_mode: string };
      };
      complete_chore: {
        Args: { p_chore_id: string; p_completed_by: string };
        Returns: {
          completion_id: string;
          next_assignee: string;
          next_due_at: string;
        };
      };
      claim_chore: {
        Args: { p_chore_id: string; p_claimed_by: string };
        Returns: void;
      };
      dispute_completion: {
        Args: { p_completion_id: string; p_disputed_by: string; p_reason?: string };
        Returns: void;
      };
      resolve_dispute: {
        Args: { p_completion_id: string; p_resolved_by: string; p_action: string };
        Returns: void;
      };
      resolve_swap_request: {
        Args: { p_request_id: string; p_status: string };
        Returns: void;
      };
    };
  };
}
