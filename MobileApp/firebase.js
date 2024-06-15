// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_4AIr2IjdMWl815G95z3rx8HM3eaur9k",
  authDomain: "crime-hotspot-ustp-cpe.firebaseapp.com",
  databaseURL:
    "https://crime-hotspot-ustp-cpe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crime-hotspot-ustp-cpe",
  storageBucket: "crime-hotspot-ustp-cpe.appspot.com",
  messagingSenderId: "1093769132537",
  appId: "1:1093769132537:web:de4a2d38b20d3ac0a5a528",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export default app;
