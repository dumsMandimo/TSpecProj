import {
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification
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

  // 2. CASE: existing user → just return user
  if (userSnap.exists()) {
    return user;
  }

  // 3. CASE: new user → role is required
  if (!role) {
    throw new Error("Role is required for new users");
  }

  // 4. IMPORTANT FIX:
  // Google accounts are already verified, so email verification is NOT required
  // If you keep this line, it will only work for email/password accounts
  // await sendEmailVerification(user);

  // 5. Save user profile in Firestore
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    role,
    emailVerified: user.emailVerified || true,
    ...extraData,
    createdAt: new Date().toISOString(),
  });

  // 6. Return consistent user object
  return user;
};