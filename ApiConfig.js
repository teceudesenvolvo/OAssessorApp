import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBNW0mDARNEofVO6iJXwYz-IAXKy9BxJ3Y",
    authDomain: "oassessor-blu.firebaseapp.com",
    projectId: "oassessor-blu",
    storageBucket: "oassessor-blu.firebasestorage.app",
    messagingSenderId: "951583753744",
    appId: "1:951583753744:web:ad9766f2b6c40da901ac95",
};

// Inicializa o Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} catch (e) {
    auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export const CLOUD_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/sendInviteEmail`;
export const GENERATE_TOKEN_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/generateWebAuthToken`;
export const TSE_HISTORICAL_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/tseHistoricalResults`;
