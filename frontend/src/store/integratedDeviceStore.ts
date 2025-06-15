// Integrated Device Store with API connectivity
import { create } from 'zustand';
import { devicesApi } from '../services/devicesService';
import { roomsApi } from '../services/roomService';
import type { Device, Room } from '../types/api';

// Local state types for UI-specific properties
interface DeviceUIState {
  isUpdating: boolean;
  lastLocalUpdate?: string;
}

interface DeviceStoreState {
  devices: Device[];
  rooms: Room[];
  deviceUIStates: Record<number, DeviceUIState>;
  isLoading: boolean;
  error: string | null;
}

interface DeviceStoreActions {
  // Data fetching
  fetchDevices: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchDeviceById: (id: number) => Promise<Device | null>;
  
  // Device state management
  toggleDevice: (id: number) => Promise<void>;
  updateDeviceState: (id: number, state: Partial<Pick<Device, 'status' | 'brightness' | 'color' | 'temperature'>>) => Promise<void>;
  setBrightness: (id: number, brightness: number) => Promise<void>;
  setColor: (id: number, color: string) => Promise<void>;
  setTemperature: (id: number, temperature: number) => Promise<void>;
  
  // Device CRUD operations
  createDevice: (deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateDevice: (id: number, deviceData: Partial<Device>) => Promise<void>;
  deleteDevice: (id: number) => Promise<void>;
  
  // Room operations
  createRoom: (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateRoom: (id: number, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (id: number) => Promise<void>;
  
  // UI state management
  setDeviceUpdating: (id: number, isUpdating: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // WebSocket integration
  updateDeviceStatus: (device: Device) => void;
  
  // Utility functions
  getDevicesByRoom: (roomId: number) => Device[];
  getDeviceById: (id: number) => Device | undefined;
  getRoomById: (id: number) => Room | undefined;
  getOnlineDevices: () => Device[];
  getOfflineDevices: () => Device[];
  getTotalPowerConsumption: () => number;
}

type DeviceStore = DeviceStoreState & DeviceStoreActions;

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  // Initial state
  devices: [],
  rooms: [],
  deviceUIStates: {},
  isLoading: false,
  error: null,

  // Data fetching actions
  fetchDevices: async () => {
    try {
      set({ isLoading: true, error: null });
      const devices = await devicesApi.getAllDevices();
      set({ devices, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching devices:', error);
    }
  },

  fetchRooms: async () => {
    try {
      set({ isLoading: true, error: null });
      const rooms = await roomsApi.getAllRooms();
      set({ rooms, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error fetching rooms:', error);
    }
  },

  fetchDeviceById: async (id: number) => {
    try {
      const device = await devicesApi.getDeviceById(id);
      const { devices } = get();
      const updatedDevices = devices.map(d => d.id === id ? device : d);
      if (!devices.find(d => d.id === id)) {
        updatedDevices.push(device);
      }
      set({ devices: updatedDevices });
      return device;
    } catch (error: any) {
      console.error('Error fetching device:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Device state management
  toggleDevice: async (id: number) => {
    const { devices, setDeviceUpdating } = get();
    const device = devices.find(d => d.id === id);
    
    if (!device) return;

    try {
      setDeviceUpdating(id, true);
      const newStatus = device.status === 'on' ? 'off' : 'on';
      const updatedDevice = await devicesApi.updateDeviceState(id, { status: newStatus });
      
      const updatedDevices = devices.map(d => d.id === id ? updatedDevice : d);
      set({ devices: updatedDevices });
    } catch (error: any) {
      console.error('Error toggling device:', error);
      set({ error: error.message });
    } finally {
      setDeviceUpdating(id, false);
    }
  },

  updateDeviceState: async (id: number, state) => {
    const { devices, setDeviceUpdating } = get();
    
    try {
      setDeviceUpdating(id, true);
      const updatedDevice = await devicesApi.updateDeviceState(id, state);
      
      const updatedDevices = devices.map(d => d.id === id ? updatedDevice : d);
      set({ devices: updatedDevices });
    } catch (error: any) {
      console.error('Error updating device state:', error);
      set({ error: error.message });
    } finally {
      setDeviceUpdating(id, false);
    }
  },

  setBrightness: async (id: number, brightness: number) => {
    await get().updateDeviceState(id, { brightness });
  },

  setColor: async (id: number, color: string) => {
    await get().updateDeviceState(id, { color });
  },

  setTemperature: async (id: number, temperature: number) => {
    await get().updateDeviceState(id, { temperature });
  },

  // Device CRUD operations
  createDevice: async (deviceData) => {
    try {
      set({ isLoading: true, error: null });
      const newDevice = await devicesApi.createDevice(deviceData);
      const { devices } = get();
      set({ devices: [...devices, newDevice], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating device:', error);
    }
  },

  updateDevice: async (id: number, deviceData) => {
    try {
      const updatedDevice = await devicesApi.updateDevice(id, deviceData);
      const { devices } = get();
      const updatedDevices = devices.map(d => d.id === id ? updatedDevice : d);
      set({ devices: updatedDevices });
    } catch (error: any) {
      console.error('Error updating device:', error);
      set({ error: error.message });
    }
  },

  deleteDevice: async (id: number) => {
    try {
      await devicesApi.deleteDevice(id);
      const { devices } = get();
      const updatedDevices = devices.filter(d => d.id !== id);
      set({ devices: updatedDevices });
    } catch (error: any) {
      console.error('Error deleting device:', error);
      set({ error: error.message });
    }
  },

  // Room operations
  createRoom: async (roomData) => {
    try {
      set({ isLoading: true, error: null });
      const newRoom = await roomsApi.createRoom(roomData);
      const { rooms } = get();
      set({ rooms: [...rooms, newRoom], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      console.error('Error creating room:', error);
    }
  },

  updateRoom: async (id: number, roomData) => {
    try {
      const updatedRoom = await roomsApi.updateRoom(id, roomData);
      const { rooms } = get();
      const updatedRooms = rooms.map(r => r.room_id === id ? updatedRoom : r);
      set({ rooms: updatedRooms });
    } catch (error: any) {
      console.error('Error updating room:', error);
      set({ error: error.message });
    }
  },

  deleteRoom: async (id: number) => {
    try {
      await roomsApi.deleteRoom(id);
      const { rooms } = get();
      const updatedRooms = rooms.filter(r => r.room_id !== id);
      set({ rooms: updatedRooms });
    } catch (error: any) {
      console.error('Error deleting room:', error);
      set({ error: error.message });
    }
  },

  // UI state management
  setDeviceUpdating: (id: number, isUpdating: boolean) => {
    const { deviceUIStates } = get();
    set({
      deviceUIStates: {
        ...deviceUIStates,
        [id]: {
          ...deviceUIStates[id],
          isUpdating,
          lastLocalUpdate: new Date().toISOString(),
        },
      },
    });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  // WebSocket integration
  updateDeviceStatus: (device: Device) => {
    const { devices } = get();
    const existingDevice = devices.find(d => d.id === device.id);
    
    if (existingDevice) {
      // Update existing device
      const updatedDevices = devices.map(d => d.id === device.id ? { ...d, ...device } : d);
      set({ devices: updatedDevices });
      console.log(`[DeviceStore] Updated device ${device.id} via WebSocket`);
    } else {
      // Add new device if it doesn't exist
      set({ devices: [...devices, device] });
      console.log(`[DeviceStore] Added new device ${device.id} via WebSocket`);
    }
  },

  // Utility functions
  getDevicesByRoom: (roomId: number) => {
    return get().devices.filter(device => device.roomId === roomId);
  },

  getDeviceById: (id: number) => {
    return get().devices.find(device => device.id === id);
  },

  getRoomById: (id: number) => {
    return get().rooms.find(room => room.id === id);
  },

  getOnlineDevices: () => {
    return get().devices.filter(device => device.isConnected);
  },

  getOfflineDevices: () => {
    return get().devices.filter(device => !device.isConnected);
  },

  getTotalPowerConsumption: () => {
    return get().devices
      .filter(device => device.status === 'on' && device.isConnected)
      .reduce((total, device) => total + (device.powerConsumption || 0), 0);
  },
}));
