// Event Logs API Service
import { apiClient, ApiResponse, PaginatedResponse } from '../lib/api';
import type { EventLog } from '../types/api';

export interface EventLogFilters {
  eventType?: EventLog['eventType'];
  deviceId?: number;
  sensorId?: number;
  sceneId?: number;
  scheduleId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const eventLogsApi = {
  // Get all event logs with optional filters and pagination
  getAllEventLogs: async (filters: EventLogFilters = {}): Promise<PaginatedResponse<EventLog>> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const endpoint = `/eventlogs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<ApiResponse<PaginatedResponse<EventLog>>>(endpoint);
    return response.data;
  },

  // Get event log by ID
  getEventLogById: async (id: number): Promise<EventLog> => {
    const response = await apiClient.get<ApiResponse<EventLog>>(`/eventlogs/${id}`);
    return response.data;
  },

  // Create new event log (typically done by the system)
  createEventLog: async (eventData: Omit<EventLog, 'id' | 'timestamp'>): Promise<EventLog> => {
    const response = await apiClient.post<ApiResponse<EventLog>>('/eventlogs', eventData);
    return response.data;
  },

  // Delete event log
  deleteEventLog: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/eventlogs/${id}`);
  },

  // Get recent events (last 24 hours by default)
  getRecentEvents: async (hours: number = 24): Promise<EventLog[]> => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (hours * 60 * 60 * 1000));
    
    const response = await eventLogsApi.getAllEventLogs({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 100
    });
    
    return response.data;
  },

  // Get events by type
  getEventsByType: async (eventType: EventLog['eventType'], limit: number = 50): Promise<EventLog[]> => {
    const response = await eventLogsApi.getAllEventLogs({
      eventType,
      limit
    });
    
    return response.data;
  },

  // Get device events
  getDeviceEvents: async (deviceId: number, limit: number = 50): Promise<EventLog[]> => {
    const response = await eventLogsApi.getAllEventLogs({
      deviceId,
      limit
    });
    
    return response.data;
  },

  // Get sensor events
  getSensorEvents: async (sensorId: number, limit: number = 50): Promise<EventLog[]> => {
    const response = await eventLogsApi.getAllEventLogs({
      sensorId,
      limit
    });
    
    return response.data;
  }
};
