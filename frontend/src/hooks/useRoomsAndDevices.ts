import { useState, useEffect, useCallback } from 'react';
import { roomsApi } from '../services/roomService';
import { devicesApi } from '../services/devicesService';
import type { Room, Device } from '../types/api';

export interface RoomWithDevices extends Room {
  devices: Device[];
  ledDevice?: Device; // The LED controller for this room
}

export interface UseRoomsAndDevicesState {
  // Data
  rooms: Room[];
  devices: Device[];
  roomsWithDevices: RoomWithDevices[];
  ledDevices: Device[];
  
  // Loading states
  loading: boolean;
  roomsLoading: boolean;
  devicesLoading: boolean;
  
  // Error handling
  error: string | null;
  usingFallbackData: boolean;
  
  // Actions
  refreshData: () => Promise<void>;
  clearError: () => void;
  
  // Helper functions
  getRoomById: (roomId: number) => Room | undefined;
  getDeviceById: (deviceId: number) => Device | undefined;
  getDevicesByRoom: (roomId: number) => Device[];
  getLEDDeviceByRoom: (roomId: number) => Device | undefined;
  getRoomIcon: (roomName: string) => string;
}

// Fallback data for when API is unavailable
const getFallbackRooms = (): Room[] => [
  { id: 1, name: 'Living Room (Fallback)', userId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Fallback data', devices: [], sensors: [] },
  { id: 2, name: 'Bedroom (Fallback)', userId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Fallback data', devices: [], sensors: [] },
  { id: 3, name: 'Kitchen (Fallback)', userId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), description: 'Fallback data', devices: [], sensors: [] },
];

const getFallbackDevices = (): Device[] => [
  // Ensure these devices align with the Room type from types/api.ts including all required fields
  { id: 1, name: 'Living Room LED (Fallback)', type: 'light', status: 'off', userId: 1, roomId: 1, isConnected: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, name: 'Bedroom LED (Fallback)', type: 'light', status: 'off', userId: 1, roomId: 2, isConnected: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 3, name: 'Kitchen LED (Fallback)', type: 'light', status: 'off', userId: 1, roomId: 3, isConnected: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 4, name: 'PIR Motion Sensor (Fallback)', type: 'sensor', status: 'idle', userId: 1, roomId: 1, isConnected: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const useRoomsAndDevices = (): UseRoomsAndDevicesState => {
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  // Error handling
  const handleError = useCallback((err: any, operation: string) => {
    const errorMessage = err.message || (typeof err === 'string' ? err : 'An unknown error occurred');
    console.error(`${operation} error:`, err);
    setError(`Failed to ${operation}: ${errorMessage}`);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    // setUsingFallbackData(false); // We will manage this more globally in refreshData
    try {
      const roomsData = await roomsApi.getAllRooms();
      console.log('[useRoomsAndDevices] Fetched Rooms Data:', roomsData);
      setRooms(roomsData || []); // Ensure it's an array
      return false; // Indicates API success (no fallback)
    } catch (err) {
      handleError(err, 'fetch rooms');
      console.warn('[useRoomsAndDevices] API request failed for rooms, using fallback room data:', err);
      setRooms(getFallbackRooms());
      return true; // Indicates fallback was used
    } finally {
      setRoomsLoading(false);
    }
  }, [handleError]);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    // setUsingFallbackData(false); // We will manage this more globally in refreshData
    try {
      const devicesData = await devicesApi.getAllDevices();
      console.log('[useRoomsAndDevices] Fetched Devices Data:', devicesData);
      setDevices(devicesData || []); // Ensure it's an array
      return false; // Indicates API success (no fallback)
    } catch (err) {
      handleError(err, 'fetch devices');
      console.warn('[useRoomsAndDevices] API request failed for devices, using fallback device data:', err);
      setDevices(getFallbackDevices());
      return true; // Indicates fallback was used
    } finally {
      setDevicesLoading(false);
    }
  }, [handleError]);
  
  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null); 
    
    let roomsUsedFallback = false;
    let devicesUsedFallback = false;

    // It's better to run them sequentially if their fallback status affects a shared flag directly
    // or handle the combined status more carefully after Promise.all
    // For now, let them run concurrently but capture their fallback status

    const roomsPromise = fetchRooms().then(fallbackUsed => roomsUsedFallback = fallbackUsed);
    const devicesPromise = fetchDevices().then(fallbackUsed => devicesUsedFallback = fallbackUsed);

    await Promise.all([roomsPromise, devicesPromise]);
    
    setUsingFallbackData(roomsUsedFallback || devicesUsedFallback);

    setLoading(false);
  }, [fetchRooms, fetchDevices]);

  // Helper functions
  const getRoomById = useCallback((roomId: number): Room | undefined => {
    return rooms.find(room => room.id === roomId);
  }, [rooms]);

  const getDeviceById = useCallback((deviceId: number): Device | undefined => {
    return devices.find(device => device.id === deviceId);
  }, [devices]);

  const getDevicesByRoom = useCallback((roomId: number): Device[] => {
    return devices.filter(device => device.roomId === roomId);
  }, [devices]);

  const getLEDDeviceByRoom = useCallback((roomId: number): Device | undefined => {
    return devices.find(device => 
      device.roomId === roomId && 
      (device.type === 'light' || device.type === 'dimmer' || device.type === 'strip')
    );
  }, [devices]);

  const getRoomIcon = useCallback((roomName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Living Room': '🛋️',
      'Bedroom': '🛏️',
      'Kitchen': '🍳',
      'Bathroom': '🚿',
      'Office': '💼',
      'Garage': '🚗',
    };
    
    // Try exact match first
    if (iconMap[roomName]) {
      return iconMap[roomName];
    }
    
    // Try partial match
    for (const [key, icon] of Object.entries(iconMap)) {
      if (roomName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    
    return '🏠'; // Default icon
  }, []);

  // Computed values
  const ledDevices = devices.filter(device => 
    device.type === 'light' || device.type === 'dimmer' || device.type === 'strip'
  );
  
  const roomsWithDevices: RoomWithDevices[] = rooms.map(room => ({
    ...room,
    devices: getDevicesByRoom(room.id),
    ledDevice: getLEDDeviceByRoom(room.id),
  }));

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    // Data
    rooms,
    devices,
    roomsWithDevices,
    ledDevices,
    
    // Loading states
    loading: loading, // Simplified: loading covers the aggregate refresh
    roomsLoading,
    devicesLoading,
    
    // Error handling
    error,
    // isAuthenticated should be sourced from AuthProvider/authStore directly by components
    usingFallbackData,
    
    // Actions
    refreshData,
    clearError,
    
    // Helper functions
    getRoomById,
    getDeviceById,
    getDevicesByRoom,
    getLEDDeviceByRoom,
    getRoomIcon,
  };
}; 