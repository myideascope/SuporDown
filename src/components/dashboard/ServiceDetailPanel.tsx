import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { deleteService } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Bell,
  Check,
  Clock,
  Code,
  Copy,
  ExternalLink,
  LineChart,
  Settings,
  Trash2,
  X,
  Timer,
} from "lucide-react";

interface ServiceDetailPanelProps {
  service?: {
    id: string;
    name: string;
    url: string;
    status: "healthy" | "degraded" | "down";
    uptime: number;
    responseTime: number;
    lastChecked: string;
    checkFrequency: number;
    incidentClass?: "infrastructure" | "application" | "network" | "security" | "maintenance";
    autoResendInterval?: number;
    incidents: Array<{
      id: string;
      date: string;
      duration: number;
      status: "resolved" | "ongoing" | "acknowledged";
      message: string;
      acknowledgedBy?: string;
      acknowledgedAt?: string;
    }>;
  };
  onClose?: () => void;
  onDelete?: (serviceId: string) => void;
}

const ServiceDetailPanel = ({
  service = {
    id: "1",
    name: "API Gateway",
    url: "https://api.example.com/health",
    status: "healthy",
    uptime: 99.98,
    responseTime: 187,
    lastChecked: "2023-06-15T14:30:00Z",
    checkFrequency: 60,
    incidentClass: "infrastructure",
    autoResendInterval: 15,
    incidents: [
      {
        id: "inc-1",
        date: "2023-06-10T08:15:00Z",
        duration: 15,
        status: "resolved",
        message: "Timeout error occurred",
      },
      {
        id: "inc-2",
        date: "2023-06-05T22:30:00Z",
        duration: 45,
        status: "acknowledged",
        message: "Service unavailable",
        acknowledgedBy: "John Doe",
        acknowledgedAt: "2023-06-05T22:35:00Z",
      },
    ],
  },
  onClose,
  onDelete,
}: ServiceDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState("metrics");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [webhookAlerts, setWebhookAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [incidentClass, setIncidentClass] = useState(service.incidentClass || "infrastructure");
  const [autoResendInterval, setAutoResendInterval] = useState(service.autoResendInterval || 15);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission, user } = useAuth();
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "healthy":
        return "default";
      case "degraded":
        return "secondary";
      case "down":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyEmbedCode = () => {
    const code = `<iframe src="https://monitor.example.com/embed/${service.id}" width="250" height="60" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
  };

  const handleDeleteService = async () => {
    if (!user || !hasPermission("edit_alerts")) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteService(service.id, user.id);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Service deleted successfully",
        });
        onDelete?.(service.id);
        onClose?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAcknowledgeIncident = (incidentId: string) => {
    // In real app, this would make an API call
    toast({
      title: "Incident Acknowledged",
      description: "The incident has been acknowledged and notifications paused.",
    });
  };

  const saveIncidentSettings = () => {
    // In real app, this would save to database
    toast({
      title: "Settings Saved",
      description: `Incident class set to ${incidentClass}, auto-resend every ${autoResendInterval} minutes.`,
    });
  };

  return (
    <Card className="w-full max-w-4xl bg-background border shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}
            ></div>
            <CardTitle>{service.name}</CardTitle>
            <Badge variant={getStatusVariant(service.status)} className="ml-2">
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </Badge>
          </div>
          <CardDescription className="mt-1">{service.url}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("edit_alerts") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteService}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          defaultValue="metrics"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="metrics">
              <LineChart className="h-4 w-4 mr-2" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alert Configuration
            </TabsTrigger>
            <TabsTrigger value="embed">
              <Code className="h-4 w-4 mr-2" />
              Status Badge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{service.uptime}%</div>
                  <Progress value={service.uptime} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {service.responseTime} ms
                  </div>
                  <Progress
                    value={
                      service.responseTime < 200
                        ? 100
                        : service.responseTime < 500
                          ? 70
                          : 40
                    }
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Check Frequency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {service.checkFrequency} sec
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last checked: {formatDate(service.lastChecked)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-md">Response Time History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full bg-muted/20 rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">
                    Response time graph would be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-md">Recent Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {service.incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-start gap-4 p-3 rounded-md border"
                    >
                      <AlertCircle
                        className={`h-5 w-5 ${
                          incident.status === "resolved" 
                            ? "text-green-500" 
                            : incident.status === "acknowledged"
                            ? "text-blue-500"
                            : "text-red-500"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">{incident.message}</p>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                incident.status === "resolved"
                                  ? "outline"
                                  : incident.status === "acknowledged"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {incident.status}
                            </Badge>
                            {incident.status === "ongoing" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledgeIncident(incident.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Ack
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(incident.date)}
                          </div>
                          <div>Duration: {incident.duration} minutes</div>
                        </div>
                        {incident.acknowledgedBy && (
                          <div className="text-xs text-blue-600 mt-1">
                            Acknowledged by {incident.acknowledgedBy} at {formatDate(incident.acknowledgedAt!)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Notification Channels</CardTitle>
                <CardDescription>
                  Configure how you want to be notified when this service has an
                  incident
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via email
                    </p>
                  </div>
                  <Switch
                    checked={emailAlerts}
                    onCheckedChange={setEmailAlerts}
                    disabled={!hasPermission("manage_alert_dispatchers")}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via SMS
                    </p>
                  </div>
                  <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts in Slack
                    </p>
                  </div>
                  <Switch
                    checked={slackAlerts}
                    onCheckedChange={setSlackAlerts}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Webhook Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Send alerts to custom webhook
                    </p>
                  </div>
                  <Switch
                    checked={webhookAlerts}
                    onCheckedChange={setWebhookAlerts}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    checked={pushAlerts}
                    onCheckedChange={setPushAlerts}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-md flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Incident Classification & Auto-Resend
                </CardTitle>
                <CardDescription>
                  Configure incident classification and automatic notification resending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incident-class">Incident Class</Label>
                    <Select value={incidentClass} onValueChange={setIncidentClass}>
                      <SelectTrigger id="incident-class">
                        <SelectValue placeholder="Select incident class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="application">Application</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Classifies incidents for filtering and different notification rules
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auto-resend">Auto-Resend Interval</Label>
                    <Select 
                      value={autoResendInterval.toString()} 
                      onValueChange={(value) => setAutoResendInterval(parseInt(value))}
                    >
                      <SelectTrigger id="auto-resend">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Disabled</SelectItem>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                        <SelectItem value="120">Every 2 hours</SelectItem>
                        <SelectItem value="240">Every 4 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      How often to resend notifications until incident is acknowledged or resolved
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveIncidentSettings}
                  disabled={!hasPermission("edit_alerts")}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Save Incident Settings
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-md">Alert Conditions</CardTitle>
                <CardDescription>
                  Define when alerts should be triggered
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status-change">Status Change</Label>
                    <Select defaultValue="any">
                      <SelectTrigger id="status-change">
                        <SelectValue placeholder="Select status change" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any status change</SelectItem>
                        <SelectItem value="down">Only when down</SelectItem>
                        <SelectItem value="degraded">
                          When degraded or down
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="response-time">
                      Response Time Threshold
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="response-time"
                        type="number"
                        defaultValue="500"
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="ml-auto"
                  disabled={!hasPermission("edit_alerts")}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Save Alert Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="embed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Status Badge</CardTitle>
                <CardDescription>
                  Embed a status badge on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-md bg-muted/20 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-background border rounded-md shadow-sm">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}
                    ></div>
                    <span className="font-medium">{service.name}</span>
                    <Badge
                      variant={getStatusVariant(service.status)}
                      className="ml-2"
                    >
                      {service.status.charAt(0).toUpperCase() +
                        service.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={`<iframe src="https://monitor.example.com/embed/${service.id}" width="250" height="60" frameborder="0"></iframe>`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={copyEmbedCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Badge
                </Button>
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ServiceDetailPanel;