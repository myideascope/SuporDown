import React, { useState } from "react";
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

interface Service {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  lastChecked: string;
  uptime: number;
  responseTime: number;
  url: string;
}

interface StatusCardGridProps {
  services?: Service[];
}

const StatusCardGrid = ({
  services = defaultServices,
}: StatusCardGridProps) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

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

// Default mock data
const defaultServices: Service[] = [
  {
    id: "1",
    name: "API Server",
    status: "healthy",
    lastChecked: "2 mins ago",
    uptime: 99.98,
    responseTime: 42,
    url: "https://api.example.com",
  },
  {
    id: "2",
    name: "Database Cluster",
    status: "degraded",
    lastChecked: "5 mins ago",
    uptime: 98.5,
    responseTime: 250,
    url: "https://db.example.com",
  },
  {
    id: "3",
    name: "Authentication Service",
    status: "healthy",
    lastChecked: "1 min ago",
    uptime: 99.99,
    responseTime: 35,
    url: "https://auth.example.com",
  },
  {
    id: "4",
    name: "Storage Server",
    status: "down",
    lastChecked: "10 mins ago",
    uptime: 95.2,
    responseTime: 0,
    url: "https://storage.example.com",
  },
  {
    id: "5",
    name: "Web Frontend",
    status: "healthy",
    lastChecked: "3 mins ago",
    uptime: 99.95,
    responseTime: 65,
    url: "https://www.example.com",
  },
  {
    id: "6",
    name: "Payment Gateway",
    status: "healthy",
    lastChecked: "4 mins ago",
    uptime: 99.9,
    responseTime: 120,
    url: "https://payments.example.com",
  },
];

export default StatusCardGrid;
