import React, { useState, useEffect } from "react";
import {
  Bell,
  Settings,
  User,
  Plus,
  Search,
  LogOut,
  Shield,
  CreditCard,
  Mail,
  MessageSquare,
  Webhook,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";
import StatusCardGrid from "./dashboard/StatusCardGrid";
import IncidentTimeline from "./dashboard/IncidentTimeline";
import QuickAddWidget from "./dashboard/QuickAddWidget";
import SubscriptionManager from "./subscription/SubscriptionManager";
import { getServiceCount } from "@/lib/supabase";

// Alert Configuration Components
const EmailNotificationConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Save to database
    toast({
      title: "Email Configuration Saved",
      description: `Email notifications ${enabled ? "enabled" : "disabled"} for ${email}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4" />
        <h3 className="font-medium">Email Notifications</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-enabled">Enable email alerts</Label>
          <Switch
            id="email-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        {enabled && (
          <div className="space-y-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button size="sm" onClick={handleSave}>
              Save Email Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SMSNotificationConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [phone, setPhone] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Save to database
    toast({
      title: "SMS Configuration Saved",
      description: `SMS notifications ${enabled ? "enabled" : "disabled"} for ${phone}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4" />
        <h3 className="font-medium">SMS Notifications</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-enabled">Enable SMS alerts</Label>
          <Switch
            id="sms-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        {enabled && (
          <div className="space-y-2">
            <Input
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button size="sm" onClick={handleSave}>
              Save SMS Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SlackIntegrationConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Save to database
    toast({
      title: "Slack Integration Saved",
      description: `Slack notifications ${enabled ? "enabled" : "disabled"}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h3 className="font-medium">Slack Integration</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="slack-enabled">Enable Slack alerts</Label>
          <Switch
            id="slack-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        {enabled && (
          <div className="space-y-2">
            <Input
              placeholder="Enter Slack webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button size="sm" onClick={handleSave}>
              Save Slack Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const WebhookIntegrationConfig = () => {
  const [enabled, setEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  const handleSave = () => {
    // TODO: Save to database
    toast({
      title: "Webhook Integration Saved",
      description: `Webhook notifications ${enabled ? "enabled" : "disabled"}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Webhook className="h-4 w-4" />
        <h3 className="font-medium">Webhook Integration</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="webhook-enabled">Enable webhook alerts</Label>
          <Switch
            id="webhook-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        {enabled && (
          <div className="space-y-2">
            <Input
              placeholder="Enter webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Button size="sm" onClick={handleSave}>
              Save Webhook Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Home = () => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [serviceCount, setServiceCount] = useState(0);
  const { user, signOut, hasPermission, subscription, getEndpointLimit } =
    useAuth();

  useEffect(() => {
    const loadServiceCount = async () => {
      if (user) {
        const { count } = await getServiceCount(user.id);
        setServiceCount(count || 0);
      }
    };
    loadServiceCount();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SuporDown</h1>
            <Badge
              variant={
                subscription?.subscription_status === "active"
                  ? "default"
                  : "secondary"
              }
            >
              {subscription?.subscription_status === "active" ? "Pro" : "Free"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {serviceCount}/{getEndpointLimit()} endpoints
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search services..." className="pl-8" />
            </div>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                3
              </span>
            </Button>
            <Button variant="outline" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSubscription(true)}
            >
              <CreditCard className="h-5 w-5" />
            </Button>
            {hasPermission("admin") && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => (window.location.href = "/admin")}
              >
                <Shield className="h-5 w-5" />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor your services and receive alerts when they go down.
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission("edit_alerts") && (
              <Button onClick={() => setShowQuickAdd(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowQuickAdd(true)}>
              <Plus className="mr-2 h-4 w-4" /> Quick Add
            </Button>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          className="space-y-4"
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Services
                  </CardTitle>
                  <div className="h-4 w-4 rounded-full bg-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {getEndpointLimit() - serviceCount} remaining
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Healthy</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">9</div>
                  <p className="text-xs text-muted-foreground">
                    75% of services
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Degraded
                  </CardTitle>
                  <div className="h-4 w-4 rounded-full bg-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    16.7% of services
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Down</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">
                    8.3% of services
                  </p>
                </CardContent>
              </Card>
            </div>

            <StatusCardGrid />
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <IncidentTimeline />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <EmailNotificationConfig />
                  <SMSNotificationConfig />
                  <SlackIntegrationConfig />
                  <WebhookIntegrationConfig />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Quick Add Widget Modal */}
      {showQuickAdd && (
        <QuickAddWidget
          onClose={() => setShowQuickAdd(false)}
          onOpenChange={setShowQuickAdd}
        />
      )}

      {/* Subscription Manager Modal */}
      {showSubscription && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Subscription Management</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubscription(false)}
              >
                ×
              </Button>
            </div>
            <SubscriptionManager onClose={() => setShowSubscription(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
