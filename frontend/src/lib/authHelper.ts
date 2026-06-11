import { UserRole } from '@/services/api';

/**
 * TODO: This is a temporary compatibility layer mapping backend uppercase roles
 * to legacy lowercase UI properties. Remove once UI handles uppercase roles.
 */
export const getAuthSession = () => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, role: null, user: null };
  }

  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return { isAuthenticated: false, role: null, user: null };
  }

  try {
    const user = JSON.parse(userStr);
    const roleMap: Record<UserRole, string> = {
      CORE: 'core',
      CREW: 'crew',
      ENTHUSIAST: 'enthusiast',
    };
    return {
      isAuthenticated: true,
      role: roleMap[user.role as UserRole] || 'enthusiast',
      user,
    };
  } catch {
    return { isAuthenticated: false, role: null, user: null };
  }
};
