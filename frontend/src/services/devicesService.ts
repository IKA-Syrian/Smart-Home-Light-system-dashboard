// Devices API Service
import { apiClient, ApiError, ApiResponse } from '../lib/api';
import { websocketService } from '../lib/websocket';
import type { Device, CreateDeviceRequest, UpdateDeviceRequest, UpdateDeviceStateRequest } from '../types/api';

export const devicesApi = {
  // Get all devices for current user
  getAllDevices: async (): Promise<Device[]> => {
    try {
      const devicesData = await apiClient.get<Device[]>('/devices');
      return devicesData || [];
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error fetching all devices (status: ${error.status}):`, error.message);
        throw new Error(`Failed to fetch devices: ${error.message}`);
      }
      console.error('Generic error fetching all devices:', error);
      throw error;
    }
  },

  // Get device by ID
  getDeviceById: async (id: number): Promise<Device | null> => {
    try {
      const deviceData = await apiClient.get<Device>(`/devices/${id}`);
      return deviceData;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          console.warn(`Device with ID ${id} not found (404).`);
          return null;
        }
        console.error(`Error fetching device ${id} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to fetch device ${id}: ${error.message}`);
      }
      console.error(`Generic error fetching device ${id}:`, error);
      throw error;
    }
  },

  // Create new device
  createDevice: async (deviceData: CreateDeviceRequest): Promise<Device> => {
    try {
      const newDevice = await apiClient.post<Device>('/devices', deviceData);
      return newDevice;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error creating device (status: ${error.status}):`, error.message);
        throw new Error(`Failed to create device: ${error.message}`);
      }
      console.error('Generic error creating device:', error);
      throw error;
    }
  },

  // Update device
  updateDevice: async (id: number, deviceData: UpdateDeviceRequest): Promise<Device> => {
    try {
      const updatedDevice = await apiClient.put<Device>(`/devices/${id}`, deviceData);
      return updatedDevice;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error updating device ${id} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to update device ${id}: ${error.message}`);
      }
      console.error(`Generic error updating device ${id}:`, error);
      throw error;
    }
  },

  // Update device state (status, brightness, color, etc.)
  updateDeviceState: async (id: number, stateData: UpdateDeviceStateRequest): Promise<Device> => {
    console.log(`DevicesApi.updateDeviceState: Updating device ${id} with state:`, stateData);
    
    try {
      // Handle translation between 'status' and 'is_on' fields
      const apiStateData: any = { ...stateData };
      
      // If status is provided, also set is_on to keep the fields in sync
      if (stateData.status !== undefined && apiStateData.is_on === undefined) {
        apiStateData.is_on = stateData.status === 'on';
      }
      
      // Log the full API endpoint being called for debugging
      const endpoint = `/devices/${id}/state`;
      console.log(`DevicesApi.updateDeviceState: Calling API endpoint: ${endpoint} with data:`, apiStateData);
      
      // First update the database record
      const updatedDeviceState = await apiClient.patch<Device>(endpoint, apiStateData);
      console.log(`DevicesApi.updateDeviceState: Database updated for device ${id}, response:`, updatedDeviceState);
      
      // Then send command to the Arduino to control the physical device if necessary
      const ledId = devicesApi.getArduinoLEDId(updatedDeviceState);
      
      if (ledId !== null) {
        console.log(`DevicesApi.updateDeviceState: Mapped device ${id} to Arduino LED ${ledId}`);
        
        // Handle status/on-off change
        if (stateData.status === 'on' || (stateData.is_on === true)) {
          try {
            const arduinoResponse = await apiClient.post(`/arduino/leds/${ledId}/manual/on`, {});
            console.log(`DevicesApi.updateDeviceState: Arduino manual ON response:`, arduinoResponse);
          } catch (arduinoError) {
            console.error(`DevicesApi.updateDeviceState: Arduino manual ON error:`, arduinoError);
          }
        } else if (stateData.status === 'off' || (stateData.is_on === false)) {
          try {
            const arduinoResponse = await apiClient.post(`/arduino/leds/${ledId}/manual/off`, {});
            console.log(`DevicesApi.updateDeviceState: Arduino manual OFF response:`, arduinoResponse);
          } catch (arduinoError) {
            console.error(`DevicesApi.updateDeviceState: Arduino manual OFF error:`, arduinoError);
          }
        }
        
        // Handle brightness change
        if (stateData.brightness !== undefined) {
          try {
            // Make sure the device is on before setting brightness
            if (updatedDeviceState.status === 'on' || updatedDeviceState.is_on === true) {
              const arduinoResponse = await apiClient.post(`/arduino/leds/${ledId}/brightness`, { 
                level: stateData.brightness 
              });
              console.log(`DevicesApi.updateDeviceState: Arduino brightness response:`, arduinoResponse);
            } else {
              console.log(`DevicesApi.updateDeviceState: Skipping brightness update because device is off`);
            }
          } catch (arduinoError) {
            console.error(`DevicesApi.updateDeviceState: Arduino brightness error:`, arduinoError);
          }
        }
      } else {
        console.warn(`DevicesApi.updateDeviceState: No LED mapping found for device ${id}`);
      }
      
      return updatedDeviceState;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`DevicesApi.updateDeviceState: API Error updating device state for ${id} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to update device state for ${id}: ${error.message}`);
      }
      console.error(`DevicesApi.updateDeviceState: Generic error updating device state for ${id}:`, error);
      throw error;
    }
  },

  // Delete device
  deleteDevice: async (id: number): Promise<void> => {
    try {
      await apiClient.delete<unknown>(`/devices/${id}`);
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error deleting device ${id} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to delete device ${id}: ${error.message}`);
      }
      console.error(`Generic error deleting device ${id}:`, error);
      throw error;
    }
  },

  // Toggle device on/off
  toggleDevice: async (id: number, isOn: boolean): Promise<Device> => {
    const newStatus = isOn ? 'on' : 'off';
    console.log(`DevicesApi.toggleDevice: Setting device ${id} to ${newStatus}`);
    
    try {
      // First update the database record via the device API
      // When sending to /devices/:id/state, we need to use status: 'on'/'off'
      // but also include is_on: true/false for the backend database
      const result = await devicesApi.updateDeviceState(id, { 
        status: newStatus,
        is_on: isOn  // Add this field for the backend database
      });
      console.log(`DevicesApi.toggleDevice: Database updated, device ${id} is now ${result.status}`);
      
      // Use WebSocket for real-time control (preferred method)
      const wsSuccess = websocketService.toggleDevice(id, isOn);
      
      // If WebSocket fails, fall back to HTTP API for device control
      if (!wsSuccess) {
        console.warn(`DevicesApi.toggleDevice: WebSocket not available, falling back to HTTP API`);
        
        // Then send command to the Arduino to control the physical device
        // We need to map the device ID to LED ID
        const ledId = devicesApi.getArduinoLEDId(result);
        if (ledId !== null) {
          console.log(`DevicesApi.toggleDevice: Mapped device ${id} to Arduino LED ${ledId}`);
          
          // Call the Arduino API endpoint
          const arduinoEndpoint = isOn 
            ? `/arduino/leds/${ledId}/manual/on` 
            : `/arduino/leds/${ledId}/manual/off`;
          
          try {
            const arduinoResponse = await apiClient.post(arduinoEndpoint, {});
            console.log(`DevicesApi.toggleDevice: Arduino API response:`, arduinoResponse);
          } catch (arduinoError) {
            console.error(`DevicesApi.toggleDevice: Arduino API error:`, arduinoError);
            // Still return the database update result even if Arduino command fails
          }
        } else {
          console.warn(`DevicesApi.toggleDevice: No LED mapping found for device ${id}`);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`DevicesApi.toggleDevice: Error toggling device ${id}:`, error);
      throw error;
    }
  },

  // Set device brightness
  setDeviceBrightness: async (id: number, brightness: number): Promise<Device> => {
    console.log(`DevicesApi.setDeviceBrightness: Setting device ${id} brightness to ${brightness}`);
    
    try {
      // First, update the database record
      const result = await devicesApi.updateDeviceState(id, { brightness });
      
      // Use WebSocket for real-time brightness control (preferred method)
      const wsSuccess = websocketService.setBrightness(id, brightness);
      
      // If WebSocket fails, fall back to HTTP API
      if (!wsSuccess) {
        console.warn(`DevicesApi.setDeviceBrightness: WebSocket not available, falling back to HTTP API`);
        // The Arduino control via HTTP will be handled by the updateDeviceState method
      }
      
      console.log(`DevicesApi.setDeviceBrightness: Brightness updated for device ${id}`);
      
      return result;
    } catch (error) {
      console.error(`DevicesApi.setDeviceBrightness: Error setting brightness for device ${id}:`, error);
      throw error;
    }
  },

  // Set device color
  setDeviceColor: async (id: number, color: string): Promise<Device> => {
    return devicesApi.updateDeviceState(id, { color });
  },

  // Set device temperature (for thermostats)
  setDeviceTemperature: async (id: number, temperature: number): Promise<Device> => {
    return devicesApi.updateDeviceState(id, { temperature });
  },

  // Map device to LED ID for Arduino control (Enhanced)
  getArduinoLEDId(device: Device): number | null {
    console.log("Mapping device to Arduino LED ID:", device);
    
    // Handle different types of device data
    if (!device) {
      console.error("Cannot map undefined or null device to LED ID");
      return null;
    }
    
    // Extract device ID considering different formats (numeric or string)
    let deviceId: number | undefined;
    
    if (typeof device.id === 'number') {
      deviceId = device.id;
    } else if (typeof device.id === 'string' && !isNaN(parseInt(device.id))) {
      deviceId = parseInt(device.id, 10);
    } else {
      console.error("Invalid device ID format for LED mapping:", device.id);
      return null;
    }
    
    // Simple direct mapping - device ID 1 maps to Arduino LED 0, etc.
    // This can be expanded to handle more complex mappings
    const ledMapping: { [key: number]: number } = {
      1: 0, // Device ID 1 maps to Arduino LED 0
      2: 1, // Device ID 2 maps to Arduino LED 1
      3: 2, // Device ID 3 maps to Arduino LED 2
      // Can add more mappings here
    };
    
    // Check if we have a mapping for this device ID
    if (deviceId !== undefined && ledMapping[deviceId] !== undefined) {
      console.log(`Device ID ${deviceId} maps to Arduino LED ${ledMapping[deviceId]}`);
      return ledMapping[deviceId];
    }
    
    // Fallback - if device ID is between 1 and 3, map directly (id-1)
    if (deviceId !== undefined && deviceId >= 1 && deviceId <= 3) {
      const mappedLedId = deviceId - 1;
      console.log(`Using fallback mapping: Device ID ${deviceId} maps to Arduino LED ${mappedLedId}`);
      return mappedLedId;
    }
    
    console.warn(`No Arduino LED mapping found for device ID ${deviceId}`);
    return null;
  }
};
