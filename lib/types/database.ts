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
    };
  };
}
