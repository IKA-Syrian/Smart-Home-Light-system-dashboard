import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, Eye, EyeOff, Battery, AlertCircle } from "lucide-react";
import { Sensor } from "@/types/api";

interface SensorStatusCardProps {
  sensor: Partial<Sensor> & { 
    id: number;
    name: string;
    type: string;
    value: number | null;
  };
}

export function SensorStatusCard({ sensor }: SensorStatusCardProps) {
  const getIcon = () => {
    switch (sensor.type) {
      case 'temperature':
        return <Thermometer className="h-4 w-4" />;
      case 'humidity':
        return <Droplets className="h-4 w-4" />;
      case 'motion':
        return sensor.value && sensor.value > 0 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />;
      case 'light_intensity':
        return <Thermometer className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  const getStatusColor = () => {
    if (sensor.isActive === false) return "destructive";
    if (sensor.value === null || sensor.value === undefined) return "secondary";
    return "default";
  };

  const formatValue = () => {
    if (sensor.value === null || sensor.value === undefined) {
      return "No data";
    }
    
    // Format based on sensor type
    switch (sensor.type) {
      case 'motion':
        return sensor.value > 0 ? "Motion Detected" : "No Motion";
      case 'light_intensity':
        return `${sensor.value}${sensor.unit || '%'}`;
      case 'temperature':
        return `${sensor.value}${sensor.unit || '°C'}`;
      case 'humidity':
        return `${sensor.value}${sensor.unit || '%'}`;
      default:
        return `${sensor.value}${sensor.unit || ''}`;
    }
  };

  // Handle null or undefined sensor data gracefully
  const getSensorLocation = () => {
    return sensor.location || "Unknown location";
  };

  const getLastUpdated = () => {
    if (!sensor.lastReading) return "Never updated";
    
    try {
      return new Date(sensor.lastReading).toLocaleTimeString();
    } catch (error) {
      console.error("Error parsing date:", error);
      return "Invalid date";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{sensor.name || `Sensor ${sensor.id}`}</CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        <div className="flex items-center justify-between mt-2">
          <Badge variant={getStatusColor()}>
            {sensor.isActive !== false ? "Active" : "Inactive"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {typeof sensor.batteryLevel === 'number' && (
              <>
                <Battery className="h-3 w-3" />
                {sensor.batteryLevel}%
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {getSensorLocation()}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {getLastUpdated()}
        </p>
      </CardContent>
    </Card>
  );
}
