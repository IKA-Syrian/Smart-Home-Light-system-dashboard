import { apiClient, ApiResponse } from '../lib/api'; // Use the central apiClient
import type { Device, CreateDeviceRequest, UpdateDeviceRequest } from '../types/api'; // Assuming Device type is defined in types/api

// Device types
// Removed local Device interface to use the one from ../types/api

export const devicesApi = {
  // Get all devices
  async getAllDevices(): Promise<Device[]> {
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>('/devices');
      if (response.success) {
        return response.data || []; // Ensure array is returned
      }
      console.warn('getAllDevices: API call did not indicate success or data missing', response);
      throw new Error(response.message || response.error || 'Failed to fetch devices');
    } catch (error) {
      console.error('Error fetching devices in devicesApi:', error);
      throw error;
    }
  },

  // Get devices by room
  async getDevicesByRoom(roomId: number): Promise<Device[]> {
    try {
      const response = await apiClient.get<ApiResponse<Device[]>>(`/rooms/${roomId}/devices`);
      if (response.success) {
        return response.data || []; // Ensure array is returned
      }
      console.warn(`getDevicesByRoom(${roomId}): API call did not indicate success or data missing`, response);
      throw new Error(response.message || response.error || `Failed to fetch devices for room ${roomId}`);
    } catch (error) {
      console.error(`Error fetching devices for room ${roomId} in devicesApi:`, error);
      throw error;
    }
  },

  // Get device by ID
  async getDeviceById(deviceId: number): Promise<Device | null> {
    try {
      const response = await apiClient.get<ApiResponse<Device>>(`/devices/${deviceId}`);
      if (response.success) {
        return response.data || null;
      }
      // If apiClient throws a 404, it will be caught below.
      // This path means success was false for other reasons.
      console.warn(`getDeviceById(${deviceId}): API call success false or data missing`, response);
      throw new Error(response.message || response.error || `Failed to fetch device ${deviceId}`);
    } catch (error: any) {
      // Optionally, specifically handle 404 from ApiError if apiClient throws it as such
      if (error.status === 404) {
        console.warn(`Device with ID ${deviceId} not found (404).`);
        return null;
      }
      console.error(`Error fetching device ${deviceId} in devicesApi:`, error);
      throw error;
    }
  },

  // Get LED devices (type: 'light', 'dimmer', 'strip')
  async getLEDDevices(): Promise<Device[]> {
    try {
      // Corrected to call devicesApi.getAllDevices()
      const devices = await devicesApi.getAllDevices(); 
      return devices.filter(device => device.type === 'light' || device.type === 'dimmer' || device.type === 'strip');
    } catch (error) {
      console.error('Error fetching LED devices in devicesApi:', error);
      throw error;
    }
  },

  // Create new device
  async createDevice(deviceData: CreateDeviceRequest): Promise<Device> {
    try {
      const response = await apiClient.post<ApiResponse<Device>>('/devices', deviceData);
      if (response.success && response.data) {
        return response.data;
      }
      console.error('createDevice: API call did not return success or data missing', response);
      throw new Error(response.message || response.error || 'Failed to create device');
    } catch (error) {
      console.error('Error creating device in devicesApi:', error);
      throw error;
    }
  },

  // Update device
  async updateDevice(deviceId: number, deviceData: UpdateDeviceRequest): Promise<Device> {
    try {
      const response = await apiClient.put<ApiResponse<Device>>(`/devices/${deviceId}`, deviceData);
      if (response.success && response.data) {
        return response.data;
      }
      console.error(`updateDevice(${deviceId}): API call did not return success or data missing`, response);
      throw new Error(response.message || response.error || 'Failed to update device');
    } catch (error) {
      console.error(`Error updating device ${deviceId} in devicesApi:`, error);
      throw error;
    }
  },

  // Delete device
  async deleteDevice(deviceId: number): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<unknown>>(`/devices/${deviceId}`);
    } catch (error) {
      console.error(`Error deleting device ${deviceId} in devicesApi:`, error);
      throw error;
    }
  },
  
  // Map device to LED ID for Arduino control
  getArduinoLEDId(device: Device): number | null {
    const ledMapping: { [key: number]: number } = {
      1: 0, 
      2: 1, 
      3: 2, 
    };
    return ledMapping[device.id] !== undefined ? ledMapping[device.id] : null;
  },

  // Get device by Arduino LED ID
  getDeviceByLEDId(ledId: number): Device | null {
    const deviceMappings: { [key: number]: Partial<Device> & { id: number } } = {
      0: { id: 1, name: 'Living Room LED Controller (Mapped)', type: 'light', roomId: 1 },
      1: { id: 2, name: 'Bedroom LED Controller (Mapped)', type: 'light', roomId: 2 },
      2: { id: 3, name: 'Kitchen LED Controller (Mapped)', type: 'light', roomId: 3 },
    };
    const partialDevice = deviceMappings[ledId];
    return partialDevice ? (partialDevice as Device) : null;
  }
};

// Note: If this file was originally deviceService.ts (singular) and useApi.ts imports 'devicesService' (plural),
// this file should be renamed to frontend/src/services/devicesService.ts

// Ensure no other exports like a 'DeviceService' class or 'deviceService' instance exist.
// The primary export should be devicesApi. 