// Energy Logs API Service
import { apiClient } from '../lib/api';
import { EnergyLog, EnergyLogSummary } from '../types/api';

// Check if we're in development mode and should use mock data
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_ENERGY_API;

// Default mock data for energy logs
const MOCK_ENERGY_DATA = {
  logs: Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    deviceId: 1,
    ledId: 2,
    timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
    energyWh: Math.random() * 0.1,
    powerW: Math.random() * 10,
    isActive: Math.random() > 0.5
  })),
  summary: {
    totalEnergyWh: 0.5,
    averagePowerW: 5.2,
    peakPowerW: 12.3,
    activeTimeMinutes: 120,
    costEstimate: 0.06,
    savingsEstimate: 0.03
  }
};

// API endpoints
const ENERGY_API_BASE_URL = '/energy';

// Energy Log interfaces
export interface EnergyLog {
  id: number;
  userId: number;
  deviceId: number;
  ledId: number;
  energyWh: number;
  logDate: string;
  logHour: number;
  createdAt?: string;
  updatedAt?: string;
  // Derived fields for UI display
  deviceName?: string;
  formattedDateTime?: string;
}

// API response interface
interface EnergyLogApiResponse {
  energy_log_id?: number;
  user_id?: number;
  device_id?: number;
  led_id?: number;
  energy_wh?: number;
  log_date?: string;
  log_hour?: number;
  created_at?: string;
  updated_at?: string;
  Device?: {
    device_id: number;
    name: string;
    type: string;
  };
}

// Interface for energy summary
export interface EnergySummary {
  totalEnergyToday: number;
  totalEnergyWeek: number;
  totalEnergyMonth: number;
  costPerKwh: number;
  totalCostToday: number;
  totalCostWeek: number;
  totalCostMonth: number;
  chartData: {
    date: string;
    hour?: number;
    minute?: number;
    energy: number;
    power?: number;
    cost: number;
  }[];
}

// Interface for recent (60-minute) energy data
export interface RecentEnergySummary {
  totalEnergyWh: number;
  totalPowerW: number;
  uniqueDevices: number;
  uniqueLeds: number;
  startTime: string;
  endTime: string;
  minuteData: {
    timestamp: string;
    energyWh: number;
    powerW: number;
  }[];
}

// Interface for API minute data
interface MinuteDataItem {
  timestamp: string;
  energy_wh: number;
  power_w: number;
  device_count: number;
  led_count: number;
}

// Interface for API recent energy data response
interface RecentEnergyApiResponse {
  status: string;
  data: {
    minute_data: MinuteDataItem[];
    total_energy_wh: number;
    total_power_w: number;
    unique_devices: number;
    unique_leds: number;
    start_time: string;
    end_time: string;
  };
}

// Define types for the new API response format
interface DailyEnergyLog {
  date: string;
  totalEnergyWh: number;
  devices: DeviceEnergyLog[];
}

interface DeviceEnergyLog {
  deviceId: number;
  deviceName: string;
  totalEnergyWh: number;
  leds: LedEnergyLog[];
}

interface LedEnergyLog {
  ledId: number;
  totalEnergyWh: number;
}

interface EnergyLogPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AllEnergyLogsResponse {
  status: string;
  data: {
    logs: DailyEnergyLog[];
    pagination: EnergyLogPagination;
  };
}

// Normalize data from API
const normalizeEnergyLog = (log: EnergyLogApiResponse): EnergyLog => {
  const normalizedLog: Partial<EnergyLog> = {
    id: log.energy_log_id,
    userId: log.user_id,
    deviceId: log.device_id,
    ledId: log.led_id,
    energyWh: log.energy_wh,
    logDate: log.log_date,
    logHour: log.log_hour,
    createdAt: log.created_at,
    updatedAt: log.updated_at,
  };

  // Add device name if available
  if (log.Device) {
    normalizedLog.deviceName = log.Device.name;
  }

  // Add formatted date/time for display
  if (normalizedLog.logDate && normalizedLog.logHour !== undefined) {
    const date = new Date(`${normalizedLog.logDate}T${normalizedLog.logHour.toString().padStart(2, '0')}:00:00`);
    normalizedLog.formattedDateTime = date.toLocaleString();
  }

  return normalizedLog as EnergyLog;
};

// Helper to format API response into chart-friendly format
const formatEnergyData = (logs: EnergyLog[], costPerKwh: number = 0.15): EnergySummary => {
  // Calculate today's date in local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate start of week (last 7 days)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calculate start of month (last 30 days)
  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);
  monthStart.setHours(0, 0, 0, 0);

  // Group logs by date and hour
  const logsByDay: Record<string, Record<number, number>> = {};
  
  logs.forEach(log => {
    if (!logsByDay[log.logDate]) {
      logsByDay[log.logDate] = {};
    }
    if (!logsByDay[log.logDate][log.logHour]) {
      logsByDay[log.logDate][log.logHour] = 0;
    }
    logsByDay[log.logDate][log.logHour] += log.energyWh;
  });

  // Calculate totals
  let totalEnergyToday = 0;
  let totalEnergyWeek = 0;
  let totalEnergyMonth = 0;
  
  // Create chart data
  const chartData = Object.keys(logsByDay)
    .sort() // Sort dates
    .flatMap(date => {
      const dateObj = new Date(date);
      const hours = logsByDay[date];
      
      // Sum up energy for this day
      const dailyTotal = Object.values(hours).reduce((sum, energy) => sum + energy, 0);
      
      // Add to period totals
      if (dateObj >= today) {
        totalEnergyToday += dailyTotal;
      }
      if (dateObj >= weekStart) {
        totalEnergyWeek += dailyTotal;
      }
      if (dateObj >= monthStart) {
        totalEnergyMonth += dailyTotal;
      }
      
      // For hourly data, return individual hour entries
      return Object.keys(hours).map(hour => {
        const hourNum = parseInt(hour);
        const energy = hours[hourNum];
        const cost = (energy / 1000) * costPerKwh; // Convert Wh to kWh
        
        return {
          date,
          hour: hourNum,
          energy: energy / 1000, // Convert to kWh for display
          cost
        };
      });
    });

  // Convert Wh to kWh for totals
  totalEnergyToday /= 1000;
  totalEnergyWeek /= 1000;
  totalEnergyMonth /= 1000;
  
  // Calculate costs
  const totalCostToday = totalEnergyToday * costPerKwh;
  const totalCostWeek = totalEnergyWeek * costPerKwh;
  const totalCostMonth = totalEnergyMonth * costPerKwh;

  return {
    totalEnergyToday,
    totalEnergyWeek,
    totalEnergyMonth,
    costPerKwh,
    totalCostToday,
    totalCostWeek,
    totalCostMonth,
    chartData
  };
};

// Helper to format recent (60-minute) energy data response
const formatRecentEnergyData = (apiResponse: RecentEnergyApiResponse, costPerKwh: number = 0.15): RecentEnergySummary => {
  if (!apiResponse || !apiResponse.data) {
    return {
      totalEnergyWh: 0,
      totalPowerW: 0,
      uniqueDevices: 0,
      uniqueLeds: 0,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      minuteData: []
    };
  }

  const data = apiResponse.data;
  
  const minuteData = data.minute_data.map((item: MinuteDataItem) => ({
    timestamp: item.timestamp,
    energyWh: item.energy_wh,
    powerW: item.power_w
  }));

  return {
    totalEnergyWh: data.total_energy_wh || 0,
    totalPowerW: data.total_power_w || 0,
    uniqueDevices: data.unique_devices || 0,
    uniqueLeds: data.unique_leds || 0,
    startTime: data.start_time,
    endTime: data.end_time,
    minuteData
  };
};

// Energy log API service
export const energyLogApi = {
  // Get all energy logs
  getAllEnergyLogs: async (): Promise<EnergyLog[]> => {
    try {
      const response = await apiClient.get<AllEnergyLogsResponse>('/energy');
      
      // The new endpoint returns a different format
      if (response.status === 'success' && response.data && response.data.logs) {
        // Convert the daily data format to our EnergyLog format
        const logs: EnergyLog[] = [];
        
        response.data.logs.forEach(day => {
          if (day.devices && Array.isArray(day.devices)) {
            day.devices.forEach(device => {
              if (device.leds && Array.isArray(device.leds)) {
                device.leds.forEach(led => {
                  logs.push({
                    id: 0, // We don't have specific IDs in this format
                    userId: 0, // We don't have user IDs in this format
                    deviceId: device.deviceId,
                    deviceName: device.deviceName,
                    ledId: led.ledId,
                    energyWh: led.totalEnergyWh,
                    logDate: day.date,
                    logHour: 0, // We don't have hours in this format
                    formattedDateTime: day.date
                  });
                });
              }
            });
          }
        });
        
        return logs;
      }
      
      // Fallback to handle old format if needed
      return [];
    } catch (error) {
      console.error('Error fetching energy logs:', error);
      return [];
    }
  },

  // Get energy logs for a specific device
  getDeviceEnergyLogs: async (deviceId: number): Promise<EnergyLog[]> => {
    try {
      const response = await apiClient.get<EnergyLogApiResponse[]>(`/energy/device/${deviceId}`);
      return response.map(normalizeEnergyLog) || [];
    } catch (error) {
      console.error(`Error fetching energy logs for device ${deviceId}:`, error);
      return [];
    }
  },

  // Get energy summary for all devices
  getEnergySummary: async (costPerKwh: number = 0.15): Promise<EnergySummary> => {
    try {
      const logs = await energyLogApi.getAllEnergyLogs();
      return formatEnergyData(logs, costPerKwh);
    } catch (error) {
      console.error('Error generating energy summary:', error);
      return {
        totalEnergyToday: 0,
        totalEnergyWeek: 0,
        totalEnergyMonth: 0,
        costPerKwh,
        totalCostToday: 0,
        totalCostWeek: 0,
        totalCostMonth: 0,
        chartData: []
      };
    }
  },

  // Get energy summary for a specific device
  getDeviceEnergySummary: async (deviceId: number, costPerKwh: number = 0.15): Promise<EnergySummary> => {
    try {
      const logs = await energyLogApi.getDeviceEnergyLogs(deviceId);
      return formatEnergyData(logs, costPerKwh);
    } catch (error) {
      console.error(`Error generating energy summary for device ${deviceId}:`, error);
      return {
        totalEnergyToday: 0,
        totalEnergyWeek: 0,
        totalEnergyMonth: 0,
        costPerKwh,
        totalCostToday: 0,
        totalCostWeek: 0,
        totalCostMonth: 0,
        chartData: []
      };
    }
  },

  // Get energy logs for a specific LED
  getLedEnergyLogs: async (
    deviceId: number,
    ledId: number,
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit: number = 24
  ): Promise<EnergyLog[]> => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`[MOCK] Getting energy logs for device ${deviceId}, LED ${ledId}`);
        return MOCK_ENERGY_DATA.logs;
      }

      const response = await apiClient.get<EnergyLog[]>(
        `${ENERGY_API_BASE_URL}/device/${deviceId}/led/${ledId}?period=${period}&limit=${limit}`
      );
      
      return response;
    } catch (error) {
      console.error(`Error fetching energy logs for device ${deviceId}, LED ${ledId}:`, error);
      // Return mock data as fallback
      return MOCK_ENERGY_DATA.logs;
    }
  },

  // Get energy summary for a specific LED
  getLedEnergySummary: async (
    deviceId: number,
    ledId: number,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<EnergyLogSummary> => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`[MOCK] Getting energy summary for device ${deviceId}, LED ${ledId}`);
        return MOCK_ENERGY_DATA.summary;
      }

      // First try to get from the summary endpoint
      try {
        const response = await apiClient.get<EnergyLogSummary>(
          `${ENERGY_API_BASE_URL}/device/${deviceId}/led/${ledId}/summary?period=${period}`
        );
        return response;
      } catch (summaryError) {
        // If summary endpoint fails, calculate from logs
        console.warn('Summary endpoint failed, calculating from logs:', summaryError);
        const logs = await getLedEnergyLogs(deviceId, ledId, period);
        
        // Calculate summary from logs
        const totalEnergyWh = logs.reduce((sum, log) => sum + log.energyWh, 0);
        const activeLogs = logs.filter(log => log.isActive);
        const averagePowerW = activeLogs.length > 0 
          ? activeLogs.reduce((sum, log) => sum + log.powerW, 0) / activeLogs.length 
          : 0;
        const peakPowerW = Math.max(...logs.map(log => log.powerW), 0);
        const activeTimeMinutes = activeLogs.length * 60 / logs.length; // Assuming each log represents 60 minutes
        const costEstimate = totalEnergyWh * 0.15 / 1000; // Assuming $0.15 per kWh
        const savingsEstimate = costEstimate * 0.2; // Assuming 20% savings
        
        return {
          totalEnergyWh,
          averagePowerW,
          peakPowerW,
          activeTimeMinutes,
          costEstimate,
          savingsEstimate
        };
      }
    } catch (error) {
      console.error(`Error fetching energy summary for device ${deviceId}, LED ${ledId}:`, error);
      // Return mock data as fallback
      return MOCK_ENERGY_DATA.summary;
    }
  },

  // Get recent (60-minute) energy data for all devices
  getRecentEnergyData: async (): Promise<RecentEnergySummary> => {
    try {
      const response = await apiClient.get<RecentEnergyApiResponse>('/energy/recent');
      return formatRecentEnergyData(response as RecentEnergyApiResponse);
    } catch (error) {
      console.error('Error fetching recent energy data:', error);
      return {
        totalEnergyWh: 0,
        totalPowerW: 0,
        uniqueDevices: 0,
        uniqueLeds: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        minuteData: []
      };
    }
  },

  // Get recent (60-minute) energy data for a specific device
  getDeviceRecentEnergyData: async (deviceId: number): Promise<RecentEnergySummary> => {
    try {
      const response = await apiClient.get<RecentEnergyApiResponse>(`/energy/recent/devices/${deviceId}`);
      return formatRecentEnergyData(response as RecentEnergyApiResponse);
    } catch (error) {
      console.error(`Error fetching recent energy data for device ${deviceId}:`, error);
      return {
        totalEnergyWh: 0,
        totalPowerW: 0,
        uniqueDevices: 0,
        uniqueLeds: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        minuteData: []
      };
    }
  },

  // Get recent (60-minute) energy data for a specific LED
  getLedRecentEnergyData: async (deviceId: number, ledId: number): Promise<RecentEnergySummary> => {
    try {
      const response = await apiClient.get<RecentEnergyApiResponse>(`/energy/recent/devices/${deviceId}/leds/${ledId}`);
      return formatRecentEnergyData(response as RecentEnergyApiResponse);
    } catch (error) {
      console.error(`Error fetching recent energy data for device ${deviceId}, LED ${ledId}:`, error);
      return {
        totalEnergyWh: 0,
        totalPowerW: 0,
        uniqueDevices: 0,
        uniqueLeds: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        minuteData: []
      };
    }
  }
};

export default {
  getLedEnergyLogs: energyLogApi.getLedEnergyLogs,
  getLedEnergySummary: energyLogApi.getLedEnergySummary,
  getAllDevicesEnergyLogs: async (
    period: 'hour' | 'day' | 'week' | 'month' = 'day',
    limit: number = 24
  ): Promise<Record<number, EnergyLog[]>> => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`[MOCK] Getting energy logs for all devices`);
        return { 1: MOCK_ENERGY_DATA.logs };
      }

      const response = await apiClient.get<Record<number, EnergyLog[]>>(
        `${ENERGY_API_BASE_URL}/devices?period=${period}&limit=${limit}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching energy logs for all devices:', error);
      // Return mock data as fallback
      return { 1: MOCK_ENERGY_DATA.logs };
    }
  },

  getAllDevicesEnergySummary: async (
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Record<number, EnergyLogSummary>> => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`[MOCK] Getting energy summary for all devices`);
        return { 1: MOCK_ENERGY_DATA.summary };
      }

      const response = await apiClient.get<Record<number, EnergyLogSummary>>(
        `${ENERGY_API_BASE_URL}/devices/summary?period=${period}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching energy summary for all devices:', error);
      // Return mock data as fallback
      return { 1: MOCK_ENERGY_DATA.summary };
    }
  },
  
  // Add the missing getLedRecentEnergyData method
  getLedRecentEnergyData: energyLogApi.getLedRecentEnergyData
}; 