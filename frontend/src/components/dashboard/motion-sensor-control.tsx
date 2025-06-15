import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArduino } from "@/hooks/useArduino";
import { Eye, EyeOff, Clock, Calendar, Activity, AlertCircle } from "lucide-react";
import { TimePickerInput } from "@/components/ui/time-picker-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface MotionSensorControlProps {
  initialEnabled?: boolean;
}

export function MotionSensorControl({
  initialEnabled = false
}: MotionSensorControlProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [activeTab, setActiveTab] = useState<string>("status");
  const [scheduleActive, setScheduleActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | undefined>(new Date());
  const [endTime, setEndTime] = useState<Date | undefined>(new Date());
  const [selectedDays, setSelectedDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { 
    arduinoStatus, 
    enablePIR, 
    disablePIR, 
    pirLoading, 
    refreshStatus,
    error: arduinoError
  } = useArduino();

  // Sync with Arduino status
  useEffect(() => {
    if (arduinoStatus) {
      setIsEnabled(arduinoStatus.pirEnabled);
    }
  }, [arduinoStatus]);

  // Show error toast when Arduino error occurs
  useEffect(() => {
    if (arduinoError) {
      toast({
        title: "Motion Sensor Error",
        description: arduinoError,
        variant: "destructive"
      });
    }
  }, [arduinoError, toast]);

  // Handle toggle with better error handling
  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to ${enabled ? 'enable' : 'disable'} PIR motion sensor...`);
      
      if (enabled) {
        console.log('Calling enablePIR() from useArduino hook');
        await enablePIR();
        await new Promise(resolve => setTimeout(resolve, 500)); // Add delay for Arduino to process
        await refreshStatus(); // Refresh status to ensure UI reflects actual Arduino state
        
        toast({
          title: "Motion Sensor Enabled",
          description: "The PIR motion sensor has been activated successfully."
        });
      } else {
        console.log('Calling disablePIR() from useArduino hook');
        await disablePIR();
        await new Promise(resolve => setTimeout(resolve, 500)); // Add delay for Arduino to process
        await refreshStatus(); // Refresh status to ensure UI reflects actual Arduino state
        
        toast({
          title: "Motion Sensor Disabled",
          description: "The PIR motion sensor has been deactivated successfully."
        });
      }
      
      // Set UI state directly, the useEffect will sync with Arduino status
      setIsEnabled(enabled);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle motion sensor";
      console.error(`PIR toggle error:`, err);
      setError(errorMessage);
      toast({
        title: "Motion Sensor Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Don't revert UI state here - let arduinoStatus sync handle it
    } finally {
      setIsLoading(false);
      
      // Request another status refresh after a delay to ensure accurate state
      setTimeout(() => {
        refreshStatus();
      }, 1000);
    }
  };

  // Save schedule (mock implementation)
  const saveSchedule = () => {
    // This would normally save to backend
    setScheduleActive(true);
    const scheduleInfo = {
      active: true,
      days: selectedDays,
      startTime: startTime ? format(startTime, 'HH:mm') : null,
      endTime: endTime ? format(endTime, 'HH:mm') : null
    };
    
    console.log("Schedule saved:", scheduleInfo);
    
    toast({
      title: "Schedule Saved",
      description: `Motion detection scheduled for ${selectedDays.length === 7 ? "every day" : selectedDays.map(d => d.substring(0, 3)).join(", ")} from ${startTime ? format(startTime, 'HH:mm') : "00:00"} to ${endTime ? format(endTime, 'HH:mm') : "23:59"}.`
    });
  };

  // Clear schedule
  const clearSchedule = () => {
    setScheduleActive(false);
    toast({
      title: "Schedule Cleared",
      description: "Motion detection schedule has been cleared."
    });
  };

  // Days of week for selection
  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" }
  ];

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Handle refresh with error handling
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await refreshStatus();
      toast({
        title: "Sensor Status Updated",
        description: "Motion sensor status has been refreshed."
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to refresh sensor status";
      setError(errorMessage);
      toast({
        title: "Refresh Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Motion Sensor Control
          </CardTitle>
          <Badge variant={isEnabled ? "default" : "outline"}>
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Status</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Motion Detection</h4>
                <p className="text-xs text-muted-foreground">
                  Enable or disable the PIR motion sensor
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="motion-toggle" 
                  checked={isEnabled} 
                  onCheckedChange={handleToggle}
                  disabled={pirLoading || isLoading}
                />
                <Label htmlFor="motion-toggle" className="sr-only">
                  Toggle motion detection
                </Label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Current Status</h4>
                <p className="text-xs text-muted-foreground">
                  {isEnabled ? "Motion detection is active" : "Motion detection is inactive"}
                </p>
              </div>
              {isEnabled ? 
                <Eye className="h-5 w-5 text-green-500" /> : 
                <EyeOff className="h-5 w-5 text-gray-400" />
              }
            </div>

            {scheduleActive && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-medium">Schedule Active</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedDays.length === 7 ? "Every day" : selectedDays.map(d => d.substring(0, 3)).join(", ")}
                      {startTime && endTime && ` • ${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Days</h4>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <Button
                      key={day.value}
                      variant={selectedDays.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      className="text-xs h-8"
                    >
                      {day.label.substring(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <TimePickerInput
                    id="start-time"
                    value={startTime}
                    onChange={setStartTime}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <TimePickerInput
                    id="end-time"
                    value={endTime}
                    onChange={setEndTime}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={clearSchedule}
                  disabled={!scheduleActive || isLoading}
                >
                  Clear Schedule
                </Button>
                <Button 
                  onClick={saveSchedule}
                  disabled={isLoading}
                >
                  Save Schedule
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {pirLoading || isLoading ? "Updating sensor..." : "Last updated: " + new Date().toLocaleTimeString()}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={pirLoading || isLoading}
            className="text-xs h-8"
          >
            {pirLoading || isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 