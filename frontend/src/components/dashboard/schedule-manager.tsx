import { useState, useEffect } from "react";
import { Device } from "@/types/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Clock, CalendarClock, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useDeviceSchedules, 
  useCreateSchedule, 
  useUpdateSchedule, 
  useDeleteSchedule 
} from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Schedule } from "@/types/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScheduleManagerProps {
  device: Device;
}

interface ExtendedSchedule extends Omit<Schedule, 'id'> {
  id?: number;
  schedule_id?: number;
}

const weekDays = [
  { id: "Monday", label: "Mon" },
  { id: "Tuesday", label: "Tue" },
  { id: "Wednesday", label: "Wed" },
  { id: "Thursday", label: "Thu" },
  { id: "Friday", label: "Fri" },
  { id: "Saturday", label: "Sat" },
  { id: "Sunday", label: "Sun" },
];

// Tracker for warnings to avoid excessive console logs
const warnedAboutCronExpressions = { value: false };

// Convert between UI-friendly time/days format and cron expression
const timeDaysToCron = (time: string, days: string[]): string => {
  // Validate time format
  if (!time || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    console.warn(`Invalid time format: "${time}", using default 08:00`);
    time = "08:00";
  }
  
  // Validate days - ensure at least one valid day is selected
  if (!days || !Array.isArray(days) || days.length === 0) {
    console.warn("No days selected, using all days");
    days = weekDays.map(d => d.id);
  }
  
  // Extract hours and minutes
  const [hours, minutes] = time.split(':').map(Number);
  
  // Validate the extracted values
  const validMinutes = !isNaN(minutes) && minutes >= 0 && minutes <= 59 ? minutes : 0;
  const validHours = !isNaN(hours) && hours >= 0 && hours <= 23 ? hours : 8;
  
  // Convert days to cron format
  const dayNumbers = days
    .filter(day => weekDays.some(d => d.id === day)) // Filter out invalid days
    .map(day => {
      const index = weekDays.findIndex(d => d.id === day);
      if (index === -1) {
        console.warn(`Invalid day: "${day}", skipping`);
        return null;
      }
      // Convert to cron format (0-6, where 0 is Sunday in cron)
      return (index + 1) % 7;
    })
    .filter(Boolean) // Remove null values
    .sort()
    .join(',');
  
  // Use * for all days if no valid days were found
  const daysPart = dayNumbers || '*';
  
  // Format: "minute hour * * day-of-week"
  return `${validMinutes} ${validHours} * * ${daysPart}`;
};

const cronToTimeDays = (cronExpression: string | undefined): { time: string; days: string[] } => {
  // Handle undefined or empty cron expression
  if (!cronExpression) {
    // Instead of warning, log once and use a default value
    if (!warnedAboutCronExpressions.value) {
      console.warn("Empty or undefined cron expression provided, using default values");
      warnedAboutCronExpressions.value = true;
    }
    return { time: "08:00", days: ["Monday"] };
  }
  
  try {
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      console.warn(`Invalid cron expression format: "${cronExpression}" (expected 5 parts)`);
      return { time: "08:00", days: ["Monday"] };
    }
    
    const minutes = parts[0];
    const hours = parts[1];
    const dayOfWeek = parts[4];
    
    // Validate minutes and hours
    if (!/^\d+$/.test(minutes) || !/^\d+$/.test(hours)) {
      console.warn(`Invalid time in cron expression: "${cronExpression}"`);
      return { time: "08:00", days: ["Monday"] };
    }
    
    // Format time as HH:MM
    const time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    
    // Parse days
    const days: string[] = [];
    if (dayOfWeek !== '*') {
      try {
        dayOfWeek.split(',').forEach(day => {
          // Validate day format
          if (!/^\d+$/.test(day)) {
            throw new Error(`Invalid day format in cron expression: "${day}"`);
          }
          
          // Convert cron day (0-6, Sunday=0) to our format
          const dayNumber = (parseInt(day) + 6) % 7;
          const weekDay = weekDays[dayNumber];
          if (weekDay) days.push(weekDay.id);
          else throw new Error(`Invalid day number in cron expression: "${day}"`);
        });
        
        // If parsing succeeded but no valid days were found, use all days
        if (days.length === 0) {
          console.warn(`No valid days found in cron expression: "${cronExpression}"`);
          days.push(...weekDays.map(d => d.id));
        }
      } catch (error) {
        console.warn(`Error parsing days in cron expression: "${cronExpression}"`, error);
        days.push(...weekDays.map(d => d.id));
      }
    } else {
      // If '*', include all days
      days.push(...weekDays.map(d => d.id));
    }
    
    return { time, days };
  } catch (error) {
    console.error(`Error parsing cron expression: "${cronExpression}"`, error);
    return { time: "08:00", days: ["Monday"] };
  }
};

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in 24h format (HH:MM)"),
  days: z.array(z.string()).min(1, "Select at least one day"),
  action: z.enum(["on", "off"]),
  brightness: z.number().min(1).max(100).optional(),
  color: z.string().optional(),
});

// Utility function to safely get action properties
const getActionProperty = (
  action: string | Record<string, unknown>, 
  property: string, 
  defaultValue?: unknown
): unknown => {
  if (typeof action === 'string') {
    try {
      // Try to parse the action string as JSON
      const parsed = JSON.parse(action) as Record<string, unknown>;
      return parsed[property] ?? defaultValue;
    } catch (e) {
      // If action is a simple string (like "on" or "off"), return it for the type property
      return property === 'type' ? action : defaultValue;
    }
  }
  
  // If action is an object, directly access the property
  return action[property] ?? defaultValue;
};

// Type-safe wrapper functions
const getActionType = (action: string | Record<string, unknown>, defaultValue: "on" | "off" = 'on'): "on" | "off" => {
  const result = getActionProperty(action, 'type', defaultValue) as string;
  return (result === 'off' ? 'off' : 'on') as "on" | "off";
};

const getActionBrightness = (action: string | Record<string, unknown>, defaultValue?: number): number | undefined => {
  return getActionProperty(action, 'brightness', defaultValue) as number | undefined;
};

const getActionColor = (action: string | Record<string, unknown>, defaultValue?: string): string | undefined => {
  return getActionProperty(action, 'color', defaultValue) as string | undefined;
};

// Utility function to safely get the schedule ID
const getScheduleId = (schedule: ExtendedSchedule): number => {
  // Return whichever ID field exists, preferring schedule.id
  return typeof schedule.id === 'number' ? schedule.id : (schedule.schedule_id as number);
};

export function ScheduleManager({ device }: ScheduleManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExtendedSchedule | null>(null);
  const { toast } = useToast();
  
  // API hooks
  const { data: schedules = [], isLoading } = useDeviceSchedules(device.id);
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  
  // Add a filtering step to remove invalid schedules
  const validSchedules = (schedules as ExtendedSchedule[]).filter(schedule => {
    const isValid = !!schedule && (typeof schedule.id === 'number' || typeof schedule.schedule_id === 'number');
    if (!isValid) {
      console.warn('Invalid schedule found:', schedule);
    }
    return isValid;
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      time: "08:00",
      days: ["Monday"],
      action: "on",
      brightness: device.type !== "light" ? 70 : undefined,
      color: device.type === "strip" ? "#ffffff" : undefined,
    },
  });
  
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert time and days to cron expression
    const cronExpression = timeDaysToCron(values.time, values.days);
    
    // Prepare action object
    const action: Record<string, unknown> = {
      type: values.action,
    };
    
    // Add brightness and color if provided
    if (values.brightness !== undefined) {
      action.brightness = values.brightness;
    }
    
    if (values.color) {
      action.color = values.color;
    }
    
    if (editingSchedule) {
      // Make sure we have a valid ID before updating
      const scheduleId = getScheduleId(editingSchedule);
      if (!scheduleId) {
        toast({
          title: "Error updating schedule",
          description: "Schedule ID is missing or invalid.",
          variant: "destructive",
        });
        return;
      }
      
      // Update existing schedule
      updateScheduleMutation.mutate({
        id: scheduleId,
        data: {
          name: values.name,
          cronExpression,
          action
        }
      }, {
        onSuccess: () => {
          toast({
            title: "Schedule updated",
            description: `"${values.name}" has been updated successfully.`,
          });
          setOpen(false);
          form.reset();
          setEditingSchedule(null);
        },
        onError: (error) => {
          toast({
            title: "Failed to update schedule",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    } else {
      // Create new schedule
      createScheduleMutation.mutate({
        name: values.name,
        deviceId: device.id,
        cronExpression,
        action
      }, {
        onSuccess: () => {
          toast({
            title: "Schedule created",
            description: `"${values.name}" will run as scheduled.`,
          });
          setOpen(false);
          form.reset();
        },
        onError: (error) => {
          toast({
            title: "Failed to create schedule",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };
  
  const handleEdit = (schedule: ExtendedSchedule) => {
    // Parse cron expression to time and days
    const { time, days } = cronToTimeDays(schedule.cronExpression);
    
    form.reset({
      name: schedule.name,
      time,
      days,
      action: getActionType(schedule.action),
      brightness: getActionBrightness(schedule.action),
      color: getActionColor(schedule.action),
    });
    
    setEditingSchedule(schedule);
    setOpen(true);
  };
  
  const handleDelete = (scheduleId: number) => {
    if (!scheduleId) {
      toast({
        title: "Error deleting schedule",
        description: "Schedule ID is missing or invalid.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate(scheduleId, {
        onSuccess: () => {
          toast({
            title: "Schedule deleted",
            description: "The schedule has been removed successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to delete schedule",
            description: error.message,
            variant: "destructive",
          });
        }
      });
    }
  };
  
  const handleToggleActive = (schedule: ExtendedSchedule) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) {
      toast({
        title: "Error toggling schedule",
        description: "Schedule ID is missing or invalid.",
        variant: "destructive",
      });
      return;
    }
    
    updateScheduleMutation.mutate({
      id: scheduleId,
      data: {
        isActive: !schedule.isActive
      }
    }, {
      onSuccess: () => {
        toast({
          title: schedule.isActive ? "Schedule disabled" : "Schedule enabled",
          description: `"${schedule.name}" is now ${schedule.isActive ? "inactive" : "active"}.`,
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to update schedule",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const onActionChange = (value: string) => {
    // If action is "off", clear brightness and color
    if (value === "off") {
      form.setValue("brightness", undefined);
      form.setValue("color", undefined);
    } else {
      // If action is "on", set default values if they're undefined
      if (device.type !== "light" && !form.getValues("brightness")) {
        form.setValue("brightness", 70);
      }
      if (device.type === "strip" && !form.getValues("color")) {
        form.setValue("color", "#ffffff");
      }
    }
  };
  
  // Calculate the next upcoming schedule
  const getNextSchedule = () => {
    if (!validSchedules.length) return null;
    
    const activeSchedules = validSchedules.filter(s => s.isActive);
    if (!activeSchedules.length) return null;
    
    // Use the first active schedule for simplicity
    // A more complex implementation would parse cron expressions to determine which is next
    return activeSchedules[0];
  };
  
  const nextSchedule = getNextSchedule();
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Schedules
          </CardTitle>
          <CardDescription>Loading schedules...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" />
          Schedules
        </CardTitle>
        <CardDescription>
          {validSchedules.length ? 
            `${validSchedules.length} schedule${validSchedules.length !== 1 ? 's' : ''}, ${validSchedules.filter(s => s.isActive).length} active` : 
            'No schedules set for this device'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {validSchedules.length > 0 ? (
          <div className="divide-y">
            {validSchedules.map((schedule) => {
                try {
                  const { time, days } = cronToTimeDays(schedule.cronExpression);
                  const actionType = getActionType(schedule.action);
                  const scheduleId = getScheduleId(schedule);
                  
                  return (
                    <div key={scheduleId} className="flex items-center justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className={cn(
                            "h-4 w-4",
                            schedule.isActive ? "text-primary" : "text-muted-foreground"
                          )} />
                          <h4 className="font-medium">{schedule.name}</h4>
                          {schedule.scene && (
                            <Badge variant="outline" className="ml-1">
                              Scene: {schedule.scene.name}
                            </Badge>
                          )}
                          <Badge variant={actionType === "on" ? "default" : "secondary"}>
                            {actionType === "on" ? "On" : "Off"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {time} on {days.map((day, index) => (
                            <span key={`${scheduleId}-day-${index}`}>
                              {index > 0 && ", "}
                              {weekDays.find(d => d.id === day)?.label || day}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleToggleActive(schedule)}
                              >
                                {schedule.isActive ? 
                                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              {schedule.isActive ? "Disable schedule" : "Enable schedule"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(schedule)}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Edit schedule
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(scheduleId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Delete schedule
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering schedule:', error);
                  return (
                    <div key={getScheduleId(schedule) || 'error'} className="p-4 text-destructive">
                      Error displaying schedule: {schedule.name || 'Unknown'}
                    </div>
                  );
                }
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No schedules have been created for this device yet.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 p-4">
        <div className="flex items-center justify-between w-full">
          <div>
            {nextSchedule && (
              <div className="text-sm">
                <span className="text-muted-foreground">Next: </span>
                <span className="font-medium">
                  {nextSchedule.name}{' '}
                  {nextSchedule.cronExpression ? 
                    `(${cronToTimeDays(nextSchedule.cronExpression).time})` : 
                    '(time not set)'
                  }
                </span>
              </div>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="schedule-dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </DialogTitle>
                <DialogDescription id="schedule-dialog-description">
                  {editingSchedule 
                    ? 'Modify the schedule settings below.' 
                    : 'Set up a schedule for this device to turn on or off automatically.'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Morning Light" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="action"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              onActionChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select action" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="on">Turn On</SelectItem>
                              <SelectItem value="off">Turn Off</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="days"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>Days</FormLabel>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {weekDays.map((day) => (
                            <FormField
                              key={day.id}
                              control={form.control}
                              name="days"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={day.id}
                                    className="flex flex-row items-center space-x-1 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(day.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, day.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== day.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {day.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("action") === "on" && device.type !== "light" && (
                    <FormField
                      control={form.control}
                      name="brightness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brightness</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Set brightness level (1-100)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch("action") === "on" && device.type === "strip" && (
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                className="w-12 h-8 p-1"
                                {...field}
                              />
                              <Input
                                type="text"
                                placeholder="#FFFFFF"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Select color for the light strip</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}>
                      {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
