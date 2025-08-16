
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from '@/lib/firebase';

type User = {
  username: string;
};

type StoredSession = {
  user: User;
  timestamp: number;
}

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSession = localStorage.getItem('userSession');
      if (storedSession) {
        const { user: storedUser, timestamp }: StoredSession = JSON.parse(storedSession);
        if (Date.now() - timestamp < THREE_DAYS_IN_MS) {
            setUser(storedUser);
        } else {
            localStorage.removeItem('userSession');
        }
      }
    } catch (error) {
      console.error('Failed to parse user from local storage', error);
      localStorage.removeItem('userSession');
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
        const userToStore: User = { username: snapshot.val().username };
        const sessionToStore: StoredSession = { user: userToStore, timestamp: Date.now() };

        localStorage.setItem('userSession', JSON.stringify(sessionToStore));
        setUser(userToStore);
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error: any) {
        throw error;
    } finally {
        setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userSession');
    setUser(null);
  }, []);
  
  const createUser = useCallback(async (username, password) => {
    if(!username || !password) {
        throw new Error('Username and password are required.');
    }
    
    if (user?.username !== 'sadiq') {
        throw new Error('Only the admin user can create new users.');
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
  }, [user]);

  return { user, login, logout, loading, createUser };
}
