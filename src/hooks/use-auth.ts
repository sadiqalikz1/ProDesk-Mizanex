
'use client';
import { useState, useEffect, useCallback } from 'react';

type User = {
  username: string;
};

// This is a simplified in-memory "database" for users.
// In a real app, this would be a call to a secure backend.
const getStoredUsers = () => {
    if (typeof window === 'undefined') {
        return [{ username: 'sadiq', password: 'Sadiq@@268' }];
    }
    try {
        const users = localStorage.getItem('users');
        if (users) {
            return JSON.parse(users);
        }
    } catch (e) {
        console.error('Failed to parse users from localStorage', e);
    }
    // Default user if none are stored
    const defaultUsers = [{ username: 'sadiq', password: 'Sadiq@@268' }];
    try {
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    } catch(e) {
      console.error('Failed to save default users to localStorage', e);
    }
    return defaultUsers;
};

const setStoredUsers = (users: any[]) => {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save users to localStorage', e);
    }
}


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
        const users = getStoredUsers();
        const foundUser = users.find(u => u.username === username && u.password === password);

        if (foundUser) {
          const userToStore = { username: foundUser.username };
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
  
  const createUser = useCallback(async (username, password) => {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if(!username || !password) {
                return reject(new Error('Username and password are required.'));
            }
            const users = getStoredUsers();
            const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

            if (existingUser) {
                return reject(new Error('Username already exists.'));
            }

            const newUsers = [...users, { username, password }];
            setStoredUsers(newUsers);
            resolve();
        }, 300);
    });
  }, []);

  return { user, login, logout, loading, createUser };
}
