import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCQZiLTMWC_TLvRGnRbvtORsjJWxBZlQdk",
  authDomain: "vaultnet-9c3cf.firebaseapp.com",
  projectId: "vaultnet-9c3cf",
  storageBucket: "vaultnet-9c3cf.firebasestorage.app",
  messagingSenderId: "680432694502",
  appId: "1:680432694502:web:e719c6e0cb3460522d3727"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
