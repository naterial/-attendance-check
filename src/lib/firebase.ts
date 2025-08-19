// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "new-prototype-gxrpr",
  "appId": "1:1007256730828:web:12ebdfff6f2f7555b61669",
  "storageBucket": "new-prototype-gxrpr.firebasestorage.app",
  "apiKey": "AIzaSyD537v1yaJwKybB9bcg-HWNhgEueZB0y5s",
  "authDomain": "new-prototype-gxrpr.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1007256730828"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


export { db, auth, app };
