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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceDetailPanel from "./ServiceDetailPanel";
import { useAuth } from "@/contexts/AuthContext";
import { getUserServices } from "@/lib/supabase";

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

const StatusCardGrid = ({ services: propServices }: StatusCardGridProps) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadServices = async () => {
      if (user) {
        setLoading(true);
        const { data } = await getUserServices(user.id);
        if (data) {
          // Transform database services to display format
          const transformedServices = data.map((service) => ({
            id: service.id,
            name: service.name,
            url: service.url,
            status: "healthy" as const, // In real app, this would be calculated
            lastChecked: "2 mins ago", // In real app, this would be calculated
            uptime: 99.9, // In real app, this would be calculated
            responseTime: 120, // In real app, this would be calculated
            enabled: service.enabled,
          }));
          setServices(transformedServices);
        }
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
      <div className="bg-background w-full">
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
      <div className="bg-background w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground">
                Add your first monitoring endpoint to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-background w-full">
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

      {selectedService && (
        <ServiceDetailPanel
          service={selectedService}
          open={detailPanelOpen}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
};

export default StatusCardGrid;
