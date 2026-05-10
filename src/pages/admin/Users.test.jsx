// src/pages/admin/Users.test.js
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Users from './Users';

// Mock firebase module
jest.mock('../../services/firebase', () => ({
  db: {}
}));

// Mock firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

import { getDocs } from 'firebase/firestore';

// Sample data matching your exact Firestore field names
const mockUsers = [
  {
    uid: 'user1',
    firstName: 'Thabo',
    lastName: 'Nkosi',
    email: 'thabo@test.com',
    role: 'applicant',
    province: 'Gauteng',
    qualification: 'NQF 4 — National Certificate',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    uid: 'user2',
    firstName: 'Acme',
    lastName: 'Training',
    email: 'acme@provider.com',
    role: 'provider',
    province: 'Western Cape',
    qualification: 'NQF 7 — Bachelor Degree',
    createdAt: '2026-02-20T10:00:00.000Z',
  },
  {
    uid: 'user3',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@ubuntucareers.com',
    role: 'admin',
    province: 'KwaZulu-Natal',
    qualification: 'NQF 10 — Doctoral Degree',
    createdAt: '2026-03-10T10:00:00.000Z',
  },
  {
    uid: 'user4',
    firstName: 'Lerato',
    lastName: 'Dlamini',
    email: 'lerato@test.com',
    role: 'applicant',
    province: 'Northern Cape',
    qualification: 'NQF 3 — Further Education',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
];

// Helper to mock getDocs returning sample data
function mockGetDocs(data = mockUsers) {
  getDocs.mockResolvedValue({
    docs: data.map(user => ({
      id: user.uid,
      data: () => {
        const { uid, ...rest } = user;
        return { uid, ...rest };
      }
    }))
  });
}

describe('Users', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ─── Loading & Error States ───────────────────────────────

  test('shows loading state initially', () => {
    getDocs.mockImplementation(() => new Promise(() => {}));
    render(<Users />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading users...');
  });

  test('shows error message when fetch fails', async () => {
    getDocs.mockRejectedValue(new Error('Firestore error'));
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to load users. Please try again.'
      );
    });
  });

  // ─── Rendering ────────────────────────────────────────────

  test('renders page heading after data loads', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    });
  });

  test('renders correct total user count in subheading', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('4 registered users on the platform')).toBeInTheDocument();
    });
  });

  test('renders all users in the table by default', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
      expect(screen.getByText('Acme Training')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Lerato Dlamini')).toBeInTheDocument();
    });
  });

  test('renders table headers correctly', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Province')).toBeInTheDocument();
      expect(screen.getByText('Qualification')).toBeInTheDocument();
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });
  });

  test('renders email as a mailto link', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      const emailLink = screen.getByRole('link', { name: 'thabo@test.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:thabo@test.com');
    });
  });

  test('renders province and qualification for each user', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Gauteng')).toBeInTheDocument();
      expect(screen.getByText('NQF 4 — National Certificate')).toBeInTheDocument();
    });
  });

  test('renders N/A when province or qualification is missing', async () => {
    const usersWithMissingFields = [{
      uid: 'user5',
      firstName: 'No',
      lastName: 'Data',
      email: 'nodata@test.com',
      role: 'applicant',
      province: null,
      qualification: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }];
    mockGetDocs(usersWithMissingFields);
    render(<Users />);
    await waitFor(() => {
      const naValues = screen.getAllByText('N/A');
      expect(naValues.length).toBeGreaterThanOrEqual(2);
    });
  });

  test('formats date correctly in South African format', async () => {
    mockGetDocs([{
      uid: 'user1',
      firstName: 'Thabo',
      lastName: 'Nkosi',
      email: 'thabo@test.com',
      role: 'applicant',
      province: 'Gauteng',
      qualification: 'NQF 4',
      createdAt: '2026-01-15T10:00:00.000Z',
    }]);
    render(<Users />);
    await waitFor(() => {
      // en-ZA locale formats as "15 Jan 2026"
      expect(screen.getByText('15 Jan 2026')).toBeInTheDocument();
    });
  });

  test('renders role badges for each user', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      const badges = screen.getAllByText(/applicant|provider|admin/i);
      expect(badges.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Summary Cards ────────────────────────────────────────

  test('renders all four summary stat cards', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Applicants')).toBeInTheDocument();
      expect(screen.getByText('Providers')).toBeInTheDocument();
      expect(screen.getByText('Admins')).toBeInTheDocument();
    });
  });

  test('summary cards show correct counts per role', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      // 4 total, 2 applicants, 1 provider, 1 admin
      const statNumbers = screen.getAllByText(/^\d+$/);
      const values = statNumbers.map(el => el.textContent);
      expect(values).toContain('4'); // total
      expect(values).toContain('2'); // applicants
      expect(values).toContain('1'); // providers
    });
  });

  // ─── Filter Tabs ──────────────────────────────────────────

  test('renders filter buttons for all roles', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Applicant' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Provider' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
    });
  });

  test('All filter is active by default', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' }))
        .toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('applicant filter shows only applicants', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Applicant' }));
    expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    expect(screen.getByText('Lerato Dlamini')).toBeInTheDocument();
    expect(screen.queryByText('Acme Training')).not.toBeInTheDocument();
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument();
  });

  test('provider filter shows only providers', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Acme Training')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Provider' }));
    expect(screen.getByText('Acme Training')).toBeInTheDocument();
    expect(screen.queryByText('Thabo Nkosi')).not.toBeInTheDocument();
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument();
  });

  test('admin filter shows only admins', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Admin' }));
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.queryByText('Thabo Nkosi')).not.toBeInTheDocument();
    expect(screen.queryByText('Acme Training')).not.toBeInTheDocument();
  });

  // ─── Search ───────────────────────────────────────────────

  test('search filters users by first name', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'thabo' }
    });
    expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    expect(screen.queryByText('Acme Training')).not.toBeInTheDocument();
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument();
  });

  test('search filters users by last name', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'nkosi' }
    });
    expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    expect(screen.queryByText('Lerato Dlamini')).not.toBeInTheDocument();
  });

  test('search filters users by email', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'acme@provider.com' }
    });
    expect(screen.getByText('Acme Training')).toBeInTheDocument();
    expect(screen.queryByText('Thabo Nkosi')).not.toBeInTheDocument();
  });

  test('search is case insensitive', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'THABO' }
    });
    expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
  });

  test('shows empty state when search has no matches', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'zzznomatch' }
    });
    expect(screen.getByText(/No.*users found.*matching "zzznomatch"/i)).toBeInTheDocument();
  });

  test('shows empty state when no users exist', async () => {
    mockGetDocs([]);
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText(/No.*users found/i)).toBeInTheDocument();
    });
  });

  // ─── Search + Filter combined ─────────────────────────────

  test('search and role filter work together', async () => {
    mockGetDocs();
    render(<Users />);
    await waitFor(() => {
      expect(screen.getByText('Thabo Nkosi')).toBeInTheDocument();
    });

    // Filter to applicants first
    fireEvent.click(screen.getByRole('button', { name: 'Applicant' }));

    // Then search within applicants
    fireEvent.change(screen.getByPlaceholderText('Search by name or email...'), {
      target: { value: 'lerato' }
    });

    expect(screen.getByText('Lerato Dlamini')).toBeInTheDocument();
    expect(screen.queryByText('Thabo Nkosi')).not.toBeInTheDocument();
  });

});