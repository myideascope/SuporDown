import React, { useState, useEffect } from "react";
import { PlusIcon, XIcon, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createService, getServiceCount } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuickAddWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAddService?: (service: ServiceConfig) => void;
  onClose?: () => void;
}

interface ServiceConfig {
  name: string;
  url: string;
  type: string;
  checkFrequency: number;
  timeout: number;
  retryCount: number;
  successCodes: string;
  notifyOnFailure: boolean;
}

const QuickAddWidget: React.FC<QuickAddWidgetProps> = ({
  open = true,
  onOpenChange = () => {},
  onAddService = () => {},
  onClose = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    name: "",
    url: "",
    type: "http",
    checkFrequency: 5,
    timeout: 30,
    retryCount: 3,
    successCodes: "200,201,204",
    notifyOnFailure: true,
  });
  const [currentServiceCount, setCurrentServiceCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    field: keyof ServiceConfig,
    value: string | number | boolean,
  ) => {
    setServiceConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { hasPermission, user, getEndpointLimit, canAddEndpoint } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadServiceCount = async () => {
      if (user) {
        try {
          const { count } = await getServiceCount(user.id);
          setCurrentServiceCount(count || 0);
        } catch (error) {
          console.error("Failed to load service count:", error);
          setCurrentServiceCount(0);
        }
      }
    };
    loadServiceCount();
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Validate form
    if (!serviceConfig.name.trim() || !serviceConfig.url.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both Service Name and URL fields.",
        variant: "destructive",
      });
      return;
    }

    // Check permissions for authenticated users
    if (user && !hasPermission("edit_alerts")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to add services.",
        variant: "destructive",
      });
      return;
    }

    // Check endpoint limits for authenticated users
    if (user && !canAddEndpoint(currentServiceCount)) {
      toast({
        title: "Endpoint Limit Reached",
        description: `You've reached your limit of ${getEndpointLimit()} endpoints. Upgrade your plan to add more.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // If no user (demo mode), just show success
      if (!user) {
        toast({
          title: "Demo Mode - Service Added!",
          description: `${serviceConfig.name} would be monitored every ${serviceConfig.checkFrequency} minutes in a real environment.`,
        });
        onAddService(serviceConfig);
        handleClose();
        return;
      }

      // Real user - attempt to create service
      const { data, error } = await createService({
        user_id: user.id,
        name: serviceConfig.name,
        url: serviceConfig.url,
        type: serviceConfig.type,
        check_frequency: serviceConfig.checkFrequency,
        timeout: serviceConfig.timeout,
        retry_count: serviceConfig.retryCount,
        success_codes: serviceConfig.successCodes,
        notify_on_failure: serviceConfig.notifyOnFailure,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to add service",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success!",
          description: `${serviceConfig.name} has been added and monitoring will begin shortly.`,
        });
        onAddService(serviceConfig);
        setCurrentServiceCount((prev) => prev + 1);
        handleClose();
      }
    } catch (error) {
      console.error("Error adding service:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while adding the service.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setServiceConfig({
      name: "",
      url: "",
      type: "http",
      checkFrequency: 5,
      timeout: 30,
      retryCount: 3,
      successCodes: "200,201,204",
      notifyOnFailure: true,
    });
    onOpenChange(false);
    onClose();
  };

  const isFormValid = serviceConfig.name.trim() && serviceConfig.url.trim();
  const endpointLimit = getEndpointLimit();
  const canAdd = user ? canAddEndpoint(currentServiceCount) : true; // Allow in demo mode

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Add New Monitoring Endpoint
            </DialogTitle>
          </DialogHeader>

          {user && !canAdd && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You've reached your limit of {endpointLimit} endpoints.
                {endpointLimit === 1
                  ? " Upgrade to Pro to monitor more services."
                  : " Purchase additional endpoint add-ons to monitor more services."}
              </AlertDescription>
            </Alert>
          )}

          {user && (
            <div className="mb-4 text-sm text-muted-foreground">
              Using {currentServiceCount} of {endpointLimit} endpoints
            </div>
          )}

          {!user && (
            <div className="mb-4 text-sm text-blue-600 bg-blue-50 p-2 rounded">
              Demo Mode - Service configuration will be shown but not saved
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    placeholder="My Website"
                    value={serviceConfig.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="url">URL / Endpoint *</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    value={serviceConfig.url}
                    onChange={(e) => handleInputChange("url", e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Monitor Type</Label>
                  <Select
                    value={serviceConfig.type}
                    onValueChange={(value) => handleInputChange("type", value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select monitor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">
                        🌐 HTTP/HTTPS - Web Service
                      </SelectItem>
                      <SelectItem value="https-ssl">
                        🔒 HTTPS + SSL Check
                      </SelectItem>
                      <SelectItem value="tcp">
                        🔌 TCP Port - Service Port
                      </SelectItem>
                      <SelectItem value="ping">
                        📡 ICMP Ping - Network Reachability
                      </SelectItem>
                      <SelectItem value="dns">🌍 DNS Resolution</SelectItem>
                      <SelectItem value="websocket">
                        ⚡ WebSocket Connection
                      </SelectItem>
                      <SelectItem value="database">
                        🗄️ Database Connection
                      </SelectItem>
                      <SelectItem value="api-health">
                        🩺 API Health Endpoint
                      </SelectItem>
                      <SelectItem value="smtp">📧 SMTP Mail Server</SelectItem>
                      <SelectItem value="ftp">📁 FTP/SFTP Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="frequency">Check Frequency (minutes)</Label>
                    <span className="text-sm">
                      {serviceConfig.checkFrequency} min
                    </span>
                  </div>
                  <Slider
                    id="frequency"
                    min={1}
                    max={60}
                    step={1}
                    value={[serviceConfig.checkFrequency]}
                    onValueChange={(value) =>
                      handleInputChange("checkFrequency", value[0])
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="timeout">Timeout (seconds)</Label>
                    <span className="text-sm">{serviceConfig.timeout} sec</span>
                  </div>
                  <Slider
                    id="timeout"
                    min={5}
                    max={120}
                    step={5}
                    value={[serviceConfig.timeout]}
                    onValueChange={(value) =>
                      handleInputChange("timeout", value[0])
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="retries">Retry Count</Label>
                    <span className="text-sm">{serviceConfig.retryCount}</span>
                  </div>
                  <Slider
                    id="retries"
                    min={0}
                    max={10}
                    step={1}
                    value={[serviceConfig.retryCount]}
                    onValueChange={(value) =>
                      handleInputChange("retryCount", value[0])
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="successCodes">Success Status Codes</Label>
                  <Input
                    id="successCodes"
                    placeholder="200,201,204"
                    value={serviceConfig.successCodes}
                    onChange={(e) =>
                      handleInputChange("successCodes", e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of HTTP status codes considered
                    successful
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notify">Enable Notifications</Label>
                  <Switch
                    id="notify"
                    checked={serviceConfig.notifyOnFailure}
                    onCheckedChange={(checked) =>
                      handleInputChange("notifyOnFailure", checked)
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!isFormValid || loading || (user && !canAdd)}
            >
              {loading ? "Adding..." : "Add Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddWidget;