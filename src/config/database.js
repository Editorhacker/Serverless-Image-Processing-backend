import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

let db;

try {
  const envVar = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!envVar) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT not found in .env");
  }

  let serviceAccount;
  
  if (envVar.trim().startsWith('{')) {
    // If it's the raw JSON string
    serviceAccount = JSON.parse(envVar);
  } else {
    // If it's a file path
    const resolvedPath = path.resolve(process.cwd(), envVar);
    const module = await import(resolvedPath, { assert: { type: 'json' } });
    serviceAccount = module.default;
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase initialized");

  db = admin.firestore();
} catch (error) {
  console.error("Firebase Admin Initialization Error:", error);
  throw error;
}

export const saveImage = async (imageId, imageData) => {
  await db.collection('images').doc(imageId).set(imageData);
  return imageData;
};

export const getImage = async (imageId) => {
  const doc = await db.collection('images').doc(imageId).get();
  return doc.exists ? doc.data() : null;
};

export const getAllImages = async () => {
  const snapshot = await db.collection('images').orderBy('uploadedAt', 'desc').get();
  return snapshot.docs.map(doc => doc.data());
};

export const deleteImage = async (imageId) => {
  await db.collection('images').doc(imageId).delete();
  return true;
};

export const imageExists = async (imageId) => {
  const doc = await db.collection('images').doc(imageId).get();
  return doc.exists;
};


