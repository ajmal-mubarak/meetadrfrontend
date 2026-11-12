/**
 * Photo Management API Service.
 * Connects the Platform Admin Photo Manager to Supabase Storage backend endpoints:
 *   GET    /api/v1/admin/photos/?category=doctors|hospitals|logos
 *   POST   /api/v1/admin/photos/upload/
 *   DELETE /api/v1/admin/photos/delete/
 */
import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';

export type PhotoCategory = 'doctors' | 'hospitals' | 'logos';

export interface StoragePhotoItem {
  name: string;
  path: string;
  category: PhotoCategory;
  url: string;
  size: number;
  content_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PhotoListResponse {
  success: boolean;
  category: PhotoCategory;
  count: number;
  photos: StoragePhotoItem[];
}

export interface PhotoUploadResponse {
  success: boolean;
  category: PhotoCategory;
  total: number;
  uploaded_count: number;
  uploaded: StoragePhotoItem[];
  errors: Array<{ name: string; error: string }>;
}

export const photoManageService = {
  /**
   * List photos for a specific category (doctors, hospitals, logos).
   */
  async listPhotos(category: PhotoCategory, limit: number = 200, offset: number = 0): Promise<StoragePhotoItem[]> {
    const res = await apiClient.get<PhotoListResponse>(API_ENDPOINTS.ADMIN.PHOTOS, {
      params: { category, limit, offset },
    });
    return res.photos || [];
  },

  /**
   * Upload multiple photos under a category to Supabase Storage.
   */
  async uploadPhotos(category: PhotoCategory, files: File[]): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('category', category);
    for (const file of files) {
      formData.append('files', file);
    }

    return await apiClient.post<PhotoUploadResponse>(API_ENDPOINTS.ADMIN.PHOTOS_UPLOAD, formData);
  },

  /**
   * Delete a photo by path.
   */
  async deletePhoto(path: string): Promise<boolean> {
    const res = await apiClient.delete<{ success: boolean }>(API_ENDPOINTS.ADMIN.PHOTOS_DELETE, {
      data: { path },
    });
    return Boolean(res?.success);
  },
};

