import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "./supabase";

// Initialize Stripe
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

export { stripePromise };

// Create Stripe customer
export const createStripeCustomer = async (userId: string, email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-customer",
      {
        body: { userId, email },
      },
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return { data: null, error };
  }
};

// Create checkout session
export const createCheckoutSession = async ({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-checkout",
      {
        body: {
          customerId,
          priceId,
          successUrl,
          cancelUrl,
        },
      },
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { data: null, error };
  }
};

// Create customer portal session
export const createPortalSession = async (
  customerId: string,
  returnUrl: string,
) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-portal",
      {
        body: { customerId, returnUrl },
      },
    );

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error creating portal session:", error);
    return { data: null, error };
  }
};
