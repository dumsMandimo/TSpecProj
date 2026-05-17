import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const signUpWithGoogle = async (role = null, extraData = {}) => {
  const provider = new GoogleAuthProvider();

  try {
    provider.setCustomParameters({ prompt: 'select_account' });
  } catch (e) {
    // ignore in test environment
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("1. Google auth success:", user.uid);

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    console.log("2. Firestore check done. Exists?", userSnap.exists());

    if (userSnap.exists()) {
      const existingRole = userSnap.data().role;
      console.log("3. Existing user found, role:", existingRole);

      if (!['applicant', 'provider', 'admin'].includes(existingRole)) {
        throw new Error('Unknown role. Contact support.');
      }

      return { user, role: existingRole };
    }

    console.log("4. New user. Role passed:", role);

    if (!role) {
      throw new Error('No account found. Please sign up first.');
    }

    if (role === 'admin') {
      throw new Error('Admin accounts cannot be self-registered.');
    }

    console.log("5. Saving to Firestore...");
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role: role,
      emailVerified: user.emailVerified || true,
      ...extraData,
      createdAt: new Date().toISOString(),
    });
    console.log("6. Saved successfully!");

    return { user, role };

  } catch (err) {
    console.error("AUTH ERROR:", err);
    throw new Error(err.message || 'Authentication failed. Please try again.');
  }
};