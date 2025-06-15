// API Types - matching the backend models

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  room_id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  devices?: Device[];
  sensors?: Sensor[];
}

export interface Device {
  id: number;
  name: string;
  type: 'light' | 'dimmer' | 'strip' | 'switch' | 'sensor' | 'thermostat' | 'camera' | 'lock';
  status: 'on' | 'off' | 'idle' | 'error';
  brightness?: number;
  color?: string;
  temperature?: number;
  humidity?: number;
  location?: string;
  roomId: number;
  userId: number;
  isConnected: boolean;
  lastSeen?: string;
  batteryLevel?: number;
  powerConsumption?: number;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  schedules?: Schedule[];
  eventLogs?: EventLog[];
}

export interface Sensor {
  id: number;
  name: string;
  type: 'temperature' | 'humidity' | 'motion' | 'light' | 'air_quality' | 'smoke' | 'water' | 'door' | 'light_intensity';
  value: number;
  unit: string;
  location?: string;
  roomId: number;
  userId: number;
  isActive: boolean;
  batteryLevel?: number;
  lastReading?: string;
  minThreshold?: number;
  maxThreshold?: number;
  alertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  room?: Room;
  eventLogs?: EventLog[];
}

// API response format for sensors
export interface ApiSensor {
  sensor_id: number;
  device_id: number;
  type: string;
  value: number;
  last_read_at: string;
  created_at: string;
  Device?: {
    device_id: number;
    name: string;
    room_id: number;
  };
}

export interface Scene {
  id: number;
  name: string;
  description?: string;
  userId: number;
  isActive: boolean;
  actions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  schedules?: Schedule[];
}

export interface Schedule {
  id: number;
  name: string;
  cronExpression: string;
  isActive: boolean;
  userId: number;
  deviceId?: number;
  sceneId?: number;
  action?: string | Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  device?: Device;
  scene?: Scene;
  // Additional properties for UI display (from API response normalization)
  deviceName?: string;
  deviceType?: string;
  sceneName?: string;
  // Daily schedule properties
  isDailySchedule?: boolean;
  ledId?: number;
  onHour?: number;
  onMinute?: number;
  offHour?: number;
  offMinute?: number;
  lastApplied?: string;
}

export interface EventLog {
  id: number;
  eventType: 'device_state_change' | 'sensor_reading' | 'schedule_triggered' | 'scene_activated' | 'user_action' | 'system_alert';
  description: string;
  userId: number;
  deviceId?: number;
  sensorId?: number;
  sceneId?: number;
  scheduleId?: number;
  data?: Record<string, unknown>;
  timestamp: string;
  device?: Device;
  sensor?: Sensor;
  scene?: Scene;
  schedule?: Schedule;
}

// Request/Response types
export interface CreateRoomRequest {
  name: string;
  description?: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
}

export interface CreateDeviceRequest {
  name: string;
  type: Device['type'];
  roomId: number;
  location?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateDeviceRequest {
  name?: string;
  type?: Device['type'];
  roomId?: number;
  location?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateDeviceStateRequest {
  status?: Device['status'];
  brightness?: number;
  color?: string;
  temperature?: number;
}

export interface CreateSensorRequest {
  name: string;
  type: Sensor['type'];
  roomId: number;
  location?: string;
  minThreshold?: number;
  maxThreshold?: number;
  alertEnabled?: boolean;
}

export interface UpdateSensorRequest {
  name?: string;
  type?: Sensor['type'];
  roomId?: number;
  location?: string;
  minThreshold?: number;
  maxThreshold?: number;
  alertEnabled?: boolean;
}

export interface CreateSceneRequest {
  name: string;
  description?: string;
  actions: Record<string, unknown>;
}

export interface UpdateSceneRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  actions?: Record<string, unknown>;
}

export interface CreateScheduleRequest {
  name: string;
  cronExpression: string;
  deviceId?: number;
  sceneId?: number;
  action: string | Record<string, unknown>;
}

export interface UpdateScheduleRequest {
  name?: string;
  cronExpression?: string;
  isActive?: boolean;
  deviceId?: number;
  sceneId?: number;
  action?: string | Record<string, unknown>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Dashboard summary types
export interface DashboardStats {
  totalDevices: number;
  totalRooms: number;
  totalSensors: number;
  totalScenes: number;
  onlineDevices: number;
  offlineDevices: number;
  activeAlerts: number;
  energyUsage: number;
}

export interface DeviceStats {
  deviceId: number;
  deviceName: string;
  powerConsumption: number;
  uptime: number;
  lastActivity: string;
}

export interface SensorReading {
  sensorId: number;
  sensorName: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
}

// Add EnergyLog and EnergyLogSummary types
export interface EnergyLog {
  id: number;
  deviceId: number;
  ledId: number;
  timestamp: string;
  energyWh: number;
  powerW: number;
  isActive: boolean;
}

export interface EnergyLogSummary {
  totalEnergyWh: number;
  averagePowerW: number;
  peakPowerW: number;
  activeTimeMinutes: number;
  costEstimate: number;
  savingsEstimate: number;
  // Additional properties needed for the enhanced chart
  totalEnergyToday?: number;
  totalCostToday?: number;
  costPerKwh?: number;
  chartData?: {
    date: string;
    hour?: number;
    minute?: number;
    energy: number;
    power?: number;
    cost: number;
  }[];
}

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
  // Additional property needed for the enhanced chart
  currentPower?: number;
}
