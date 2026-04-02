import { UserResponse } from '@/types';
import { clearStorageNamespace, readStorage, readStringStorage, writeStorage } from '@/lib/client-storage';

const AUTH_TOKEN_STORAGE_KEY = 'auth:token';
const AUTH_USER_STORAGE_KEY = 'auth:user';

function parseUser(value: unknown): UserResponse | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as UserResponse;
}

export function getStoredToken() {
  return readStringStorage(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string) {
  writeStorage(AUTH_TOKEN_STORAGE_KEY, token);
}

export function getStoredUser() {
  return readStorage<UserResponse | null>(AUTH_USER_STORAGE_KEY, null, parseUser);
}

export function setStoredUser(user: UserResponse) {
  writeStorage(AUTH_USER_STORAGE_KEY, user);
}

export function clearStoredSession() {
  clearStorageNamespace([AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY]);
}
