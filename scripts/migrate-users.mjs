/**
 * Script de migración: Firebase Users → Supabase
 * 
 * Este script:
 * 1. Lee todos los usuarios de la colección 'users' en Firestore
 * 2. Crea los usuarios en Supabase Auth
 * 3. Inserta los datos en la tabla public.users de Supabase
 * 
 * IMPORTANTE: Necesita la service_role key de Supabase (no la anon key)
 * para poder crear usuarios en auth.users via admin API.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAoSUxKjXRe2exPPaJ9A6a31tRg8mBF22g",
  authDomain: "sistemarondas-72799.firebaseapp.com",
  projectId: "sistemarondas-72799",
  storageBucket: "sistemarondas-72799.firebasestorage.app",
  messagingSenderId: "797332524004",
  appId: "1:797332524004:web:cc1f168d4e5b2a899295f1"
};

// Supabase config - usa la SERVICE ROLE KEY (no anon key) para operaciones admin
const SUPABASE_URL = 'https://ijmwlehyttqulbnovroi.supabase.co';
// IMPORTANTE: Reemplaza con tu service_role key desde el dashboard de Supabase
// Settings > API > service_role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'TU_SERVICE_ROLE_KEY_AQUI';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function migrateUsers() {
  console.log('📥 Leyendo usuarios de Firebase...');
  
  const snapshot = await getDocs(collection(db, 'users'));
  const firebaseUsers = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
  
  console.log(`   Encontrados: ${firebaseUsers.length} usuarios\n`);
  
  // Mostrar los usuarios encontrados
  firebaseUsers.forEach(u => {
    console.log(`   👤 ${u.name || 'Sin nombre'} | ${u.email} | Rol: ${u.role} | RUT: ${u.rut || 'N/A'}`);
  });
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (const fbUser of firebaseUsers) {
    try {
      console.log(`🔄 Migrando: ${fbUser.name || fbUser.email}...`);
      
      // 1. Crear usuario en auth.users de Supabase
      // Usamos el RUT como password temporal (como hace la app)
      const password = fbUser.rut || fbUser.email.split('@')[0] || 'TempPass123!';
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: fbUser.email,
        password: password,
        email_confirm: true, // Auto-confirmar email
        user_metadata: {
          name: fbUser.name,
          role: fbUser.role
        }
      });

      if (authError) {
        // Si el usuario ya existe, intentar buscarlo
        if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
          console.log(`   ⚠️  Ya existe en auth, buscando...`);
          const { data: listData } = await supabase.auth.admin.listUsers();
          const existing = listData?.users?.find(u => u.email === fbUser.email);
          if (existing) {
            // Insertar solo en public.users
            await insertPublicUser(existing.id, fbUser);
            successCount++;
            continue;
          }
        }
        throw authError;
      }

      // 2. Insertar en public.users con el ID generado por auth
      await insertPublicUser(authData.user.id, fbUser);
      
      console.log(`   ✅ Migrado exitosamente (ID: ${authData.user.id})`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Error migrando ${fbUser.email}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Migrados: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📊 Total: ${firebaseUsers.length}`);
  
  process.exit(0);
}

async function insertPublicUser(supabaseAuthId, fbUser) {
  const { error } = await supabase.from('users').upsert({
    id: supabaseAuthId,
    email: fbUser.email,
    name: fbUser.name || '',
    role: fbUser.role || 'guardia',
    rut: fbUser.rut || null,
    dv: fbUser.dv || null,
    // Las instalaciones/secciones se re-asignarán después ya que los IDs cambiaron
  }, { onConflict: 'id' });
  
  if (error) throw error;
}

migrateUsers().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
