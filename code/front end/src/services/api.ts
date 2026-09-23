import { apiClient } from '../lib/axios';
import { ApiResponse } from '../types';

export const getRequest = async <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
  return apiClient.get(url, { params });
};

export const postRequest = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
  return apiClient.post(url, data);
};

export const putRequest = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
  return apiClient.put(url, data);
};

export const deleteRequest = async <T>(url: string): Promise<ApiResponse<T>> => {
  return apiClient.delete(url);
};
