/**
 * Paso 1: Lee los usuarios de Firebase y los imprime en formato JSON
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAoSUxKjXRe2exPPaJ9A6a31tRg8mBF22g",
  authDomain: "sistemarondas-72799.firebaseapp.com",
  projectId: "sistemarondas-72799",
  storageBucket: "sistemarondas-72799.firebasestorage.app",
  messagingSenderId: "797332524004",
  appId: "1:797332524004:web:cc1f168d4e5b2a899295f1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportUsers() {
  console.log('Reading Firebase users...');
  const snapshot = await getDocs(collection(db, 'users'));
  const users = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
  
  // Output as JSON
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

exportUsers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
