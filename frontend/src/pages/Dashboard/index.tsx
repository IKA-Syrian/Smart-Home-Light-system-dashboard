import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useDeviceStore } from "@/store/integratedDeviceStore";
import { useRooms, useDevices, useSensors, useSchedules } from "@/hooks/useApi";
import { StatusCard } from "@/components/dashboard/status-card";
import { DeviceCard } from "@/components/dashboard/device-card";
import { RoomPreview } from "@/components/dashboard/room-preview";
import { SensorStatusCard } from "@/components/dashboard/sensor-status-card";
import { MotionSensorControl } from "@/components/dashboard/motion-sensor-control";
import { ColorButton } from "@/components/ui/color-button";
import SmartHomeTabs from "@/components/dashboard/smart-home-tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { LightbulbIcon, Clock, Settings, Sparkles, Loader2, Eye } from "lucide-react";
import { Device, ApiSensor } from "@/types/api";
import { useArduino } from "@/hooks/useArduino";
import { EnhancedEnergyChart } from "@/components/dashboard/enhanced-energy-chart";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { devices: storeDevices, rooms: storeRooms } = useDeviceStore();
  const { arduinoStatus, refreshStatus } = useArduino();
  const [pirEnabled, setPirEnabled] = useState(false);
  
  // Fetch data using API hooks
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: sensors = [], isLoading: sensorsLoading } = useSensors<ApiSensor[]>();
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedules();
  
  // Use API data when available, fallback to store data
  const currentDevices = devices.length > 0 ? devices : storeDevices;
  const currentRooms = rooms.length > 0 ? rooms : storeRooms;
  
  const isLoading = devicesLoading || roomsLoading || sensorsLoading || schedulesLoading;

  // Update PIR status when Arduino status changes
  useEffect(() => {
    refreshStatus();
    if (arduinoStatus) {
      setPirEnabled(arduinoStatus.pirEnabled);
    }
  }, [arduinoStatus, refreshStatus]);

  // Count active devices
  const activeDevices = 1;
  
  // Group devices by room
  const devicesByRoom: Record<number, Device[]> = {};
  currentDevices
    .filter(device => typeof device.id === 'number' && typeof device.roomId === 'number')
    .forEach(device => {
    if (!devicesByRoom[device.roomId]) {
      devicesByRoom[device.roomId] = [];
    }
    devicesByRoom[device.roomId].push(device);
  });
  
  // Count schedules from API
  const activeSchedules = schedules.filter(schedule => schedule.isActive).length;
  
  // Mock time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.username || user?.firstName || 'User'}
        </h2>
        <p className="text-muted-foreground">
          Here's the current status of your smart lighting system.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard 
          title="Active Devices"
          value={activeDevices}
          icon={<LightbulbIcon className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatusCard 
          title="Motion Sensors"
          value={sensors.filter(s => s.type === "motion").length.toString()}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatusCard 
          title="Schedules"
          value={`${activeSchedules}/${schedules.length}`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatusCard 
          title="Connected Lights"
          value={`${currentDevices.filter(d => d.status === 'on').length}/${currentDevices.length}`}
          icon={<Settings className="h-4 w-4" />}
        />
      </div>
      
      {/* Motion Sensor Control */}
      <div className="grid gap-6 md:grid-cols-2">
        <MotionSensorControl initialEnabled={pirEnabled} />
        
        <EnhancedEnergyChart deviceId={1} ledId={0} />
      </div>
      
      {/* Room previews with images */}
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Rooms</h3>
          <ColorButton>
            <Sparkles className="mr-2 h-4 w-4" />
            Create Custom Scene
          </ColorButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {currentRooms
            .filter(room => room && typeof room.room_id === 'number')
            .map(room => (
            <RoomPreview key={room.room_id} room={room} />
          ))}
        </div>
      </div>
      
      {/* Tabs section for Energy Usage and Schedules */}
      <SmartHomeTabs className="mb-8" schedules={schedules} />
      
      <div className="grid gap-4 animate-scale-in">
        {currentRooms.map(room => {
          const roomDevices = (devicesByRoom[room.room_id] || []).filter(
            device => typeof device.id === 'number'
          );
          if (roomDevices.length === 0) return null;
          
          return (
            <Card key={room.room_id} className="overflow-hidden hover:card-highlight transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle>{room.name}</CardTitle>
                <CardDescription>
                  {roomDevices.length} device{roomDevices.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roomDevices.map(device => (
                    <DeviceCard key={device.id} device={device} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sensors section */}
      {sensors.length > 0 && (
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Sensors</h3>
            <Eye className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sensors.map(sensor => (
              <SensorStatusCard 
                key={sensor.sensor_id} 
                sensor={{
                  id: sensor.sensor_id,
                  name: `${sensor.Device?.name || 'Unknown'} ${sensor.type.replace('_', ' ')}`,
                  type: sensor.type as any,
                  value: sensor.value,
                  isActive: true,
                  location: sensor.Device?.name || 'Unknown',
                  lastReading: sensor.last_read_at
                }} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
