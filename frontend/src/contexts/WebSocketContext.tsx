import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { websocketService } from '@/lib/websocket';
import { useToast } from '@/components/ui/use-toast';
import { Device } from '@/types/api';
import { useDeviceStore } from '@/store/integratedDeviceStore';

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: unknown | null;
  connectionAttempts: number;
  sendControlMessage: (deviceId: number, command: string, params?: Record<string, unknown>) => boolean;
  subscribeToDeviceUpdates: (callback: (device: Device) => void) => () => void;
  subscribeToEnergyUpdates: (callback: (energyData: EnergyUpdate) => void) => () => void;
  requestEnergyData: () => void;
}

// Define energy data interfaces to match websocket service
interface EnergyData {
  ledId: number;
  energyToday: number;
  currentPowerW: number;
  isActive: boolean;
}

interface EnergyUpdate {
  timestamp: string;
  leds: EnergyData[];
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();
  const { updateDeviceStatus } = useDeviceStore();

  // Handle connection status changes
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        setConnectionAttempts(0);
      } else {
        setConnectionAttempts(prev => prev + 1);
      }
    };

    // Subscribe to connection events
    const unsubscribeConnected = websocketService.subscribe('connectionStatus', (data) => {
      const statusData = data as { connected: boolean };
      handleConnectionChange(statusData.connected);
      if (statusData.connected) {
        toast({
          title: "Connected to server",
          description: "Real-time updates are now active",
          variant: "default",
        });
      } else if (connectionAttempts > 3) {
        toast({
          title: "Connection lost",
          description: "Attempting to reconnect...",
          variant: "destructive",
        });
      }
    });

    // Initialize connection status
    setIsConnected(websocketService.isConnected());

    // Handle control responses
    const unsubscribeControl = websocketService.subscribe('controlResponse', (data) => {
      setLastMessage(data);
      
      const responseData = data as { success: boolean; error?: string };
      if (!responseData.success) {
        toast({
          title: "Control Error",
          description: responseData.error || "Failed to control device",
          variant: "destructive",
        });
      }
    });

    // Handle status updates
    const unsubscribeStatus = websocketService.subscribe('statusUpdate', (data) => {
      setLastMessage(data);
      
      // Update device store with new statuses
      const statusData = data as { devices?: Device[] };
      if (statusData && statusData.devices) {
        statusData.devices.forEach((device: Device) => {
          updateDeviceStatus(device);
        });
      }
    });

    // Handle energy updates
    const unsubscribeEnergy = websocketService.subscribe('energyUpdate', (data) => {
      setLastMessage(data);
      // Energy updates are handled by subscribers via subscribeToEnergyUpdates
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeConnected();
      unsubscribeControl();
      unsubscribeStatus();
      unsubscribeEnergy();
    };
  }, [toast, connectionAttempts, updateDeviceStatus]);

  // Function to send control messages
  const sendControlMessage = (deviceId: number, command: string, params?: Record<string, unknown>): boolean => {
    const success = websocketService.controlDevice(deviceId, command, params);
    
    if (!success && connectionAttempts === 0) {
      toast({
        title: "WebSocket Unavailable",
        description: "Using fallback HTTP API instead",
        variant: "default",
      });
    }
    
    return success;
  };

  // Function to subscribe to device updates
  const subscribeToDeviceUpdates = (callback: (device: Device) => void) => {
    return websocketService.subscribe('deviceUpdate', (data) => {
      callback(data as Device);
    });
  };

  // Function to subscribe to energy updates
  const subscribeToEnergyUpdates = (callback: (energyData: EnergyUpdate) => void) => {
    return websocketService.subscribe('energyUpdate', (data) => {
      callback(data as EnergyUpdate);
    });
  };

  // Function to request energy data from the server
  const requestEnergyData = () => {
    websocketService.requestEnergyData();
  };

  return (
    <WebSocketContext.Provider 
      value={{ 
        isConnected, 
        lastMessage, 
        connectionAttempts,
        sendControlMessage,
        subscribeToDeviceUpdates,
        subscribeToEnergyUpdates,
        requestEnergyData
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}; 