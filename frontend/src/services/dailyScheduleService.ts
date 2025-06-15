// Daily Schedules API Service
import { apiClient, ApiError } from '../lib/api';

// Daily Schedule interfaces
export interface DailySchedule {
  id: number;
  userId: number;
  deviceId: number;
  ledId: number;
  onHour: number;
  onMinute: number;
  offHour: number;
  offMinute: number;
  isActive: boolean;
  lastApplied?: string;
  createdAt?: string;
  updatedAt?: string;
  // Derived fields for UI display
  deviceName?: string;
  formattedOnTime?: string;
  formattedOffTime?: string;
}

// API response interface
interface DailyScheduleApiResponse {
  schedule_id?: number;
  user_id?: number;
  device_id?: number;
  led_id?: number;
  on_hour?: number;
  on_minute?: number;
  off_hour?: number;
  off_minute?: number;
  is_active?: boolean;
  is_daily_schedule?: boolean;
  last_applied?: string;
  created_at?: string;
  updated_at?: string;
  deviceName?: string;
  Device?: {
    device_id: number;
    name: string;
    type: string;
  };
}

// Generic API response with data
interface ApiDataResponse<T> {
  status?: string;
  data?: T | T[] | { schedules?: T[] };
}

// Wrapper for create/update API response containing a single schedule object
interface ScheduleWrapperResponse {
  data: {
    schedule: DailyScheduleApiResponse;
    arduinoResult?: unknown;
  };
}

// API request interfaces
interface DailyScheduleCreateRequest {
  device_id: number;
  led_id: number;
  on_hour: number;
  on_minute: number;
  off_hour: number;
  off_minute: number;
  is_active: boolean;
  is_daily_schedule: boolean;
}

interface DailyScheduleUpdateRequest {
  on_hour?: number;
  on_minute?: number;
  off_hour?: number;
  off_minute?: number;
  is_active?: boolean;
  is_daily_schedule?: boolean;
}

// Create request interface
export interface CreateDailyScheduleRequest {
  deviceId: number;
  ledId: number;
  onHour: number;
  onMinute: number;
  offHour: number;
  offMinute: number;
  isActive?: boolean;
}

// Update request interface
export interface UpdateDailyScheduleRequest {
  onHour?: number;
  onMinute?: number;
  offHour?: number;
  offMinute?: number;
  isActive?: boolean;
}

// Helper to format time for display (e.g., "08:30 AM")
const formatTime = (hour: number | undefined | null, minute: number | undefined | null): string => {
  // Return a placeholder if hour or minute is null/undefined
  if (hour === null || hour === undefined || minute === null || minute === undefined) {
    return "N/A";
  }
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12; // Convert to 12-hour format
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
};

// Normalize data from API
const normalizeDailySchedule = (schedule: DailyScheduleApiResponse | null | undefined): DailySchedule => {
  // Handle null or undefined schedule
  if (!schedule) {
    return {
      id: 0,
      userId: 0,
      deviceId: 0,
      ledId: 0,
      onHour: 0,
      onMinute: 0,
      offHour: 0,
      offMinute: 0,
      isActive: false,
      formattedOnTime: "N/A",
      formattedOffTime: "N/A"
    };
  }

  const normalizedSchedule: Partial<DailySchedule> = {
    id: schedule.schedule_id || 0,
    userId: schedule.user_id || 0,
    deviceId: schedule.device_id || 0,
    ledId: schedule.led_id || 0,
    onHour: schedule.on_hour || 0,
    onMinute: schedule.on_minute || 0,
    offHour: schedule.off_hour || 0,
    offMinute: schedule.off_minute || 0,
    isActive: !!schedule.is_active,
    lastApplied: schedule.last_applied,
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at,
  };

  // Add device name if available
  if (schedule.Device && schedule.Device.name) {
    normalizedSchedule.deviceName = schedule.Device.name;
  } else if (schedule.deviceName) {
    normalizedSchedule.deviceName = schedule.deviceName;
  } else {
    normalizedSchedule.deviceName = `Device ${normalizedSchedule.deviceId}`;
  }

  // Add formatted times for display
  normalizedSchedule.formattedOnTime = formatTime(normalizedSchedule.onHour, normalizedSchedule.onMinute);
  normalizedSchedule.formattedOffTime = formatTime(normalizedSchedule.offHour, normalizedSchedule.offMinute);

  return normalizedSchedule as DailySchedule;
};

// Process API response in various formats
function processApiResponse<T, R>(
  response: unknown, 
  processor: (item: T) => R
): R[] {
  if (!response) {
    return [];
  }
  
  // Handle array response
  if (Array.isArray(response)) {
    return response.map(item => processor(item as T));
  }
  
  // Handle object with data property
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    
    // Check if it has a data property that is an array
    if ('data' in obj && Array.isArray(obj.data)) {
      return obj.data.map(item => processor(item as T));
    }
    
    // Check for nested data.schedules array
    if ('data' in obj && obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if ('schedules' in data && Array.isArray(data.schedules)) {
        return data.schedules.map(item => processor(item as T));
      }
    }
  }
  
  console.warn('Unexpected API response format:', response);
  return [];
}

// Daily schedule API service
export const dailyScheduleApi = {
  // Get all daily schedules
  getAllDailySchedules: async (): Promise<DailySchedule[]> => {
    try {
      // Get all schedules but filter for is_daily_schedule=true on client side
      const response = await apiClient.get('/schedules');
      return processApiResponse<DailyScheduleApiResponse, DailySchedule>(
        response, 
        normalizeDailySchedule
      );
    } catch (error) {
      console.error('Error fetching daily schedules:', error);
      return [];
    }
  },

  // Get daily schedules for a specific device
  getDeviceDailySchedules: async (deviceId: number): Promise<DailySchedule[]> => {
    try {
      const response = await apiClient.get(`/schedules?deviceId=${deviceId}`);
      return processApiResponse<DailyScheduleApiResponse, DailySchedule>(
        response, 
        normalizeDailySchedule
      );
    } catch (error) {
      console.error(`Error fetching daily schedules for device ${deviceId}:`, error);
      return [];
    }
  },

  // Get a specific daily schedule by ID
  getDailyScheduleById: async (id: number): Promise<DailySchedule | null> => {
    try {
      const response = await apiClient.get(`/schedules/${id}`);
      return normalizeDailySchedule(response as DailyScheduleApiResponse);
    } catch (error) {
      console.error(`Error fetching daily schedule ${id}:`, error);
      return null;
    }
  },

  // Create a new daily schedule
  createDailySchedule: async (scheduleData: CreateDailyScheduleRequest): Promise<DailySchedule> => {
    const serverData: DailyScheduleCreateRequest = {
      device_id: scheduleData.deviceId,
      led_id: scheduleData.ledId,
      on_hour: scheduleData.onHour,
      on_minute: scheduleData.onMinute,
      off_hour: scheduleData.offHour,
      off_minute: scheduleData.offMinute,
      is_active: scheduleData.isActive !== undefined ? scheduleData.isActive : true,
      is_daily_schedule: true
    };

    try {
      const response = await apiClient.post<{ message: string; scheduleId: number; data?: { schedule: DailyScheduleApiResponse } }>('/schedules', serverData);
      
      // Check if response contains the schedule directly
      if (response?.data?.schedule) {
        return normalizeDailySchedule(response.data.schedule);
      }
      
      // Otherwise try to fetch the newly created schedule
      if (response && typeof response.scheduleId === 'number') {
        try {
          const created = await apiClient.get(`/schedules/${response.scheduleId}`);
          return normalizeDailySchedule(created as DailyScheduleApiResponse);
        } catch (fetchError) {
          console.error('Error fetching newly created schedule:', fetchError);
        }
      }
      
      // Fallback: return a minimal object constructed from input
      return {
        id: response?.scheduleId || 0,
        userId: 0,
        deviceId: scheduleData.deviceId,
        ledId: scheduleData.ledId,
        onHour: scheduleData.onHour,
        onMinute: scheduleData.onMinute,
        offHour: scheduleData.offHour,
        offMinute: scheduleData.offMinute,
        isActive: scheduleData.isActive ?? true,
        formattedOnTime: formatTime(scheduleData.onHour, scheduleData.onMinute),
        formattedOffTime: formatTime(scheduleData.offHour, scheduleData.offMinute),
      } as DailySchedule;
    } catch (error) {
      console.error('Error creating daily schedule:', error);
      throw error;
    }
  },

  // Update an existing daily schedule
  updateDailySchedule: async (id: number, scheduleData: UpdateDailyScheduleRequest): Promise<DailySchedule> => {
    // Validate ID
    if (id === undefined || isNaN(id)) {
      throw new ApiError('Invalid daily schedule ID', 400);
    }

    // Convert to snake_case for API
    const serverData: DailyScheduleUpdateRequest = {};
    if (scheduleData.onHour !== undefined) serverData.on_hour = scheduleData.onHour;
    if (scheduleData.onMinute !== undefined) serverData.on_minute = scheduleData.onMinute;
    if (scheduleData.offHour !== undefined) serverData.off_hour = scheduleData.offHour;
    if (scheduleData.offMinute !== undefined) serverData.off_minute = scheduleData.offMinute;
    if (scheduleData.isActive !== undefined) serverData.is_active = scheduleData.isActive;
    // Mark as daily schedule to ensure it's picked up by scheduler
    serverData.is_daily_schedule = true;

    try {
      await apiClient.put<{ message: string }>(`/schedules/${id}`, serverData);
      // Retrieve the updated schedule
      const updated = await apiClient.get(`/schedules/${id}`);
      return normalizeDailySchedule(updated as DailyScheduleApiResponse);
    } catch (error) {
      console.error(`Error updating daily schedule ${id}:`, error);
      throw error;
    }
  },

  // Delete a daily schedule
  deleteDailySchedule: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/schedules/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting daily schedule ${id}:`, error);
      return false;
    }
  },

  // Apply a daily schedule to the Arduino
  applyDailySchedule: async (_id: number): Promise<boolean> => {
    console.warn('applyDailySchedule is deprecated; use applyAllSchedules for all schedules');
    return false;
  },

  // Apply all daily schedules to the Arduino
  applyAllSchedules: async (): Promise<boolean> => {
    try {
      // Use the Arduino controller endpoint to apply schedules
      await apiClient.post('/arduino/schedules/apply');
      return true;
    } catch (error) {
      console.error('Error applying all daily schedules:', error);
      throw error;
    }
  },

  // Clear all daily schedules from the Arduino
  clearAllSchedules: async (): Promise<boolean> => {
    try {
      // Use the Arduino controller endpoint to clear schedules
      await apiClient.post('/arduino/schedules/clear');
      return true;
    } catch (error) {
      console.error('Error clearing all daily schedules:', error);
      throw error;
    }
  }
};