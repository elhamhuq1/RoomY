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
import type { Profile, Household } from "./types/database";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  household: Household | null;
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
        setHousehold(memberData.households as unknown as Household);
      } else {
        setHousehold(null);
      }
    } catch {
      // Profile or household not found -- user may not have completed onboarding
      setProfile(null);
      setHousehold(null);
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
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchProfileAndHousehold(newSession.user.id);
      } else {
        setProfile(null);
        setHousehold(null);
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
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, household, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
