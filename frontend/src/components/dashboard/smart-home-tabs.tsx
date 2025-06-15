import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartLine, Calendar } from "lucide-react";
import { WebSocketStatus } from "./websocket-status";
import { Schedule, Device, Room } from "@/types/api";
import { useDevices, useRooms } from "@/hooks/useApi";
import { EnergyTabContent } from "./energy-tab-content";
import { SchedulesTabContent } from "./schedules-tab-content";
import { dailyScheduleApi } from "@/services/dailyScheduleService";

interface SmartHomeTabsProps {
  className?: string;
  schedules?: Schedule[];
  onSchedulesRefresh?: () => void;
}

export default function SmartHomeTabs({ 
  className, 
  schedules = [], 
  onSchedulesRefresh 
}: SmartHomeTabsProps) {
  const { data: devices = [], refetch: refetchDevices } = useDevices();
  const { data: rooms = [] } = useRooms();
  const [activeTab, setActiveTab] = useState("energy");
  
  // Ensure devices, rooms, and schedules are arrays
  const validDevices = Array.isArray(devices) ? devices : [];
  const validRooms = Array.isArray(rooms) ? rooms : [];
  const validSchedules = Array.isArray(schedules) ? schedules : [];
  
  // Handle refresh of data
  const handleRefresh = async () => {
    // Refetch devices
    refetchDevices();
    
    // Call parent refresh if available
    if (onSchedulesRefresh) {
      onSchedulesRefresh();
    }
    
    // Apply all schedules to ensure they're active on the Arduino
    try {
      await dailyScheduleApi.applyAllSchedules();
    } catch (error) {
      console.error("Error applying schedules during refresh:", error);
    }
  };
  
  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab}
      onValueChange={setActiveTab} 
      className={className}
    >
      <div className="flex items-center justify-between mb-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="energy">
            <ChartLine className="h-4 w-4 mr-2" />
            Energy Usage
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Calendar className="h-4 w-4 mr-2" />
            Schedules
          </TabsTrigger>
        </TabsList>
        <WebSocketStatus />
      </div>
      
      <TabsContent key="energy-tab" value="energy">
        <EnergyTabContent devices={validDevices} rooms={validRooms} />
      </TabsContent>
      
      <TabsContent key="schedules-tab" value="schedules">
        <SchedulesTabContent 
          schedules={validSchedules} 
          devices={validDevices} 
          rooms={validRooms}
          onRefresh={handleRefresh}
        />
      </TabsContent>
    </Tabs>
  );
}