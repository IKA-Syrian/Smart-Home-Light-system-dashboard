import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { Lightbulb, Palette, Zap, Power, Gauge, Activity } from "lucide-react";

interface DeviceControlPanelProps {
  deviceId: number;
  ledId: number;
  deviceName?: string;
  initialBrightness?: number;
  initialColor?: string;
}

export function DeviceControlPanel({
  deviceId,
  ledId,
  deviceName = "LED Controller",
  initialBrightness = 0,
  initialColor = "#FFFFFF"
}: DeviceControlPanelProps) {
  const [brightness, setBrightness] = useState(initialBrightness);
  const [color, setColor] = useState(initialColor);
  const [isOn, setIsOn] = useState(initialBrightness > 0);
  const [isAuto, setIsAuto] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("brightness");
  const { isConnected, sendControlMessage } = useWebSocket();

  // Map brightness from 0-255 to 0-100 for UI
  const brightnessPercentage = Math.round((brightness / 255) * 100);

  // Update brightness in Arduino
  const handleBrightnessChange = (value: number) => {
    const newBrightness = Math.round((value / 100) * 255);
    setBrightness(newBrightness);
    
    if (isConnected) {
      console.log(`Sending brightness ${newBrightness} to device ${deviceId}, LED ${ledId}`);
      sendControlMessage(deviceId, 'setBrightness', { 
        ledId, 
        brightness: newBrightness 
      });
    }
    
    // If we're turning on from zero, update the isOn state
    if (newBrightness > 0 && !isOn) {
      setIsOn(true);
    } else if (newBrightness === 0 && isOn) {
      setIsOn(false);
    }
  };

  // Handle color change (for demo only)
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    console.log(`Color changed to ${newColor} (demo only - not sent to device)`);
  };

  // Toggle device on/off
  const togglePower = () => {
    const newIsOn = !isOn;
    setIsOn(newIsOn);
    
    if (isConnected) {
      if (newIsOn) {
        // Turn on with last brightness or default to full
        const targetBrightness = brightness > 0 ? brightness : 255;
        setBrightness(targetBrightness);
        sendControlMessage(deviceId, 'turnOn', { ledId });
        sendControlMessage(deviceId, 'setBrightness', { 
          ledId, 
          brightness: targetBrightness 
        });
      } else {
        // Turn off
        sendControlMessage(deviceId, 'turnOff', { ledId });
      }
    }
  };

  // Toggle auto mode
  const toggleAutoMode = () => {
    const newAutoState = !isAuto;
    setIsAuto(newAutoState);
    
    if (isConnected) {
      sendControlMessage(deviceId, 'setAuto', { 
        ledId, 
        auto: newAutoState 
      });
      
      console.log(`Set LED ${ledId} auto mode to ${newAutoState ? 'ON' : 'OFF'}`);
    }
  };

  // Preset brightness levels
  const presetLevels = [
    { name: "Low", value: 64 },
    { name: "Medium", value: 128 },
    { name: "High", value: 192 },
    { name: "Max", value: 255 }
  ];

  // Preset colors
  const presetColors = [
    { name: "Warm White", value: "#FFF4E0" },
    { name: "Cool White", value: "#F1F6FF" },
    { name: "Red", value: "#FF5B5B" },
    { name: "Green", value: "#4CAF50" },
    { name: "Blue", value: "#2196F3" },
    { name: "Purple", value: "#9C27B0" },
    { name: "Orange", value: "#FF9800" },
    { name: "Pink", value: "#E91E63" }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{deviceName}</CardTitle>
          <div className="flex gap-2">
            <Button 
              variant={isAuto ? "default" : "outline"} 
              size="sm" 
              className={`rounded-full w-10 h-10 p-0 ${isAuto ? "bg-blue-500 hover:bg-blue-600" : ""}`}
              onClick={toggleAutoMode}
              disabled={!isConnected}
              title="Toggle Auto Mode"
            >
              <Activity className={`h-5 w-5 ${isAuto ? "text-white" : "text-muted-foreground"}`} />
            </Button>
            <Button 
              variant={isOn ? "default" : "outline"} 
              size="sm" 
              className={`rounded-full w-10 h-10 p-0 ${isOn ? "bg-primary" : ""}`}
              onClick={togglePower}
              disabled={!isConnected}
            >
              <Power className={`h-5 w-5 ${isOn ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={isAuto ? "opacity-50 pointer-events-none" : ""}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="brightness" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                <span>Brightness</span>
              </TabsTrigger>
              <TabsTrigger value="color" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span>Color</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="brightness" className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Brightness</span>
                  <span className="text-sm font-medium">{brightnessPercentage}%</span>
                </div>
                <Slider
                  value={[brightnessPercentage]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleBrightnessChange(values[0])}
                  disabled={!isConnected || !isOn || isAuto}
                  className={!isConnected || !isOn ? "opacity-50" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Presets</div>
                <div className="grid grid-cols-4 gap-2">
                  {presetLevels.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      disabled={!isConnected || !isOn || isAuto}
                      className={brightness === preset.value ? "border-primary" : ""}
                      onClick={() => handleBrightnessChange((preset.value / 255) * 100)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {!isConnected && (
                <div className="text-xs text-amber-500 mt-2">
                  Device is offline. Brightness control unavailable.
                </div>
              )}
              {isAuto && (
                <div className="text-xs text-blue-500 mt-2">
                  Auto mode is active. Manual controls are disabled.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="color" className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Custom Color</span>
                  <span className="text-sm font-medium">{color}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-10 h-10 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    disabled={!isOn || isAuto}
                    className="w-full h-10"
                    title="Select color"
                    aria-label="Select color for the LED"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Note: Color control is for demonstration only
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Preset Colors</div>
                <div className="grid grid-cols-4 gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.name}
                      disabled={!isOn || isAuto}
                      className="w-full h-10 rounded border hover:scale-105 transition-transform flex items-center justify-center"
                      style={{ backgroundColor: preset.value }}
                      onClick={() => handleColorChange(preset.value)}
                      title={preset.name}
                    >
                      <span className="sr-only">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Zap className={`h-4 w-4 ${isConnected ? "text-green-500" : "text-amber-500"}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {isAuto && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Auto Mode
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Device ID: {deviceId} • LED: {ledId}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 