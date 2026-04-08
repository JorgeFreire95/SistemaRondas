import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = 'sistemarondas-72799.firebasestorage.app';

async function setCorsConfiguration() {
  try {
    await storage.bucket(bucketName).setCorsConfiguration([
      {
        maxAgeSeconds: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
        origin: ['*'],
        responseHeader: ['Content-Type', 'x-goog-resumable'],
      },
    ]);
    console.log('✅ CORS configurado con éxito.');
  } catch (error) {
    console.error('❌ Error configurando CORS:', error);
  }
}

setCorsConfiguration();
