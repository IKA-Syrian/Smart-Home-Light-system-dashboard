
import { create } from 'zustand';

// Types
export type DeviceType = 'light' | 'dimmer' | 'strip' | 'switch';

export type Schedule = {
  id: string;
  deviceId: string;
  name: string;
  time: string;
  days: string[];
  action: 'on' | 'off';
  brightness?: number;
  color?: string;
  isActive: boolean;
};

export type UsageData = {
  date: string;
  value: number;
};

export type ElectricityUsage = {
  deviceId: string;
  daily: UsageData[];
  weekly: UsageData[];
  monthly: UsageData[];
  totalKwh: number;
  costPerKwh: number;
};

export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  isOn: boolean;
  brightness?: number;
  color?: string;
  isConnected: boolean;
  lastUpdated: string;
  powerConsumption: number; // watts
  usageData: ElectricityUsage;
  schedules: Schedule[];
};

export type Room = {
  id: string;
  name: string;
  icon: string;
};

type DeviceStore = {
  devices: Device[];
  rooms: Room[];
  toggleDevice: (id: string) => void;
  setBrightness: (id: string, brightness: number) => void;
  setColor: (id: string, color: string) => void;
  addSchedule: (deviceId: string, schedule: Omit<Schedule, 'id'>) => void;
  removeSchedule: (deviceId: string, scheduleId: string) => void;
  toggleScheduleActive: (deviceId: string, scheduleId: string) => void;
  updateSchedule: (deviceId: string, schedule: Schedule) => void;
};

// Initial mock data
const initialRooms: Room[] = [
  { id: '1', name: 'Living Room', icon: 'sofa' },
  { id: '2', name: 'Bedroom', icon: 'bed' },
  { id: '3', name: 'Kitchen', icon: 'utensils' },
  { id: '4', name: 'Bathroom', icon: 'bath' },
];

// Mock electricity usage data generator
const generateUsageData = (): ElectricityUsage => {
  const daily: UsageData[] = [];
  const weekly: UsageData[] = [];
  const monthly: UsageData[] = [];
  
  // Generate mock daily data for the last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    daily.push({
      date: date.toISOString().split('T')[0],
      value: Math.random() * 0.8 + 0.2 // Random value between 0.2 and 1 kWh
    });
  }
  
  // Generate mock weekly data for the last 4 weeks
  for (let i = 3; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    weekly.push({
      date: `Week ${4-i}`,
      value: Math.random() * 4 + 2 // Random value between 2 and 6 kWh
    });
  }
  
  // Generate mock monthly data for the last 6 months
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    monthly.push({
      date: monthNames[monthIndex],
      value: Math.random() * 15 + 10 // Random value between 10 and 25 kWh
    });
  }
  
  return {
    deviceId: '',
    daily,
    weekly,
    monthly,
    totalKwh: Math.random() * 50 + 30, // Random between 30 and 80
    costPerKwh: 0.15
  };
};

// Generate schedules
const generateSchedules = (deviceId: string): Schedule[] => {
  if (Math.random() > 0.7) { // Only 30% of devices have schedules
    return [];
  }
  
  const schedules: Schedule[] = [];
  const possibleTimes = ['07:00', '08:30', '17:45', '20:00', '22:30'];
  const possibleDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate 1-3 random schedules
  const numSchedules = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numSchedules; i++) {
    const isOn = Math.random() > 0.5;
    schedules.push({
      id: `schedule-${deviceId}-${i}`,
      deviceId,
      name: isOn ? 'Turn On' : 'Turn Off',
      time: possibleTimes[Math.floor(Math.random() * possibleTimes.length)],
      days: possibleDays.filter(() => Math.random() > 0.5),
      action: isOn ? 'on' : 'off',
      brightness: isOn ? Math.floor(Math.random() * 60) + 40 : undefined,
      color: isOn && Math.random() > 0.7 ? '#' + Math.floor(Math.random() * 16777215).toString(16) : undefined,
      isActive: Math.random() > 0.3, // 70% active
    });
  }
  
  return schedules;
};

const initialDevices: Device[] = [
  {
    id: '1',
    name: 'Ceiling Light',
    type: 'light',
    roomId: '1',
    isOn: true,
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 60,
    usageData: generateUsageData(),
    schedules: generateSchedules('1'),
  },
  {
    id: '2',
    name: 'Floor Lamp',
    type: 'dimmer',
    roomId: '1',
    isOn: false,
    brightness: 80,
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 45,
    usageData: generateUsageData(),
    schedules: generateSchedules('2'),
  },
  {
    id: '3',
    name: 'Nightstand Lamp',
    type: 'dimmer',
    roomId: '2',
    isOn: true,
    brightness: 40,
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 35,
    usageData: generateUsageData(),
    schedules: generateSchedules('3'),
  },
  {
    id: '4',
    name: 'Kitchen Counter',
    type: 'strip',
    roomId: '3',
    isOn: true,
    brightness: 100,
    color: '#FFCC00',
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 80,
    usageData: generateUsageData(),
    schedules: generateSchedules('4'),
  },
  // Add some more strip lights with color capabilities for testing
  {
    id: '5',
    name: 'TV Backlight',
    type: 'strip',
    roomId: '1',
    isOn: true,
    brightness: 70,
    color: '#6A0DAD',
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 50,
    usageData: generateUsageData(),
    schedules: generateSchedules('5'),
  },
  {
    id: '6',
    name: 'Bedroom LED Strip',
    type: 'strip',
    roomId: '2',
    isOn: false,
    brightness: 90,
    color: '#2196F3',
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 55,
    usageData: generateUsageData(),
    schedules: generateSchedules('6'),
  },
  {
    id: '7',
    name: 'Bathroom Accent',
    type: 'strip',
    roomId: '4',
    isOn: true,
    brightness: 60,
    color: '#4CAF50',
    isConnected: true,
    lastUpdated: new Date().toISOString(),
    powerConsumption: 40,
    usageData: generateUsageData(),
    schedules: generateSchedules('7'),
  },
];

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: initialDevices,
  rooms: initialRooms,
  
  toggleDevice: (id) => 
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id 
          ? { 
              ...device, 
              isOn: !device.isOn,
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
  
  setBrightness: (id, brightness) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id 
          ? { 
              ...device, 
              brightness,
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
    
  setColor: (id, color) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id 
          ? { 
              ...device, 
              color,
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),

  addSchedule: (deviceId, scheduleData) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === deviceId 
          ? { 
              ...device, 
              schedules: [
                ...device.schedules,
                {
                  ...scheduleData,
                  id: `schedule-${deviceId}-${Date.now()}`,
                  deviceId
                }
              ],
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
    
  removeSchedule: (deviceId, scheduleId) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === deviceId 
          ? { 
              ...device, 
              schedules: device.schedules.filter(s => s.id !== scheduleId),
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
    
  toggleScheduleActive: (deviceId, scheduleId) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === deviceId 
          ? { 
              ...device, 
              schedules: device.schedules.map(schedule => 
                schedule.id === scheduleId 
                  ? { ...schedule, isActive: !schedule.isActive }
                  : schedule
              ),
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
    
  updateSchedule: (deviceId, updatedSchedule) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === deviceId 
          ? { 
              ...device, 
              schedules: device.schedules.map(schedule => 
                schedule.id === updatedSchedule.id 
                  ? updatedSchedule
                  : schedule
              ),
              lastUpdated: new Date().toISOString() 
            } 
          : device
      ),
    })),
}));
