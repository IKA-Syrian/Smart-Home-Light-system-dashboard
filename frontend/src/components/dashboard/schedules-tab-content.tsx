import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Schedule, Device, Room } from "@/types/api";
import { ScheduleCreator } from "./schedule-creator";
import { LegacySchedulesList } from "./legacy-schedules-list";
import { AllSchedulesList } from "./all-schedules-list";
import { ScheduleEditDialog } from "./schedule-edit-dialog";

interface SchedulesTabContentProps {
  schedules: Schedule[];
  devices: Device[];
  rooms: Room[];
  onRefresh?: () => void; // Add a refresh callback
}

export function SchedulesTabContent({ schedules, devices, rooms, onRefresh }: SchedulesTabContentProps) {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  
  // Handle view schedules click
  const handleViewSchedules = (deviceId: number) => {
    // Navigate to the device detail page with focus on schedules
    navigate(`/devices/${deviceId}?tab=schedules`);
  };

  // Handle refresh after edit
  const handleEditSuccess = () => {
    // Refresh data if callback is provided
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <ScheduleCreator />
      
      <LegacySchedulesList 
        schedules={schedules}
        devices={devices}
        rooms={rooms}
        onViewSchedules={handleViewSchedules}
      />
      
      <AllSchedulesList 
        schedules={schedules} 
        devices={devices} 
        rooms={rooms}
        onEditSchedule={(schedule) => {
          setEditingSchedule(schedule);
          setEditDialogOpen(true);
        }}
      />
      
      <ScheduleEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        schedule={editingSchedule}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
} 