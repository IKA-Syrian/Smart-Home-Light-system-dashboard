// import { apiConfig } from './authService'; // Removed this import

// Arduino API Service
import { apiClient } from '../lib/api';

// Arduino API Base URL
const ARDUINO_API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/arduino';

// Check if we're in development mode and should use mock data
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_ARDUINO_API;

// Shared mock state that can be updated
const MOCK_STATE = {
  pirEnabled: false,
  leds: [
    { id: 0, motionActiveConfig: false, manualControlActive: false, timedScheduleActive: false, timedScheduleRemainingSeconds: 0, brightness: 0, energyToday: 0, currentPowerW: 0 },
    { id: 1, motionActiveConfig: false, manualControlActive: false, timedScheduleActive: false, timedScheduleRemainingSeconds: 0, brightness: 0, energyToday: 0, currentPowerW: 0 },
    { id: 2, motionActiveConfig: false, manualControlActive: false, timedScheduleActive: false, timedScheduleRemainingSeconds: 0, brightness: 0, energyToday: 0, currentPowerW: 0 }
  ]
};

// Default mock data for when API is unavailable - now points to the shared state
const DEFAULT_MOCK_DATA = MOCK_STATE;

// Arduino-specific types
export interface LEDStatus {
  id: number;
  motionActiveConfig: boolean;
  manualControlActive: boolean;
  timedScheduleActive: boolean;
  timedScheduleRemainingSeconds: number;
  brightness: number;
  energyToday: number;      // Total energy consumed today in Wh
  currentPowerW: number;    // Current power consumption in watts
}

export interface ArduinoStatus {
  pirEnabled: boolean;
  leds: LEDStatus[];
}

export interface ArduinoConnection {
  isOpen: boolean;
  port: string;
  lastMessage: string;
}

export interface LEDBrightnessRequest {
  level: number; // 0-255
}

export interface LEDMotionConfigRequest {
  active: boolean;
}

export interface LEDScheduleRequest {
  duration_seconds: number;
}

export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  parsedStatus?: T;
  ledStatus?: T;
  connection?: T;
}

class ArduinoService {
  private baseURL: string;

  constructor() {
    this.baseURL = ARDUINO_API_BASE_URL; // Use the locally defined base URL
  }

  // PIR Sensor Control
  async enablePIR(): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log('[MOCK] Enabling PIR sensor');
      MOCK_STATE.pirEnabled = true;
      return { status: 'success', message: 'PIR sensor enabled (mock)' };
    }

    try {
      const response = await fetch(`${this.baseURL}/pir/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to enable PIR sensor: ${response.statusText}`);
      }

      MOCK_STATE.pirEnabled = true;
      return await response.json();
    } catch (error) {
      console.error('Error enabling PIR sensor:', error);
      return { status: 'error', message: `Error enabling PIR sensor: ${error}` };
    }
  }

  async disablePIR(): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log('[MOCK] Disabling PIR sensor');
      MOCK_STATE.pirEnabled = false;
      return { status: 'success', message: 'PIR sensor disabled (mock)' };
    }

    try {
      const response = await fetch(`${this.baseURL}/pir/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to disable PIR sensor: ${response.statusText}`);
      }

      MOCK_STATE.pirEnabled = false;
      return await response.json();
    } catch (error) {
      console.error('Error disabling PIR sensor:', error);
      return { status: 'error', message: `Error disabling PIR sensor: ${error}` };
    }
  }

  // LED Control Methods
  async setLEDMotionConfig(ledId: number, config: LEDMotionConfigRequest): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Setting LED ${ledId} motion config to ${config.active}`);
      MOCK_STATE.leds[ledId].motionActiveConfig = config.active;
      return { status: 'success', message: `LED ${ledId} motion config updated (mock)` };
    }

    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/motionconfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to configure LED ${ledId} motion: ${response.statusText}`);
      }

      MOCK_STATE.leds[ledId].motionActiveConfig = config.active;
      return await response.json();
    } catch (error) {
      console.error(`Error configuring LED ${ledId} motion:`, error);
      return { status: 'error', message: `Error configuring LED ${ledId} motion: ${error}` };
    }
  }

  async turnLEDOn(ledId: number): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Turning LED ${ledId} on`);
      MOCK_STATE.leds[ledId].manualControlActive = true;
      return { status: 'success', message: `LED ${ledId} turned on (mock)` };
    }
    
    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/manual/on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to turn on LED ${ledId}: ${response.statusText}`);
        return { status: 'error', message: `Failed to turn on LED ${ledId}: ${response.statusText}` };
      }

      MOCK_STATE.leds[ledId].manualControlActive = true;
      return await response.json();
    } catch (error) {
      console.error(`Error turning on LED ${ledId}:`, error);
      return { status: 'error', message: `Error turning on LED ${ledId}: ${error}` };
    }
  }

  async turnLEDOff(ledId: number): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Turning LED ${ledId} off`);
      MOCK_STATE.leds[ledId].manualControlActive = false;
      return { status: 'success', message: `LED ${ledId} turned off (mock)` };
    }
    
    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/manual/off`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to turn off LED ${ledId}: ${response.statusText}`);
        return { status: 'error', message: `Failed to turn off LED ${ledId}: ${response.statusText}` };
      }

      MOCK_STATE.leds[ledId].manualControlActive = false;
      return await response.json();
    } catch (error) {
      console.error(`Error turning off LED ${ledId}:`, error);
      return { status: 'error', message: `Error turning off LED ${ledId}: ${error}` };
    }
  }

  async setLEDBrightness(ledId: number, brightness: LEDBrightnessRequest): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Setting LED ${ledId} brightness to ${brightness.level}`);
      MOCK_STATE.leds[ledId].brightness = brightness.level;
      return { status: 'success', message: `LED ${ledId} brightness set to ${brightness.level} (mock)` };
    }
    
    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/brightness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brightness),
      });

      if (!response.ok) {
        console.warn(`Failed to set LED ${ledId} brightness: ${response.statusText}`);
        return { status: 'error', message: `Failed to set LED ${ledId} brightness: ${response.statusText}` };
      }

      MOCK_STATE.leds[ledId].brightness = brightness.level;
      return await response.json();
    } catch (error) {
      console.error(`Error setting LED ${ledId} brightness:`, error);
      return { status: 'error', message: `Error setting LED ${ledId} brightness: ${error}` };
    }
  }

  async setLEDAuto(ledId: number): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Setting LED ${ledId} to auto mode`);
      MOCK_STATE.leds[ledId].manualControlActive = false;
      MOCK_STATE.leds[ledId].motionActiveConfig = false;
      return { status: 'success', message: `LED ${ledId} set to auto mode (mock)` };
    }
    
    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to set LED ${ledId} to auto mode: ${response.statusText}`);
        return { status: 'error', message: `Failed to set LED ${ledId} to auto mode: ${response.statusText}` };
      }

      MOCK_STATE.leds[ledId].manualControlActive = false;
      MOCK_STATE.leds[ledId].motionActiveConfig = false;
      return await response.json();
    } catch (error) {
      console.error(`Error setting LED ${ledId} to auto mode:`, error);
      return { status: 'error', message: `Error setting LED ${ledId} to auto mode: ${error}` };
    }
  }

  async scheduleLED(ledId: number, schedule: LEDScheduleRequest): Promise<ApiResponse> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Scheduling LED ${ledId} for ${schedule.duration_seconds} seconds`);
      MOCK_STATE.leds[ledId].timedScheduleActive = true;
      MOCK_STATE.leds[ledId].timedScheduleRemainingSeconds = schedule.duration_seconds;
      return { status: 'success', message: `LED ${ledId} scheduled for ${schedule.duration_seconds} seconds (mock)` };
    }
    
    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        console.warn(`Failed to schedule LED ${ledId}: ${response.statusText}`);
        return { status: 'error', message: `Failed to schedule LED ${ledId}: ${response.statusText}` };
      }

      MOCK_STATE.leds[ledId].timedScheduleActive = true;
      MOCK_STATE.leds[ledId].timedScheduleRemainingSeconds = schedule.duration_seconds;
      return await response.json();
    } catch (error) {
      console.error(`Error scheduling LED ${ledId}:`, error);
      return { status: 'error', message: `Error scheduling LED ${ledId}: ${error}` };
    }
  }

  // Status and Monitoring
  async getArduinoStatus(): Promise<ApiResponse<ArduinoStatus>> {
    if (USE_MOCK_DATA) {
      console.log('[MOCK] Getting Arduino status');
      return { 
        status: 'success', 
        parsedStatus: MOCK_STATE 
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to get Arduino status: ${response.statusText}`);
        return { 
          status: 'error', 
          message: `Failed to get Arduino status: ${response.statusText}`,
          parsedStatus: MOCK_STATE
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Arduino status:', error);
      return { 
        status: 'error', 
        message: `Error fetching Arduino status: ${error}`,
        parsedStatus: MOCK_STATE
      };
    }
  }

  async getCurrentStatus(): Promise<ApiResponse<ArduinoStatus>> {
    try {
      if (USE_MOCK_DATA) {
        console.log('[MOCK] Getting current Arduino status');
        return { 
          status: 'success', 
          parsedStatus: MOCK_STATE
        };
      }
      
      // Use the correct Arduino endpoint path
      const response = await fetch(`${this.baseURL}/arduino/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to get current Arduino status: ${response.statusText}`);
        // Return a default status object instead of throwing
        return {
          status: 'error',
          message: `Failed to get current Arduino status: ${response.statusText}`,
          parsedStatus: MOCK_STATE
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Arduino status:', error);
      // Return a default status object on error
      return {
        status: 'error',
        message: `Error fetching Arduino status: ${error}`,
        parsedStatus: MOCK_STATE
      };
    }
  }

  async getLEDStatus(ledId: number): Promise<ApiResponse<LEDStatus>> {
    if (USE_MOCK_DATA) {
      console.log(`[MOCK] Getting LED ${ledId} status`);
      return { 
        status: 'success', 
        ledStatus: MOCK_STATE.leds[ledId] || MOCK_STATE.leds[0]
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/leds/${ledId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to get LED ${ledId} status: ${response.statusText}`);
        return { 
          status: 'error', 
          message: `Failed to get LED ${ledId} status: ${response.statusText}`,
          ledStatus: MOCK_STATE.leds[ledId] || MOCK_STATE.leds[0]
        };
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching LED ${ledId} status:`, error);
      return { 
        status: 'error', 
        message: `Error fetching LED ${ledId} status: ${error}`,
        ledStatus: MOCK_STATE.leds[ledId] || MOCK_STATE.leds[0]
      };
    }
  }

  async getConnectionInfo(): Promise<ApiResponse<ArduinoConnection>> {
    if (USE_MOCK_DATA) {
      console.log('[MOCK] Getting connection info');
      return { 
        status: 'success', 
        connection: { isOpen: true, port: 'MOCK_PORT', lastMessage: 'Mock connection active' } 
      };
    }

    try {
      // Try to use the main status endpoint as a fallback
      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to get Arduino connection info: ${response.statusText}`);
        return { 
          status: 'error', 
          message: `Failed to get Arduino connection info: ${response.statusText}`,
          connection: { isOpen: false, port: 'Unknown', lastMessage: 'Connection failed' }
        };
      }

      // If we don't have a dedicated connection endpoint, construct connection info from status
      return { 
        status: 'success',
        connection: { isOpen: true, port: 'COM Port', lastMessage: 'Connection active' }
      };
    } catch (error) {
      console.error('Error fetching Arduino connection info:', error);
      return { 
        status: 'error', 
        message: `Error fetching Arduino connection info: ${error}`,
        connection: { isOpen: false, port: 'Unknown', lastMessage: 'Connection error' }
      };
    }
  }

  // Helper methods for LED control with room mapping
  async controlRoomLED(roomName: string, action: 'on' | 'off' | 'auto', brightness?: number): Promise<ApiResponse> {
    const ledMapping: { [key: string]: number } = {
      'Living Room': 0,
      'Bedroom': 1,
      'Kitchen': 2,
    };

    const ledId = ledMapping[roomName];
    if (ledId === undefined) {
      throw new Error(`Unknown room: ${roomName}`);
    }

    switch (action) {
      case 'on':
        if (brightness !== undefined) {
          return await this.setLEDBrightness(ledId, { level: brightness });
        } else {
          return await this.turnLEDOn(ledId);
        }
      case 'off':
        return await this.turnLEDOff(ledId);
      case 'auto':
        return await this.setLEDAuto(ledId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // Bulk control methods
  async turnAllLEDsOn(): Promise<ApiResponse[]> {
    const promises = [
      this.turnLEDOn(0), // Living Room
      this.turnLEDOn(1), // Bedroom
      this.turnLEDOn(2), // Kitchen
    ];
    return await Promise.all(promises);
  }

  async turnAllLEDsOff(): Promise<ApiResponse[]> {
    const promises = [
      this.turnLEDOff(0), // Living Room
      this.turnLEDOff(1), // Bedroom
      this.turnLEDOff(2), // Kitchen
    ];
    return await Promise.all(promises);
  }

  async setAllLEDsBrightness(brightness: number): Promise<ApiResponse[]> {
    const promises = [
      this.setLEDBrightness(0, { level: brightness }), // Living Room
      this.setLEDBrightness(1, { level: brightness }), // Bedroom
      this.setLEDBrightness(2, { level: brightness }), // Kitchen
    ];
    return await Promise.all(promises);
  }

  async getAllLEDStatuses(): Promise<LEDStatus[]> {
    try {
      if (USE_MOCK_DATA) {
        console.log('[MOCK] Getting all LED statuses');
        return MOCK_STATE.leds;
      }

      // Try to get the status for all LEDs
      const status = await this.getCurrentStatus();
      if (status.parsedStatus?.leds) {
        return status.parsedStatus.leds;
      }
      
      // Fallback to individual LED status calls
      const promises = [
        this.getLEDStatus(0), // Living Room
        this.getLEDStatus(1), // Bedroom
        this.getLEDStatus(2), // Kitchen
      ];
      
      const responses = await Promise.all(promises);
      return responses.map((response, index) => ({
        id: index,
        ...response.ledStatus,
      }));
    } catch (error) {
      console.error('Failed to get all LED statuses:', error);
      // Return default status if API call fails
      return MOCK_STATE.leds;
    }
  }

  // Room name helper
  getRoomNameForLED(ledId: number): string {
    const roomMapping: { [key: number]: string } = {
      0: 'Living Room',
      1: 'Bedroom',
      2: 'Kitchen',
    };
    return roomMapping[ledId] || `LED ${ledId}`;
  }
}

// Export singleton instance
export const arduinoService = new ArduinoService();
export default arduinoService; 