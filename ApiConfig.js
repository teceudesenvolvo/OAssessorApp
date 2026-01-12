import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBNW0mDARNEofVO6iJXwYz-IAXKy9BxJ3Y",
    authDomain: "oassessor-blu-default-rtdb.firebaseapp.com",
    databaseURL: "https://oassessor-blu-default-rtdb.firebaseio.com",
    projectId: "oassessor-blu",
    storageBucket: "oassessor-blu-default-rtdb.appspot.com",
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
export const API_BASE_URL = firebaseConfig.databaseURL;
export const CLOUD_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/sendInviteEmail`;
export const GENERATE_TOKEN_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/generateWebAuthToken`;