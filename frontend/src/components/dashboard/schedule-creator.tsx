import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DailyScheduleForm } from "./daily-schedule-form";
import { Clock, Plus, Calendar } from "lucide-react";
import { useDevices } from "@/hooks/useApi";
import { dailyScheduleApi, DailySchedule } from "@/services/dailyScheduleService";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function ScheduleCreator() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [schedules, setSchedules] = useState<DailySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: devices = [] } = useDevices();
  
  // Fetch all schedules
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const allSchedules = await dailyScheduleApi.getAllDailySchedules();
      setSchedules(allSchedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to load schedules");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchSchedules();
  }, []);
  
  // Apply all schedules to Arduino
  const handleApplyAll = async () => {
    setIsApplyingAll(true);
    try {
      await dailyScheduleApi.applyAllSchedules();
      toast.success("All schedules applied to Arduino");
    } catch (error) {
      console.error("Error applying schedules:", error);
      toast.error("Failed to apply schedules");
    } finally {
      setIsApplyingAll(false);
    }
  };
  
  // Clear all schedules from Arduino
  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await dailyScheduleApi.clearAllSchedules();
      toast.success("All schedules cleared from Arduino");
    } catch (error) {
      console.error("Error clearing schedules:", error);
      toast.error("Failed to clear schedules");
    } finally {
      setIsClearingAll(false);
    }
  };
  
  // Group schedules by device
  const schedulesByDevice = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.deviceId]) {
      acc[schedule.deviceId] = [];
    }
    acc[schedule.deviceId].push(schedule);
    return acc;
  }, {} as Record<number, DailySchedule[]>);
  
  // Handle schedule creation success
  const handleScheduleCreated = () => {
    setIsDialogOpen(false);
    fetchSchedules();
    toast.success("Schedule created successfully");
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Schedules</CardTitle>
            <CardDescription>
              Configure automatic on/off times for your devices
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              disabled={isClearingAll || schedules.length === 0}
            >
              {isClearingAll ? "Clearing..." : "Clear All"}
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleApplyAll}
              disabled={isApplyingAll || schedules.length === 0}
            >
              {isApplyingAll ? "Applying..." : "Apply All"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading schedules...
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No schedules created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(schedulesByDevice).map(([deviceIdStr, deviceSchedules]) => {
              const deviceId = parseInt(deviceIdStr);
              const device = devices.find(d => d.id === deviceId);
              
              if (!device) return null;
              
              return (
                <div key={deviceId} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{device.name}</h3>
                    <Badge variant="outline">
                      {deviceSchedules.filter(s => s.isActive).length}/{deviceSchedules.length} active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {deviceSchedules.map(schedule => (
                      <div key={schedule.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            LED {schedule.ledId + 1}: {schedule.formattedOnTime} - {schedule.formattedOffTime}
                          </span>
                        </div>
                        <Badge variant={schedule.isActive ? "default" : "outline"} className="text-xs">
                          {schedule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Set up when your device should turn on and off automatically
              </DialogDescription>
            </DialogHeader>
            
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Select Device</label>
              <Select 
                value={selectedDeviceId?.toString() || ""} 
                onValueChange={(value) => setSelectedDeviceId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices && devices.length > 0 ? devices.map(device => (
                    device && device.id ? (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        {device.name}
                      </SelectItem>
                    ) : null
                  )) : (
                    <SelectItem value="no-devices" disabled>
                      No devices available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedDeviceId && (
              <DailyScheduleForm 
                deviceId={selectedDeviceId} 
                onSuccess={handleScheduleCreated}
                onCancel={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
} 