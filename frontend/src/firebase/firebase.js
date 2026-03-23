import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmNJhdwySk7BVlvrldV5TjEz43Fizr5Fs",
  authDomain: "smartmedi-d2601.firebaseapp.com",
  projectId: "smartmedi-d2601",
  storageBucket: "smartmedi-d2601.firebasestorage.app",
  messagingSenderId: "229833779109",
  appId: "1:229833779109:web:b1a675a9b79cb897232a4c",
  measurementId: "G-RL8Q2483EB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
