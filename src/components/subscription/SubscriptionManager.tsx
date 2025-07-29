import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Plus, Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

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
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // In a real implementation, you would call your backend to create a checkout session
      // For now, we'll simulate the upgrade
      toast({
        title: "Upgrade Simulation",
        description: "In a real app, this would redirect to Stripe checkout",
      });
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
    if (!user) return;

    setLoading(true);
    try {
      // Simulate adding an addon
      toast({
        title: "Add-on Simulation",
        description:
          "In a real app, this would add 5 more endpoints to your plan",
      });
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
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No billing history available yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
