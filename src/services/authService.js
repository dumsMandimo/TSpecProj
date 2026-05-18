import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * =========================
 * GOOGLE SIGNUP - new users only
 * =========================
 */
export const signUpWithGoogle = async (role, extraData = {}) => {
  if (!role) throw new Error("Role is required for new users");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // Sign in with Google
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // If user already exists, return error
  if (userSnap.exists()) {
    throw new Error("User already exists. Please log in instead.");
  }

  // Save user to Firestore
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

/**
 * =========================
 * GOOGLE LOGIN - existing users only
 * =========================
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // User doesn’t exist → don’t try to create, just throw
    throw new Error("No account found. Please sign up first.");
  }

  // Return user and their role
  return {
    user,
    role: userSnap.data().role,
  };
};