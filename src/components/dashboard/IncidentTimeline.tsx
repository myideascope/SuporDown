import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, FilterIcon } from "lucide-react";

interface Incident {
  id: string;
  serviceName: string;
  startTime: Date;
  endTime: Date | null;
  duration: string;
  severity: "critical" | "major" | "minor";
  status: "resolved" | "ongoing";
  description: string;
}

const IncidentTimeline = ({
  incidents = mockIncidents,
}: {
  incidents?: Incident[];
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [selectedService, setSelectedService] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [view, setView] = useState<"list" | "timeline">("list");

  // Filter incidents based on selected filters
  const filteredIncidents = incidents.filter((incident) => {
    const dateMatches =
      !selectedDate ||
      incident.startTime.toDateString() === selectedDate.toDateString();

    const serviceMatches =
      selectedService === "all" || incident.serviceName === selectedService;

    const severityMatches =
      selectedSeverity === "all" || incident.severity === selectedSeverity;

    return dateMatches && serviceMatches && severityMatches;
  });

  // Get unique service names for the filter dropdown
  const serviceNames = [
    "all",
    ...new Set(incidents.map((incident) => incident.serviceName)),
  ];

  return (
    <Card className="w-full bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Incident Timeline</CardTitle>
        <div className="flex items-center space-x-2">
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as "list" | "timeline")}
          >
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <div className="flex items-center">
            <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Date filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Service filter */}
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              {serviceNames.map((service) => (
                <SelectItem key={service} value={service}>
                  {service === "all" ? "All Services" : service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity filter */}
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="major">Major</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDate(undefined);
              setSelectedService("all");
              setSelectedSeverity("all");
            }}
          >
            Clear Filters
          </Button>
        </div>

        {view === "list" ? (
          <div className="space-y-4">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{incident.serviceName}</h3>
                      <Badge
                        variant={
                          incident.status === "resolved"
                            ? "outline"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {incident.status}
                      </Badge>
                      <Badge
                        variant={
                          {
                            critical: "destructive",
                            major: "default",
                            minor: "secondary",
                          }[incident.severity]
                        }
                        className="text-xs"
                      >
                        {incident.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {incident.description}
                    </p>
                  </div>
                  <div className="text-sm text-right">
                    <div>Started: {format(incident.startTime, "PPp")}</div>
                    {incident.endTime && (
                      <div>Ended: {format(incident.endTime, "PPp")}</div>
                    )}
                    <div className="font-medium">{incident.duration}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No incidents found matching the selected filters.
              </div>
            )}
          </div>
        ) : (
          <div className="relative mt-6 h-[200px]">
            {/* Timeline visualization */}
            <div className="absolute left-0 top-0 h-full w-1 bg-border"></div>

            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((incident, index) => {
                // Calculate position based on index
                const topPosition = `${index * 40}px`;
                const dotColor = {
                  critical: "bg-destructive",
                  major: "bg-amber-500",
                  minor: "bg-blue-500",
                }[incident.severity];

                return (
                  <div
                    key={incident.id}
                    className="absolute left-0 ml-6"
                    style={{ top: topPosition }}
                  >
                    <div
                      className={`absolute -left-[10px] -top-[4px] w-3 h-3 rounded-full ${dotColor}`}
                    ></div>
                    <div className="ml-4 p-2 border rounded-md bg-card shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {incident.serviceName}
                        </span>
                        <Badge
                          variant={
                            {
                              critical: "destructive",
                              major: "default",
                              minor: "secondary",
                            }[incident.severity]
                          }
                          className="text-xs"
                        >
                          {incident.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(incident.startTime, "PPp")}
                        {incident.status === "resolved"
                          ? ` - ${incident.duration}`
                          : " - Ongoing"}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground ml-6">
                No incidents found matching the selected filters.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Mock data for incidents
const mockIncidents: Incident[] = [
  {
    id: "1",
    serviceName: "API Server",
    startTime: new Date(2023, 5, 15, 14, 30),
    endTime: new Date(2023, 5, 15, 16, 45),
    duration: "2h 15m",
    severity: "critical",
    status: "resolved",
    description: "API server was down due to database connection issues.",
  },
  {
    id: "2",
    serviceName: "Web Dashboard",
    startTime: new Date(2023, 5, 16, 9, 15),
    endTime: new Date(2023, 5, 16, 9, 45),
    duration: "30m",
    severity: "minor",
    status: "resolved",
    description: "Brief outage during scheduled maintenance window.",
  },
  {
    id: "3",
    serviceName: "Authentication Service",
    startTime: new Date(2023, 5, 17, 18, 0),
    endTime: null,
    duration: "Ongoing",
    severity: "major",
    status: "ongoing",
    description: "Users unable to log in due to OAuth provider issues.",
  },
  {
    id: "4",
    serviceName: "Database Cluster",
    startTime: new Date(2023, 5, 14, 2, 30),
    endTime: new Date(2023, 5, 14, 4, 15),
    duration: "1h 45m",
    severity: "critical",
    status: "resolved",
    description:
      "Primary database node failure, automatic failover to secondary.",
  },
  {
    id: "5",
    serviceName: "CDN",
    startTime: new Date(2023, 5, 13, 10, 0),
    endTime: new Date(2023, 5, 13, 10, 30),
    duration: "30m",
    severity: "minor",
    status: "resolved",
    description: "Increased latency in Asia-Pacific region.",
  },
];

export default IncidentTimeline;
