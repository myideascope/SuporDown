import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
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
import { getUserServices } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SettingsPanel from "@/components/admin/SettingsPanel";
import { useServiceMonitoring } from "@/hooks/useServiceMonitoring";
import { supabase } from "@/lib/supabase";

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

interface DetailedService {
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
}

interface StatusCardGridProps {
  services?: Service[];
}

// Mock services for demo/fallback with more realistic data
const mockServices: Service[] = [
  {
    id: "1",
    name: "Main Website",
    url: "https://example.com",
    status: "healthy",
    lastChecked: new Date(Date.now() - 2 * 60 * 1000).toLocaleString(), // 2 mins ago
    uptime: 99.9,
    responseTime: 120,
    enabled: true,
  },
  {
    id: "2",
    name: "API Server",
    url: "https://api.example.com",
    status: "healthy",
    lastChecked: new Date(Date.now() - 1 * 60 * 1000).toLocaleString(), // 1 min ago
    uptime: 99.8,
    responseTime: 85,
    enabled: true,
  },
  {
    id: "3",
    name: "Database",
    url: "db.example.com:5432",
    status: "degraded",
    lastChecked: new Date(Date.now() - 3 * 60 * 1000).toLocaleString(), // 3 mins ago
    uptime: 98.5,
    responseTime: 450,
    enabled: true,
  },
  {
    id: "4",
    name: "CDN",
    url: "https://cdn.example.com",
    status: "healthy",
    lastChecked: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(), // 5 mins ago
    uptime: 99.2,
    responseTime: 45,
    enabled: true,
  },
];

const StatusCardGrid = ({ services: propServices }: StatusCardGridProps) => {
  const { services: monitoredServices, loading: monitoringLoading, refresh } = useServiceMonitoring();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  // Auto-refresh services every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) {
        refresh();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, loading, refresh]);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      
      if (propServices) {
        // Use provided services (for storybook/demo)
        setServices(propServices);
        setLoading(false);
        return;
      }

      if (user) {
        if (monitoredServices.length > 0) {
          // Use real monitored services data with proper transformation
          const transformedServices = monitoredServices.map((service) => ({
            id: service.id,
            name: service.name,
            url: service.url,
            status: service.status,
            lastChecked: service.lastChecked,
            uptime: Math.round(service.uptime * 100) / 100, // Round to 2 decimal places
            responseTime: Math.round(service.responseTime),
            enabled: service.enabled,
          }));
          setServices(transformedServices);
        } else if (!monitoringLoading) {
          // User has no services yet, show empty state
          setServices([]);
        }
      } else {
        // Demo mode - use mock services with dynamic updates
        const updatedMockServices = mockServices.map(service => ({
          ...service,
          lastChecked: new Date(Date.now() - Math.random() * 5 * 60 * 1000).toLocaleString(),
          responseTime: Math.round(service.responseTime + (Math.random() - 0.5) * 20),
          uptime: Math.round((service.uptime + (Math.random() - 0.5) * 0.2) * 100) / 100,
        }));
        setServices(updatedMockServices);
      }
      
      setLoading(false);
    };

    loadServices();
  }, [user, propServices, monitoredServices, monitoringLoading]);

  const handleCardClick = (service: Service) => {
    // Transform service data to match ServiceDetailPanel expectations
    const detailedService: DetailedService = {
      id: service.id,
      name: service.name,
      url: service.url,
      status: service.status,
      uptime: service.uptime,
      responseTime: service.responseTime,
      lastChecked: new Date().toISOString(),
      checkFrequency: 30, // Default 30 seconds
      incidentClass: "infrastructure",
      autoResendInterval: 15,
      incidents: [
        // Generate mock incidents based on service status
        ...(service.status === "down" ? [{
          id: "1",
          date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          duration: 60,
          status: "ongoing" as const,
          message: `${service.name} is currently down - connection timeout`,
        }] : []),
        ...(service.status === "degraded" ? [{
          id: "2", 
          date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          duration: 15,
          status: "resolved" as const,
          message: `${service.name} experienced high response times`,
        }] : []),
        // Add a resolved incident for healthy services
        {
          id: "3",
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          duration: 5,
          status: "resolved" as const,
          message: `Brief connectivity issue resolved`,
        }
      ],
    };
    
    setSelectedService(detailedService);
    setDetailPanelOpen(true);
  };

  const handleClosePanel = () => {
    setDetailPanelOpen(false);
    setSelectedService(null);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (user) {
      // Delete from database
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        // Refresh services after deletion
        await refresh();
        
        toast({
          title: "Service Deleted",
          description: "The service has been removed from monitoring.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete service. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Demo mode - just remove from local state
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
      toast({
        title: "Service Deleted",
        description: "The service has been removed from monitoring.",
      });
    }
    
    setDetailPanelOpen(false);
    setSelectedService(null);
  };

  const handleAddService = async (newService: any) => {
    if (user) {
      // Add to database
      try {
        const { data, error } = await supabase
          .from('services')
          .insert({
            user_id: user.id,
            name: newService.name,
            url: newService.url,
            type: newService.type || 'http',
            check_frequency: newService.checkFrequency || 60,
            timeout: 30,
            retry_count: 3,
            success_codes: '200,201,202,204',
            notify_on_failure: true,
            enabled: true,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Refresh services after addition
        await refresh();
        
        toast({
          title: "Service Added",
          description: `${newService.name} has been added to monitoring.`,
        });
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to add service. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Demo mode - add to local state
      const service: Service = {
        id: Date.now().toString(),
        name: newService.name,
        url: newService.url,
        status: "healthy",
        lastChecked: new Date().toLocaleString(),
        uptime: 100,
        responseTime: Math.floor(Math.random() * 100 + 50),
        enabled: true,
      };
      setServices((prev) => [service, ...prev]);
      
      toast({
        title: "Service Added",
        description: `${newService.name} has been added to monitoring.`,
      });
    }
    
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
            <h2 className="text-2xl font-bold tracking-tight">
              Service Status
            </h2>
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
              <Button onClick={() => setShowQuickAdd(true)} className="mt-4">
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
      {selectedService && detailPanelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[90vh] overflow-auto">
            <ServiceDetailPanel
              service={selectedService}
              onClose={handleClosePanel}
              onDelete={handleDeleteService}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusCardGrid;