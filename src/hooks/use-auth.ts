
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getDatabase, ref, get, set, child } from "firebase/database";
import { app } from '@/lib/firebase';


type User = {
  username: string;
};

<<<<<<< HEAD
<<<<<<< HEAD
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

=======
// This hook now uses Firebase Realtime Database for user storage.
>>>>>>> 17672a1 (USER DATA STORE IN FIRE BASE DATABASE MOVE CURENT USER DATA)
=======
// This hook now uses Firebase Realtime Database for user storage.
>>>>>>> fec24d5ab29fd1a78e81f689e13cc9e1128f9c4f
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
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
=======
>>>>>>> fec24d5ab29fd1a78e81f689e13cc9e1128f9c4f
    const db = getDatabase(app);
    const usersRef = ref(db, 'users');
    const userRef = child(usersRef, username.toLowerCase());

    try {
<<<<<<< HEAD
      const snapshot = await get(userRef);

      if (snapshot.exists() && snapshot.val().password === password) {
        const userToStore = { username: snapshot.val().username };
        sessionStorage.setItem('user', JSON.stringify(userToStore));
        setUser(userToStore);
      } else {
        // If login fails, check if any user exists at all.
        // If not, seed the default user. This is a one-time operation.
        const allUsersSnap = await get(usersRef);
        if (!allUsersSnap.exists()) {
            const sadiqRef = child(usersRef, 'sadiq');
            await set(sadiqRef, { username: 'sadiq', password: '123'});
=======
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
<<<<<<< HEAD
>>>>>>> 17672a1 (USER DATA STORE IN FIRE BASE DATABASE MOVE CURENT USER DATA)
=======
>>>>>>> fec24d5ab29fd1a78e81f689e13cc9e1128f9c4f
>>>>>>> future
        }
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
<<<<<<< HEAD
<<<<<<< HEAD

  return { user, login, logout, loading };
=======
  
  const createUser = useCallback(async (username, password) => {
    if(!username || !password) {
        throw new Error('Username and password are required.');
    }

=======
  
  const createUser = useCallback(async (username, password) => {
    if(!username || !password) {
        return Promise.reject(new Error('Username and password are required.'));
    }

>>>>>>> fec24d5ab29fd1a78e81f689e13cc9e1128f9c4f
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
<<<<<<< HEAD
>>>>>>> 6967e15 (but new created users cant login fix this)
=======
>>>>>>> fec24d5ab29fd1a78e81f689e13cc9e1128f9c4f
}
