import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CreateDailyScheduleRequest, dailyScheduleApi } from "@/services/dailyScheduleService";

interface DailyScheduleFormProps {
  deviceId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: {
    ledId?: number;
    onHour?: number;
    onMinute?: number;
    offHour?: number;
    offMinute?: number;
    isActive?: boolean;
  };
  editMode?: boolean;
  scheduleId?: number;
}

// The validation schema must allow LED IDs 0, 1, or 2 only
const formSchema = z.object({
  ledId: z.number().min(0).max(2),
  onHour: z.number().min(0).max(23),
  onMinute: z.number().min(0).max(59),
  offHour: z.number().min(0).max(23),
  offMinute: z.number().min(0).max(59),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export function DailyScheduleForm({ 
  deviceId, 
  onSuccess, 
  onCancel,
  defaultValues,
  editMode = false,
  scheduleId
}: DailyScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define form with proper default values
  // IMPORTANT: The LED IDs in the database and Arduino are 0-based (0, 1, 2)
  // No conversion needed - use the LED ID directly as provided
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ledId: defaultValues?.ledId ?? 0,
      onHour: defaultValues?.onHour ?? 8,
      onMinute: defaultValues?.onMinute ?? 0,
      offHour: defaultValues?.offHour ?? 20,
      offMinute: defaultValues?.offMinute ?? 0,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editMode && scheduleId) {
        // Update existing schedule
        await dailyScheduleApi.updateDailySchedule(scheduleId, {
          onHour: data.onHour,
          onMinute: data.onMinute,
          offHour: data.offHour,
          offMinute: data.offMinute,
          isActive: data.isActive,
        });
        
        // Apply all schedules to ensure changes take effect
        try {
          await dailyScheduleApi.applyAllSchedules();
        } catch (applyError) {
          console.error("Error applying schedules:", applyError);
          // Continue even if apply fails
        }
        
        toast.success("Daily schedule updated successfully");
      } else {
        // Create new schedule
        // IMPORTANT: Use LED ID directly without conversion
        const scheduleData: CreateDailyScheduleRequest = {
          deviceId,
          ledId: data.ledId, // No conversion needed
          onHour: data.onHour,
          onMinute: data.onMinute,
          offHour: data.offHour,
          offMinute: data.offMinute,
          isActive: data.isActive,
        };
        await dailyScheduleApi.createDailySchedule(scheduleData);
        
        // Apply all schedules to ensure changes take effect
        try {
          await dailyScheduleApi.applyAllSchedules();
        } catch (applyError) {
          console.error("Error applying schedules:", applyError);
          // Continue even if apply fails
        }
        
        toast.success("Daily schedule created successfully");
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Schedule form error details:", error);
      toast.error(editMode 
        ? `Failed to update schedule. Please try again.` 
        : "Failed to create schedule. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate hour and minute options
  const hoursOptions = Array.from({ length: 24 }, (_, i) => ({ value: i, label: i.toString().padStart(2, "0") }));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => ({ value: i, label: i.toString().padStart(2, "0") }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {!editMode && (
          <FormField
            control={form.control}
            name="ledId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LED</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={(field.value ?? 0).toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LED" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">LED 1</SelectItem>
                    <SelectItem value="1">LED 2</SelectItem>
                    <SelectItem value="2">LED 3</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">On Time</h3>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="onHour"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Hour</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={(field.value ?? 0).toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hoursOptions.map(option => (
                          <SelectItem key={`on-hour-${option.value}`} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="onMinute"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Minute</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={(field.value ?? 0).toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {minutesOptions.map(option => (
                          <SelectItem key={`on-min-${option.value}`} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Off Time</h3>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="offHour"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Hour</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={(field.value ?? 0).toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hour" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hoursOptions.map(option => (
                          <SelectItem key={`off-hour-${option.value}`} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="offMinute"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Minute</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={(field.value ?? 0).toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Minute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {minutesOptions.map(option => (
                          <SelectItem key={`off-min-${option.value}`} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editMode ? "Update Schedule" : "Create Schedule"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 