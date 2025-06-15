import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Clock, 
  Power 
} from "lucide-react";
import { DailyScheduleForm } from "./daily-schedule-form";
import { DailySchedule, dailyScheduleApi } from "@/services/dailyScheduleService";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailySchedulesListProps {
  deviceId: number;
}

export function DailySchedulesList({ deviceId }: DailySchedulesListProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DailySchedule | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);

  // Fetch device daily schedules
  const { data: schedules, isLoading, isError, refetch } = useQuery({
    queryKey: ["daily-schedules", deviceId],
    queryFn: () => dailyScheduleApi.getDeviceDailySchedules(deviceId),
  });

  // Handle schedule status toggle
  const handleStatusToggle = async (schedule: DailySchedule) => {
    setIsUpdatingStatus(schedule.id);
    try {
      await dailyScheduleApi.updateDailySchedule(schedule.id, {
        isActive: !schedule.isActive,
      });
      toast.success(`Schedule ${schedule.isActive ? "disabled" : "enabled"}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update schedule status");
      console.error("Status toggle error:", error);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Handle schedule deletion
  const handleDelete = async () => {
    if (!selectedSchedule) return;
    
    try {
      const success = await dailyScheduleApi.deleteDailySchedule(selectedSchedule.id);
      if (success) {
        toast.success("Schedule deleted successfully");
        refetch();
      } else {
        toast.error("Failed to delete schedule");
      }
    } catch (error) {
      toast.error("Error deleting schedule");
      console.error("Delete error:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSchedule(null);
    }
  };

  // Handle apply schedule to Arduino
  const handleApplySchedule = async (schedule: DailySchedule) => {
    try {
      const success = await dailyScheduleApi.applyDailySchedule(schedule.id);
      if (success) {
        toast.success("Schedule applied to Arduino");
      } else {
        toast.error("Failed to apply schedule");
      }
    } catch (error) {
      toast.error("Error applying schedule");
      console.error("Apply schedule error:", error);
    }
  };

  const closeAllDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedSchedule(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Daily Schedules</CardTitle>
        <Button
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          className="ml-auto"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground">Loading schedules...</div>
        ) : isError ? (
          <div className="py-6 text-center text-muted-foreground">Error loading schedules</div>
        ) : !schedules || schedules.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No daily schedules set up yet. Create one to automatically control your device.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LED</TableHead>
                <TableHead>On Time</TableHead>
                <TableHead>Off Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell>LED {schedule.ledId}</TableCell>
                  <TableCell>{schedule.formattedOnTime}</TableCell>
                  <TableCell>{schedule.formattedOffTime}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={schedule.isActive}
                        onCheckedChange={() => handleStatusToggle(schedule)}
                        disabled={isUpdatingStatus === schedule.id}
                      />
                      <Badge variant={schedule.isActive ? "default" : "outline"}>
                        {schedule.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsEditDialogOpen(true);
                        }}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleApplySchedule(schedule)}
                        title="Apply now"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add Schedule Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent aria-describedby="add-schedule-description">
            <DialogHeader>
              <DialogTitle>Add Daily Schedule</DialogTitle>
              <DialogDescription id="add-schedule-description">
                Set a daily on/off schedule for a specific LED on this device.
              </DialogDescription>
            </DialogHeader>
            <DailyScheduleForm
              deviceId={deviceId}
              onSuccess={() => {
                refetch();
                setIsAddDialogOpen(false);
              }}
              onCancel={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Dialog */}
        {selectedSchedule && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent aria-describedby="edit-schedule-description">
              <DialogHeader>
                <DialogTitle>Edit Daily Schedule</DialogTitle>
                <DialogDescription id="edit-schedule-description">
                  Update the schedule for LED {selectedSchedule.ledId}.
                </DialogDescription>
              </DialogHeader>
              <DailyScheduleForm
                deviceId={deviceId}
                editMode={true}
                scheduleId={selectedSchedule.id}
                defaultValues={{
                  ledId: selectedSchedule.ledId,
                  onHour: selectedSchedule.onHour,
                  onMinute: selectedSchedule.onMinute,
                  offHour: selectedSchedule.offHour,
                  offMinute: selectedSchedule.offMinute,
                  isActive: selectedSchedule.isActive,
                }}
                onSuccess={() => {
                  refetch();
                  setIsEditDialogOpen(false);
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this schedule? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
} 