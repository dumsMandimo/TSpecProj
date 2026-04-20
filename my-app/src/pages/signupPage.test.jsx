// src/pages/signupPage.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from './signupPage';

// Mock child form components
jest.mock('../components/signupApplicant', () => () => <div>Applicant Form</div>);
jest.mock('../components/signupProvider', () => () => <div>Provider Form</div>);
jest.mock('../components/signupAdmin', () => () => <div>Admin Form</div>);

// Mock CSS
jest.mock('./signupPage.css', () => ({}));

function renderSignupPage() {
  return render(
    <MemoryRouter>
      <SignupPage />
    </MemoryRouter>
  );
}

describe('SignupPage', () => {

  // ─── Rendering ────────────────────────────────────────────

  test('renders brand name', () => {
    renderSignupPage();
    expect(screen.getByText('UBUNTU')).toBeInTheDocument();
    expect(screen.getByText('CAREERS')).toBeInTheDocument();
  });

  test('renders hero heading', () => {
    renderSignupPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('renders platform description', () => {
    renderSignupPage();
    expect(screen.getByText(/SETA-accredited/i)).toBeInTheDocument();
  });

  test('renders stats section with opportunities, providers and provinces', () => {
    renderSignupPage();
    expect(screen.getByText('12k+')).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('800+')).toBeInTheDocument();
    expect(screen.getByText('Providers')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Provinces')).toBeInTheDocument();
  });

  test('renders create your account heading', () => {
    renderSignupPage();
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  test('renders subtitle', () => {
    renderSignupPage();
    expect(screen.getByText(/choose your role to get started/i)).toBeInTheDocument();
  });

  test('renders sign in link', () => {
    renderSignupPage();
    const link = screen.getByRole('link', { name: /sign in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/login');
  });

  test('renders already have an account prompt', () => {
    renderSignupPage();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  // ─── Role tabs ────────────────────────────────────────────

  test('renders all three role tabs', () => {
    renderSignupPage();
    expect(screen.getByRole('tab', { name: /applicant/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /provider/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /admin/i })).toBeInTheDocument();
  });

  test('renders tab descriptions', () => {
    renderSignupPage();
    expect(screen.getByText(/looking for learnerships/i)).toBeInTheDocument();
    expect(screen.getByText(/employer or training organisation/i)).toBeInTheDocument();
    expect(screen.getByText(/platform administrator/i)).toBeInTheDocument();
  });

  test('applicant tab is selected by default', () => {
    renderSignupPage();
    const applicantTab = screen.getByRole('tab', { name: /applicant/i });
    expect(applicantTab).toHaveAttribute('aria-selected', 'true');
  });

  test('provider and admin tabs are not selected by default', () => {
    renderSignupPage();
    expect(screen.getByRole('tab', { name: /provider/i }))
      .toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /admin/i }))
      .toHaveAttribute('aria-selected', 'false');
  });

  test('applicant tab has active class by default', () => {
    renderSignupPage();
    expect(screen.getByRole('tab', { name: /applicant/i })).toHaveClass('active');
  });

  // ─── Tab switching ────────────────────────────────────────

  test('clicking provider tab sets it as active', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    expect(screen.getByRole('tab', { name: /provider/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('clicking admin tab sets it as active', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /admin/i }));
    expect(screen.getByRole('tab', { name: /admin/i }))
      .toHaveAttribute('aria-selected', 'true');
  });

  test('clicking provider tab deselects applicant tab', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    expect(screen.getByRole('tab', { name: /applicant/i }))
      .toHaveAttribute('aria-selected', 'false');
  });

  test('clicking admin tab deselects applicant tab', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /admin/i }));
    expect(screen.getByRole('tab', { name: /applicant/i }))
      .toHaveAttribute('aria-selected', 'false');
  });

  test('only one tab is active at a time', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    const activeTabs = screen.getAllByRole('tab')
      .filter(tab => tab.getAttribute('aria-selected') === 'true');
    expect(activeTabs).toHaveLength(1);
  });

  // ─── Form rendering ───────────────────────────────────────

  test('shows applicant form by default', () => {
    renderSignupPage();
    expect(screen.getByText('Applicant Form')).toBeInTheDocument();
  });

  test('does not show provider or admin form by default', () => {
    renderSignupPage();
    expect(screen.queryByText('Provider Form')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Form')).not.toBeInTheDocument();
  });

  test('clicking provider tab shows provider form', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    expect(screen.getByText('Provider Form')).toBeInTheDocument();
  });

  test('clicking provider tab hides applicant form', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    expect(screen.queryByText('Applicant Form')).not.toBeInTheDocument();
  });

  test('clicking admin tab shows admin form', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /admin/i }));
    expect(screen.getByText('Admin Form')).toBeInTheDocument();
  });

  test('clicking admin tab hides applicant form', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /admin/i }));
    expect(screen.queryByText('Applicant Form')).not.toBeInTheDocument();
  });

  test('switching back to applicant tab shows applicant form again', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    fireEvent.click(screen.getByRole('tab', { name: /applicant/i }));
    expect(screen.getByText('Applicant Form')).toBeInTheDocument();
    expect(screen.queryByText('Provider Form')).not.toBeInTheDocument();
  });

  // ─── Accessibility ────────────────────────────────────────

  test('nav has correct aria-label', () => {
    renderSignupPage();
    expect(screen.getByRole('navigation', { name: /account type/i })).toBeInTheDocument();
  });

  test('tab panel has correct aria-label for default role', () => {
    renderSignupPage();
    expect(screen.getByRole('tabpanel', { name: /applicant signup form/i })).toBeInTheDocument();
  });

  test('tab panel aria-label updates when role changes', () => {
    renderSignupPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider/i }));
    expect(screen.getByRole('tabpanel', { name: /provider signup form/i })).toBeInTheDocument();
  });

  test('tab list has correct role', () => {
    renderSignupPage();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

});