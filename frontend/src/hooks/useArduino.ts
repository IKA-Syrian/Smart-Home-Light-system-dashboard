import { useState, useEffect, useCallback, useRef } from 'react';
import { arduinoService, ArduinoStatus, LEDStatus, ArduinoConnection, ApiResponse } from '../services/arduinoService';
import { websocketService, StatusUpdatePayload } from '../services/websocketService';
import { apiClient } from '../lib/api';

export interface UseArduinoState {
  // Status data
  arduinoStatus: ArduinoStatus | null;
  ledStatuses: LEDStatus[];
  connectionInfo: ArduinoConnection | null;
  
  // Loading states
  loading: boolean;
  ledLoading: { [key: number]: boolean };
  pirLoading: boolean;
  
  // Connection states
  wsConnected: boolean;
  wsConnectionState: string;
  
  // Error handling
  error: string | null;
  
  // Control functions
  enablePIR: () => Promise<void>;
  disablePIR: () => Promise<void>;
  
  // LED control functions
  turnLEDOn: (ledId: number) => Promise<void>;
  turnLEDOff: (ledId: number) => Promise<void>;
  setLEDBrightness: (ledId: number, brightness: number) => Promise<void>;
  setLEDAuto: (ledId: number) => Promise<void>;
  scheduleLED: (ledId: number, duration: number) => Promise<void>;
  setLEDMotionConfig: (ledId: number, active: boolean) => Promise<void>;
  
  // Room-based control
  controlRoomLED: (roomName: string, action: 'on' | 'off' | 'auto', brightness?: number) => Promise<void>;
  
  // Bulk control
  turnAllLEDsOn: () => Promise<void>;
  turnAllLEDsOff: () => Promise<void>;
  setAllLEDsBrightness: (brightness: number) => Promise<void>;
  
  // Utility functions
  refreshStatus: () => Promise<void>;
  getRoomNameForLED: (ledId: number) => string;
  clearError: () => void;
}

export const useArduino = (): UseArduinoState => {
  // State management
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoStatus | null>(null);
  const [ledStatuses, setLedStatuses] = useState<LEDStatus[]>([]);
  const [connectionInfo, setConnectionInfo] = useState<ArduinoConnection | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [ledLoading, setLedLoading] = useState<{ [key: number]: boolean }>({});
  const [pirLoading, setPirLoading] = useState(false);
  
  // Connection states
  const [wsConnected, setWsConnected] = useState(false);
  const [wsConnectionState, setWsConnectionState] = useState('DISCONNECTED');
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cleanup
  const mounted = useRef(true);
  const connectionAttempted = useRef(false);

  // Error handling helper
  const handleError = useCallback((error: Error | unknown, operation: string) => {
    console.error(`Arduino ${operation} error:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    setError(`Failed to ${operation}: ${errorMessage}`);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // LED loading helper
  const setLedLoadingState = useCallback((ledId: number, isLoading: boolean) => {
    setLedLoading(prev => ({ ...prev, [ledId]: isLoading }));
  }, []);

  // Refresh Arduino status
  const refreshStatus = useCallback(async () => {
    if (!mounted.current) return;
    
    setLoading(true);
    try {
      const [statusResponse, connectionResponse, ledStatusesResponse] = await Promise.all([
        arduinoService.getCurrentStatus(),
        arduinoService.getConnectionInfo(),
        arduinoService.getAllLEDStatuses(),
      ]);

      if (mounted.current) {
        if (statusResponse.parsedStatus) {
          setArduinoStatus(statusResponse.parsedStatus);
        }
        if (connectionResponse.connection) {
          setConnectionInfo(connectionResponse.connection);
        }
        setLedStatuses(ledStatusesResponse);
      }
    } catch (error) {
      if (mounted.current) {
        handleError(error, 'refresh status');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [handleError]);

  // WebSocket event handlers
  const handleConnected = useCallback(() => {
    console.log('WebSocket connected');
    setWsConnected(true);
    websocketService.requestStatus();
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('WebSocket disconnected');
    setWsConnected(false);
  }, []);

  const handleStatusUpdate = useCallback((payload: StatusUpdatePayload) => {
    console.log('Received status update from WebSocket:', payload);
    if (payload?.arduinoStatus) {
      setArduinoStatus(payload.arduinoStatus);
    }
    if (payload?.connectionInfo) {
      setConnectionInfo(payload.connectionInfo);
    }
  }, []);

  const handleWebSocketError = useCallback((error: Error | unknown) => {
    console.error('WebSocket error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Connection failed';
    setError(`WebSocket error: ${errorMessage}`);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    if (connectionAttempted.current) return;
    
    connectionAttempted.current = true;
    console.log('Initializing WebSocket connection...');
    
    // Set up WebSocket event listeners
    websocketService.on('connected', handleConnected);
    websocketService.on('disconnected', handleDisconnected);
    websocketService.on('arduinoStatusUpdate', handleStatusUpdate);
    websocketService.on('error', handleWebSocketError);
    
    // Connect to WebSocket server
    websocketService.connect().catch(error => {
      console.error('Failed to connect to WebSocket:', error);
      setError(`WebSocket connection failed: ${error.message || 'Unknown error'}`);
    });
    
    // Update connection state periodically
    const updateConnectionInterval = setInterval(updateConnectionState, 5000);
    
    // Initial status fetch
    refreshStatus();
    
    return () => {
      mounted.current = false;
      
      // Clean up WebSocket listeners
      websocketService.off('connected', handleConnected);
      websocketService.off('disconnected', handleDisconnected);
      websocketService.off('arduinoStatusUpdate', handleStatusUpdate);
      websocketService.off('error', handleWebSocketError);
      
      // Clear interval
      clearInterval(updateConnectionInterval);
    };
  }, [handleConnected, handleDisconnected, handleStatusUpdate, handleWebSocketError, refreshStatus]);

  // Update WebSocket connection state
  const updateConnectionState = useCallback(() => {
    const state = websocketService.getConnectionState();
    setWsConnectionState(state);
    setWsConnected(state === 'CONNECTED');
    
    // If we're connected, request the latest status
    if (state === 'CONNECTED') {
      websocketService.requestStatus();
    }
  }, []);

  // PIR control functions
  const enablePIR = useCallback(async () => {
    setPirLoading(true);
    try {
      console.log('Sending PIR enable command via apiClient');
      
      // Use apiClient instead of arduinoService directly for consistent behavior
      const response = await apiClient.post<ApiResponse>('/arduino/pir/enable');
      console.log('PIR enable response:', response);
      
      if (response && typeof response === 'object' && response.status === 'error') {
        throw new Error(response.message || 'Failed to enable PIR sensor');
      }
      
      // Update local state immediately for better UI responsiveness
      if (arduinoStatus) {
        setArduinoStatus({
          ...arduinoStatus,
          pirEnabled: true
        });
      }
      
      // Refresh status from server
      await refreshStatus();
    } catch (error) {
      console.error('Error enabling PIR:', error);
      handleError(error, 'enable PIR sensor');
      throw error; // Re-throw to allow component to handle
    } finally {
      setPirLoading(false);
    }
  }, [refreshStatus, handleError, arduinoStatus]);

  const disablePIR = useCallback(async () => {
    setPirLoading(true);
    try {
      console.log('Sending PIR disable command via apiClient');
      
      // Use apiClient instead of arduinoService directly for consistent behavior
      const response = await apiClient.post<ApiResponse>('/arduino/pir/disable');
      console.log('PIR disable response:', response);
      
      if (response && typeof response === 'object' && response.status === 'error') {
        throw new Error(response.message || 'Failed to disable PIR sensor');
      }
      
      // Update local state immediately for better UI responsiveness
      if (arduinoStatus) {
        setArduinoStatus({
          ...arduinoStatus,
          pirEnabled: false
        });
      }
      
      // Refresh status from server
      await refreshStatus();
    } catch (error) {
      console.error('Error disabling PIR:', error);
      handleError(error, 'disable PIR sensor');
      throw error; // Re-throw to allow component to handle
    } finally {
      setPirLoading(false);
    }
  }, [refreshStatus, handleError, arduinoStatus]);

  // LED control functions
  const turnLEDOn = useCallback(async (ledId: number) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.turnLEDOn(ledId);
      await refreshStatus();
    } catch (error) {
      handleError(error, `turn on LED ${ledId}`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  const turnLEDOff = useCallback(async (ledId: number) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.turnLEDOff(ledId);
      await refreshStatus();
    } catch (error) {
      handleError(error, `turn off LED ${ledId}`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  const setLEDBrightness = useCallback(async (ledId: number, brightness: number) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.setLEDBrightness(ledId, { level: brightness });
      await refreshStatus();
    } catch (error) {
      handleError(error, `set LED ${ledId} brightness`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  const setLEDAuto = useCallback(async (ledId: number) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.setLEDAuto(ledId);
      await refreshStatus();
    } catch (error) {
      handleError(error, `set LED ${ledId} to auto mode`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  const scheduleLED = useCallback(async (ledId: number, duration: number) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.scheduleLED(ledId, { duration_seconds: duration });
      await refreshStatus();
    } catch (error) {
      handleError(error, `schedule LED ${ledId}`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  const setLEDMotionConfig = useCallback(async (ledId: number, active: boolean) => {
    setLedLoadingState(ledId, true);
    try {
      await arduinoService.setLEDMotionConfig(ledId, { active });
      await refreshStatus();
    } catch (error) {
      handleError(error, `configure LED ${ledId} motion detection`);
    } finally {
      setLedLoadingState(ledId, false);
    }
  }, [refreshStatus, handleError, setLedLoadingState]);

  // Room-based control
  const controlRoomLED = useCallback(async (roomName: string, action: 'on' | 'off' | 'auto', brightness?: number) => {
    try {
      await arduinoService.controlRoomLED(roomName, action, brightness);
      await refreshStatus();
    } catch (error) {
      handleError(error, `control ${roomName} LED`);
    }
  }, [refreshStatus, handleError]);

  // Bulk control functions
  const turnAllLEDsOn = useCallback(async () => {
    setLoading(true);
    try {
      await arduinoService.turnAllLEDsOn();
      await refreshStatus();
    } catch (error) {
      handleError(error, 'turn on all LEDs');
    } finally {
      setLoading(false);
    }
  }, [refreshStatus, handleError]);

  const turnAllLEDsOff = useCallback(async () => {
    setLoading(true);
    try {
      await arduinoService.turnAllLEDsOff();
      await refreshStatus();
    } catch (error) {
      handleError(error, 'turn off all LEDs');
    } finally {
      setLoading(false);
    }
  }, [refreshStatus, handleError]);

  const setAllLEDsBrightness = useCallback(async (brightness: number) => {
    setLoading(true);
    try {
      await arduinoService.setAllLEDsBrightness(brightness);
      await refreshStatus();
    } catch (error) {
      handleError(error, 'set all LEDs brightness');
    } finally {
      setLoading(false);
    }
  }, [refreshStatus, handleError]);

  // Utility functions
  const getRoomNameForLED = useCallback((ledId: number): string => {
    const roomMap: Record<number, string> = {
      0: 'Living Room',
      1: 'Bedroom',
      2: 'Kitchen',
      3: 'Bathroom',
      4: 'Office',
      5: 'Hallway'
    };
    return roomMap[ledId] || `Room ${ledId}`;
  }, []);

  return {
    // Status data
    arduinoStatus,
    ledStatuses,
    connectionInfo,
    
    // Loading states
    loading,
    ledLoading,
    pirLoading,
    
    // Connection states
    wsConnected,
    wsConnectionState,
    
    // Error handling
    error,
    
    // Control functions
    enablePIR,
    disablePIR,
    
    // LED control functions
    turnLEDOn,
    turnLEDOff,
    setLEDBrightness,
    setLEDAuto,
    scheduleLED,
    setLEDMotionConfig,
    
    // Room-based control
    controlRoomLED,
    
    // Bulk control
    turnAllLEDsOn,
    turnAllLEDsOff,
    setAllLEDsBrightness,
    
    // Utility functions
    refreshStatus,
    getRoomNameForLED,
    clearError
  };
}; 