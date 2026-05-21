// ── Top of authService.test.js ──
// Mocks must be hoisted above all imports

jest.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    setCustomParameters = jest.fn();
  }

  return {
    GoogleAuthProvider,
    signInWithPopup: jest.fn(),
  };
});

jest.mock('./firebase', () => ({
  auth: { signOut: jest.fn() },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// ── Imports (after mocks) ──
import { signUpWithGoogle } from './authService';
import { signInWithPopup } from 'firebase/auth';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth } from './firebase';

// ── Helpers ──

const mockUser = {
  uid: 'uid-123',
  email: 'test@gmail.com',
  emailVerified: true,
};

const makeSnap = (exists, data = {}) => ({
  exists: () => exists,
  data: () => data,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default: successful Google sign-in
  signInWithPopup.mockResolvedValue({ user: mockUser });
});

// ── New user flows ──

describe('new user', () => {
  beforeEach(() => {
    getDoc.mockResolvedValue(makeSnap(false));
  });

  it('creates a new applicant in Firestore and returns { user, role, existingUser: false }', async () => {
    setDoc.mockResolvedValue(undefined);

    const result = await signUpWithGoogle('applicant', { firstName: 'Tumi' });

    expect(result).toEqual({ user: mockUser, role: 'applicant', existingUser: false });
    expect(setDoc).toHaveBeenCalledTimes(1);

    const savedData = setDoc.mock.calls[0][1];
    expect(savedData.uid).toBe('uid-123');
    expect(savedData.email).toBe('test@gmail.com');
    expect(savedData.role).toBe('applicant');
    expect(savedData.status).toBe('active');
    expect(savedData.firstName).toBe('Tumi');
  });

  it('creates a new provider with status "pending"', async () => {
    setDoc.mockResolvedValue(undefined);

    const result = await signUpWithGoogle('provider', { organisationName: 'Acme' });

    expect(result).toEqual({ user: mockUser, role: 'provider', existingUser: false });

    const savedData = setDoc.mock.calls[0][1];
    expect(savedData.status).toBe('pending');
    expect(savedData.role).toBe('provider');
    expect(savedData.organisationName).toBe('Acme');
  });

  it('throws if no role is provided for a new user', async () => {
    await expect(signUpWithGoogle()).rejects.toThrow(
      'No account found. Please sign up first.'
    );
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('throws if role is "admin" for a new user', async () => {
    await expect(signUpWithGoogle('admin')).rejects.toThrow(
      'Admin accounts cannot be self-registered.'
    );
    expect(setDoc).not.toHaveBeenCalled();
  });
});

// ── Existing user flows ──

describe('existing user', () => {
  it('returns existing applicant role without writing to Firestore', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'applicant', status: 'active' }));

    const result = await signUpWithGoogle();

    expect(result).toEqual({ user: mockUser, role: 'applicant', existingUser: true });
    expect(setDoc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('returns existing provider role without writing to Firestore', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'provider', status: 'active' }));

    const result = await signUpWithGoogle();

    expect(result).toEqual({ user: mockUser, role: 'provider', existingUser: true });
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('returns existing admin role without writing to Firestore', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'admin', status: 'active' }));

    const result = await signUpWithGoogle();

    expect(result).toEqual({ user: mockUser, role: 'admin', existingUser: true });
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('throws if existing user has an unknown role', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'superuser', status: 'active' }));

    await expect(signUpWithGoogle()).rejects.toThrow('Unknown role. Contact support.');
  });

  it('signs out and throws if existing user status is "removed"', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'applicant', status: 'removed' }));
    auth.signOut.mockResolvedValue(undefined);

    await expect(signUpWithGoogle()).rejects.toThrow(
      'Your account has been removed. Contact support.'
    );
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('resets an existing active provider back to pending when re-registering as provider', async () => {
    getDoc.mockResolvedValue(makeSnap(true, { role: 'provider', status: 'active' }));
    updateDoc.mockResolvedValue(undefined);

    const result = await signUpWithGoogle('provider', { organisationName: 'New Org' });

    expect(result).toEqual({ user: mockUser, role: 'provider', existingUser: true });
    expect(updateDoc).toHaveBeenCalledTimes(1);

    const updatePayload = updateDoc.mock.calls[0][1];
    expect(updatePayload.status).toBe('pending');
    expect(updatePayload.organisationName).toBe('New Org');
  });
});

// ── Google auth failure ──

describe('Google auth failure', () => {
  it('throws if signInWithPopup rejects', async () => {
    signInWithPopup.mockRejectedValue(new Error('Popup closed'));

    await expect(signUpWithGoogle('applicant')).rejects.toThrow('Popup closed');
  });

  it('throws if user has no uid', async () => {
    signInWithPopup.mockResolvedValue({ user: { uid: null, email: 'x@x.com' } });

    await expect(signUpWithGoogle('applicant')).rejects.toThrow(
      'Google authentication failed'
    );
  });

  it('throws if user has no email', async () => {
    signInWithPopup.mockResolvedValue({ user: { uid: 'uid-123', email: null } });

    await expect(signUpWithGoogle('applicant')).rejects.toThrow(
      'Google authentication failed'
    );
  });
});