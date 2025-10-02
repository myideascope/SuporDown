import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Filter,
} from "lucide-react";
import { useServiceMonitoring } from "@/hooks/useServiceMonitoring";

interface Incident {
  id: string;
  service: string;
  title: string;
  description: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "low" | "medium" | "high" | "critical";
  startTime: string;
  endTime?: string;
  duration?: number;
  updates: Array<{
    id: string;
    timestamp: string;
    message: string;
    status: string;
  }>;
}

interface ResponseTimeData {
  timestamp: string;
  time: string;
  [key: string]: string | number; // For dynamic service response times
}

const IncidentTimeline = () => {
  const { services, loading } = useServiceMonitoring();
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [selectedService, setSelectedService] = useState("all");
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  // Generate realistic response time data
  useEffect(() => {
    const generateResponseTimeData = () => {
      const data: ResponseTimeData[] = [];
      const now = new Date();
      const hours = selectedTimeRange === "24h" ? 24 : selectedTimeRange === "7d" ? 168 : 720;
      const interval = selectedTimeRange === "24h" ? 1 : selectedTimeRange === "7d" ? 6 : 24;

      for (let i = hours; i >= 0; i -= interval) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        const dataPoint: ResponseTimeData = {
          timestamp: timestamp.toISOString(),
          time: selectedTimeRange === "24h" 
            ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        };

        // Add response times for each service
        services.forEach(service => {
          const baseTime = service.responseTime || 100;
          const variation = Math.random() * 50 - 25; // ±25ms variation
          const spike = Math.random() < 0.05 ? Math.random() * 200 : 0; // 5% chance of spike
          dataPoint[service.name] = Math.max(10, baseTime + variation + spike);
        });

        data.push(dataPoint);
      }
      return data;
    };

    if (services.length > 0) {
      setResponseTimeData(generateResponseTimeData());
    }
  }, [services, selectedTimeRange]);

  // Generate realistic incidents based on service status
  useEffect(() => {
    const generateIncidents = () => {
      const mockIncidents: Incident[] = [];
      const now = new Date();

      services.forEach((service, index) => {
        // Add ongoing incidents for down services
        if (service.status === 'down') {
          mockIncidents.push({
            id: `incident-${service.id}-current`,
            service: service.name,
            title: `${service.name} Service Outage`,
            description: `${service.name} is currently experiencing connectivity issues. Our team is investigating the root cause.`,
            status: "investigating",
            severity: "high",
            startTime: new Date(now.getTime() - Math.random() * 3600000).toISOString(), // Within last hour
            updates: [
              {
                id: "1",
                timestamp: new Date(now.getTime() - 1800000).toISOString(), // 30 min ago
                message: "We are investigating reports of connectivity issues.",
                status: "investigating"
              },
              {
                id: "2", 
                timestamp: new Date(now.getTime() - 900000).toISOString(), // 15 min ago
                message: "Issue has been identified and our team is working on a fix.",
                status: "identified"
              }
            ]
          });
        }

        // Add recent incidents for degraded services
        if (service.status === 'degraded') {
          mockIncidents.push({
            id: `incident-${service.id}-degraded`,
            service: service.name,
            title: `${service.name} Performance Issues`,
            description: `${service.name} is experiencing slower than normal response times.`,
            status: "monitoring",
            severity: "medium",
            startTime: new Date(now.getTime() - Math.random() * 7200000).toISOString(), // Within last 2 hours
            updates: [
              {
                id: "1",
                timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
                message: "Elevated response times detected. Investigating cause.",
                status: "investigating"
              },
              {
                id: "2",
                timestamp: new Date(now.getTime() - 1800000).toISOString(), // 30 min ago
                message: "Performance improvements implemented. Monitoring closely.",
                status: "monitoring"
              }
            ]
          });
        }

        // Add resolved incidents for all services (historical data)
        const resolvedIncidentCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < resolvedIncidentCount; i++) {
          const startTime = new Date(now.getTime() - Math.random() * 30 * 24 * 3600000); // Within last 30 days
          const duration = Math.random() * 120 + 5; // 5-125 minutes
          const endTime = new Date(startTime.getTime() + duration * 60000);

          mockIncidents.push({
            id: `incident-${service.id}-resolved-${i}`,
            service: service.name,
            title: `${service.name} ${Math.random() < 0.5 ? 'Connectivity' : 'Performance'} Issue`,
            description: `Brief ${Math.random() < 0.5 ? 'outage' : 'performance degradation'} affecting ${service.name}.`,
            status: "resolved",
            severity: Math.random() < 0.3 ? "high" : Math.random() < 0.6 ? "medium" : "low",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: Math.round(duration),
            updates: [
              {
                id: "1",
                timestamp: startTime.toISOString(),
                message: "Issue detected and investigation started.",
                status: "investigating"
              },
              {
                id: "2",
                timestamp: new Date(startTime.getTime() + duration * 60000 * 0.8).toISOString(),
                message: "Root cause identified and fix implemented.",
                status: "identified"
              },
              {
                id: "3",
                timestamp: endTime.toISOString(),
                message: "Service fully restored. Monitoring for stability.",
                status: "resolved"
              }
            ]
          });
        }
      });

      // Sort by start time (newest first)
      return mockIncidents.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    };

    if (services.length > 0) {
      setIncidents(generateIncidents());
    }
  }, [services]);

  const getStatusIcon = (status: Incident["status"]) => {
    switch (status) {
      case "investigating":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "identified":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "monitoring":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getSeverityBadge = (severity: Incident["severity"]) => {
    const variants = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800", 
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[severity]}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const filteredIncidents = incidents.filter(incident => 
    selectedService === "all" || incident.service === selectedService
  );

  const serviceColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00", "#ff00ff"
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Incident Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Incident Timeline & Performance
          </CardTitle>
          <div className="flex gap-2">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Services</option>
              {services.map(service => (
                <option key={service.id} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Incident Timeline</TabsTrigger>
            <TabsTrigger value="performance">Response Time History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Incidents</h3>
                <p className="text-muted-foreground">
                  All services are running smoothly with no reported incidents.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <Card key={incident.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(incident.status)}
                            <h4 className="font-semibold">{incident.title}</h4>
                            {getSeverityBadge(incident.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {incident.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Service: {incident.service}</span>
                            <span>Started: {new Date(incident.startTime).toLocaleString()}</span>
                            {incident.endTime && (
                              <span>Duration: {incident.duration} minutes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {incident.updates.length > 0 && (
                        <div className="mt-4 pl-4 border-l-2 border-muted">
                          <h5 className="text-sm font-medium mb-2">Updates:</h5>
                          <div className="space-y-2">
                            {incident.updates.slice(-2).map((update) => (
                              <div key={update.id} className="text-xs">
                                <span className="text-muted-foreground">
                                  {new Date(update.timestamp).toLocaleString()}
                                </span>
                                <p className="mt-1">{update.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            {responseTimeData.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
                <p className="text-muted-foreground">
                  Response time data will appear here once services are monitored.
                </p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value: number, name: string) => [`${Math.round(value)}ms`, name]}
                    />
                    {services.map((service, index) => (
                      <Line
                        key={service.id}
                        type="monotone"
                        dataKey={service.name}
                        stroke={serviceColors[index % serviceColors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default IncidentTimeline;