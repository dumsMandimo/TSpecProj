import { render, screen, fireEvent } from '@testing-library/react';
import SignupProvider from './signupProvider';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('../services/authService', () => ({
  signUpWithEmail: jest.fn(),
  signUpWithGoogle: jest.fn(),
}));

describe('SignupProvider', () => {
  test('renders all form fields', () => {
    render(<SignupProvider />);
    expect(screen.getByLabelText(/Organisation name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact person/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
  });

  test('renders sector dropdown', () => {
    render(<SignupProvider />);
    expect(screen.getByText(/Select sector/i)).toBeInTheDocument();
  });

  test('renders province dropdown', () => {
    render(<SignupProvider />);
    expect(screen.getByText(/Select province/i)).toBeInTheDocument();
  });

  test('renders register organisation button', () => {
    render(<SignupProvider />);
    expect(
      screen.getByRole('button', { name: /Register organisation/i })
    ).toBeInTheDocument();
  });

  test('renders google signup button', () => {
    render(<SignupProvider />);
    expect(
      screen.getByRole('button', { name: /Sign up with Google/i })
    ).toBeInTheDocument();
  });

  test('user can type in organisation name field', () => {
    render(<SignupProvider />);
    const organisationInput = screen.getByLabelText(/Organisation name/i);
    fireEvent.change(organisationInput, { target: { value: 'Ubuntu Funding' } });
    expect(organisationInput.value).toBe('Ubuntu Funding');
  });

  test('user can type in email field', () => {
    render(<SignupProvider />);
    const workEmailInput = screen.getByLabelText(/Work email/i);
    fireEvent.change(workEmailInput, { target: { value: 'ubuntu.org@test.com' } });
    expect(workEmailInput.value).toBe('ubuntu.org@test.com');
  });
});