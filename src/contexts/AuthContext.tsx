import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import {
  supabase,
  getUserPermissions,
  getUserSubscription,
} from "@/lib/supabase";

interface SubscriptionInfo {
  stripe_customer_id: string | null;
  subscription_status: string;
  subscription_id: string | null;
  endpoint_addons: number;
  subscription_current_period_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  permissions: string[];
  subscription: SubscriptionInfo | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getEndpointLimit: () => number;
  canAddEndpoint: (currentCount: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const refreshPermissions = async () => {
    if (user) {
      const userPermissions = await getUserPermissions(user.id);
      setPermissions(userPermissions);
    } else {
      setPermissions([]);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      const { data } = await getUserSubscription(user.id);
      setSubscription(data);
    } else {
      setSubscription(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refreshPermissions();
    refreshSubscription();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (permission: string) => {
    return permissions.includes("admin") || permissions.includes(permission);
  };

  const getEndpointLimit = () => {
    if (!subscription) return 3; // Default free tier
    if (subscription.subscription_status === "active") {
      return 3 + subscription.endpoint_addons * 5; // 3 free + 5 per addon
    }
    return 3; // Free tier
  };

  const canAddEndpoint = (currentCount: number) => {
    return currentCount < getEndpointLimit();
  };

  const value = {
    user,
    session,
    permissions,
    subscription,
    loading,
    signIn,
    signUp,
    signOut,
    hasPermission,
    refreshPermissions,
    refreshSubscription,
    getEndpointLimit,
    canAddEndpoint,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
