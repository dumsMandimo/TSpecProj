import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './loginPage';


const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock auth instance
jest.mock('../services/firebase', () => ({
  auth: {},
}));

// Mock role service
jest.mock('../services/userService', () => ({
  getUserRole: jest.fn(),
}));

import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserRole } from '../services/userService';

describe('LoginPage', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  test('shows alert if fields are empty', () => {
    window.alert = jest.fn();

    render(<LoginPage />);

    const button = screen.getByDisplayValue(/login/i);
    fireEvent.click(button);

    expect(window.alert).toHaveBeenCalledWith(
      'Please enter email and password'
    );
  });

  test('successful login redirects admin', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123' },
    });

    getUserRole.mockResolvedValue('admin');

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'TEST@EMAIL.COM' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByDisplayValue(/login/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin');
    });
  });

  test('successful login redirects provider', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123' },
    });

    getUserRole.mockResolvedValue('provider');

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@email.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByDisplayValue(/login/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/provider');
    });
  });

  test('successful login redirects applicant (default)', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123' },
    });

    getUserRole.mockResolvedValue('applicant');

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@email.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByDisplayValue(/login/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/applicant');
    });
  });

  test('shows alert if no role found', async () => {
    window.alert = jest.fn();

    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: '123' },
    });

    getUserRole.mockResolvedValue(null);

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@email.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByDisplayValue(/login/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'No role found for this user. Contact admin.'
      );
    });
  });

  test('handles invalid credentials error', async () => {
    window.alert = jest.fn();

    signInWithEmailAndPassword.mockRejectedValue({
      code: 'auth/invalid-credential',
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@email.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByDisplayValue(/login/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Invalid email or password.'
      );
    });
  });

});