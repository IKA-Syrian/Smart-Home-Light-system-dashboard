import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedEnergyChart } from "@/components/dashboard/enhanced-energy-chart";
import { MotionSensorControl } from "@/components/dashboard/motion-sensor-control";
import { ArduinoConnectionReset } from "@/components/dashboard/arduino-connection-reset";
import { useArduino } from "@/hooks/useArduino";

export default function DashboardPage() {
  const { arduinoStatus, refreshStatus } = useArduino();
  const [pirEnabled, setPirEnabled] = useState(false);

  // Fetch initial data
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Update PIR status when Arduino status changes
  useEffect(() => {
    if (arduinoStatus) {
      setPirEnabled(arduinoStatus.pirEnabled);
    }
  }, [arduinoStatus]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Smart Home Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Motion Sensor Control */}
        <MotionSensorControl initialEnabled={pirEnabled} />
        
        {/* Energy Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Energy Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedEnergyChart deviceId={1} ledId={2} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Arduino Connection Status and Reset */}
        <ArduinoConnectionReset />
      </div>
    </div>
  );
} 