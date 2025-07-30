import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Plus, Check } from "lucide-react";
import {
  stripePromise,
  createCheckoutSession,
  createPortalSession,
  createStripeCustomer,
} from "@/lib/stripe";

interface SubscriptionManagerProps {
  open?: boolean;
  onClose?: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  open = true,
  onClose = () => {},
}) => {
  const { user, subscription, refreshSubscription, getEndpointLimit } =
    useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let customerId = subscription?.stripe_customer_id;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const { data: customerData, error: customerError } =
          await createStripeCustomer(user.id, user.email || "");

        if (customerError || !customerData) {
          throw new Error("Failed to create customer");
        }

        customerId = customerData.customerId;
        await refreshSubscription();
      }

      // Create checkout session for Pro plan
      const { data: sessionData, error: sessionError } =
        await createCheckoutSession({
          customerId,
          priceId: "price_pro_monthly", // Replace with your actual price ID
          successUrl: `${window.location.origin}/?success=true`,
          cancelUrl: `${window.location.origin}/?canceled=true`,
        });

      if (sessionError || !sessionData) {
        throw new Error("Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (sessionData.url) {
        window.location.href = sessionData.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddon = async () => {
    if (!user || !subscription?.stripe_customer_id) return;

    setLoading(true);
    try {
      // Create checkout session for endpoint addon
      const { data: sessionData, error: sessionError } =
        await createCheckoutSession({
          customerId: subscription.stripe_customer_id,
          priceId: "price_endpoint_addon", // Replace with your actual price ID
          successUrl: `${window.location.origin}/?addon_success=true`,
          cancelUrl: `${window.location.origin}/?addon_canceled=true`,
        });

      if (sessionError || !sessionData) {
        throw new Error("Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (sessionData.url) {
        window.location.href = sessionData.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add endpoint addon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentPlan =
    subscription?.subscription_status === "active" ? "Pro" : "Free";
  const endpointLimit = getEndpointLimit();

  return (
    <div className="space-y-6 bg-background p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">
            Manage your SuporDown subscription and endpoint limits
          </p>
        </div>
        <Badge variant={currentPlan === "Pro" ? "default" : "secondary"}>
          {currentPlan} Plan
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Plan Type:</span>
              <Badge variant={currentPlan === "Pro" ? "default" : "secondary"}>
                {currentPlan}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Endpoint Limit:</span>
              <span className="font-medium">{endpointLimit} endpoints</span>
            </div>
            {subscription?.endpoint_addons &&
              subscription.endpoint_addons > 0 && (
                <div className="flex items-center justify-between">
                  <span>Add-ons:</span>
                  <span className="font-medium">
                    {subscription.endpoint_addons} × 5 endpoints
                  </span>
                </div>
              )}
            {subscription?.subscription_current_period_end && (
              <div className="flex items-center justify-between">
                <span>Renews:</span>
                <span className="font-medium">
                  {new Date(
                    subscription.subscription_current_period_end,
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan === "Free" ? (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Pro Plan - $9.99/month</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />1 endpoint
                      included
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Advanced alerting
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Priority support
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Upgrade to Pro"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h4 className="font-medium">Endpoint Add-on - $4.99/month</h4>
                  <p className="text-sm text-muted-foreground">
                    Add 5 more endpoints to your monitoring
                  </p>
                </div>
                <Button
                  onClick={handleAddAddon}
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Add 5 Endpoints"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Billing History
            {subscription?.stripe_customer_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!subscription.stripe_customer_id) return;

                  const { data, error } = await createPortalSession(
                    subscription.stripe_customer_id,
                    window.location.href,
                  );

                  if (data?.url) {
                    window.location.href = data.url;
                  } else {
                    toast({
                      title: "Error",
                      description: "Failed to open billing portal",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Manage Billing
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {subscription?.stripe_customer_id
              ? "Click 'Manage Billing' to view your billing history and manage your subscription."
              : "No billing history available yet."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
