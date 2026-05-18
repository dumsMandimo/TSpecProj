const { signUpWithGoogle } = require('./authService');
const { signInWithPopup } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(function () {
    this.setCustomParameters = jest.fn();
  }),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock('./firebase', () => ({
  auth: {},
  db: {},
}));

describe('Google Auth Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // UAT 2.1 — New applicant signup saves to Firestore and returns correct role
  test('creates new applicant in Firestore and returns { user, role }', async () => {
    const mockUser = { uid: '123', email: 'google@test.com' };
    const mockDocRef = { id: '123' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue();
    doc.mockReturnValue(mockDocRef);

    const result = await signUpWithGoogle('applicant');

    expect(signInWithPopup).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      uid: mockUser.uid,
      email: mockUser.email,
      role: 'applicant',
    }));
    expect(result).toEqual({ user: mockUser, role: 'applicant' });
  });

  // UAT 2.1 — New provider signup saves to Firestore and returns correct role
  test('creates new provider in Firestore and returns { user, role }', async () => {
    const mockUser = { uid: '124', email: 'provider@test.com' };
    const mockDocRef = { id: '124' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });
    setDoc.mockResolvedValue();
    doc.mockReturnValue(mockDocRef);

    const result = await signUpWithGoogle('provider');

    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      uid: mockUser.uid,
      email: mockUser.email,
      role: 'provider',
    }));
    expect(result).toEqual({ user: mockUser, role: 'provider' });
  });

  // UAT 2.2 — Login with no role throws error for unknown user
  test('throws error if new user has no role provided', async () => {
    const mockUser = { uid: '456', email: 'new@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(signUpWithGoogle()).rejects.toThrow(
      'No account found. Please sign up first.'
    );
  });

  // UAT 2.3 — Admin cannot self-register
  test('throws error if someone tries to sign up as admin', async () => {
    const mockUser = { uid: '999', email: 'admin@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(signUpWithGoogle('admin')).rejects.toThrow(
      'Admin accounts cannot be self-registered.'
    );
  });

  // UAT 2.1 — Existing user login returns their role without saving again
  test('returns existing applicant role without saving to Firestore', async () => {
    const mockUser = { uid: '789', email: 'existing@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'applicant' }),
    });

    const result = await signUpWithGoogle();

    expect(setDoc).not.toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser, role: 'applicant' });
  });

  // UAT 2.1 — Existing admin login returns admin role
  test('returns existing admin role without saving to Firestore', async () => {
    const mockUser = { uid: '111', email: 'admin@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'admin' }),
    });

    const result = await signUpWithGoogle();

    expect(setDoc).not.toHaveBeenCalled();
    expect(result).toEqual({ user: mockUser, role: 'admin' });
  });

  // UAT 2.2 — Unknown role in Firestore throws error
  test('throws error if existing user has unknown role', async () => {
    const mockUser = { uid: '222', email: 'unknown@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ role: 'superuser' }),
    });

    await expect(signUpWithGoogle()).rejects.toThrow(
      'Unknown role. Contact support.'
    );
  });
});