import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceDetailPanel from "./ServiceDetailPanel";
import QuickAddWidget from "./QuickAddWidget";
import { useAuth } from "@/contexts/AuthContext";
import { getUserServices } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SettingsPanel from "@/components/admin/SettingsPanel";

interface Service {
  id: string;
  name: string;
  url: string;
  status: "healthy" | "degraded" | "down";
  lastChecked: string;
  uptime: number;
  responseTime: number;
  enabled: boolean;
}

interface StatusCardGridProps {
  services?: Service[];
}

// Mock services for demo/fallback
const mockServices: Service[] = [
  {
    id: "1",
    name: "Main Website",
    url: "https://example.com",
    status: "healthy",
    lastChecked: "2 mins ago",
    uptime: 99.9,
    responseTime: 120,
    enabled: true,
  },
  {
    id: "2",
    name: "API Server",
    url: "https://api.example.com",
    status: "healthy",
    lastChecked: "1 min ago",
    uptime: 99.8,
    responseTime: 85,
    enabled: true,
  },
  {
    id: "3",
    name: "Database",
    url: "db.example.com:5432",
    status: "degraded",
    lastChecked: "3 mins ago",
    uptime: 98.5,
    responseTime: 250,
    enabled: true,
  },
  {
    id: "4",
    name: "CDN",
    url: "https://cdn.example.com",
    status: "down",
    lastChecked: "5 mins ago",
    uptime: 95.2,
    responseTime: 0,
    enabled: false,
  },
];

const StatusCardGrid = ({ services: propServices }: StatusCardGridProps) => {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadServices = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data } = await getUserServices(user.id);
          if (data && data.length > 0) {
            // Transform database services to display format
            const transformedServices = data.map((service) => ({
              id: service.id,
              name: service.name,
              url: service.url,
              status: "healthy" as const, // In real app, this would be calculated
              lastChecked: "2 mins ago", // In real app, this would be calculated
              uptime: 99.9, // In real app, this would be calculated
              responseTime: 120, // In real app, this would be calculated
              enabled: service.enabled ?? true,
            }));
            setServices(transformedServices);
          } else {
            // Use mock services if no real services exist
            setServices(mockServices);
          }
        } catch (error) {
          console.error("Failed to load services:", error);
          setServices(mockServices);
        } finally {
          setLoading(false);
        }
      } else {
        // Use mock services for demo mode
        setServices(mockServices);
        setLoading(false);
      }
    };

    if (propServices) {
      setServices(propServices);
      setLoading(false);
    } else {
      loadServices();
    }
  }, [user, propServices]);

  const handleCardClick = (service: Service) => {
    setSelectedService(service);
    setDetailPanelOpen(true);
  };

  const handleClosePanel = () => {
    setDetailPanelOpen(false);
    setSelectedService(null);
  };

  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
    setDetailPanelOpen(false);
    setSelectedService(null);
    toast({
      title: "Service Deleted",
      description: "The service has been removed from monitoring.",
    });
  };

  const handleAddService = (newService: any) => {
    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      url: newService.url,
      status: "healthy",
      lastChecked: "Just now",
      uptime: 100,
      responseTime: 0,
      enabled: true,
    };
    setServices((prev) => [service, ...prev]);
    setShowQuickAdd(false);
  };

  const getStatusIcon = (status: Service["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: Service["status"]) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-amber-500">Degraded</Badge>;
      case "down":
        return <Badge className="bg-red-500">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white w-full p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Service Status</h2>
            <p className="text-muted-foreground">
              Monitor the health of your services and endpoints
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission("manage_settings") && (
              <Button
                variant="outline"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            )}
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground">
                Add your first monitoring endpoint to get started.
              </p>
              <Button 
                onClick={() => setShowQuickAdd(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Widget */}
        <QuickAddWidget
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          onAddService={handleAddService}
          onClose={() => setShowQuickAdd(false)}
        />

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            open={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 bg-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Service Status</h2>
          <p className="text-muted-foreground">
            Monitor the health of your services and endpoints
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission("manage_settings") && (
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          )}
          <Button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <Card
            key={service.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(service)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                {getStatusIcon(service.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(service.status)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Uptime:</span>
                  <span className="font-medium">{service.uptime}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Response Time:
                  </span>
                  <span className="font-medium">{service.responseTime} ms</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
              <div className="flex justify-between items-center w-full">
                <span className="text-xs text-muted-foreground">
                  Last checked: {service.lastChecked}
                </span>
                <Button variant="ghost" size="sm" className="p-0">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Quick Add Widget */}
      <QuickAddWidget
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
        onAddService={handleAddService}
        onClose={() => setShowQuickAdd(false)}
      />

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          open={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Service Detail Panel */}
      {selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          open={detailPanelOpen}
          onClose={handleClosePanel}
          onDelete={handleDeleteService}
        />
      )}
    </div>
  );
};

export default StatusCardGrid;