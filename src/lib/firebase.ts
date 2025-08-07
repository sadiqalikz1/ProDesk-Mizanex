// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCifdry6_FMd-DRTZqe2cVZ1mcKijyRxiE",
  authDomain: "prodesk-mizanex.firebaseapp.com",
  databaseURL: "https://prodesk-mizanex-default-rtdb.firebaseio.com",
  projectId: "prodesk-mizanex",
  storageBucket: "prodesk-mizanex.appspot.com",
  messagingSenderId: "798483829998",
  appId: "1:798483829998:web:395b81d611902783e38fff",
  measurementId: "G-W8Z3RSME25"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, firestore, auth, database, analytics };
