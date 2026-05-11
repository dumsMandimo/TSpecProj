import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

export const signUpWithGoogle = async (role, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  // Google login
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!user?.uid || !user?.email) {
    throw new Error("Google authentication failed");
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // Create user only if they don't exist
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      ...extraData,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    return { user, role };
  }

  const data = userSnap.data();
//block removed users
  if (data.status === 'removed'){
    await auth.signOut();
    throw new Error('account-removed');
  }
  return { user, role: data.role };
};