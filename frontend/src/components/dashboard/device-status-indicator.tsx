
import { cn } from "@/lib/utils";

interface DeviceStatusIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export function DeviceStatusIndicator({ isConnected, className }: DeviceStatusIndicatorProps) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span 
        className={cn(
          "h-2 w-2 shrink-0 rounded-full inline-block",
          isConnected ? "bg-green-500" : "bg-red-500"
        )} 
      />
      <span className="truncate">
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </span>
  );
}
