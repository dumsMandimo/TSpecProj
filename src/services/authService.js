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

  // 1. Google sign-in
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // 2. Existing user
  if (userSnap.exists()) {
    return user;
  }

  // 3. New user must have role
  if (!role) {
    throw new Error("Role is required for new users");
  }

  // 4. Save user profile in Firestore
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    role,
    emailVerified: user.emailVerified || true,
    ...extraData,
    createdAt: new Date().toISOString(),
  });

  return user;
};
