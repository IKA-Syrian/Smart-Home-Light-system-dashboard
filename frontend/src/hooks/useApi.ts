// React Query Hooks for API Integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

// Import all services
import { authApi } from '../services/authService';
import { roomsApi } from '../services/roomService';
import { devicesApi } from '../services/devicesService';
import { sensorsApi } from '../services/sensorsService';
import { scenesApi } from '../services/scenesService';
import { schedulesApi } from '../services/schedulesService';
import { eventLogsApi, EventLogFilters } from '../services/eventLogsService';

// Types
import type {
  User, Room, Device, Sensor, Scene, Schedule, EventLog,
  LoginRequest, RegisterRequest, CreateRoomRequest, UpdateRoomRequest,
  CreateDeviceRequest, UpdateDeviceRequest, UpdateDeviceStateRequest,
  CreateSensorRequest, UpdateSensorRequest,
  CreateSceneRequest, UpdateSceneRequest,
  CreateScheduleRequest, UpdateScheduleRequest
} from '../types/api';

// Query Keys
export const queryKeys = {
  token: ['token'] as const,
  rooms: ['rooms'] as const,
  room: (id: number) => ['rooms', id] as const,
  roomDevices: (roomId: number) => ['rooms', roomId, 'devices'] as const,
  roomSensors: (roomId: number) => ['rooms', roomId, 'sensors'] as const,
  devices: ['devices'] as const,
  device: (id: number) => ['devices', id] as const,
  sensors: ['sensors'] as const,
  sensor: (id: number) => ['sensors', id] as const,
  sensorReadings: (id: number) => ['sensors', id, 'readings'] as const,
  scenes: ['scenes'] as const,
  scene: (id: number) => ['scenes', id] as const,
  schedules: ['schedules'] as const,
  schedule: (id: number) => ['schedules', id] as const,
  deviceSchedules: (deviceId: number) => ['schedules', 'device', deviceId] as const,
  sceneSchedules: (sceneId: number) => ['schedules', 'scene', sceneId] as const,
  eventLogs: (filters?: EventLogFilters) => ['eventLogs', filters] as const,
  eventLog: (id: number) => ['eventLogs', id] as const,
  recentEvents: (hours?: number) => ['eventLogs', 'recent', hours] as const,
};

// ============================================================================
// token HOOKS
// ============================================================================

export const useAuth = () => {
  return useQuery({
    queryKey: queryKeys.token,
    queryFn: authApi.getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.token, data.user);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.token, data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.token, data);
    },
  });
};

// ============================================================================
// ROOMS HOOKS
// ============================================================================

export const useRooms = () => {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: roomsApi.getAllRooms,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useRoom = (id: number) => {
  return useQuery({
    queryKey: queryKeys.room(id),
    queryFn: () => roomsApi.getRoomById(id),
    enabled: !!id,
  });
};

export const useRoomDevices = (roomId: number) => {
  return useQuery({
    queryKey: queryKeys.roomDevices(roomId),
    queryFn: () => roomsApi.getDevicesInRoom(roomId),
    enabled: !!roomId,
  });
};

export const useRoomSensors = (roomId: number) => {
  return useQuery({
    queryKey: queryKeys.roomSensors(roomId),
    queryFn: () => roomsApi.getSensorsInRoom(roomId),
    enabled: !!roomId,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roomsApi.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoomRequest }) =>
      roomsApi.updateRoom(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      queryClient.invalidateQueries({ queryKey: queryKeys.room(id) });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: roomsApi.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

// ============================================================================
// DEVICES HOOKS
// ============================================================================

export const useDevices = () => {
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: devicesApi.getAllDevices,
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
};

export const useDevice = (id: number) => {
  return useQuery({
    queryKey: queryKeys.device(id),
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for device details
  });
};

export const useCreateDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: devicesApi.createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeviceRequest }) =>
      devicesApi.updateDevice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
    },
  });
};

export const useUpdateDeviceState = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, state }: { id: number; state: UpdateDeviceStateRequest }) =>
      devicesApi.updateDeviceState(id, state),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
    },
  });
};

export const useToggleDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isOn }: { id: number; isOn: boolean }) => {
      console.log(`useToggleDevice mutation called with id: ${id}, isOn: ${isOn}`);
      // Adding direct logging for params
      const status = isOn ? 'on' : 'off';
      console.log(`Setting device ${id} status to: ${status}`);
      return devicesApi.toggleDevice(id, isOn);
    },
    onSuccess: (data, variables) => {
      const { id } = variables;
      console.log(`Toggle device success for id: ${id}, received data:`, data);
      
      // Invalidate device queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.device(id) });
      
      // Also invalidate room devices queries as they might contain this device
      // Find all room IDs in the cache
      const queryCache = queryClient.getQueryCache();
      const roomQueries = queryCache.findAll({ 
        queryKey: ['rooms'], 
        exact: false 
      });
      
      // For all room-related queries that might contain device lists
      roomQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    },
    onError: (error, variables) => {
      console.error(`Toggle device error for id: ${variables.id}:`, error);
    }
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: devicesApi.deleteDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

// ============================================================================
// SENSORS HOOKS
// ============================================================================

export const useSensors = <T = Sensor[]>() => {
  const { toast } = useToast();
  
  return useQuery<T, Error>({
    queryKey: queryKeys.sensors,
    queryFn: async () => {
      try {
        return await sensorsApi.getAllSensors() as T;
      } catch (error) {
        console.error("Error fetching sensors:", error);
        toast({
          title: "Error loading sensors",
          description: "Could not load sensor data. Please try again later.",
          variant: "destructive",
        });
        // Return empty array as default value
        return [] as T;
      }
    },
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    retry: 2,
    refetchOnWindowFocus: true,
  });
};

export const useSensor = (id: number) => {
  return useQuery({
    queryKey: queryKeys.sensor(id),
    queryFn: () => sensorsApi.getSensorById(id),
    enabled: !!id,
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};

export const useSensorReadings = (id: number, limit: number = 24) => {
  return useQuery({
    queryKey: queryKeys.sensorReadings(id),
    queryFn: () => sensorsApi.getSensorReadings(id, limit),
    enabled: !!id,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useCreateSensor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sensorsApi.createSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

export const useUpdateSensor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSensorRequest }) =>
      sensorsApi.updateSensor(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      queryClient.invalidateQueries({ queryKey: queryKeys.sensor(id) });
    },
  });
};

export const useDeleteSensor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sensorsApi.deleteSensor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
    },
  });
};

// ============================================================================
// SCENES HOOKS
// ============================================================================

export const useScenes = () => {
  return useQuery({
    queryKey: queryKeys.scenes,
    queryFn: scenesApi.getAllScenes,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useScene = (id: number) => {
  return useQuery({
    queryKey: queryKeys.scene(id),
    queryFn: () => scenesApi.getSceneById(id),
    enabled: !!id,
  });
};

export const useCreateScene = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scenesApi.createScene,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes });
    },
  });
};

export const useUpdateScene = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSceneRequest }) =>
      scenesApi.updateScene(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes });
      queryClient.invalidateQueries({ queryKey: queryKeys.scene(id) });
    },
  });
};

export const useActivateScene = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scenesApi.activateScene,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes });
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
};

export const useDeleteScene = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scenesApi.deleteScene,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scenes });
    },
  });
};

// ============================================================================
// SCHEDULES HOOKS
// ============================================================================

export const useSchedules = () => {
  return useQuery({
    queryKey: queryKeys.schedules,
    queryFn: schedulesApi.getAllSchedules,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useSchedule = (id: number) => {
  return useQuery({
    queryKey: queryKeys.schedule(id),
    queryFn: () => schedulesApi.getScheduleById(id),
    enabled: !!id,
  });
};

export const useDeviceSchedules = (deviceId: number) => {
  return useQuery({
    queryKey: queryKeys.deviceSchedules(deviceId),
    queryFn: () => schedulesApi.getDeviceSchedules(deviceId),
    enabled: !!deviceId,
  });
};

export const useSceneSchedules = (sceneId: number) => {
  return useQuery({
    queryKey: queryKeys.sceneSchedules(sceneId),
    queryFn: () => schedulesApi.getSceneSchedules(sceneId),
    enabled: !!sceneId,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: schedulesApi.createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number | undefined; data: UpdateScheduleRequest }) => {
      // Add validation before making the API call
      if (id === undefined || isNaN(Number(id))) {
        toast({
          title: "Invalid schedule",
          description: "Cannot update schedule with missing or invalid ID",
          variant: "destructive",
        });
        throw new Error("Invalid schedule ID. Cannot update schedule with undefined ID.");
      }
      return schedulesApi.updateSchedule(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      if (id !== undefined) {
        queryClient.invalidateQueries({ queryKey: queryKeys.schedule(id) });
      }
      
      // Also invalidate device schedules queries as they might contain this schedule
      const queryCache = queryClient.getQueryCache();
      const scheduleQueries = queryCache.findAll({
        queryKey: ['schedules'],
        exact: false
      });
      
      // Invalidate all schedule-related queries to ensure data is refreshed
      scheduleQueries.forEach(query => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: schedulesApi.deleteSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
    },
  });
};

// ============================================================================
// EVENT LOGS HOOKS
// ============================================================================

export const useEventLogs = (filters?: EventLogFilters) => {
  return useQuery({
    queryKey: queryKeys.eventLogs(filters),
    queryFn: () => eventLogsApi.getAllEventLogs(filters),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useEventLog = (id: number) => {
  return useQuery({
    queryKey: queryKeys.eventLog(id),
    queryFn: () => eventLogsApi.getEventLogById(id),
    enabled: !!id,
  });
};

export const useRecentEvents = (hours: number = 24) => {
  return useQuery({
    queryKey: queryKeys.recentEvents(hours),
    queryFn: () => eventLogsApi.getRecentEvents(hours),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};
