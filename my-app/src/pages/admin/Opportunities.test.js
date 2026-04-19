// src/pages/admin/Opportunities.test.js
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Opportunities from './Opportunities';

// Mock firebase module
jest.mock('../../services/firebase', () => ({
  db: {}
}));

// Mock firestore functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

// Import mocked functions so we can control them in tests
import { getDocs, updateDoc } from 'firebase/firestore';

// Sample data matching your exact Firestore document structure
const mockOpportunities = [
  {
    id: 'opp1',
    title: 'IT Learnership',
    location: 'Johannesburg',
    nqfLevel: 4,
    closingDate: '2026-06-30',
    status: 'pending',
  },
  {
    id: 'opp2',
    title: 'Engineering Internship',
    location: 'Cape Town',
    nqfLevel: 5,
    closingDate: '2026-07-15',
    status: 'approved',
  },
  {
    id: 'opp3',
    title: 'Healthcare Apprenticeship',
    location: 'Durban',
    nqfLevel: 3,
    closingDate: '2026-08-01',
    status: 'removed',
  },
];

// Helper to mock getDocs returning our sample data
function mockGetDocs(data = mockOpportunities) {
  getDocs.mockResolvedValue({
    docs: data.map(opp => ({
      id: opp.id,
      data: () => {
        const { id, ...rest } = opp;
        return rest;
      }
    }))
  });
}

describe('Opportunities', () => {

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
    render(<Opportunities />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading opportunities...');
  });

  test('shows error message when fetch fails', async () => {
    getDocs.mockRejectedValue(new Error('Firestore error'));
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load opportunities.');
    });
  });

  // ─── Rendering ────────────────────────────────────────────

  test('renders page heading after data loads', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Opportunities' })).toBeInTheDocument();
    });
  });

  test('renders correct total and pending counts in subheading', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  test('renders all opportunities in table by default', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('IT Learnership')).toBeInTheDocument();
      expect(screen.getByText('Engineering Internship')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Apprenticeship')).toBeInTheDocument();
    });
  });

  test('renders table headers correctly', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('NQF Level')).toBeInTheDocument();
      expect(screen.getByText('Closing Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  test('renders status badges for each opportunity', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
      expect(screen.getByText('removed')).toBeInTheDocument();
    });
  });

  // ─── Filter Tabs ──────────────────────────────────────────

  test('filter buttons render for all statuses', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Approved' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Removed' })).toBeInTheDocument();
    });
  });

  test('All filter is active by default', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('pending filter shows only pending opportunities', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('IT Learnership')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.getByText('IT Learnership')).toBeInTheDocument();
    expect(screen.queryByText('Engineering Internship')).not.toBeInTheDocument();
    expect(screen.queryByText('Healthcare Apprenticeship')).not.toBeInTheDocument();
  });

  test('approved filter shows only approved opportunities', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('Engineering Internship')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approved' }));
    expect(screen.getByText('Engineering Internship')).toBeInTheDocument();
    expect(screen.queryByText('IT Learnership')).not.toBeInTheDocument();
    expect(screen.queryByText('Healthcare Apprenticeship')).not.toBeInTheDocument();
  });

  test('removed filter shows only removed opportunities', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText('Healthcare Apprenticeship')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Removed' }));
    expect(screen.getByText('Healthcare Apprenticeship')).toBeInTheDocument();
    expect(screen.queryByText('IT Learnership')).not.toBeInTheDocument();
    expect(screen.queryByText('Engineering Internship')).not.toBeInTheDocument();
  });

  test('shows empty state when no opportunities match filter', async () => {
    mockGetDocs([]);
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByText(/No.*opportunities found/i)).toBeInTheDocument();
    });
  });

  // ─── Action Buttons ───────────────────────────────────────

  test('pending opportunity shows Approve and Remove buttons', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve IT Learnership' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove IT Learnership' })).toBeInTheDocument();
    });
  });

  test('approved opportunity shows only Remove button', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove Engineering Internship' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Approve Engineering Internship' })).not.toBeInTheDocument();
    });
  });

  test('removed opportunity shows only Restore button', async () => {
    mockGetDocs();
    render(<Opportunities />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore Healthcare Apprenticeship' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove Healthcare Apprenticeship' })).not.toBeInTheDocument();
    });
  });

  // ─── Status Updates ───────────────────────────────────────

  test('clicking Approve updates opportunity status to approved in UI', async () => {
    updateDoc.mockResolvedValue();
    mockGetDocs();
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve IT Learnership' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve IT Learnership' }));

    await waitFor(() => {
      // After approval, Approve button disappears and Remove button appears instead
      expect(screen.queryByRole('button', { name: 'Approve IT Learnership' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove IT Learnership' })).toBeInTheDocument();
    });
  });

  test('clicking Remove updates opportunity status to removed in UI', async () => {
    updateDoc.mockResolvedValue();
    mockGetDocs();
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove IT Learnership' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove IT Learnership' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove IT Learnership' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Restore IT Learnership' })).toBeInTheDocument();
    });
  });

  test('clicking Restore updates opportunity status to approved in UI', async () => {
    updateDoc.mockResolvedValue();
    mockGetDocs();
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Restore Healthcare Apprenticeship' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Restore Healthcare Apprenticeship' }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Restore Healthcare Apprenticeship' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Healthcare Apprenticeship' })).toBeInTheDocument();
    });
  });

  test('updateDoc is called with correct arguments when approving', async () => {
    updateDoc.mockResolvedValue();
    mockGetDocs();
    render(<Opportunities />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Approve IT Learnership' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Approve IT Learnership' }));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
      expect(updateDoc).toHaveBeenCalledWith(
        undefined, // doc() returns undefined in the mock
        { status: 'approved' }
      );
    });
  });

});