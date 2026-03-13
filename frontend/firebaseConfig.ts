
// 1. QUESTA RIGA LA DEVI AGGIUNGERE TU (serve per il login)
import { getAuth } from 'firebase/auth';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDn7faEr5J_RXeyRzSOeyZRUgPOvTLfMKY",
  authDomain: "factcheckapp-f8e0e.firebaseapp.com",
  projectId: "factcheckapp-f8e0e",
  storageBucket: "factcheckapp-f8e0e.firebasestorage.app",
  messagingSenderId: "714083621460",
  appId: "1:714083621460:web:d1a0dc05468255f22aabc1",
  measurementId: "G-X5JES826RZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// 2. QUESTA RIGA LA DEVI AGGIUNGERE TU (permette alla schermata di login di usare l'autenticazione)
export const auth = getAuth(app);