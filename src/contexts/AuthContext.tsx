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
    isFirstUser?: boolean,
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshPermissions: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  getEndpointLimit: () => number;
  canAddEndpoint: (currentCount: number) => boolean;
  isAdmin: () => boolean;
  setUserPermissions: (userId: string, permissions: string[]) => Promise<void>;
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

  // Check if this is the first user (for admin setup)
  const checkFirstUser = async () => {
    try {
      // In real app, this would check if any users exist
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      return !data || data.length === 0;
    } catch (error) {
      return false;
    }
  };

  const refreshPermissions = async () => {
    if (user) {
      try {
        const userPermissions = await getUserPermissions(user.id);
        
        // If no permissions found in database but user exists, check if they're the first user
        if (userPermissions.length === 0) {
          // Check if this user was created as the first user (admin)
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .neq('id', user.id)
            .limit(1);
          
          // If no other users exist, this is likely the admin user
          if (!userData || userData.length === 0) {
            // Grant admin permissions for the first user
            setPermissions(["admin", "edit_alerts", "manage_users", "view_reports", "manage_settings"]);
            return;
          }
        }
        
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Failed to load permissions:', error);
        // Fallback: if this is the only user, grant admin permissions
        try {
          const { data: allUsers } = await supabase
            .from('users')
            .select('id')
            .limit(2);
          
          if (allUsers && allUsers.length === 1 && allUsers[0].id === user.id) {
            setPermissions(["admin", "edit_alerts", "manage_users", "view_reports", "manage_settings"]);
          } else {
            setPermissions([]);
          }
        } catch (fallbackError) {
          setPermissions([]);
        }
      }
    } else {
      // Demo mode - provide admin permissions for testing
      setPermissions(["admin", "edit_alerts", "manage_users", "view_reports", "manage_settings"]);
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

  const signUp = async (email: string, password: string, fullName: string, isFirstUser = false) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          is_first_user: isFirstUser,
        },
      },
    });

    // If this is the first user, automatically grant admin permissions
    if (!error && data.user && isFirstUser) {
      try {
        await setUserPermissions(data.user.id, ["admin", "edit_alerts", "manage_users", "view_reports", "manage_settings"]);
      } catch (permError) {
        console.error("Failed to set admin permissions:", permError);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasPermission = (permission: string) => {
    return permissions.includes("admin") || permissions.includes(permission);
  };

  const isAdmin = () => {
    return permissions.includes("admin");
  };

  const setUserPermissions = async (userId: string, newPermissions: string[]) => {
    try {
      // In real app, this would update the database
      // For demo, we'll just update local state if it's the current user
      if (user && user.id === userId) {
        setPermissions(newPermissions);
      }
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      throw new Error("Failed to update permissions");
    }
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
    isAdmin,
    setUserPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};