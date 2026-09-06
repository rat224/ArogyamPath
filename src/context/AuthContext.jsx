/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange } from "../firebase/services/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthChange(async (user) => {
      setLoading(true);

      if (user) {
        setCurrentUser(user);
        
        // REAL-TIME USER PROFILE LISTENER 
        const docRef = doc(db, "users", user.uid);
        unsubscribeDoc = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setUserDoc(snap.data());
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user profile:", error);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserDoc(null);
        if (unsubscribeDoc) unsubscribeDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const value = {
    currentUser,
    userDoc,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};