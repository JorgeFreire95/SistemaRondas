import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (!u) {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    setLoading(true);
    const unsubDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...snapshot.data()
        });
      } else {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: 'guest'
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user doc:", error);
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'error' });
      setLoading(false);
    });

    return unsubDoc;
  }, [firebaseUser]);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => signOut(auth);

  const addUser = async (email, password, name, role, extraData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = { name, role, email, ...extraData };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, addUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
