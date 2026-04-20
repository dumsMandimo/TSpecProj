import { render, screen, fireEvent } from '@testing-library/react';
import SignupAdmin from './signupAdmin';


jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));


jest.mock('../services/authService', () => ({
  signUpWithEmail: jest.fn(),
  signUpWithGoogle: jest.fn(),
}));

describe('SignupAdmin', () => {
  
  test('renders all form fields', () => {
    render(<SignupAdmin />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
  
  test('renders create account button', () => {
    render(<SignupAdmin />);
    expect(screen.getByRole('button', { name: /create admin account/i }))
      .toBeInTheDocument();
  });

  test('renders google signup button', () => {
    render(<SignupAdmin />);
    expect(screen.getByRole('button', { name: /sign up with google/i }))
      .toBeInTheDocument();
  });

  test('user can type in first name field', () => {
    render(<SignupAdmin />);
    const fullNameInput = screen.getByLabelText(/full name/i);
fireEvent.change(fullNameInput, { target: { value: 'Peace' } });
expect(fullNameInput.value).toBe('Peace');
  });

  test('user can type in email field', () => {
    render(<SignupAdmin />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'peace@test.com' } });
    expect(emailInput.value).toBe('peace@test.com');
  });

});