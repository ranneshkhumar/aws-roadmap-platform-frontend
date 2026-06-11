import apiClient from './apiClient';
import { LoginDto, RegisterDto, AuthResponse, UserProfile } from './api';

export const authService = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', dto);
    return res.data;
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', dto);
    return res.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>('/auth/profile');
    return res.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // Deprecate simulation keys
      localStorage.removeItem('role');
      localStorage.removeItem('isAuthenticated');
    }
  },
};
