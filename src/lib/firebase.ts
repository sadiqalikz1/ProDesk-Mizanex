// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "prodesk-mizanex.firebaseapp.com",
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

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, firestore, auth, analytics };
