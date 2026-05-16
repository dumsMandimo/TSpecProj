const { signUpWithGoogle } = require('./authService');  // <-- fixed path
const { signInWithPopup, GoogleAuthProvider } = require('firebase/auth');
const { doc, setDoc, getDoc } = require('firebase/firestore');
const { auth, db } = require('./firebase');

jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
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

  test('creates new user in Firestore if not exists', async () => {
    const mockUser = { uid: '123', email: 'google@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });

    const result = await signUpWithGoogle('applicant');

    expect(signInWithPopup).toHaveBeenCalled();
    expect(setDoc).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      uid: mockUser.uid,
      email: mockUser.email,
      role: 'applicant',
    }));
    expect(result).toEqual(mockUser);
  });

  test('throws error if new user role not provided', async () => {
    const mockUser = { uid: '456', email: 'new@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => false });

    await expect(signUpWithGoogle()).rejects.toThrow(
      'No account found. Please sign up first.'
    );
  });

  test('does not create user if already exists', async () => {
    const mockUser = { uid: '789', email: 'existing@test.com' };
    signInWithPopup.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({ exists: () => true });

    await signUpWithGoogle('applicant');

    expect(setDoc).not.toHaveBeenCalled();
  });
});
