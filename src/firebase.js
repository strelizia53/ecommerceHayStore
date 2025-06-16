// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBePHnZ06Qd03PmfPimNx8UfgnM6sxiAu8",
  authDomain: "ecommerceappfyphay.firebaseapp.com",
  projectId: "ecommerceappfyphay",
  storageBucket: "ecommerceappfyphay.firebasestorage.app",
  messagingSenderId: "976452277580",
  appId: "1:976452277580:web:4e441636e4abd5680debe9",
  measurementId: "G-PCL21TM00E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
