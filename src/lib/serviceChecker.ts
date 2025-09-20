import { supabase } from './supabase';

export interface ServiceCheckResult {
  id: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  statusCode?: number;
  error?: string;
  checkedAt: string;
}

export interface ServiceToCheck {
  id: string;
  name: string;
  url: string;
  type: string;
  timeout: number;
  retry_count: number;
  success_codes: string;
  enabled: boolean;
}

// Parse success codes from string to array
const parseSuccessCodes = (codes: string): number[] => {
  return codes.split(',').map(code => parseInt(code.trim())).filter(code => !isNaN(code));
};

// Check HTTP/HTTPS service
const checkHttpService = async (service: ServiceToCheck): Promise<ServiceCheckResult> => {
  const startTime = Date.now();
  const successCodes = parseSuccessCodes(service.success_codes);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout * 1000);
    
    const response = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Uptime-Monitor/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const isSuccess = successCodes.includes(response.status);
    
    return {
      id: service.id,
      status: isSuccess ? 'healthy' : 'degraded',
      responseTime,
      statusCode: response.status,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      id: service.id,
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date().toISOString(),
    };
  }
};

// Check TCP port
const checkTcpService = async (service: ServiceToCheck): Promise<ServiceCheckResult> => {
  const startTime = Date.now();
  
  try {
    // For browser environment, we'll use a simple HTTP check to the host
    // In a real server environment, you'd use actual TCP socket connection
    const url = new URL(service.url);
    const testUrl = `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? 443 : 80)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout * 1000);
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors', // Allow cross-origin requests
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      id: service.id,
      status: 'healthy',
      responseTime,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      id: service.id,
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Connection failed',
      checkedAt: new Date().toISOString(),
    };
  }
};

// Check ping (simplified for browser)
const checkPingService = async (service: ServiceToCheck): Promise<ServiceCheckResult> => {
  const startTime = Date.now();
  
  try {
    // In browser, we simulate ping with a simple HTTP request
    const url = new URL(service.url);
    const testUrl = `${url.protocol}//${url.hostname}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeout * 1000);
    
    await fetch(testUrl, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      id: service.id,
      status: 'healthy',
      responseTime,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      id: service.id,
      status: 'down',
      responseTime,
      error: error instanceof Error ? error.message : 'Ping failed',
      checkedAt: new Date().toISOString(),
    };
  }
};

// Main service checker function
export const checkService = async (service: ServiceToCheck): Promise<ServiceCheckResult> => {
  if (!service.enabled) {
    return {
      id: service.id,
      status: 'down',
      responseTime: 0,
      error: 'Service disabled',
      checkedAt: new Date().toISOString(),
    };
  }

  let result: ServiceCheckResult;
  
  switch (service.type) {
    case 'http':
    case 'https':
    case 'https-ssl':
    case 'api-health':
      result = await checkHttpService(service);
      break;
    case 'tcp':
      result = await checkTcpService(service);
      break;
    case 'ping':
      result = await checkPingService(service);
      break;
    default:
      result = await checkHttpService(service); // Default to HTTP check
  }

  // Apply retry logic if the service is down
  if (result.status === 'down' && service.retry_count > 0) {
    for (let i = 0; i < service.retry_count; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between retries
      const retryResult = await checkHttpService(service);
      if (retryResult.status !== 'down') {
        result = retryResult;
        break;
      }
    }
  }

  return result;
};

// Save check result to database
export const saveCheckResult = async (result: ServiceCheckResult): Promise<void> => {
  try {
    const { error } = await supabase
      .from('service_checks')
      .insert({
        service_id: result.id,
        status: result.status,
        response_time: result.responseTime,
        status_code: result.statusCode,
        error_message: result.error,
        checked_at: result.checkedAt,
      });

    if (error) {
      console.error('Failed to save check result:', error);
    }

    // Update the service's current status
    await supabase
      .from('services')
      .update({
        current_status: result.status,
        last_checked: result.checkedAt,
        last_response_time: result.responseTime,
      })
      .eq('id', result.id);

  } catch (error) {
    console.error('Error saving check result:', error);
  }
};

// Get services that need to be checked
export const getServicesForChecking = async (userId: string): Promise<ServiceToCheck[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) {
      console.error('Failed to get services for checking:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting services for checking:', error);
    return [];
  }
};

// Run checks for all user services
export const runServiceChecks = async (userId: string): Promise<ServiceCheckResult[]> => {
  const services = await getServicesForChecking(userId);
  const results: ServiceCheckResult[] = [];

  for (const service of services) {
    try {
      const result = await checkService(service);
      await saveCheckResult(result);
      results.push(result);
    } catch (error) {
      console.error(`Failed to check service ${service.name}:`, error);
    }
  }

  return results;
};

// Calculate uptime percentage for a service
export const calculateUptime = async (serviceId: string, days: number = 30): Promise<number> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('service_checks')
      .select('status')
      .eq('service_id', serviceId)
      .gte('checked_at', startDate.toISOString());

    if (error || !data || data.length === 0) {
      return 100; // Default to 100% if no data
    }

    const totalChecks = data.length;
    const healthyChecks = data.filter(check => check.status === 'healthy').length;
    
    return Math.round((healthyChecks / totalChecks) * 100 * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Error calculating uptime:', error);
    return 100;
  }
};