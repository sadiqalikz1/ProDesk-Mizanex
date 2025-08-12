
'use client';
import { useState, useEffect, useCallback } from 'react';

type User = {
  username: string;
};

const FAKE_USER: User = { username: 'sadiq' };
const FAKE_PASSWORD = 'Sadiq@@268';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from session storage', error);
      sessionStorage.removeItem('user');
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (username === FAKE_USER.username && password === FAKE_PASSWORD) {
          const userToStore = { username };
          sessionStorage.setItem('user', JSON.stringify(userToStore));
          setUser(userToStore);
          setLoading(false);
          resolve();
        } else {
          setLoading(false);
          reject(new Error('Invalid username or password'));
        }
      }, 500);
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  return { user, login, logout, loading };
}
