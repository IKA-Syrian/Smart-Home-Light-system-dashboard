import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface DeviceBrightnessControlProps {
  brightness: number;
  isEnabled: boolean;
  onChange: (value: number) => void;
  deviceId: number;
}

export function DeviceBrightnessControl({ 
  brightness, 
  isEnabled, 
  onChange,
  deviceId
}: DeviceBrightnessControlProps) {
  const { isConnected, sendControlMessage } = useWebSocket();
  
  // Log initial brightness value
  useEffect(() => {
    console.log(`BrightnessControl: Initial brightness=${brightness}, isEnabled=${isEnabled}, deviceId=${deviceId}`);
  }, []);

  // Handle brightness change with logging
  const handleBrightnessChange = (value: number) => {
    console.log(`BrightnessControl: Changing brightness to ${value}, isEnabled=${isEnabled}, deviceId=${deviceId}`);
    
    // Try WebSocket for real-time control first
    if (isEnabled && isConnected) {
      sendControlMessage(deviceId, 'setBrightness', { brightness: value });
    }
    
    // Still call the onChange handler to update the UI and database
    onChange(value);
  };

  return (
    <div className="pt-2">
      <div className="text-xs text-muted-foreground mb-1">
        Brightness
        {isConnected && isEnabled && <span className="text-xs text-green-500 ml-2">(Real-time)</span>}
      </div>
      <Slider 
        value={[brightness]} 
        min={1}
        max={100}
        step={1}
        disabled={!isEnabled}
        onValueChange={(value) => handleBrightnessChange(value[0])}
        className={cn(!isEnabled && "opacity-50")}
      />
    </div>
  );
}
