
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBVkLMJJSBYL64T_saLABmz1yDSfCzQ1i4",
  authDomain: "meu-corre-2.firebaseapp.com",
  projectId: "meu-corre-2",
  storageBucket: "meu-corre-2.firebasestorage.app",
  messagingSenderId: "432036922384",
  appId: "1:432036922384:web:e6498953c72e0c17c8f695",
  measurementId: "G-ZPXZ9ML0HG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Analytics pode não ser suportado em alguns ambientes (ex: SSR ou alguns modos privativos)
export const analyticsPromise = isSupported().then(yes => yes ? getAnalytics(app) : null);
