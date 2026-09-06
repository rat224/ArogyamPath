import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../config";

const googleProvider = new GoogleAuthProvider();

// Sign up new user
export const signUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential; // Return full credential for flexible usage
};

// Log in existing user
export const logIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential; // Return full credential as expected by Login.jsx
};

// Sign out
export const logOut = async () => {
  localStorage.removeItem("roleVerified");
  await signOut(auth);
};

// Auth State Observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Google Sign In
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result;
};

// Password Reset
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};
