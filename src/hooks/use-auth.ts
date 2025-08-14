
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, get, set, child } from "firebase/database";
import { app } from '@/lib/firebase';


type User = {
  username: string;
};

// This hook now uses Firebase Realtime Database for user storage.
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
    const db = getDatabase(app);
    const userRef = ref(db, 'users/' + username.toLowerCase());

    try {
      const snapshot = await get(userRef);

      if (snapshot.exists() && snapshot.val().password === password) {
        const userToStore = { username: snapshot.val().username };
        sessionStorage.setItem('user', JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error: any) {
        console.error("Firebase login error:", error);
        throw error; // Re-throw the error to be caught by the form
    } finally {
        setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);
  
  const createUser = useCallback(async (username, password) => {
    if(!username || !password) {
        throw new Error('Username and password are required.');
    }

    const db = getDatabase(app);
    const userRef = ref(db, 'users/' + username.toLowerCase());

    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            throw new Error('Username already exists.');
        }
        
        await set(userRef, { username, password });

    } catch (error: any) {
        console.error("Firebase createUser error:", error);
        throw error;
    }
  }, []);

  return { user, login, logout, loading, createUser };
}
