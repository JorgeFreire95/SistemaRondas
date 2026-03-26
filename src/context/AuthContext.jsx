import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, adminAuth, db } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Unique ID for this device session
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('rondas_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('rondas_session_id', sid);
    }
    return sid;
  });

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
        const data = snapshot.data();
        
        // Conflict detection: if someone else logged in
        if (data.activeSessionId && data.activeSessionId !== sessionId) {
          alert("Se ha iniciado sesión en otro dispositivo. Se cerrará esta sesión.");
          logout();
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...data
        });
      } else {
        // If the document is deleted, log the user out immediately
        logout();
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
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const uid = credentials.user.uid;
      
      // Check for active session before allowing entry
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.activeSessionId && data.activeSessionId !== sessionId) {
          await signOut(auth); // Sign out immediately
          return { 
            success: false, 
            message: "YA TIENES UNA SESIÓN ABIERTA CON EL USUARIO EN OTRO DISPOSITIVO" 
          };
        }
        
        // Set current session
        await setDoc(userRef, { activeSessionId: sessionId }, { merge: true });
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let msg = "Error al iniciar sesión";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = "Usuario o contraseña incorrectos";
      }
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        // Clear session in Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), { activeSessionId: null }, { merge: true });
      }
    } catch (e) {
      console.error("Error clearing session on logout:", e);
    }
    return signOut(auth);
  };

  const addUser = async (email, password, name, role, extraData = {}) => {
    try {
      // Use the secondary adminAuth to avoid logging out the current admin
      const userCredential = await createUserWithEmailAndPassword(adminAuth, email, password);
      const newUser = { name, role, email, ...extraData };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      
      // Sign out from the temporary admin app specifically
      await signOut(adminAuth);
      
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
