import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Device } from "@/types/api";
import { useDeviceStore } from "@/store/integratedDeviceStore";
import { useToggleDevice, useUpdateDeviceState } from "@/hooks/useApi";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DeviceStatusIndicator } from "./device-status-indicator";
import { DeviceBrightnessControl } from "./device-brightness-control";
import { DeviceColorPicker } from "./device-color-picker";
import { DeviceControlButtons } from "./device-control-buttons";
import { DeviceDetailDialog } from "./device-detail-dialog";
import { useWebSocket } from "@/contexts/WebSocketContext";

interface DeviceCardProps {
  device: Device;
  className?: string;
}

export function DeviceCard({ device, className }: DeviceCardProps) {
  const { setDeviceUpdating } = useDeviceStore();
  const toggleDeviceMutation = useToggleDevice();
  const updateDeviceStateMutation = useUpdateDeviceState();
  const { isConnected, sendControlMessage } = useWebSocket();
  
  const [currentBrightness, setCurrentBrightness] = useState(
    device?.brightness || 100
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "energy">("schedule");

  // Handle brightness change with debounce
  useEffect(() => {
    if (!device || typeof device.id !== 'number') return;
    
    const timer = setTimeout(() => {
      if (device.brightness !== currentBrightness && device.type === "light") {
        // Send WebSocket message first for immediate feedback
        if (isConnected) {
          sendControlMessage(device.id, 'setBrightness', { brightness: currentBrightness });
        }
        
        // Update the database (API) as well
        updateDeviceStateMutation.mutate({
          id: device.id,
          state: { brightness: currentBrightness }
        });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentBrightness, device, updateDeviceStateMutation, isConnected, sendControlMessage]);

  if (!device || typeof device.id !== 'number') {
    console.error('DeviceCard rendered with invalid device prop:', device);
    return (
      <Card className={cn("p-4 sm:p-5 border-destructive", className)}>
        <p className="text-destructive-foreground">Invalid device data</p>
      </Card>
    );
  }

  // Handle device toggle
  const handleToggle = async () => {
    console.log('Toggle clicked for device:', device);
    
    // New state will be the opposite of current state
    const newState = device.status === 'on' ? 'off' : 'on';
    console.log(`Toggling device ${device.id} from ${device.status} to ${newState}`);
    
    setDeviceUpdating(device.id, true);
    try {
      // Use direct API call instead of going through the mutation to ensure immediate update
      const deviceId = device.id;
      const isOn = newState === 'on';
      
      // First, try to use WebSocket for real-time control
      const wsSuccess = isConnected && sendControlMessage(deviceId, isOn ? 'turnOn' : 'turnOff');
      
      // Update API to keep database in sync (always do this regardless of WebSocket success)
      await toggleDeviceMutation.mutateAsync({ 
        id: deviceId, 
        isOn: isOn 
      });
      
      console.log(`Device ${deviceId} toggled successfully to ${newState}`);
    } catch (error) {
      console.error('Failed to toggle device:', error);
      // Errors will be shown via WebSocketContext toast system
    } finally {
      setDeviceUpdating(device.id, false);
    }
  };

  // Handle color change
  const handleColorChange = (colorValue: string) => {
    if (device.isConnected && device.status === 'on') {
      // Try WebSocket first for real-time feedback
      if (isConnected) {
        sendControlMessage(device.id, 'setColor', { color: colorValue });
      }
      
      // Update database via API
      updateDeviceStateMutation.mutate({
        id: device.id,
        state: { color: colorValue }
      });
    }
  };

  // Calculate if device has schedules (mock for now)
  const hasSchedules = false; // device.schedules && device.schedules.length > 0;
  const activeSchedulesCount = 0; // device.schedules?.filter(s => s.isActive).length || 0;

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 overflow-hidden",
        device.status === 'on' ? "card-highlight animate-glow" : "",
        device.color && device.status === 'on' ? "border-l-4" : "",
        device.color && device.status === 'on' ? `border-l-[${device.color}]` : "",
        !isConnected && "opacity-90", // Subtle indication that real-time control is not available
        className
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium truncate">{device.name}</h3>
                <p className="text-xs text-muted-foreground">
                  <DeviceStatusIndicator isConnected={device.isConnected} />
                  {!isConnected && <span className="ml-2 text-amber-500">(Offline mode)</span>}
                </p>
              </div>
              <Switch 
                checked={device.status === 'on'} 
                onCheckedChange={handleToggle}
                className={cn(
                  device.status === 'on' && "bg-primary",
                  !device.isConnected && "opacity-50 cursor-not-allowed"
                )}
                disabled={!device.isConnected}
              />
            </div>
            
            {(device.type === "dimmer" || device.type === "strip") && (
              <DeviceBrightnessControl
                brightness={currentBrightness}
                isEnabled={device.status === 'on' && device.isConnected}
                onChange={setCurrentBrightness}
                deviceId={device.id}
              />
            )}
            
            {/* Color control for strip lights */}
            {device.type === "strip" && (
              <DeviceColorPicker
                color={device.color}
                isEnabled={device.status === 'on' && device.isConnected}
                onColorChange={handleColorChange}
              />
            )}

            {/* Control features: Schedule and Energy Usage */}
            <DeviceControlButtons
              hasSchedules={hasSchedules}
              activeSchedulesCount={activeSchedulesCount}
              onOpenSchedule={() => {
                setActiveTab("schedule");
                setDetailsOpen(true);
              }}
              onOpenEnergy={() => {
                setActiveTab("energy");
                setDetailsOpen(true);
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      <DeviceDetailDialog
        device={device}
        isOpen={detailsOpen}
        activeTab={activeTab}
        onOpenChange={setDetailsOpen}
        onTabChange={setActiveTab}
      />
    </>
  );
}
