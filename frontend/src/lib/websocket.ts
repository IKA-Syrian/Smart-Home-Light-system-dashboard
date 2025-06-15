// WebSocket service for real-time device control
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

interface WebSocketMessage {
  type: string;
  payload?: unknown;
}

type MessageHandler = (data: unknown) => void;

// Define interfaces for the status and energy data
interface LedStatus {
  id: number;
  brightness: number;
  energyToday?: number;
  currentPowerW?: number;
  motionActiveConfig?: boolean;
  manualControlActive?: boolean;
  timedScheduleActive?: boolean;
  timedScheduleRemainingSeconds?: number;
}

interface DeviceStatus {
  leds: LedStatus[];
  pirEnabled?: boolean;
  timestamp?: string;
}

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

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // 2 seconds

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the WebSocket connection
   */
  initialize(): void {
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    console.log('[WebSocketService] Initializing connection to', WS_URL);
    
    try {
      this.socket = new WebSocket(WS_URL);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('[WebSocketService] Failed to initialize WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.socket) {
      console.log('[WebSocketService] Closing connection');
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(type: string, payload?: unknown): boolean {
    if (!this.isConnected()) {
      console.warn('[WebSocketService] Cannot send message, not connected');
      return false;
    }
    
    const message: WebSocketMessage = { type };
    if (payload !== undefined) {
      message.payload = payload;
    }
    
    console.log('[WebSocketService] Sending message:', message);
    this.socket!.send(JSON.stringify(message));
    return true;
  }

  /**
   * Subscribe to a specific message type
   */
  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    
    const handlers = this.messageHandlers.get(type)!;
    handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Request device status from the server
   */
  requestStatus(): void {
    this.send('requestStatus');
  }

  /**
   * Request energy data from the server
   */
  requestEnergyData(): void {
    this.send('requestEnergyData');
  }

  /**
   * Control a device through the WebSocket
   */
  controlDevice(deviceId: number, command: string, params?: Record<string, unknown>): boolean {
    return this.send('controlDevice', { 
      deviceId, 
      command, 
      ...params 
    });
  }

  /**
   * Toggle a device on/off through the WebSocket
   */
  toggleDevice(deviceId: number, isOn: boolean): boolean {
    // Map the device ID to LED ID for Arduino
    const ledId = this.mapDeviceToLedId(deviceId);
    if (ledId === null) {
      console.error(`[WebSocketService] No LED mapping for device ${deviceId}`);
      return false;
    }
    
    return this.send('controlDevice', { 
      ledId,
      command: isOn ? 'turnOn' : 'turnOff'
    });
  }

  /**
   * Set device brightness through the WebSocket
   */
  setBrightness(deviceId: number, brightness: number): boolean {
    // Map the device ID to LED ID for Arduino
    const ledId = this.mapDeviceToLedId(deviceId);
    if (ledId === null) {
      console.error(`[WebSocketService] No LED mapping for device ${deviceId}`);
      return false;
    }
    
    return this.send('controlDevice', { 
      ledId,
      command: 'setBrightness',
      brightness
    });
  }

  /**
   * Map device ID to LED ID for Arduino
   */
  private mapDeviceToLedId(deviceId: number): number | null {
    // Simple direct mapping for now - can be enhanced later
    const ledMapping: { [key: number]: number } = {
      1: 0, // Device ID 1 maps to Arduino LED 0
      2: 1, // Device ID 2 maps to Arduino LED 1
      3: 2, // Device ID 3 maps to Arduino LED 2
    };
    
    if (typeof deviceId === 'number' && ledMapping[deviceId] !== undefined) {
      return ledMapping[deviceId];
    } else if (deviceId >= 1 && deviceId <= 3) {
      // Fallback for devices 1-3: direct mapping (id-1)
      return deviceId - 1;
    }
    
    return null;
  }

  // Event handlers
  private handleOpen(event: Event): void {
    console.log('[WebSocketService] Connection established');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Emit connection status update
    this.emitConnectionStatus(true);
    
    // Request initial status
    this.requestStatus();
  }

  private handleMessage(event: MessageEvent): void {
    console.log('[WebSocketService] Message received:', event.data);
    
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Handle ping messages automatically
      if (message.type === 'ping') {
        this.send('pong');
        return;
      }
      
      // Process status updates to extract energy data
      if (message.type === 'statusUpdate' && message.payload) {
        this.processStatusForEnergyData(message.payload as DeviceStatus);
      }
      
      // Dispatch to handlers
      if (this.messageHandlers.has(message.type)) {
        const handlers = this.messageHandlers.get(message.type)!;
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error(`[WebSocketService] Error in handler for ${message.type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocketService] Failed to parse message:', error);
    }
  }

  /**
   * Process status updates to extract energy data
   */
  private processStatusForEnergyData(statusData: DeviceStatus): void {
    // Check if the status update contains energy data
    if (statusData && statusData.leds && Array.isArray(statusData.leds)) {
      const hasEnergyData = statusData.leds.some((led: LedStatus) => 
        'energyToday' in led || 'currentPowerW' in led
      );
      
      if (hasEnergyData) {
        // Create energy data update from status
        const energyUpdate: EnergyUpdate = {
          timestamp: new Date().toISOString(),
          leds: statusData.leds.map((led: LedStatus) => ({
            ledId: led.id,
            energyToday: led.energyToday || 0,
            currentPowerW: led.currentPowerW || 0,
            isActive: led.brightness > 0
          }))
        };
        
        // Dispatch energy update to subscribers
        if (this.messageHandlers.has('energyUpdate')) {
          const handlers = this.messageHandlers.get('energyUpdate')!;
          handlers.forEach(handler => {
            try {
              handler(energyUpdate);
            } catch (error) {
              console.error('[WebSocketService] Error in energy update handler:', error);
            }
          });
        }
      }
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocketService] Connection closed:', event.code, event.reason);
    this.socket = null;
    this.isConnecting = false;
    
    // Emit connection status update
    this.emitConnectionStatus(false);
    
    // Schedule reconnect if not closed cleanly
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('[WebSocketService] WebSocket error:', event);
    // Emit connection status update
    this.emitConnectionStatus(false);
    // The onclose handler will be called after this
  }

  /**
   * Emit connection status to subscribers
   */
  private emitConnectionStatus(connected: boolean): void {
    const handlers = this.messageHandlers.get('connectionStatus') || [];
    handlers.forEach(handler => {
      try {
        handler({ connected });
      } catch (error) {
        console.error('[WebSocketService] Error in connection status handler:', error);
      }
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    console.log(`[WebSocketService] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.initialize();
    }, delay);
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService(); 