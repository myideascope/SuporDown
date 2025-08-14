import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth helpers
export const signUp = async (
  email: string,
  password: string,
  fullName: string,
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Permission helpers
export const getUserPermissions = async (userId: string) => {
  const { data: userPermissions } = await supabase
    .from("user_permissions")
    .select("permissions(name)")
    .eq("user_id", userId);

  const { data: groupPermissions } = await supabase
    .from("user_groups")
    .select("groups(group_permissions(permissions(name)))")
    .eq("user_id", userId);

  const permissions = new Set<string>();

  userPermissions?.forEach((up: any) => {
    if (up.permissions?.name) permissions.add(up.permissions.name);
  });

  groupPermissions?.forEach((ug: any) => {
    ug.groups?.group_permissions?.forEach((gp: any) => {
      if (gp.permissions?.name) permissions.add(gp.permissions.name);
    });
  });

  return Array.from(permissions);
};

export const hasPermission = (
  userPermissions: string[],
  permission: string,
) => {
  return (
    userPermissions.includes("admin") || userPermissions.includes(permission)
  );
};

// Group management
export const addUserToGroup = async (userId: string, groupId: string) => {
  const { data, error } = await supabase
    .from("user_groups")
    .insert({ user_id: userId, group_id: groupId });
  return { data, error };
};

export const removeUserFromGroup = async (userId: string, groupId: string) => {
  const { error } = await supabase
    .from("user_groups")
    .delete()
    .eq("user_id", userId)
    .eq("group_id", groupId);
  return { error };
};

// User management
export const getAllUsers = async () => {
  const { data, error } = await supabase.from("users").select(`
      *,
      user_groups(
        groups(id, name)
      )
    `);
  return { data, error };
};

export const getAllGroups = async () => {
  const { data, error } = await supabase.from("groups").select("*");
  return { data, error };
};

export const getAllPermissions = async () => {
  const { data, error } = await supabase.from("permissions").select("*");
  return { data, error };
};

// Alert management
export const getAlerts = async () => {
  const { data, error } = await supabase.from("alerts").select("*");
  return { data, error };
};

export const updateAlertStatus = async (alertId: string, enabled: boolean) => {
  const { data, error } = await supabase
    .from("alerts")
    .update({ enabled })
    .eq("id", alertId);
  return { data, error };
};

// Alert dispatcher management
export const getAlertDispatchers = async () => {
  const { data, error } = await supabase.from("alert_dispatchers").select("*");
  return { data, error };
};

export const updateAlertDispatcherStatus = async (
  dispatcherId: string,
  enabled: boolean,
) => {
  const { data, error } = await supabase
    .from("alert_dispatchers")
    .update({ enabled })
    .eq("id", dispatcherId);
  return { data, error };
};

// Subscription management
export const getUserSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select(
      "stripe_customer_id, subscription_status, subscription_id, endpoint_addons, subscription_current_period_end",
    )
    .eq("id", userId)
    .single();
  return { data, error };
};

export const updateUserSubscription = async (
  userId: string,
  subscriptionData: {
    stripe_customer_id?: string;
    subscription_status?: string;
    subscription_id?: string;
    endpoint_addons?: number;
    subscription_current_period_end?: string;
  },
) => {
  const { data, error } = await supabase
    .from("users")
    .update(subscriptionData)
    .eq("id", userId);
  return { data, error };
};

// Service management
export const getUserServices = async (userId: string) => {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
};

export const createService = async (serviceData: {
  user_id: string;
  name: string;
  url: string;
  type: string;
  check_frequency: number;
  timeout: number;
  retry_count: number;
  success_codes: string;
  notify_on_failure: boolean;
}) => {
  const { data, error } = await supabase
    .from("services")
    .insert(serviceData)
    .select()
    .single();
  return { data, error };
};

export const getServiceCount = async (userId: string) => {
  const { count, error } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return { count, error };
};

export const deleteService = async (serviceId: string, userId: string) => {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("user_id", userId);
  return { error };
};

export const updateService = async (
  serviceId: string,
  userId: string,
  serviceData: {
    name?: string;
    url?: string;
    type?: string;
    check_frequency?: number;
    timeout?: number;
    retry_count?: number;
    success_codes?: string;
    notify_on_failure?: boolean;
    enabled?: boolean;
  },
) => {
  const { data, error } = await supabase
    .from("services")
    .update(serviceData)
    .eq("id", serviceId)
    .eq("user_id", userId)
    .select()
    .single();
  return { data, error };
};
