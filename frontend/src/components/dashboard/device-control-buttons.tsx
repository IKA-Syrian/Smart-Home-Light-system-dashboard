
import { Calendar, ChartBar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeviceControlButtonsProps {
  hasSchedules: boolean;
  activeSchedulesCount: number;
  onOpenSchedule: () => void;
  onOpenEnergy: () => void;
}

export function DeviceControlButtons({ 
  hasSchedules, 
  activeSchedulesCount, 
  onOpenSchedule, 
  onOpenEnergy 
}: DeviceControlButtonsProps) {
  return (
    <div className="pt-2 flex flex-wrap items-center justify-between gap-y-2">
      <div className="text-xs text-muted-foreground">
        {hasSchedules && (
          <Badge variant="outline" className="text-xs px-2 py-0 flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{activeSchedulesCount} active</span>
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onOpenSchedule}
          className="flex items-center gap-1 bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-xs"
        >
          <Calendar className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">Schedule</span>
        </button>
        
        <button
          onClick={onOpenEnergy}
          className="flex items-center gap-1 bg-muted/50 hover:bg-muted px-2 py-1 rounded-md text-xs"
        >
          <ChartBar className="h-3 w-3 shrink-0" />
          <span className="whitespace-nowrap">Energy</span>
        </button>
      </div>
    </div>
  );
}
