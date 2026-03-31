import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Credentials should be filled by user
const firebaseConfig = {
  apiKey: "AIzaSyAoSUxKjXRe2exPPaJ9A6a31tRg8mBF22g",
  authDomain: "sistemarondas-72799.firebaseapp.com",
  projectId: "sistemarondas-72799",
  storageBucket: "sistemarondas-72799.firebasestorage.app",
  messagingSenderId: "797332524004",
  appId: "1:797332524004:web:cc1f168d4e5b2a899295f1",
  measurementId: "G-6D38J8HY0H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Secondary app for admin-only registrations (avoids auto-login)
const adminApp = initializeApp(firebaseConfig, "admin-registration");
export const adminAuth = getAuth(adminApp);

// Use browserSessionPersistence to logout on tab/window closure
setPersistence(auth, browserSessionPersistence)
  .catch((error) => console.error("Persistence error:", error));

export const db = initializeFirestore(app, {
  // Removed experimentalAutoDetectLongPolling due to ca9 crash on Capacitor
});
export const storage = getStorage(app);
export default app;
