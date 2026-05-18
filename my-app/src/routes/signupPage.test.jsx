
import { render, screen, fireEvent } from '@testing-library/react';
import SignupPage from './signupPage';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children }) => <span>{children}</span>,
}));

// Mock child components
jest.mock('../components/signupApplicant', () => () => (
  <div>Applicant Form</div>
));

jest.mock('../components/signupProvider', () => () => (
  <div>Provider Form</div>
));

jest.mock('../components/signupAdmin', () => () => (
  <div>Admin Form</div>
));

describe('SignupPage', () => {

  test('renders page heading', () => {
    render(<SignupPage />);
    
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
  });

  test('default role is applicant', () => {
    render(<SignupPage />);
    
    expect(screen.getByText('Applicant Form')).toBeInTheDocument();
  });

  test('switches to provider form when provider tab is clicked', () => {
    render(<SignupPage />);
    
    const providerTab = screen.getByRole('tab', { name: /provider/i });
    fireEvent.click(providerTab);

    expect(screen.getByText('Provider Form')).toBeInTheDocument();
  });

  test('switches to admin form when admin tab is clicked', () => {
    render(<SignupPage />);
    
    const adminTab = screen.getByRole('tab', { name: /admin/i });
    fireEvent.click(adminTab);

    expect(screen.getByText('Admin Form')).toBeInTheDocument();
  });

  test('login link is visible', () => {
    render(<SignupPage />);
    
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

});