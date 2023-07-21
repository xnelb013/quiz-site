import { GoogleAuthProvider, UserCredential, getAuth, signInWithPopup } from "firebase/auth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4qq-5-jNRUoKk37id3M_dB6MkfazYH74",
  authDomain: "quiz-site-d2062.firebaseapp.com",
  projectId: "quiz-site-d2062",
  storageBucket: "quiz-site-d2062.appspot.com",
  messagingSenderId: "711917269121",
  appId: "1:711917269121:web:1fd608427fddc335705d80",
  measurementId: "G-9XZV70FZ5P",
};

export const app = firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore();
export const storage = firebase.storage();

export const auth = getAuth(app);

export const signInWithGoogle = (): Promise<UserCredential> => {
  const googleProvider = new GoogleAuthProvider();

  return signInWithPopup(auth, googleProvider);
};
