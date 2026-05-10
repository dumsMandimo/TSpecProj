import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const signUpWithGoogle = async (role, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  // 1. Google login
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // 2. Create user if not exists (same behaviour)
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      ...extraData,
      createdAt: new Date().toISOString(),
    });
  }

  return user;
};