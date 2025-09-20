import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { runServiceChecks, ServiceCheckResult, calculateUptime } from '@/lib/serviceChecker';
import { getUserServices } from '@/lib/supabase';

export interface ServiceStatus {
  id: string;
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: string;
  uptime: number;
  responseTime: number;
  enabled: boolean;
}

export const useServiceMonitoring = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { user } = useAuth();

  // Load services from database
  const loadServices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data } = await getUserServices(user.id);
      if (data) {
        // Transform database services and calculate uptime for each
        const servicesWithStatus = await Promise.all(
          data.map(async (service) => {
            const uptime = await calculateUptime(service.id);
            return {
              id: service.id,
              name: service.name,
              url: service.url,
              status: (service.current_status as 'healthy' | 'degraded' | 'down') || 'healthy',
              lastChecked: service.last_checked || new Date().toISOString(),
              uptime,
              responseTime: service.last_response_time || 0,
              enabled: service.enabled ?? true,
            };
          })
        );
        setServices(servicesWithStatus);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Run service checks
  const runChecks = useCallback(async () => {
    if (!user) return;

    try {
      const results = await runServiceChecks(user.id);
      
      // Update services with new check results
      setServices(prevServices => 
        prevServices.map(service => {
          const result = results.find(r => r.id === service.id);
          if (result) {
            return {
              ...service,
              status: result.status,
              lastChecked: result.checkedAt,
              responseTime: result.responseTime,
            };
          }
          return service;
        })
      );
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to run service checks:', error);
    }
  }, [user]);

  // Auto-refresh services periodically
  useEffect(() => {
    if (!user) return;

    // Initial load
    loadServices();

    // Set up periodic checking (every 5 minutes)
    const checkInterval = setInterval(() => {
      runChecks();
    }, 5 * 60 * 1000); // 5 minutes

    // Set up periodic reload (every 30 minutes to sync with database)
    const reloadInterval = setInterval(() => {
      loadServices();
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearInterval(checkInterval);
      clearInterval(reloadInterval);
    };
  }, [user, loadServices, runChecks]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await loadServices();
    await runChecks();
  }, [loadServices, runChecks]);

  return {
    services,
    loading,
    lastUpdate,
    refresh,
    runChecks,
  };
};