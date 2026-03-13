// Auth context with Supabase session management
// Source: Supabase Expo social auth quickstart (Pattern 2 from RESEARCH.md)
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  PropsWithChildren,
} from "react";
import { supabase } from "./supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, Household, HouseholdSettings } from "./types/database";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
  householdSettings: HouseholdSettings | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <AuthProvider />");
  }
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdSettings, setHouseholdSettings] =
    useState<HouseholdSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndHousehold = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch household membership and household data
      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id, households(*)")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (memberData?.households) {
        // households is returned as a joined object
        const h = memberData.households as unknown as Household;
        setHousehold(h);

        // Fetch household settings for module toggles
        const { data: settingsData } = await supabase
          .from("household_settings")
          .select("*")
          .eq("household_id", h.id)
          .single();

        if (settingsData) {
          setHouseholdSettings(settingsData as HouseholdSettings);
        } else {
          setHouseholdSettings(null);
        }
      } else {
        setHousehold(null);
        setHouseholdSettings(null);
      }
    } catch {
      // Profile or household not found -- user may not have completed onboarding
      setProfile(null);
      setHousehold(null);
      setHouseholdSettings(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfileAndHousehold(user.id);
    }
  }, [user?.id, fetchProfileAndHousehold]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfileAndHousehold(initialSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Show loading spinner on sign-in to prevent onboarding screen flash
        // while profile/household data is being fetched. Skip for token
        // refreshes so the app doesn't flicker during normal use.
        if (event === "SIGNED_IN") {
          setLoading(true);
        }
        fetchProfileAndHousehold(newSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setHousehold(null);
        setHouseholdSettings(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfileAndHousehold]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setHousehold(null);
    setHouseholdSettings(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, household, householdSettings, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
