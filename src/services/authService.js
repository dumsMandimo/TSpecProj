import {
<<<<<<< HEAD
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
=======
  signInWithPopup,
  GoogleAuthProvider,
>>>>>>> dev-auth-fix
  sendEmailVerification
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

<<<<<<< HEAD
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

=======
export const signUpWithGoogle = async (role, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  // 1. Google sign-in
>>>>>>> dev-auth-fix
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

<<<<<<< HEAD
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      createdAt: new Date().toISOString(),
    });
  }

=======
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
>>>>>>> dev-auth-fix
  return user;
};