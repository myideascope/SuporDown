import React, { useState, useEffect, useCallback } from "react";
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
  XCircle,
  Settings,
  CreditCard,
  LogIn,
  LogOut,
  Loader2
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, hasPermission } = useAuth();
  const { services, loading: servicesLoading, lastUpdate, refresh } = useServiceMonitoring();
  const [showLogin, setShowLogin] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Calculate overall system status based on services
  const calculateSystemStatus = useCallback(() => {
    if (services.length === 0) {
      return { status: 'operational', message: 'All systems operational' };
    }

    const downServices = services.filter(s => s.status === 'down').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;

    if (downServices > 0) {
      if (downServices >= services.length / 2) {
        return { status: 'major-outage', message: 'Major service outage detected' };
      } else {
        return { status: 'partial-outage', message: `${downServices} service${downServices > 1 ? 's' : ''} experiencing issues` };
      }
    } else if (degradedServices > 0) {
      return { status: 'degraded-performance', message: `${degradedServices} service${degradedServices > 1 ? 's' : ''} experiencing degraded performance` };
    } else {
      return { status: 'operational', message: 'All systems operational' };
    }
  }, [services]);

  const systemStatus = calculateSystemStatus();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Service Monitor
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, {user.email}
                  </span>
                  {hasPermission("admin") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdmin(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubscription(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Subscription
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLogin(true)}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              )}
              {!user && (
                <Button onClick={() => setShowLogin(true)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Status Banner */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`h-4 w-4 rounded-full ${
                  systemStatus.status === 'operational' ? 'bg-green-500' :
                  systemStatus.status === 'degraded-performance' ? 'bg-yellow-500' :
                  systemStatus.status === 'partial-outage' ? 'bg-orange-500' :
                  'bg-red-500'
                }`} />
                <div>
                  <h2 className="text-lg font-semibold">
                    {systemStatus.status === 'operational' ? 'All Systems Operational' :
                     systemStatus.status === 'degraded-performance' ? 'Degraded Performance' :
                     systemStatus.status === 'partial-outage' ? 'Partial Outage' :
                     'Major Outage'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {systemStatus.message}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Last updated: {lastUpdate?.toLocaleTimeString() || 'Never'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  disabled={servicesLoading}
                  className="mt-2"
                >
                  {servicesLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status Grid */}
        <StatusCardGrid services={services} />

        {/* Incident Timeline */}
        <div className="mt-8">
          <IncidentTimeline />
        </div>
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
}