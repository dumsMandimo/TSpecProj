// services/authService.js
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Handles both signup and login with Google.
 * 
 * @param {string|null} role - Role to assign for new users ("applicant" or "provider").
 * @param {object} extraData - Additional data to store for new users or updating provider info.
 * @returns {object} - { user, role, existingUser }
 */
export const signUpWithGoogle = async (role = null, extraData = {}) => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user?.uid || !user?.email) {
      throw new Error('Google authentication failed');
    }

    console.log('1. Google auth success:', user.uid);

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    console.log('2. Firestore check done. Exists?', userSnap.exists());
    console.log('Doc data:', userSnap.data());

    // ── Existing user ───────────────────────────────────────────────
    if (userSnap.exists()) {
      const data = userSnap.data();
      console.log('3. Existing user found, role:', data.role);

      if (!['applicant', 'provider', 'admin'].includes(data.role)) {
        throw new Error('Unknown role. Contact support.');
      }

      if (data.status === 'removed') {
        await auth.signOut();
        throw new Error('Your account has been removed. Contact support.');
      }

      // Re-registering as provider resets them to pending review
      if (role === 'provider' && data.status === 'active') {
        await updateDoc(userRef, {
          ...extraData,
          status: 'pending',
        });
        return { user, role, existingUser: true };
      }

      // Return existing user role for login
      return { user, role: data.role, existingUser: true };
    }

    // ── New user ───────────────────────────────────────────────────
    console.log('4. New user. Role passed:', role);

    if (!role) {
      throw new Error('No account found. Please sign up first.');
    }

    if (role === 'admin') {
      throw new Error('Admin accounts cannot be self-registered.');
    }

    const status = role === 'provider' ? 'pending' : 'active';

    console.log('5. Saving new user to Firestore...');
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      role,
      emailVerified: user.emailVerified || true,
      status,
      ...extraData,
      createdAt: new Date().toISOString(),
    });

    console.log('6. New user saved successfully!');

    return { user, role, existingUser: false };

  } catch (err) {
    console.error('AUTH ERROR:', err);
    throw new Error(err.message || 'Authentication failed. Please try again.');
  }
};