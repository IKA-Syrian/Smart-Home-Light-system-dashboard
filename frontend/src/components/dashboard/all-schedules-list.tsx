import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Schedule, Device, Room } from "@/types/api";

interface AllSchedulesListProps {
  schedules: Schedule[];
  devices: Device[];
  rooms: Room[];
  onEditSchedule: (schedule: Schedule) => void;
}

// Helper to get a human-readable time from cron_expression
const getTimeFromCron = (cron: string) => {
  try {
    // Simple parsing for cron expression (assuming format like "0 30 9 * * ?")
    const parts = cron.split(' ');
    const minute = parseInt(parts[1]);
    const hour = parseInt(parts[2]);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  } catch {
    return 'Not set';
  }
};

export function AllSchedulesList({ schedules, devices, rooms, onEditSchedule }: AllSchedulesListProps) {
  // Format time from cron expression
  const getCronTime = (cronExp: string) => {
    if (!cronExp) return 'Unknown time';
    try {
      const parts = cronExp.split(' ');
      if (parts.length !== 5) return cronExp;
      
      const minute = parts[0];
      const hour = parts[1];
      const dayOfWeek = parts[4];
      
      // Convert to readable time
      const hourNum = parseInt(hour);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const hour12 = hourNum % 12 || 12;
      
      let dayText = '';
      if (dayOfWeek !== '*') {
        // Map cron days (0=Sunday) to text
        const days = dayOfWeek.split(',').map(d => {
          const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return dayMap[parseInt(d) % 7];
        });
        dayText = ` on ${days.join(', ')}`;
      }
      
      return `${hour12}:${minute.padStart(2, '0')} ${period}${dayText}`;
    } catch (e) {
      return cronExp;
    }
  };
  
  // Get action type
  const getActionString = (action: string | Record<string, unknown> | null | undefined) => {
    if (!action) {
      return 'Unknown action';
    }
    
    if (typeof action === 'string') {
      return action;
    }
    
    if (action.type === 'activate_scene') {
      return 'Activate scene';
    }
    
    return String(action.type || 'Unknown action');
  };
  
  // For each schedule:
  const displayTime = (schedule: Schedule) => {
    if (schedule.onHour !== null && schedule.onMinute !== null && schedule.onHour !== undefined && schedule.onMinute !== undefined) {
      return `${schedule.onHour}:${String(schedule.onMinute).padStart(2, '0')}`;
    }
    if (schedule.cronExpression) {
      return getTimeFromCron(schedule.cronExpression);
    }
    return 'Not set';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Schedules</CardTitle>
        <CardDescription>
          All scheduled events for your smart home system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => {
              const device = schedule.device || devices.find(d => d.id === schedule.deviceId);
              const scene = schedule.scene;
              
              // Determine device name
              let deviceName = "Unknown Device";
              if (device && typeof device === 'object') {
                if ('name' in device && device.name) {
                  deviceName = device.name;
                } else if ('id' in device && device.id) {
                  deviceName = `Device ${device.id}`;
                }
              } else if (schedule.deviceName) {
                deviceName = schedule.deviceName;
              } else if (schedule.deviceId) {
                deviceName = `Device ${schedule.deviceId}`;
              }
              
              // Determine scene name
              let sceneName = "Unknown Scene";
              if (scene && typeof scene === 'object' && 'name' in scene && scene.name) {
                sceneName = scene.name;
              } else if (schedule.sceneName) {
                sceneName = schedule.sceneName;
              } else if (schedule.sceneId) {
                sceneName = `Scene ${schedule.sceneId}`;
              }
              
              return (
                <div key={`schedule-${schedule.id}`} className="border p-3 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{schedule.name || 'Unnamed Schedule'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getCronTime(schedule.cronExpression)}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={schedule.isActive ? 'default' : 'outline'}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button size="icon" variant="outline" onClick={() => onEditSchedule(schedule)} title="Edit">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18"/><path d="M16.243 3.757a2.828 2.828 0 1 1 4 4L7.5 20.5 3 21l.5-4.5L16.243 3.757z"/></svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {device && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Device</p>
                        <p className="text-sm">{deviceName}</p>
                      </div>
                    )}
                    
                    {scene && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Scene</p>
                        <p className="text-sm">{sceneName}</p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Action</p>
                      <p className="text-sm">{getActionString(schedule.action)}</p>
                    </div>
                    
                    {schedule.isDailySchedule && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Schedule Type</p>
                        <p className="text-sm">Daily Schedule</p>
                      </div>
                    )}
                    
                    {schedule.ledId !== undefined && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">LED</p>
                        <p className="text-sm">{schedule.ledId}</p>
                      </div>
                    )}
                    
                    {/* On Time */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">On Time</p>
                      <p className="text-sm">{displayTime(schedule)}</p>
                    </div>
                    
                    {schedule.offHour !== undefined && schedule.offMinute !== undefined ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Off Time</p>
                        <p className="text-sm">
                          {schedule.offHour !== null && schedule.offMinute !== null 
                            ? `${schedule.offHour}:${String(schedule.offMinute).padStart(2, '0')}` 
                            : "Not set"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto opacity-20 mb-2" />
            <p className="text-lg font-medium">No schedules found</p>
            <p className="text-muted-foreground">
              Create a schedule to automate your smart home
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 