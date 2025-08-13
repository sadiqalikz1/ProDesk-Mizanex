
'use client';
import { useState, useEffect, useCallback } from 'react';

type User = {
  username: string;
};

<<<<<<< HEAD
const FAKE_USER: User = { username: 'sadiq' };
const FAKE_PASSWORD = 'Sadiq@@268';
=======
type StoredUser = {
    username: string;
    password?: string;
}

// This is a simplified in-memory "database" for users.
// In a real app, this would be a call to a secure backend.
const initialUsers: StoredUser[] = [{ username: 'sadiq', password: 'Sadiq@@268' }];

const getUsersFromStorage = (): StoredUser[] => {
    if (typeof window === 'undefined') {
        return initialUsers;
    }
    try {
        const stored = localStorage.getItem('users');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to read users from localStorage", e);
    }
    
    // If nothing in storage, set initial users
    try {
        localStorage.setItem('users', JSON.stringify(initialUsers));
    } catch (e) {
        console.error("Failed to write initial users to localStorage", e);
    }
    
    return initialUsers;
};

const setUsersInStorage = (users: StoredUser[]) => {
    try {
        localStorage.setItem('users', JSON.stringify(users));
    } catch (e) {
        console.error("Failed to write users to localStorage", e);
    }
};
>>>>>>> 6967e15 (but new created users cant login fix this)

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
<<<<<<< HEAD
        if (username === FAKE_USER.username && password === FAKE_PASSWORD) {
          const userToStore = { username };
=======
        const users = getUsersFromStorage();
        const foundUser = users.find(u => u.username === username && u.password === password);

        if (foundUser) {
          const userToStore = { username: foundUser.username };
>>>>>>> 6967e15 (but new created users cant login fix this)
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
<<<<<<< HEAD

  return { user, login, logout, loading };
=======
  
  const createUser = useCallback(async (username, password) => {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            if(!username || !password) {
                return reject(new Error('Username and password are required.'));
            }
            const users = getUsersFromStorage();
            const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

            if (existingUser) {
                return reject(new Error('Username already exists.'));
            }

            const newUsers = [...users, { username, password }];
            setUsersInStorage(newUsers);
            resolve();
        }, 300);
    });
  }, []);

  return { user, login, logout, loading, createUser };
>>>>>>> 6967e15 (but new created users cant login fix this)
}
