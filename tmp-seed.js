
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAoSUxKjXRe2exPPaJ9A6a31tRg8mBF22g",
  authDomain: "sistemarondas-72799.firebaseapp.com",
  projectId: "sistemarondas-72799",
  storageBucket: "sistemarondas-72799.firebasestorage.app",
  messagingSenderId: "797332524004",
  appId: "1:797332524004:web:cc1f168d4e5b2a899295f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  try {
    console.log("Creando usuario administrador...");
    const userCredential = await createUserWithEmailAndPassword(auth, "admin@test.com", "123456");
    console.log("Auth creado correctamente.");
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: "Admin de Sistema",
      role: "admin",
      email: "admin@test.com"
    });
    console.log("Firestore guardado correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("Error al crear admin:", error.message);
    process.exit(1);
  }
}

seed();
