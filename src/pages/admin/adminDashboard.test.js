import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboard from './adminDashboard';
import { getAdminDashboard } from '../../services/api';

// Mock the API module
jest.mock('../../services/api', () => ({
  getAdminDashboard: jest.fn()
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    getAdminDashboard.mockImplementation(() => new Promise(() => {}));
    
    render(<AdminDashboard />);
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('renders dashboard with stats when API call succeeds', async () => {
    const mockStats = {
      total: 25,
      approved: 18,
      pending: 7
    };
    getAdminDashboard.mockResolvedValue(mockStats);
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
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
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data. Please try again.')).toBeInTheDocument();
    });
  });

  test('calls getAdminDashboard once on mount', async () => {
    getAdminDashboard.mockResolvedValue({ total: 0, pending: 0, approved: 0 });
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(getAdminDashboard).toHaveBeenCalledTimes(1);
    });
  });

  test('handles zero values correctly', async () => {
    const zeroStats = {
      total: 0,
      approved: 0,
      pending: 0
    };
    getAdminDashboard.mockResolvedValue(zeroStats);
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements).toHaveLength(3);
    });
  });

  test('displays correct CSS classes', async () => {
    getAdminDashboard.mockResolvedValue({ total: 10, pending: 5, approved: 5 });
    
    render(<AdminDashboard />);
    
    await waitFor(() => {
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveClass('container');
      
      const heading = screen.getByText('Dashboard');
      expect(heading).toHaveClass('heading');
    });
  });
});