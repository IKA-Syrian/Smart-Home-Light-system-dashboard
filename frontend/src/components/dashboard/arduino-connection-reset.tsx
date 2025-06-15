import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Activity, RefreshCw } from "lucide-react";
import { useArduino } from "@/hooks/useArduino";
import { apiClient } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

export function ArduinoConnectionReset() {
  const [isResetting, setIsResetting] = useState(false);
  const { connectionInfo, wsConnected, refreshStatus } = useArduino();
  const { toast } = useToast();

  // Reset the Arduino Serial connection
  const handleConnectionReset = async () => {
    setIsResetting(true);
    try {
      const response = await apiClient.post('/arduino/reset');
      
      toast({
        title: "Connection Reset Request Sent",
        description: "The Arduino connection reset has been requested. Please wait a moment."
      });

      // Wait a moment before refreshing status
      setTimeout(async () => {
        await refreshStatus();
        setIsResetting(false);
        
        toast({
          title: "Status Refreshed",
          description: "Arduino connection status has been refreshed."
        });
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset Arduino connection";
      
      toast({
        title: "Reset Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      setIsResetting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Arduino Connection Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Connection Status</h4>
              <p className="text-sm text-muted-foreground">
                Serial Port: {connectionInfo?.port || "Unknown"}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-md ${connectionInfo?.isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {connectionInfo?.isOpen ? "Connected" : "Disconnected"}
            </div>
          </div>

          {/* WebSocket Status */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">WebSocket Status</h4>
              <p className="text-sm text-muted-foreground">
                Real-time data connection
              </p>
            </div>
            <div className={`px-2 py-1 rounded-md ${wsConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {wsConnected ? "Connected" : "Disconnected"}
            </div>
          </div>

          {/* Last Message */}
          <div className="space-y-1">
            <h4 className="font-medium">Last Arduino Message</h4>
            <p className="text-sm bg-gray-50 p-2 rounded border">
              {connectionInfo?.lastMessage || "No messages received"}
            </p>
          </div>

          {/* Warning when disconnected */}
          {!connectionInfo?.isOpen && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div className="text-sm text-yellow-700">
                Arduino not connected. PIR and LED controls may not work properly.
              </div>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              disabled={isResetting}
              onClick={handleConnectionReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isResetting ? "animate-spin" : ""}`} />
              {isResetting ? "Resetting..." : "Reset Connection"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 