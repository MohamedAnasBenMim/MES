const AUTH_KEYS = ['user', 'role', 'username', 'user_id', 'session_id'];

export function getAuthItem(key: string): string | null {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function getAuthUser(): any {
  const storedUser = getAuthItem('user');

  if (!storedUser) {
    return {};
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return {};
  }
}

export function getAuthRole(): string {
  const user = getAuthUser();
  return (user?.role || getAuthItem('role') || '').toLowerCase();
}

export function getAuthUsername(): string {
  const user = getAuthUser();
  return user?.username || getAuthItem('username') || '';
}

export function getAuthUserId(): number | null {
  const user = getAuthUser();
  return Number(user?.id || getAuthItem('user_id')) || null;
}

export function setAuthSession(user: any, role: string, sessionId?: string | number): void {
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('role', role);
  sessionStorage.setItem('username', user?.username || '');
  sessionStorage.setItem('user_id', String(user?.id || ''));

  if (sessionId) {
    sessionStorage.setItem('session_id', String(sessionId));
  } else {
    sessionStorage.removeItem('session_id');
  }

  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function updateAuthUser(user: any): void {
  sessionStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('username', user?.username || '');
  sessionStorage.setItem('user_id', String(user?.id || ''));
}

export function clearAuthSession(): void {
  AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
}
