import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useDeviceStore } from "@/store/integratedDeviceStore";
import { useDevice, useRoom } from "@/hooks/useApi";
import { DeviceCard } from "@/components/dashboard/device-card";
import { ScheduleManager } from "@/components/dashboard/schedule-manager";
import { DailySchedulesList } from "@/components/dashboard/daily-schedules-list";
import { EnhancedEnergyChart } from "@/components/dashboard/enhanced-energy-chart";
import { ScheduleDebugger } from "@/components/dashboard/schedule-debugger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Calendar, Clock, ArrowLeft, Loader2, BatteryCharging, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const navigate = useNavigate();
  
  // Parse deviceId to number
  const deviceIdNum = deviceId ? parseInt(deviceId) : null;
  
  // Fetch device and room data
  const { data: device, isLoading: deviceLoading, error: deviceError } = useDevice(deviceIdNum || 0);
  const { data: room, isLoading: roomLoading } = useRoom(device?.roomId || 0);
  
  const isLoading = deviceLoading || roomLoading;
  
  // Handle back button click
  const handleBack = () => {
    navigate("/dashboard");
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading device details...</span>
      </div>
    );
  }
  
  if (!device || deviceError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Device not found</h2>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{device.name}</h2>
          <p className="text-muted-foreground">
            {room?.name} • {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <DeviceCard device={device} className="h-full" />
        </div>
        
        <div className="md:col-span-2">
          <Tabs 
            defaultValue={initialTab} 
            className="h-full"
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">
                <ChartLine className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="schedules">
                <Calendar className="h-4 w-4 mr-2" />
                Schedules
              </TabsTrigger>
              <TabsTrigger value="daily">
                <Clock className="h-4 w-4 mr-2" />
                Daily Schedules
              </TabsTrigger>
              <TabsTrigger value="debug">
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <EnhancedEnergyChart 
                deviceId={deviceIdNum || undefined} 
                title={`${device.name} Energy Usage`} 
                costPerKwh={0.15}
              />
            </TabsContent>
            
            <TabsContent value="schedules" className="mt-4">
              {device && <ScheduleManager device={device} />}
            </TabsContent>

            <TabsContent value="daily" className="mt-4">
              {device && deviceIdNum && <DailySchedulesList deviceId={deviceIdNum} />}
            </TabsContent>
            
            <TabsContent value="debug" className="mt-4">
              <ScheduleDebugger />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
