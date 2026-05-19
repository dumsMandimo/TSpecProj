import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './adminDashboard';
import { getAdminDashboard, getPendingProviders } from '../../services/api';

// ── Mock react-router-dom navigate ────────────────────────────────────────────
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ── Mock API ──────────────────────────────────────────────────────────────────
jest.mock('../../services/api', () => ({
  getAdminDashboard:   jest.fn(),
  getPendingProviders: jest.fn(),
  approveProvider:     jest.fn(),
  rejectProvider:      jest.fn(),
}));

// ── Mock Firebase services ────────────────────────────────────────────────────
jest.mock('../../services/firebase', () => ({
  auth: { currentUser: { uid: 'admin-uid-123' } },
  db:   {},
}));

jest.mock('firebase/firestore', () => ({
  doc:     jest.fn(),
  getDoc:  jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
// Pull getDoc ref so individual tests can configure it
const { getDoc } = jest.requireMock('firebase/firestore');

// Admin Firestore snap — role === "admin" so the component proceeds normally
const adminSnap = {
  exists: () => true,
  data:   () => ({ role: 'admin' }),
};

// Wrap component in MemoryRouter (required by useNavigate)
const renderDashboard = () =>
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  // Default: valid admin session, no pending providers
  getDoc.mockResolvedValue(adminSnap);
  getPendingProviders.mockResolvedValue([]);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminDashboard', () => {

  test('renders loading state initially', () => {
    // Keep the promise pending so loading stays true
    getAdminDashboard.mockImplementation(() => new Promise(() => {}));

    renderDashboard();

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('renders dashboard with stats when API call succeeds', async () => {
    const mockStats = { total: 25, approved: 18, pending: 7 };
    getAdminDashboard.mockResolvedValue(mockStats);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    getAdminDashboard.mockRejectedValue(new Error('API Error'));

    renderDashboard();

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load dashboard data. Please try again.')
      ).toBeInTheDocument();
    });
  });

  test('calls getAdminDashboard once on mount', async () => {
    getAdminDashboard.mockResolvedValue({ total: 0, pending: 0, approved: 0 });

    renderDashboard();

    await waitFor(() => {
      expect(getAdminDashboard).toHaveBeenCalledTimes(1);
    });
  });

  test('handles zero values correctly', async () => {
    getAdminDashboard.mockResolvedValue({ total: 0, approved: 0, pending: 0 });

    renderDashboard();

    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(3);
    });
  });

  test('displays correct CSS classes', async () => {
    getAdminDashboard.mockResolvedValue({ total: 10, pending: 5, approved: 5 });

    renderDashboard();

    await waitFor(() => {
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('container');

      const heading = screen.getByText('Admin Dashboard');
      expect(heading).toHaveClass('heading');
    });
  });

  test('redirects to login when no user is logged in', async () => {
    // Override firebase mock for this test — no current user
    jest.resetModules();
    const { auth } = jest.requireMock('../../services/firebase');
    const originalUser = auth.currentUser;
    auth.currentUser = null;

    getAdminDashboard.mockResolvedValue({ total: 0, pending: 0, approved: 0 });

    renderDashboard();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    auth.currentUser = originalUser; // restore
  });

  test('redirects to login when user is not an admin', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data:   () => ({ role: 'provider' }),  // not admin
    });

    getAdminDashboard.mockResolvedValue({ total: 0, pending: 0, approved: 0 });

    renderDashboard();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});