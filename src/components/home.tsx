import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceMonitoring } from "@/hooks/useServiceMonitoring";
import StatusCardGrid from "./dashboard/StatusCardGrid";
import IncidentTimeline from "./dashboard/IncidentTimeline";
import LoginForm from "./auth/LoginForm";
import SubscriptionManager from "./subscription/SubscriptionManager";
import AdminPanel from "./admin/AdminPanel";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  Activity, 
  Shield, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

const Home = () => {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { services, loading: servicesLoading, lastUpdate, refresh } = useServiceMonitoring();
  const [showLogin, setShowLogin] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Calculate overall statistics
  const totalServices = services.length;
  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const degradedServices = services.filter(s => s.status === 'degraded').length;
  const downServices = services.filter(s => s.status === 'down').length;
  const overallUptime = totalServices > 0 
    ? Math.round((services.reduce((sum, s) => sum + s.uptime, 0) / totalServices) * 100) / 100
    : 100;
  const avgResponseTime = totalServices > 0
    ? Math.round(services.reduce((sum, s) => sum + s.responseTime, 0) / totalServices)
    : 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Uptime Monitor
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {lastUpdate && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={servicesLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${servicesLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Welcome, {user.email}
                  </span>
                  {hasPermission("manage_subscription") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSubscription(true)}
                    >
                      Subscription
                    </Button>
                  )}
                  {hasPermission("manage_settings") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdmin(true)}
                    >
                      Admin
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={() => setShowLogin(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        {totalServices > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Services
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServices}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {healthyServices} Healthy
                  </Badge>
                  {degradedServices > 0 && (
                    <Badge variant="outline" className="text-yellow-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {degradedServices} Degraded
                    </Badge>
                  )}
                  {downServices > 0 && (
                    <Badge variant="outline" className="text-red-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      {downServices} Down
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Uptime
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallUptime}%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  Across all services
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {downServices === 0 ? (
                    <span className="text-green-600">Operational</span>
                  ) : downServices < totalServices / 2 ? (
                    <span className="text-yellow-600">Degraded</span>
                  ) : (
                    <span className="text-red-600">Major Outage</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current system health
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Service Status Grid */}
        <div className="mb-8">
          <StatusCardGrid services={services} />
        </div>

        {/* Incident Timeline */}
        {totalServices > 0 && (
          <div className="mb-8">
            <IncidentTimeline />
          </div>
        )}

        {/* Demo Mode Notice */}
        {!user && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">
                    Demo Mode Active
                  </h3>
                  <p className="text-blue-700 text-sm">
                    You're viewing sample monitoring data. Sign in to monitor your own services and receive real alerts.
                  </p>
                  <Button 
                    className="mt-3" 
                    onClick={() => setShowLogin(true)}
                    size="sm"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modals */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <LoginForm onClose={() => setShowLogin(false)} />
          </div>
        </div>
      )}

      {showSubscription && (
        <SubscriptionManager
          open={showSubscription}
          onClose={() => setShowSubscription(false)}
        />
      )}

      {showAdmin && (
        <AdminPanel
          open={showAdmin}
          onClose={() => setShowAdmin(false)}
        />
      )}
    </div>
  );
};

export default Home;