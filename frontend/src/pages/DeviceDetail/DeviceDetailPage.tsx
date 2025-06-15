import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDeviceStore } from "@/store/integratedDeviceStore";
import { useQuery } from "@tanstack/react-query";
import { devicesApi } from "@/services/devicesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeviceControlPanel } from "@/components/dashboard/device-control-panel";
import { EnhancedEnergyChart } from "@/components/dashboard/enhanced-energy-chart";
import { Loader2 } from "lucide-react";

export default function DeviceDetailPage() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [activeTab, setActiveTab] = useState("control");
  const numericDeviceId = parseInt(deviceId || "0", 10);

  // Fetch device details
  const { data: device, isLoading, error } = useQuery({
    queryKey: ["device", numericDeviceId],
    queryFn: () => devicesApi.getDeviceById(numericDeviceId),
    enabled: !!numericDeviceId && numericDeviceId > 0,
  });

  // Map device ID to LED ID (simple mapping for demo)
  const ledId = numericDeviceId - 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-destructive mb-2">Error Loading Device</h2>
        <p className="text-muted-foreground">
          Could not load device with ID {deviceId}. Please check the device ID and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{device.name}</h1>
          <p className="text-muted-foreground">
            {device.type.charAt(0).toUpperCase() + device.type.slice(1)} • 
            {device.isConnected ? " Connected" : " Disconnected"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="control">Control</TabsTrigger>
          <TabsTrigger value="energy">Energy Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Control</CardTitle>
              </CardHeader>
              <CardContent>
                <DeviceControlPanel
                  deviceId={numericDeviceId}
                  ledId={ledId}
                  deviceName={device.name}
                  initialBrightness={device.brightness || 0}
                  initialColor={device.color || "#FFFFFF"}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Device ID</dt>
                    <dd className="text-lg">{device.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Type</dt>
                    <dd className="text-lg">{device.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-lg flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${device.status === 'on' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      {device.status === 'on' ? 'On' : 'Off'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Room</dt>
                    <dd className="text-lg">{device.room?.name || 'Unassigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                    <dd className="text-lg">{new Date(device.updatedAt || Date.now()).toLocaleString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="energy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedEnergyChart
                deviceId={numericDeviceId}
                ledId={ledId}
                title={`${device.name} Energy Usage`}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 