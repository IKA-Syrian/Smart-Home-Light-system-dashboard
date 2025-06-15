import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DailyScheduleForm } from "./daily-schedule-form";
import { Schedule } from "@/types/api";

interface ScheduleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onSuccess?: () => void;
}

export function ScheduleEditDialog({ open, onOpenChange, schedule, onSuccess }: ScheduleEditDialogProps) {
  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="edit-schedule-description">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription id="edit-schedule-description">
            Update the schedule settings for this device.
          </DialogDescription>
        </DialogHeader>
        <DailyScheduleForm
          scheduleId={schedule.id}
          deviceId={schedule.deviceId}
          editMode={true}
          defaultValues={{
            ledId: schedule.ledId,
            onHour: schedule.onHour,
            onMinute: schedule.onMinute,
            offHour: schedule.offHour,
            offMinute: schedule.offMinute,
            isActive: schedule.isActive,
          }}
          onSuccess={() => {
            onOpenChange(false);
            if (onSuccess) onSuccess();
          }}
          onCancel={() => {
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
} 