import { useState } from "react";
import { Device } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChartBar, Settings } from "lucide-react";
import { ScheduleManager } from "./schedule-manager";
import { EnergyUsageChart } from "./energy-usage-chart";
import { EnhancedEnergyChart } from "./enhanced-energy-chart";
import { DeviceControlPanel } from "./device-control-panel";

interface DeviceDetailDialogProps {
  device: Device;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

// Create placeholder usage data
const createUsageData = (device: Device) => {
  const baseValue = device.powerConsumption || 10;
  const today = new Date();
  
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.max(1, baseValue * (1 + Math.random() * 0.5 - 0.25))
    };
  }).reverse();
  
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (i * 7));
    return {
      date: `Week ${4-i}`,
      value: Math.max(5, baseValue * 7 * (1 + Math.random() * 0.3 - 0.15))
    };
  }).reverse();
  
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(today.getMonth() - i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short' }),
      value: Math.max(20, baseValue * 30 * (1 + Math.random() * 0.2 - 0.1))
    };
  }).reverse();
  
  return {
    deviceId: device.id,
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
    totalKwh: baseValue * 30,
    costPerKwh: 0.12
  };
};

export function DeviceDetailDialog({
  device,
  isOpen,
  onOpenChange,
  activeTab = "control",
  onTabChange = () => {},
}: DeviceDetailDialogProps) {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    onTabChange(tab);
  };

  // Map device ID to LED ID (simple mapping for demo)
  const ledId = device.id - 1;

  // Generate usage data based on device
  const usageData = createUsageData(device);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{device.name}</DialogTitle>
          <DialogDescription>
            {device.type.charAt(0).toUpperCase() + device.type.slice(1)} • 
            {device.isConnected ? " Connected" : " Disconnected"}
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={currentTab} 
          onValueChange={handleTabChange} 
          className="w-full mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="control" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Control</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="energy" className="flex items-center gap-2">
              <ChartBar className="h-4 w-4" />
              <span>Energy</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="py-4">
            <DeviceControlPanel 
              deviceId={device.id}
              ledId={ledId}
              deviceName={device.name}
              initialBrightness={device.brightness || 0}
              initialColor={device.color || "#FFFFFF"}
            />
          </TabsContent>

          <TabsContent value="schedule" className="py-4">
            <ScheduleManager device={device} />
          </TabsContent>

          <TabsContent value="energy" className="py-4">
            <EnhancedEnergyChart 
              deviceId={device.id} 
              ledId={ledId} 
              title={`${device.name} Energy Usage`}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
