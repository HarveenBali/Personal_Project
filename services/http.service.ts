import axios, { type AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { getSecureItem, removeSecureItem } from './storage.service';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  message?: string;
  error?: string;
  code?: string;
}

export const httpClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  headers: { Accept: 'application/json' },
  timeout: 30_000,
});

httpClient.interceptors.request.use((config) => {
  const token =
    typeof window === 'undefined' ? null : getSecureItem<string>('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      removeSecureItem('accessToken');
      window.dispatchEvent(new CustomEvent('app:unauthorized'));
    }

    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'The request failed.';
    return Promise.reject(new ApiError(message, status, error.response?.data?.code));
  },
);
