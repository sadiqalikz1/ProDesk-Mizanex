
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
    const dbRef = ref(db);

    try {
        const snapshot = await get(child(dbRef, `users/${username}`));
        
        // If no users exist at all, create the default user.
        const allUsersSnapshot = await get(child(dbRef, 'users'));
        if (!allUsersSnapshot.exists()) {
             await set(ref(db, 'users/sadiq'), {
                username: 'sadiq',
                password: 'Sadiq@@268',
            });
            // Re-check for the user after seeding
            const seededSnapshot = await get(child(dbRef, `users/${username}`));
             if (seededSnapshot.exists() && seededSnapshot.val().password === password) {
                const userToStore = { username: seededSnapshot.val().username };
                sessionStorage.setItem('user', JSON.stringify(userToStore));
                setUser(userToStore);
                resolve();
                return;
            }
        }
        
        if (snapshot.exists() && snapshot.val().password === password) {
            const userToStore = { username: snapshot.val().username };
            sessionStorage.setItem('user', JSON.stringify(userToStore));
            setUser(userToStore);
            return Promise.resolve();
        } else {
            return Promise.reject(new Error('Invalid username or password'));
        }
    } catch (error) {
        console.error("Firebase login error:", error);
        return Promise.reject(new Error('An error occurred during login.'));
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
        return Promise.reject(new Error('Username and password are required.'));
    }

    const db = getDatabase(app);
    const userRef = ref(db, 'users/' + username.toLowerCase());

    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return Promise.reject(new Error('Username already exists.'));
        }
        
        await set(userRef, { username, password });
        return Promise.resolve();

    } catch (error) {
        console.error("Firebase createUser error:", error);
        return Promise.reject(new Error('An error occurred while creating the user.'));
    }
  }, []);

  return { user, login, logout, loading, createUser };
}
