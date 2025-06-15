import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedEnergyChart } from "./enhanced-energy-chart";
import { Device, Room } from "@/types/api";

interface EnergyTabContentProps {
  devices: Device[];
  rooms: Room[];
}

// Generate aggregate electricity usage data
const generateAggregateUsage = (devices: Device[]) => {
  // Calculate total kWh as sum of power consumption or random if not available
  const totalKwh = devices.reduce((sum, device) => 
    sum + (device.powerConsumption ? device.powerConsumption / 1000 * 24 : Math.random() * 2), 0);
  
  return {
    costPerKwh: 0.15,
    totalKwh
  };
};

export function EnergyTabContent({ devices, rooms }: EnergyTabContentProps) {
  // Calculate aggregate usage
  const aggregateUsage = generateAggregateUsage(devices);
  
  // Calculate total devices by room
  const devicesByRoom = rooms.map(room => {
    const roomDevices = devices.filter(d => d.roomId === room.room_id);
    const activeDevices = roomDevices.filter(d => d.status === 'on');
    const totalEnergyUsage = roomDevices.reduce((sum, device) => sum + (device.powerConsumption || 0), 0) / 1000 * 24; // Convert W to kWh
    
    return {
      ...room,
      deviceCount: roomDevices.length,
      activeCount: activeDevices.length,
      totalEnergyUsage
    };
  });

  return (
    <div className="space-y-4 mt-4">
      <EnhancedEnergyChart title="Total Household Energy Usage" costPerKwh={aggregateUsage.costPerKwh} />
      
      <h3 className="text-lg font-bold mt-6">Energy Usage By Room</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devicesByRoom
          .filter(room => room.deviceCount > 0)
          .sort((a, b) => b.totalEnergyUsage - a.totalEnergyUsage)
          .map(room => (
            <Card key={`room-${room.room_id || 'unknown'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{room.name}</h4>
                  <Badge variant="outline">
                    {room.activeCount}/{room.deviceCount} active
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Energy Usage</p>
                    <p className="text-2xl font-bold">{room.totalEnergyUsage.toFixed(2)} kWh</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${(room.totalEnergyUsage * aggregateUsage.costPerKwh).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
} 