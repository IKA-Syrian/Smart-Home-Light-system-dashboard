import React, { useState } from 'react';
import { useArduino } from '../hooks/useArduino';
import { useRoomsAndDevices } from '../hooks/useRoomsAndDevices';
import { devicesApi } from '../services/devicesService';

interface LEDControlCardProps {
  ledId: number;
  roomName: string;
  deviceName: string;
  brightness: number;
  isOn: boolean;
  isLoading: boolean;
  motionActive: boolean;
  manualControl: boolean;
  timedScheduleActive: boolean;
  timedScheduleRemaining: number;
  energyToday: number;
  currentPowerW: number;
  onTurnOn: () => void;
  onTurnOff: () => void;
  onBrightnessChange: (brightness: number) => void;
  onSetAuto: () => void;
  onSchedule: (duration: number) => void;
  onMotionConfig: (active: boolean) => void;
  icon: string;
  deviceId?: number;
  roomId?: number;
}

const LEDControlCard: React.FC<LEDControlCardProps> = ({
  ledId,
  roomName,
  deviceName,
  brightness,
  isOn,
  isLoading,
  motionActive,
  manualControl,
  timedScheduleActive,
  timedScheduleRemaining,
  energyToday,
  currentPowerW,
  onTurnOn,
  onTurnOff,
  onBrightnessChange,
  onSetAuto,
  onSchedule,
  onMotionConfig,
  icon,
  deviceId,
  roomId,
}) => {
  const [scheduleDuration, setScheduleDuration] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const brightnessPercentage = Math.round((brightness / 255) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{icon} {roomName}</h3>
          <p className="text-sm text-gray-500">{deviceName}</p>
          <p className="text-xs text-gray-400">
            DB Device ID: {deviceId ?? 'N/A'} / Arduino LED Index: {ledId ?? 'N/A'}
          </p>
          <p className="text-xs text-gray-400">
            Room: {roomName} (ID: {roomId ?? 'N/A'})
          </p>
        </div>
        <div className={`w-4 h-4 rounded-full ${isOn ? 'bg-yellow-400 shadow-lg' : 'bg-gray-300'}`} />
      </div>

      {/* Energy Info */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-gray-50 rounded-md">
        <div className="text-xs">
          <div className="font-medium text-gray-700">Current Power:</div>
          <div className={`text-sm ${currentPowerW > 0.001 ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            {currentPowerW.toFixed(4)} W
            <span className="text-xs ml-1">
              {currentPowerW > 0.001 ? '(Active)' : '(Idle)'}
            </span>
          </div>
        </div>
        <div className="text-xs">
          <div className="font-medium text-gray-700">Energy Today:</div>
          <div className="text-sm text-blue-600 font-medium">
            {energyToday.toFixed(6)} Wh
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className={`text-xs px-2 py-1 rounded ${motionActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
          Motion: {motionActive ? 'ON' : 'OFF'}
        </div>
        <div className={`text-xs px-2 py-1 rounded ${manualControl ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          Manual: {manualControl ? 'ON' : 'OFF'}
        </div>
        {timedScheduleActive && (
          <div className="col-span-2 text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">
            Scheduled: {timedScheduleRemaining}s remaining
          </div>
        )}
      </div>

      {/* Brightness Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`brightness-${ledId}`}>
          Brightness: {brightnessPercentage}%
        </label>
        <input
          id={`brightness-${ledId}`}
          type="range"
          min="0"
          max="100"
          value={brightnessPercentage}
          onChange={(e) => onBrightnessChange(Math.round((parseInt(e.target.value) / 100) * 255))}
          disabled={isLoading}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          aria-label={`Brightness control for ${deviceName}`}
        />
      </div>

      {/* Basic Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={onTurnOn}
          disabled={isLoading}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
        >
          {isLoading ? '...' : 'ON'}
        </button>
        <button
          onClick={onTurnOff}
          disabled={isLoading}
          className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
        >
          {isLoading ? '...' : 'OFF'}
        </button>
        <button
          onClick={onSetAuto}
          disabled={isLoading}
          className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {isLoading ? '...' : 'AUTO'}
        </button>
      </div>

      {/* Advanced Controls Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-sm text-gray-600 hover:text-gray-800 mb-2"
      >
        {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
      </button>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-3">
          {/* Motion Detection Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Motion Detection</span>
            <button
              onClick={() => onMotionConfig(!motionActive)}
              disabled={isLoading}
              className={`px-3 py-1 rounded text-xs ${
                motionActive 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              } disabled:opacity-50`}
            >
              {motionActive ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Schedule Control */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-700" htmlFor={`schedule-duration-${ledId}`}>Schedule Timer</label>
            <div className="flex gap-2">
              <input
                id={`schedule-duration-${ledId}`}
                type="number"
                min="1"
                max="3600"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(parseInt(e.target.value) || 30)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                placeholder="Duration (seconds)"
                aria-label="Schedule duration in seconds"
              />
              <button
                onClick={() => onSchedule(scheduleDuration)}
                disabled={isLoading}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ArduinoDashboard: React.FC = () => {
  const {
    arduinoStatus,
    ledStatuses,
    connectionInfo,
    loading,
    ledLoading,
    pirLoading,
    wsConnected,
    wsConnectionState,
    error,
    enablePIR,
    disablePIR,
    turnLEDOn,
    turnLEDOff,
    setLEDBrightness,
    setLEDAuto,
    scheduleLED,
    setLEDMotionConfig,
    turnAllLEDsOn,
    turnAllLEDsOff,
    setAllLEDsBrightness,
    refreshStatus,
    clearError,
  } = useArduino();

  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    refreshData: refreshRoomsData,
    deviceToRoom,
  } = useRoomsAndDevices();

  const [masterBrightness, setMasterBrightness] = useState(100);

  const handleMasterBrightnessChange = (brightness: number) => {
    setMasterBrightness(brightness);
    const ledBrightness = Math.round((brightness / 100) * 255);
    setAllLEDsBrightness(ledBrightness);
  };

  const handleRefreshAll = async () => {
    await Promise.all([refreshStatus(), refreshRoomsData()]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Arduino LED Control Dashboard</h1>
          <p className="text-gray-600">Real-time control of LEDs across multiple rooms with live database integration</p>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm">WebSocket: {wsConnectionState}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${connectionInfo?.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm">Arduino: {connectionInfo?.isOpen ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${arduinoStatus?.pirEnabled ? 'bg-blue-400' : 'bg-gray-400'}`} />
                  <span className="text-sm">PIR: {arduinoStatus?.pirEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${roomsLoading ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <span className="text-sm">Data: {roomsLoading ? 'Loading...' : 'Live API'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshAll}
              disabled={loading || roomsLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading || roomsLoading ? 'Refreshing...' : 'Refresh All'}
            </button>
          </div>
          
          {connectionInfo && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Arduino Port: {connectionInfo.port}</p>
              <p>Last Message: {connectionInfo.lastMessage}</p>
              <p>Rooms Found: {rooms.length} | LED Devices: {ledStatuses.length}</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {(error || roomsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800">{error || roomsError}</span>
              </div>
              <button
                onClick={() => {
                  clearError();
                }}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* LED Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {ledStatuses.map((led) => {
            const roomId = deviceToRoom?.[led.id]?.roomId || 0;
            const deviceId = led.id;
            const roomName = deviceToRoom?.[led.id]?.roomName || 'Unknown Room';
            const deviceName = deviceToRoom?.[led.id]?.deviceName || `LED ${led.id}`;
            const icon = deviceToRoom?.[led.id]?.icon || '💡';
            
            return (
              <LEDControlCard
                key={led.id}
                ledId={led.id}
                roomName={roomName}
                deviceName={deviceName}
                brightness={led.brightness}
                isOn={led.brightness > 0}
                isLoading={ledLoading[led.id] || false}
                motionActive={led.motionActiveConfig}
                manualControl={led.manualControlActive}
                timedScheduleActive={led.timedScheduleActive}
                timedScheduleRemaining={led.timedScheduleRemainingSeconds}
                energyToday={led.energyToday || 0}
                currentPowerW={led.currentPowerW || 0}
                onTurnOn={() => turnLEDOn(led.id)}
                onTurnOff={() => turnLEDOff(led.id)}
                onBrightnessChange={(brightness) => setLEDBrightness(led.id, brightness)}
                onSetAuto={() => setLEDAuto(led.id)}
                onSchedule={(duration) => scheduleLED(led.id, duration)}
                onMotionConfig={(active) => setLEDMotionConfig(led.id, active)}
                icon={icon}
                deviceId={deviceId}
                roomId={roomId}
              />
            );
          })}
        </div>

        {/* No Rooms Message */}
        {rooms.length === 0 && !roomsLoading && (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Found</h3>
            <p className="text-gray-500">No rooms with LED devices were found in the database.</p>
            <button
              onClick={refreshRoomsData}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>IoT Project - Arduino LED Simulation with Database Integration</p>
          <p>Real-time control via WebSocket • Dynamic room and device management</p>
        </div>
      </div>
    </div>
  );
};

export default ArduinoDashboard; 