// Schedules API Service
import { apiClient, ApiError } from '../lib/api';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '../types/api';

// Define interface for API response that might have schedule_id instead of id
interface ScheduleApiResponse extends Partial<Schedule> {
  id?: number;
  schedule_id?: number;
  user_id?: number;
  device_id?: number;
  scene_id?: number;
  cron_expression?: string;
  is_active?: boolean;
  is_daily_schedule?: boolean;
  led_id?: number;
  on_hour?: number;
  on_minute?: number;
  off_hour?: number;
  off_minute?: number;
  created_at?: string;
  updated_at?: string;
  message?: string;
  // Nested objects
  Device?: {
    device_id: number;
    name: string;
    type: string;
  };
  Scene?: {
    scene_id: number;
    name: string;
  };
}

// Cache to avoid duplicate warnings for the same schedule
const warnedSchedules = new Set<string>();

// Helper to normalize schedule data from API
const normalizeSchedule = (schedule: ScheduleApiResponse): Schedule => {
  // Create a copy of the schedule to avoid modifying the original
  const normalizedSchedule: Partial<Schedule> = { ...schedule };
  
  // Map snake_case to camelCase fields
  if (schedule.schedule_id !== undefined) {
    normalizedSchedule.id = schedule.schedule_id;
  }
  
  if (schedule.user_id !== undefined) {
    normalizedSchedule.userId = schedule.user_id;
  }
  
  if (schedule.device_id !== undefined) {
    normalizedSchedule.deviceId = schedule.device_id;
  }
  
  if (schedule.scene_id !== undefined) {
    normalizedSchedule.sceneId = schedule.scene_id;
  }
  
  if (schedule.cron_expression !== undefined) {
    normalizedSchedule.cronExpression = schedule.cron_expression;
  }
  
  if (schedule.is_active !== undefined) {
    normalizedSchedule.isActive = schedule.is_active;
  }

  if (schedule.is_daily_schedule !== undefined) {
    normalizedSchedule.isDailySchedule = schedule.is_daily_schedule;
  }
  
  if (schedule.led_id !== undefined) {
    normalizedSchedule.ledId = schedule.led_id;
  }
  
  if (schedule.on_hour !== undefined) {
    normalizedSchedule.onHour = schedule.on_hour;
  }
  
  if (schedule.on_minute !== undefined) {
    normalizedSchedule.onMinute = schedule.on_minute;
  }
  
  if (schedule.off_hour !== undefined) {
    normalizedSchedule.offHour = schedule.off_hour;
  }
  
  if (schedule.off_minute !== undefined) {
    normalizedSchedule.offMinute = schedule.off_minute;
  }
  
  if (schedule.created_at !== undefined) {
    normalizedSchedule.createdAt = schedule.created_at;
  }
  
  if (schedule.updated_at !== undefined) {
    normalizedSchedule.updatedAt = schedule.updated_at;
  }
  
  // Handle nested objects
  if (schedule.Device) {
    // We might store device info directly on the schedule for display purposes
    normalizedSchedule.deviceName = schedule.Device.name;
    normalizedSchedule.deviceType = schedule.Device.type;
  }
  
  if (schedule.Scene) {
    // We might store scene info directly on the schedule for display purposes
    normalizedSchedule.sceneName = schedule.Scene.name;
  }
  
  // If schedule has no name but has a scene with a name, use "Activate [Scene Name]" as the name
  if (!normalizedSchedule.name && schedule.Scene?.name) {
    normalizedSchedule.name = `Activate ${schedule.Scene.name}`;
  }
  
  // If schedule has no name but has action type "activate_scene", use that info
  if (!normalizedSchedule.name && typeof normalizedSchedule.action === 'string') {
    try {
      const actionObj = JSON.parse(normalizedSchedule.action);
      if (actionObj.type === 'activate_scene' && actionObj.sceneName) {
        normalizedSchedule.name = `Activate ${actionObj.sceneName}`;
      }
    } catch (e) {
      // Not a JSON string, ignore
    }
  }
  
  // Parse action if it's a string to make it an object
  if (typeof normalizedSchedule.action === 'string') {
    try {
      // Skip if the string is empty
      if (!normalizedSchedule.action.trim()) {
        normalizedSchedule.action = { type: 'unknown' };
      }
      // Check if the string starts with { or [ to determine if it's JSON
      else {
        const actionStr = normalizedSchedule.action.trim();
        if ((actionStr.startsWith('{') && actionStr.endsWith('}')) || 
            (actionStr.startsWith('[') && actionStr.endsWith(']'))) {
          normalizedSchedule.action = JSON.parse(actionStr);
        } else {
          // If it's not JSON formatted, create an object with the string as the 'type'
          normalizedSchedule.action = { type: actionStr };
        }
      }
    } catch (e) {
      console.warn(`Failed to parse action JSON for schedule ${normalizedSchedule.id}`, e);
      // Convert to an object with the string as the 'type' if parsing fails
      const actionStr = String(normalizedSchedule.action || '');
      normalizedSchedule.action = { type: actionStr || 'unknown' };
    }
  } else if (normalizedSchedule.action === null || normalizedSchedule.action === undefined) {
    // Set a default action if none is provided
    normalizedSchedule.action = { type: 'unknown' };
  }
  
  // Last resort fallback if still no name
  if (!normalizedSchedule.name) {
    normalizedSchedule.name = normalizedSchedule.sceneId 
      ? `Scene Schedule ${normalizedSchedule.sceneId}`
      : `Device Schedule ${normalizedSchedule.deviceId || 'Unknown'}`;
  }
  
  // If cronExpression is missing, add a default daily schedule at 8 AM
  if (!normalizedSchedule.cronExpression) {
    const scheduleId = normalizedSchedule.id;
    const warnKey = `missing-cron-${scheduleId}`;
    
    // Only log warning once per schedule
    if (!warnedSchedules.has(warnKey)) {
      console.warn(`Missing cronExpression for schedule ${scheduleId}, adding default schedule (8 AM daily)`);
      warnedSchedules.add(warnKey);
    }
    
    normalizedSchedule.cronExpression = '0 8 * * *';
  }
  
  return normalizedSchedule as Schedule;
};

export const schedulesApi = {
  // Get all schedules for current user
  getAllSchedules: async (): Promise<Schedule[]> => {
    try {
      const schedules = await apiClient.get<ScheduleApiResponse[]>('/schedules');
      
      // Normalize schedules data
      const normalizedSchedules = schedules.map(normalizeSchedule);
      
      // Log any schedules that originally had missing cronExpression
      normalizedSchedules.forEach(schedule => {
        if (schedule.cronExpression === '0 8 * * *' && !schedules.find(s => 
          (s.id === schedule.id || s.schedule_id === schedule.id) && s.cronExpression === '0 8 * * *')) {
          
          const scheduleId = schedule.id;
          const warnKey = `all-default-cron-${scheduleId}`;
          
          // Only log warning once per schedule
          if (!warnedSchedules.has(warnKey)) {
            console.warn(`Schedule using default cronExpression: ID=${scheduleId}, Name=${schedule.name || 'Unknown'}`);
            warnedSchedules.add(warnKey);
          }
        }
      });
      
      return normalizedSchedules || [];
    } catch (error) {
      console.error('Error fetching all schedules:', error);
      return []; // Return empty array instead of undefined
    }
  },

  // Get schedule by ID
  getScheduleById: async (id: number): Promise<Schedule | null> => {
    try {
      const schedule = await apiClient.get<ScheduleApiResponse>(`/schedules/${id}`);
      return normalizeSchedule(schedule);
    } catch (error) {
      console.error(`Error fetching schedule ${id}:`, error);
      return null;
    }
  },

  // Create new schedule
  createSchedule: async (scheduleData: CreateScheduleRequest): Promise<Schedule> => {
    // Map client field names to server field names
    const serverData: {
      name: string;
      cron_expression: string;
      device_id?: number;
      scene_id?: number;
      target_device_id?: number;
      target_scene_id?: number;
      action: string;
      is_active?: boolean;
    } = {
      name: scheduleData.name,
      cron_expression: scheduleData.cronExpression,
      action: typeof scheduleData.action === 'object' 
        ? JSON.stringify(scheduleData.action) 
        : scheduleData.action
    };
    
    // Add optional fields if present
    if (scheduleData.deviceId !== undefined) {
      serverData.device_id = scheduleData.deviceId;
      serverData.target_device_id = scheduleData.deviceId;
    }
    
    if (scheduleData.sceneId !== undefined) {
      serverData.scene_id = scheduleData.sceneId;
      serverData.target_scene_id = scheduleData.sceneId;
    }
    
    console.log('Creating schedule with data:', serverData);
    
    try {
      const response = await apiClient.post<ScheduleApiResponse>('/schedules', serverData);
      console.log('Create schedule response:', response);
      return normalizeSchedule(response);
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  },

  // Update schedule
  updateSchedule: async (id: number | undefined, scheduleData: UpdateScheduleRequest): Promise<Schedule> => {
    // Validate ID
    if (id === undefined || isNaN(id)) {
      throw new ApiError('Invalid schedule ID. Cannot update schedule with undefined ID.', 400);
    }
    
    // Map client field names to server field names
    const serverData: {
      name?: string;
      is_active?: boolean;
      cron_expression?: string;
      device_id?: number;
      scene_id?: number;
      target_device_id?: number;
      target_scene_id?: number;
      action?: string;
    } = {};
    
    // Map field names
    if (scheduleData.name !== undefined) serverData.name = scheduleData.name;
    if (scheduleData.isActive !== undefined) serverData.is_active = scheduleData.isActive;
    if (scheduleData.cronExpression !== undefined) serverData.cron_expression = scheduleData.cronExpression;
    
    // Handle both device_id and target_device_id (server might expect either)
    if (scheduleData.deviceId !== undefined) {
      serverData.device_id = scheduleData.deviceId;
      serverData.target_device_id = scheduleData.deviceId;
    }
    
    // Handle both scene_id and target_scene_id (server might expect either)
    if (scheduleData.sceneId !== undefined) {
      serverData.scene_id = scheduleData.sceneId;
      serverData.target_scene_id = scheduleData.sceneId;
    }
    
    // Handle action field - ensure it's a string for the API
    if (scheduleData.action !== undefined) {
      serverData.action = typeof scheduleData.action === 'object' 
        ? JSON.stringify(scheduleData.action) 
        : scheduleData.action;
    }
    
    console.log(`Updating schedule ${id} with data:`, serverData);
    
    try {
      const response = await apiClient.put<ScheduleApiResponse>(`/schedules/${id}`, serverData);
      console.log(`Update schedule response:`, response);
      
      // If the server doesn't return the updated schedule, we need to fetch it
      if (response.message && !response.id && !response.schedule_id) {
        // The server returned only a success message, not the schedule object
        console.log("Server returned success message without schedule data. Fetching updated schedule.");
        
        // Construct a basic schedule object with the known fields
        const constructedSchedule: ScheduleApiResponse = {
          id: id,
          name: serverData.name || 'Unknown Schedule',
          cronExpression: serverData.cron_expression || '0 8 * * *',
          isActive: serverData.is_active !== undefined ? serverData.is_active : true,
          userId: 0, // Default value, will be updated when the schedule is refreshed
          action: serverData.action || '{"type":"on"}',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        if (serverData.device_id) constructedSchedule.deviceId = serverData.device_id;
        if (serverData.scene_id) constructedSchedule.sceneId = serverData.scene_id;
        
        return normalizeSchedule(constructedSchedule);
      }
      
      return normalizeSchedule(response);
    } catch (error) {
      console.error(`Error updating schedule ${id}:`, error);
      throw error;
    }
  },

  // Delete schedule
  deleteSchedule: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`/schedules/${id}`);
  },

  // Toggle schedule active status
  toggleSchedule: async (id: number, isActive: boolean): Promise<Schedule> => {
    return schedulesApi.updateSchedule(id, { isActive });
  },

  // Get schedules for a specific device
  getDeviceSchedules: async (deviceId: number): Promise<Schedule[]> => {
    try {
      const schedules = await apiClient.get<ScheduleApiResponse[]>(`/schedules?deviceId=${deviceId}`);
      
      // Normalize schedules data
      const normalizedSchedules = schedules.map(normalizeSchedule);
      
      // Log any schedules that originally had missing cronExpression
      normalizedSchedules.forEach(schedule => {
        if (schedule.cronExpression === '0 8 * * *' && !schedules.find(s => 
          (s.id === schedule.id || s.schedule_id === schedule.id) && s.cronExpression === '0 8 * * *')) {
          
          const scheduleId = schedule.id;
          const warnKey = `device-default-cron-${deviceId}-${scheduleId}`;
          
          // Only log warning once per device+schedule combination
          if (!warnedSchedules.has(warnKey)) {
            console.warn(`Device schedule using default cronExpression: DeviceID=${deviceId}, ScheduleID=${scheduleId}, Name=${schedule.name || 'Unknown'}`);
            warnedSchedules.add(warnKey);
          }
        }
      });
      
      return normalizedSchedules || [];
    } catch (error) {
      console.error(`Error fetching schedules for device ${deviceId}:`, error);
      return []; // Return empty array instead of undefined
    }
  },

  // Get schedules for a specific scene
  getSceneSchedules: async (sceneId: number): Promise<Schedule[]> => {
    try {
      const schedules = await apiClient.get<ScheduleApiResponse[]>(`/schedules?sceneId=${sceneId}`);
      
      // Normalize schedules data
      const normalizedSchedules = schedules.map(normalizeSchedule);
      
      // Log any schedules that originally had missing cronExpression
      normalizedSchedules.forEach(schedule => {
        if (schedule.cronExpression === '0 8 * * *' && !schedules.find(s => 
          (s.id === schedule.id || s.schedule_id === schedule.id) && s.cronExpression === '0 8 * * *')) {
          
          const scheduleId = schedule.id;
          const warnKey = `scene-default-cron-${sceneId}-${scheduleId}`;
          
          // Only log warning once per scene+schedule combination
          if (!warnedSchedules.has(warnKey)) {
            console.warn(`Scene schedule using default cronExpression: SceneID=${sceneId}, ScheduleID=${scheduleId}, Name=${schedule.name || 'Unknown'}`);
            warnedSchedules.add(warnKey);
          }
        }
      });
      
      return normalizedSchedules || [];
    } catch (error) {
      console.error(`Error fetching schedules for scene ${sceneId}:`, error);
      return []; // Return empty array instead of undefined
    }
  }
};
