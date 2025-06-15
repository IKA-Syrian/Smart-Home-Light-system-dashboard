import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRoom, useRoomDevices } from "@/hooks/useApi";
import { Device } from "@/types/api";
import { DeviceCard } from "@/components/dashboard/device-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // Parse roomId to number, default to NaN if not a valid number string
  const parsedRoomId = roomId ? parseInt(roomId, 10) : NaN;
  
  // Determine the ID to pass to hooks. Pass 0 if parsed ID is not a positive number.
  // This ensures hooks are called with a number, and 0 will disable them due to `enabled: !!id`
  // logic within useRoom and useRoomDevices.
  const hookId = (!isNaN(parsedRoomId) && parsedRoomId > 0) ? parsedRoomId : 0;

  const { data: room, isLoading: roomLoading, error: roomError } = useRoom(hookId);
  const { data: rawRoomDevices = [], isLoading: devicesLoading } = useRoomDevices(hookId);
  
  console.log('Raw room devices from useRoomDevices:', rawRoomDevices);

  // Enhanced processing logic to handle various data structures
  const processedRoomDevices = rawRoomDevices.map(rawDevice => {
    if (!rawDevice) return null;
    
    // For debugging - log the first raw device object's exact structure
    if (rawRoomDevices.indexOf(rawDevice) === 0) {
      console.log('First raw device object structure:', rawDevice);
      console.log('First raw device type:', typeof rawDevice);
      console.log('Property names:', Object.keys(rawDevice));
    }
    
    // Handle common property name variations
    const possibleDeviceMap: Device = {
      // Try to find id using common variations
      id: getPropertyValue(rawDevice, ['id', 'device_id', 'deviceId', '_id']) as number,
      
      // Map other essential Device properties
      name: getPropertyValue(rawDevice, ['name', 'device_name', 'deviceName']) as string,
      type: getPropertyValue(rawDevice, ['type', 'device_type', 'deviceType']) as Device['type'],
      status: getPropertyValue(rawDevice, ['status', 'state']) as Device['status'],
      brightness: getPropertyValue(rawDevice, ['brightness']) as number | undefined,
      color: getPropertyValue(rawDevice, ['color']) as string | undefined,
      isConnected: getPropertyValue(rawDevice, ['isConnected', 'is_connected', 'connected']) as boolean,
      roomId: getPropertyValue(rawDevice, ['roomId', 'room_id']) as number,
      userId: getPropertyValue(rawDevice, ['userId', 'user_id']) as number,
      lastSeen: getPropertyValue(rawDevice, ['lastSeen', 'last_seen']) as string | undefined,
      createdAt: getPropertyValue(rawDevice, ['createdAt', 'created_at']) as string,
      updatedAt: getPropertyValue(rawDevice, ['updatedAt', 'updated_at']) as string,
    };
    
    // Ensure id is a number
    let numericId: number | undefined = undefined;
    
    if (typeof possibleDeviceMap.id === 'number') {
      numericId = possibleDeviceMap.id;
    } else if (typeof possibleDeviceMap.id === 'string') {
      const parsedId = parseInt(possibleDeviceMap.id, 10);
      if (!isNaN(parsedId)) {
        numericId = parsedId;
      }
    }
    
    // Only return if we have a valid numeric ID and minimal required fields
    if (numericId !== undefined && numericId > 0) {
      // Ensure all required fields have sensible defaults if missing
      return {
        ...possibleDeviceMap,
        id: numericId,
        name: possibleDeviceMap.name || `Device ${numericId}`,
        type: possibleDeviceMap.type || 'light', // Default type
        status: possibleDeviceMap.status || 'off', // Default status
        isConnected: possibleDeviceMap.isConnected !== undefined ? possibleDeviceMap.isConnected : true, // Default connection
        roomId: possibleDeviceMap.roomId || hookId, // Use current room ID if missing
        userId: possibleDeviceMap.userId || 1, // Default user ID
        createdAt: possibleDeviceMap.createdAt || new Date().toISOString(),
        updatedAt: possibleDeviceMap.updatedAt || new Date().toISOString(),
      } as Device;
    }
    
    return null;
  }).filter(Boolean) as Device[];
  
  // Helper function to try multiple property names and return the first valid value
  function getPropertyValue(obj: any, propertyNames: string[]): any {
    for (const prop of propertyNames) {
      if (obj[prop] !== undefined) {
        return obj[prop];
      }
    }
    return undefined;
  }

  // Use the processed devices
  const roomDevices = processedRoomDevices;
  
  // Log what we got after processing
  console.log('Processed room devices:', processedRoomDevices);

  const isLoading = roomLoading || devicesLoading;
  
  // Group devices by type
  const devicesByType: Record<string, Device[]> = {
    lights: [],
    dimmers: [],
    strips: []
  };
  
  roomDevices.forEach(device => {
    if (device.type === "light") devicesByType.lights.push(device);
    if (device.type === "dimmer") devicesByType.dimmers.push(device);
    if (device.type === "strip") devicesByType.strips.push(device);
  });

  // Handle invalid or non-positive room IDs from URL
  if (hookId === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Invalid Room ID</h2>
        <p className="text-muted-foreground mt-1">The room ID in the URL is not valid.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading room details...</span>
      </div>
    );
  }

  if (!room || roomError) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Room Not Found</h2>
        <p className="text-muted-foreground mt-1">
          {roomError ? "There was an error loading the room details." : "The requested room could not be found."}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {room.name}
          </h2>
          <p className="text-muted-foreground">
            Manage lighting for this room
          </p>
        </div>
      </div>
      
      {Object.entries(devicesByType).map(([type, typeDevices]) => {
        if (typeDevices.length === 0) return null;
        
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        
        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {typeDevices.map(device => (
                  <DeviceCard key={device.id} device={device} />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {roomDevices.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No devices in this room</h3>
          <p className="text-muted-foreground mt-1">
            Add devices to this room in the settings.
          </p>
        </div>
      )}
    </div>
  );
}
