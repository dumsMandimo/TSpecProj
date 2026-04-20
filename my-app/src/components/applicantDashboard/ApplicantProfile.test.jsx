import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicantProfile from './ApplicantProfile';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('../../firebase', () => ({
  db: {},
  auth: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-supabase.co/cvs/test.pdf' }
        })
      }))
    }
  }))
}));

jest.mock('./ApplicantProfile.css', () => ({}));

import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, updateDoc } from 'firebase/firestore';

// ── Sample profile data ────────────────────────────────────────────────────

const mockProfile = {
  name: 'Thabo Nkosi',
  phone: '0821234567',
  education: 'Matric',
  province: 'Gauteng',
  skills: 'JavaScript, React',
  interests: 'Web development',
  qualification: 'NQF 4 — National Certificate',
  cvUrl: 'https://mock-supabase.co/cvs/thabo_cv.pdf'
};

// ── Helpers ────────────────────────────────────────────────────────────────

function setupAuthWithProfile(profileData = mockProfile) {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback({ uid: 'mock-uid-123' });
    return jest.fn(); // unsubscribe
  });

  getDoc.mockResolvedValue({
    exists: () => true,
    id: 'mock-uid-123',
    data: () => profileData
  });
}

function setupAuthNoProfile() {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback({ uid: 'mock-uid-123' });
    return jest.fn();
  });

  getDoc.mockResolvedValue({
    exists: () => false,
    id: null,
    data: () => null
  });
}

function setupNoUser() {
  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(null);
    return jest.fn();
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ApplicantProfile', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
    console.log.mockRestore();
    window.alert.mockRestore();
  });

  // ─── Loading state ─────────────────────────────────────────

  test('shows loading state before profile loads', () => {
    onAuthStateChanged.mockImplementation(() => jest.fn());
    render(<ApplicantProfile />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('does not show profile content while loading', () => {
    onAuthStateChanged.mockImplementation(() => jest.fn());
    render(<ApplicantProfile />);
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument();
  });

  // ─── Profile view mode ─────────────────────────────────────

  test('renders profile heading after data loads', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /my profile/i })).toBeInTheDocument();
    });
  });

  test('renders profile name in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/thabo nkosi/i)).toBeInTheDocument();
    });
  });

  test('renders profile phone in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/0821234567/)).toBeInTheDocument();
    });
  });

  test('renders profile education in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/matric/i)).toBeInTheDocument();
    });
  });

  test('renders profile province in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/gauteng/i)).toBeInTheDocument();
    });
  });

  test('renders profile skills in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/javascript, react/i)).toBeInTheDocument();
    });
  });

  test('renders profile interests in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/web development/i)).toBeInTheDocument();
    });
  });

  test('renders NQF qualification in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText(/NQF 4/i)).toBeInTheDocument();
    });
  });

  test('renders CV download link when cvUrl exists', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /download cv/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', mockProfile.cvUrl);
    });
  });

  test('CV link opens in new tab', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /download cv/i });
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  test('does not render CV link when cvUrl is missing', async () => {
    setupAuthWithProfile({ ...mockProfile, cvUrl: null });
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /download cv/i })).not.toBeInTheDocument();
    });
  });

  test('renders Update Profile button in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
    });
  });

  test('renders Profile Details legend in view mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText('Profile Details')).toBeInTheDocument();
    });
  });

  // ─── Edit mode ─────────────────────────────────────────────

  test('clicking Update Profile switches to edit mode', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  test('edit mode shows name input pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('Thabo Nkosi')).toBeInTheDocument();
  });

  test('edit mode shows phone input pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('0821234567')).toBeInTheDocument();
  });

  test('edit mode shows education textarea pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('Matric')).toBeInTheDocument();
  });

  test('edit mode shows province select pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('Gauteng')).toBeInTheDocument();
  });

  test('edit mode shows skills textarea pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('JavaScript, React')).toBeInTheDocument();
  });

  test('edit mode shows interests textarea pre-filled', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByDisplayValue('Web development')).toBeInTheDocument();
  });

  test('edit mode shows Save Changes button', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  test('edit mode shows file input for CV upload', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    const fileInput = screen.getByLabelText(/update cv/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.pdf');
  });

  test('edit mode shows all nine province options', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    const provinces = [
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
      'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
    ];
    provinces.forEach(province => {
      expect(screen.getByRole('option', { name: province })).toBeInTheDocument();
    });
  });

  // ─── Field editing ─────────────────────────────────────────

  test('user can type in the name field', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    const nameInput = screen.getByDisplayValue('Thabo Nkosi');
    fireEvent.change(nameInput, { target: { value: 'Thabo Updated' } });
    expect(screen.getByDisplayValue('Thabo Updated')).toBeInTheDocument();
  });

  test('user can type in the phone field', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    const phoneInput = screen.getByDisplayValue('0821234567');
    fireEvent.change(phoneInput, { target: { value: '0839876543' } });
    expect(screen.getByDisplayValue('0839876543')).toBeInTheDocument();
  });

  test('user can change province selection', async () => {
    setupAuthWithProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    const select = screen.getByDisplayValue('Gauteng');
    fireEvent.change(select, { target: { value: 'Western Cape' } });
    expect(screen.getByDisplayValue('Western Cape')).toBeInTheDocument();
  });

  // ─── Save changes ──────────────────────────────────────────

  test('clicking Save Changes calls updateDoc', async () => {
    setupAuthWithProfile();
    updateDoc.mockResolvedValue({});
    const { auth: mockAuth } = require('../../firebase');
    mockAuth.currentUser = { uid: 'mock-uid-123' };

    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledTimes(1);
    });
  });

  test('successful save shows alert', async () => {
    setupAuthWithProfile();
    updateDoc.mockResolvedValue({});
    const { auth: mockAuth } = require('../../firebase');
    mockAuth.currentUser = { uid: 'mock-uid-123' };

    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Profile updated!');
    });
  });

  test('successful save switches back to view mode', async () => {
    setupAuthWithProfile();
    updateDoc.mockResolvedValue({});
    const { auth: mockAuth } = require('../../firebase');
    mockAuth.currentUser = { uid: 'mock-uid-123' };

    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(screen.getByText('Profile Details')).toBeInTheDocument();
    });
  });

  test('failed save shows error alert', async () => {
    setupAuthWithProfile();
    updateDoc.mockRejectedValue(new Error('Firestore error'));
    const { auth: mockAuth } = require('../../firebase');
    mockAuth.currentUser = { uid: 'mock-uid-123' };

    render(<ApplicantProfile />);
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /update profile/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Failed to update profile. Please try again.'
      );
    });
  });

  // ─── No profile found ──────────────────────────────────────

  test('stays on loading when no profile document exists', async () => {
    setupAuthNoProfile();
    render(<ApplicantProfile />);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ─── No user logged in ─────────────────────────────────────

  test('stays on loading when no user is authenticated', async () => {
    setupNoUser();
    render(<ApplicantProfile />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

});