// Scenes API Service
import { apiClient, ApiResponse } from '../lib/api';
import type { Scene, CreateSceneRequest, UpdateSceneRequest } from '../types/api';

export const scenesApi = {
  // Get all scenes for current user
  getAllScenes: async (): Promise<Scene[]> => {
    const response = await apiClient.get<ApiResponse<Scene[]>>('/scenes');
    return response.data;
  },

  // Get scene by ID
  getSceneById: async (id: number): Promise<Scene> => {
    const response = await apiClient.get<ApiResponse<Scene>>(`/scenes/${id}`);
    return response.data;
  },

  // Create new scene
  createScene: async (sceneData: CreateSceneRequest): Promise<Scene> => {
    const response = await apiClient.post<ApiResponse<Scene>>('/scenes', sceneData);
    return response.data;
  },

  // Update scene
  updateScene: async (id: number, sceneData: UpdateSceneRequest): Promise<Scene> => {
    const response = await apiClient.put<ApiResponse<Scene>>(`/scenes/${id}`, sceneData);
    return response.data;
  },

  // Delete scene
  deleteScene: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/scenes/${id}`);
  },

  // Activate scene
  activateScene: async (id: number): Promise<Scene> => {
    const response = await apiClient.post<ApiResponse<Scene>>(`/scenes/${id}/activate`);
    return response.data;
  },

  // Toggle scene active status
  toggleScene: async (id: number, isActive: boolean): Promise<Scene> => {
    return scenesApi.updateScene(id, { isActive });
  }
};
