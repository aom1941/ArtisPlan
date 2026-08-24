import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot,
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import type { ProjectData } from '../types';

let firebaseConfig: any = {
  projectId: "picas-9e875",
  appId: "1:11972199461:web:4b7d5cbb673064150dabcc",
  apiKey: "AIzaSyC3-nMDAXl1FKfeKZpTm5HE4E7GwO1Q1RY",
  authDomain: "picas-9e875.firebaseapp.com",
  storageBucket: "picas-9e875.firebasestorage.app",
  messagingSenderId: "11972199461",
};

// Try to read custom config if available in window or imports
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Sign in anonymously for instant collaboration session
export const initAuth = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err) {
          console.warn("Anonymous auth failed, operating locally:", err);
          resolve(null);
        }
      }
    });
  });
};

// Helper to recursively strip undefined properties and values for Firestore compatibility
export const sanitizeForFirestore = <T>(val: T): T => {
  if (val === null || val === undefined) {
    return val;
  }
  if (typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(val)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
};

// Sync Project to Firestore
export const saveProjectToCloud = async (project: ProjectData): Promise<boolean> => {
  try {
    const projectRef = doc(db, 'art_projects', project.id);
    const sanitizedProject = sanitizeForFirestore(project);
    const cleanData = {
      ...sanitizedProject,
      updatedAt: new Date().toISOString(),
      _cloudSavedAt: serverTimestamp(),
    };
    await setDoc(projectRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to save project to Firestore:", err);
    return false;
  }
};

// Fetch Project from Firestore
export const fetchProjectFromCloud = async (projectId: string): Promise<ProjectData | null> => {
  try {
    const projectRef = doc(db, 'art_projects', projectId);
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      return snap.data() as ProjectData;
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch project from Firestore:", err);
    return null;
  }
};

// Real-time listener for multi-device cross-sync
export const subscribeToProjectCloud = (
  projectId: string, 
  onUpdate: (project: ProjectData) => void
) => {
  const projectRef = doc(db, 'art_projects', projectId);
  return onSnapshot(projectRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as ProjectData;
      onUpdate(data);
    }
  }, (err) => {
    console.warn("Firestore subscription note:", err.message);
  });
};
