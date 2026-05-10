import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * =========================
 * EMAIL + PASSWORD SIGNUP
 * =========================
 */
export const signUpWithEmail = async (
  email,
  password,
  role,
  extraData = {}
) => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    throw new Error("Please enter a valid email address");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const user = userCredential.user;

  // IMPORTANT: ensure user is fully initialized before sending email
  await sendEmailVerification(user);

  await updateProfile(user, {
    displayName: extraData.displayName || cleanEmail.split("@")[0],
  });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: cleanEmail,
    role,
    ...extraData,
    createdAt: new Date().toISOString(),
  });

  return user;
};

/**
 * =========================
 * RESEND VERIFICATION EMAIL
 * =========================
 */
export const resendVerificationEmail = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No logged-in user found");
  }

  await sendEmailVerification(user);
};

/**
 * =========================
 * EMAIL + PASSWORD LOGIN
 * =========================
 */
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = userCredential.user;

  await user.reload();

  const userDoc = await getDoc(doc(db, "users", user.uid));

  return {
    user,
    role: userDoc.exists() ? userDoc.data().role : null,
  };
};

/**
 * =========================
 * GOOGLE SIGNUP / LOGIN
 * =========================
 */
export const signUpWithGoogle = async (role = "applicant") => {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      createdAt: new Date().toISOString(),
    });
  }

  return user;
};