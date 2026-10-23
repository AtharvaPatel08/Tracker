import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDOcVcBpELis2mWsirbULyzdhmBvSr4J7o",
  authDomain: "shat-94ca2.firebaseapp.com",
  projectId: "shat-94ca2",
  storageBucket: "shat-94ca2.firebasestorage.app",
  messagingSenderId: "498548105345",
  appId: "1:498548105345:web:f6f7d5514bef94c795ad80",
  measurementId: "G-XH7LSM0VGK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
