import { Calendar, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Schedule, Device, Room } from "@/types/api";

interface LegacySchedulesListProps {
  schedules: Schedule[];
  devices: Device[];
  rooms: Room[];
  onViewSchedules: (deviceId: number) => void;
}

export function LegacySchedulesList({ schedules, devices, rooms, onViewSchedules }: LegacySchedulesListProps) {
  // Process schedules data
  const activeSchedules = schedules.filter(s => s.isActive).length;
  
  // Group schedules by device
  const deviceSchedules = schedules.reduce((acc, schedule) => {
    if (schedule.deviceId) {
      if (!acc[schedule.deviceId]) {
        acc[schedule.deviceId] = [];
      }
      acc[schedule.deviceId].push(schedule);
    }
    return acc;
  }, {} as Record<number, Schedule[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legacy Schedules</CardTitle>
        <CardDescription>
          {Object.keys(deviceSchedules).length} devices with {schedules.length} schedules ({activeSchedules} active)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(deviceSchedules).length > 0 ? (
            Object.entries(deviceSchedules).map(([deviceIdStr, deviceScheduleList]) => {
              const deviceId = parseInt(deviceIdStr);
              const device = devices.find(d => d.id === deviceId);
              if (!device) return null;
              
              const activeCount = deviceScheduleList.filter(s => s.isActive).length;
              const room = rooms.find(r => r.room_id === device.roomId);
              
              return (
                <div key={deviceId} className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h4 className="font-medium">{device.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {room?.name || "Unknown Room"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-sm">
                        {activeCount}/{deviceScheduleList.length} active
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onViewSchedules(deviceId)}
                    >
                      View Schedules
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div key="no-schedules" className="text-center py-6">
              <Calendar className="h-12 w-12 mx-auto opacity-20 mb-2" />
              <p className="text-lg font-medium">No legacy schedules created yet</p>
              <p className="text-muted-foreground">
                Use the new schedule creator above for best results
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 