// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "prodesk-mizanex.firebaseapp.com",
  databaseURL: "https://prodesk-mizanex-default-rtdb.firebaseio.com/",
  projectId: "prodesk-mizanex",
  storageBucket: "prodesk-mizanex.appspot.com",
  messagingSenderId: "99359146536",
  appId: "1:99359146536:web:1c3e381ad7f52de20a84b0",
  measurementId: "G-RFR5P3XG02"
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
