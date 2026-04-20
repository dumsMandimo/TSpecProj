import { render, screen, fireEvent } from '@testing-library/react';
import SignupApplicant from './signupApplicant';


jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));


jest.mock('../services/authService', () => ({
  signUpWithEmail: jest.fn(),
  signUpWithGoogle: jest.fn(),
}));

describe('SignupApplicant', () => {
  
  test('renders all form fields', () => {
    render(<SignupApplicant />);
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('renders province dropdown', () => {
    render(<SignupApplicant />);
    expect(screen.getByText(/select province/i)).toBeInTheDocument();
  });

  test('renders NQF level dropdown', () => {
    render(<SignupApplicant />);
    expect(screen.getByText(/select nqf level/i)).toBeInTheDocument();
  });

  test('renders all 10 NQF levels', () => {
    render(<SignupApplicant />);
    expect(screen.getByText(/NQF 1 — General Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/NQF 10 — Doctoral Degree/i)).toBeInTheDocument();
});
  test('renders create account button', () => {
    render(<SignupApplicant />);
    expect(screen.getByRole('button', { name: /create account/i }))
      .toBeInTheDocument();
  });

  test('renders google signup button', () => {
    render(<SignupApplicant />);
    expect(screen.getByRole('button', { name: /sign up with google/i }))
      .toBeInTheDocument();
  });

  test('user can type in first name field', () => {
    render(<SignupApplicant />);
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Peace' } });
    expect(firstNameInput.value).toBe('Peace');
  });

  test('user can type in email field', () => {
    render(<SignupApplicant />);
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'peace@test.com' } });
    expect(emailInput.value).toBe('peace@test.com');
  });

});