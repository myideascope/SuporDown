import React, { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

interface QuickAddWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAddService?: (service: ServiceConfig) => void;
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

  const handleInputChange = (
    field: keyof ServiceConfig,
    value: string | number | boolean,
  ) => {
    setServiceConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const { hasPermission } = useAuth();

  const handleSubmit = () => {
    if (!hasPermission("edit_alerts")) return;
    onAddService(serviceConfig);
    onOpenChange(false);
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
  };

  const isFormValid = serviceConfig.name && serviceConfig.url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Add New Monitoring Endpoint
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  placeholder="My Website"
                  value={serviceConfig.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="url">URL / Endpoint</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={serviceConfig.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
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
                    <SelectItem value="http">HTTP/HTTPS</SelectItem>
                    <SelectItem value="tcp">TCP Port</SelectItem>
                    <SelectItem value="ping">Ping</SelectItem>
                    <SelectItem value="dns">DNS</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || !hasPermission("edit_alerts")}
          >
            Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddWidget;
