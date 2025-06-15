import { apiClient, ApiError, ApiResponse } from '../lib/api'; // Ensure ApiError is imported
import type { Room, Device, CreateRoomRequest, UpdateRoomRequest, Sensor } from '../types/api'; // Ensure these types exist or adjust

// Room types
// Removed local Room interface to use the one from ../types/api

export const roomsApi = {
  // Get all rooms
  async getAllRooms(): Promise<Room[]> {
    try {
      // apiClient.get<Room[]> will return Room[] directly on HTTP success (2xx)
      const roomsData = await apiClient.get<Room[]>('/rooms?include=devices');
      return roomsData || []; // Ensure array is returned, even if API sends null for an empty list
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error fetching all rooms (status: ${error.status}):`, error.message);
        // For a list, returning an empty array on error (especially 404) might be acceptable,
        // or rethrow if the error should halt operations.
        // if (error.status === 404) return [];
        throw new Error(`Failed to fetch rooms: ${error.message}`);
      }
      console.error('Generic error fetching all rooms:', error);
      throw error;
    }
  },

  // Get room by ID
  async getRoomById(roomId: number): Promise<Room | null> {
    try {
      const roomData = await apiClient.get<Room>(`/rooms/${roomId}`);
      return roomData;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          console.warn(`Room with ID ${roomId} not found (404).`);
          return null;
        }
        console.error(`Error fetching room ${roomId} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to fetch room ${roomId}: ${error.message}`);
      }
      console.error(`Generic error fetching room ${roomId}:`, error);
      throw error;
    }
  },

  // Create new room
  // Assuming CreateRoomRequest is defined in types/api.ts and includes { name: string, description?: string }
  async createRoom(roomData: CreateRoomRequest): Promise<Room> {
    try {
      // apiClient.post<Room> is expected to return the created Room object directly
      const newRoom = await apiClient.post<Room>('/rooms', roomData);
      return newRoom;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error creating room (status: ${error.status}):`, error.message);
        throw new Error(`Failed to create room: ${error.message}`);
      }
      console.error('Generic error creating room:', error);
      throw error;
    }
  },

  // Update room
  // Assuming UpdateRoomRequest is defined in types/api.ts and includes { name?: string, description?: string }
  async updateRoom(roomId: number, roomData: UpdateRoomRequest): Promise<Room> {
    try {
      // apiClient.put<Room> is expected to return the updated Room object directly
      const updatedRoom = await apiClient.put<Room>(`/rooms/${roomId}`, roomData);
      return updatedRoom;
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error updating room ${roomId} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to update room ${roomId}: ${error.message}`);
      }
      console.error(`Generic error updating room ${roomId}:`, error);
      throw error;
    }
  },

  // Delete room
  async deleteRoom(roomId: number): Promise<void> {
    try {
      // apiClient.delete might return nothing (void) or a confirmation object.
      // Assuming it returns a generic object or nothing on success based on api.ts (Promise<T>).
      // If it's truly void, the type parameter for apiClient.delete might be <void>.
      await apiClient.delete<unknown>(`/rooms/${roomId}`); // Using <unknown> if response is not strictly typed or used
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Error deleting room ${roomId} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to delete room ${roomId}: ${error.message}`);
      }
      console.error(`Generic error deleting room ${roomId}:`, error);
      throw error;
    }
  },

  // Add this new method
  async getDevicesInRoom(roomId: number): Promise<Device[]> {
    try {
      const devicesData = await apiClient.get<Device[]>(`/rooms/${roomId}/devices`);
      return devicesData || []; // Ensure array is returned
    } catch (error) {
      if (error instanceof ApiError) {
        // For a list, returning an empty array on error (especially 404 for the room itself) might be acceptable
        if (error.status === 404) {
          console.warn(`Error fetching devices for room ${roomId}: Room not found (404). Returning empty list.`);
          return []; 
        }
        console.error(`Error fetching devices for room ${roomId} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to fetch devices for room ${roomId}: ${error.message}`);
      }
      console.error(`Generic error fetching devices for room ${roomId}:`, error);
      throw error;
    }
  },
  
  // Add missing getSensorsInRoom method
  async getSensorsInRoom(roomId: number): Promise<Sensor[]> {
    try {
      const sensorsData = await apiClient.get<Sensor[]>(`/rooms/${roomId}/sensors`);
      return sensorsData || []; // Ensure array is returned
    } catch (error) {
      if (error instanceof ApiError) {
        // For a list, returning an empty array on error (especially 404) might be acceptable
        if (error.status === 404) {
          console.warn(`Error fetching sensors for room ${roomId}: Room not found (404). Returning empty list.`);
          return []; 
        }
        console.error(`Error fetching sensors for room ${roomId} (status: ${error.status}):`, error.message);
        throw new Error(`Failed to fetch sensors for room ${roomId}: ${error.message}`);
      }
      console.error(`Generic error fetching sensors for room ${roomId}:`, error);
      throw error;
    }
  }
};

// Final comment line cleaned 