import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import { auth, db } from "./firebase";

import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// GOOGLE SIGNUP
export const signUpWithGoogle = async (role, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!user?.uid || !user?.email) {
    throw new Error("Google authentication failed");
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  console.log("Looking up UID:", user.uid);
  console.log("Doc exists:", userSnap.exists());
  console.log("Doc data:", userSnap.data());

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      ...extraData,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    return { user, role };
  }

  const data = userSnap.data();

  if (data.status === "removed") {
    await auth.signOut();
    throw new Error("account-removed");
  }

  return { user, role: data.role };
};

// EMAIL/PASSWORD SIGNUP
export const signUpWithEmail = async (
  email,
  password,
  role,
  extraData = {}
) => {
  const result = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = result.user;

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role,
    ...extraData,
    status: "active",
    createdAt: new Date().toISOString(),
  });

  return { user, role };
};