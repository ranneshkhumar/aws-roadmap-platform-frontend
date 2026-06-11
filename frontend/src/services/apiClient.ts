import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status: number;
  errors?: any;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiBaseUrl) {
  throw new Error('Critical Configuration Error: process.env.NEXT_PUBLIC_API_URL is missing.');
}

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Normalize Axios errors to ApiError
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
    };
    return Promise.reject(apiError);
  }
);

export default apiClient;
