import {
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

import { auth, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs
} from "firebase/firestore";

export const signUpWithGoogle = async (role, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  // 1. Google login
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!user?.email) {
    throw new Error("No email found from Google account");
  }

  // 2. Check if email already exists in system
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", user.email));
  const existingUsers = await getDocs(q);

  if (!existingUsers.empty) {
    throw new Error("This Google account is already registered.");
  }

  // 3. Create user if not exists by UID
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

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