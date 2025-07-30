import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? "",
    );

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (userError || !user) {
          console.error("User not found for customer:", customerId);
          break;
        }

        // Count endpoint addons from subscription items
        let endpointAddons = 0;
        for (const item of subscription.items.data) {
          if (item.price.metadata?.type === "endpoint_addon") {
            endpointAddons += item.quantity || 0;
          }
        }

        // Update user subscription status
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            endpoint_addons: endpointAddons,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000,
            ).toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating user subscription:", updateError);
        } else {
          console.log("Updated subscription for user:", user.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (userError || !user) {
          console.error("User not found for customer:", customerId);
          break;
        }

        // Reset user to free tier
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
            endpoint_addons: 0,
            subscription_current_period_end: null,
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error canceling user subscription:", updateError);
        } else {
          console.log("Canceled subscription for user:", user.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log("Payment succeeded for customer:", customerId);

        // Find user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (userError || !user) {
          console.error("User not found for customer:", customerId);
          break;
        }

        // Ensure subscription is active after successful payment
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: "active",
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating payment status:", updateError);
        } else {
          console.log("Payment confirmed for user:", user.id);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log("Payment failed for customer:", customerId);

        // Find user by Stripe customer ID
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (userError || !user) {
          console.error("User not found for customer:", customerId);
          break;
        }

        // Mark subscription as past_due
        const { error: updateError } = await supabase
          .from("users")
          .update({
            subscription_status: "past_due",
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating payment failure status:", updateError);
        } else {
          console.log("Payment failure recorded for user:", user.id);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
