// Sensors API Service
import { apiClient, ApiError, ApiResponse } from '../lib/api';
import type { Sensor, CreateSensorRequest, UpdateSensorRequest, EventLog } from '../types/api';

export const sensorsApi = {
  // Get all sensors for current user
  async getAllSensors(): Promise<Sensor[]> {
    try {
      // Updated to handle direct array response
      const sensors = await apiClient.get<Sensor[]>('/sensors');
      return sensors || [];
    } catch (error) {
      console.error('Error fetching sensors in sensorsApi:', error);
      throw error;
    }
  },

  // Get sensor by ID
  async getSensorById(id: number): Promise<Sensor | null> {
    try {
      const response = await apiClient.get<ApiResponse<Sensor>>(`/sensors/${id}`);
      if (response.success) {
        return response.data || null;
      }
      console.warn(`getSensorById(${id}): API call did not indicate success or data missing`, response);
      throw new Error(response.message || response.error || `Failed to fetch sensor ${id}`);
    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`Sensor with ID ${id} not found (404).`);
        return null;
      }
      console.error(`Error fetching sensor ${id} in sensorsApi:`, error);
      throw error;
    }
  },

  // Create new sensor
  async createSensor(sensorData: CreateSensorRequest): Promise<Sensor> {
    try {
      const response = await apiClient.post<ApiResponse<Sensor>>('/sensors', sensorData);
      if (response.success && response.data) {
        return response.data;
      }
      console.error('createSensor: API call did not return success or data missing', response);
      throw new Error(response.message || response.error || 'Failed to create sensor');
    } catch (error) {
      console.error('Error creating sensor in sensorsApi:', error);
      throw error;
    }
  },

  // Update sensor
  async updateSensor(id: number, sensorData: UpdateSensorRequest): Promise<Sensor> {
    try {
      const response = await apiClient.put<ApiResponse<Sensor>>(`/sensors/${id}`, sensorData);
      if (response.success && response.data) {
        return response.data;
      }
      console.error(`updateSensor(${id}): API call did not return success or data missing`, response);
      throw new Error(response.message || response.error || `Failed to update sensor ${id}`);
    } catch (error) {
      console.error(`Error updating sensor ${id} in sensorsApi:`, error);
      throw error;
    }
  },

  // Delete sensor
  async deleteSensor(id: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(`/sensors/${id}`);
    } catch (error) {
      console.error(`Error deleting sensor ${id} in sensorsApi:`, error);
      throw error;
    }
  },

  // Get sensor readings (last N readings)
  async getSensorReadings(id: number, limit: number = 24): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`/sensors/${id}/readings?limit=${limit}`);
      if (response.success) {
        return response.data || []; // Ensure array is returned
      }
      console.warn(`getSensorReadings(${id}): API call did not indicate success or data missing`, response);
      throw new Error(response.message || response.error || `Failed to fetch readings for sensor ${id}`);
    } catch (error) {
      console.error(`Error fetching readings for sensor ${id} in sensorsApi:`, error);
      throw error;
    }
  },

  // Update sensor reading (simulate sensor data)
  async updateSensorReading(id: number, value: number): Promise<Sensor> {
    try {
      const response = await apiClient.patch<ApiResponse<Sensor>>(`/sensors/${id}/reading`, { value });
      if (response.success && response.data) {
        return response.data;
      }
      console.error(`updateSensorReading(${id}): API call did not return success or data missing`, response);
      throw new Error(response.message || response.error || `Failed to update sensor reading for ${id}`);
    } catch (error) {
      console.error(`Error updating sensor reading for ${id} in sensorsApi:`, error);
      throw error;
    }
  }
};
