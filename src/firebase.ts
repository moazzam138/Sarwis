import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_MM3HSRv8KoyTs5THqjd6",
  authDomain: "studio-8518113056-71790.firebaseapp.com",
  projectId: "studio-8518113056-71790",
  storageBucket: "studio-8518113056-71790.appspot.com",
  messagingSenderId: "934801290952",
  appId: "1:934801290952:web:38b18cd4ca"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);