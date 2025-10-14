import React, { useState, useEffect } from 'react';
import './profile.css';
import { API_BASE_URL } from '../../config';

interface UserData {
  user_id?: string;
  full_name: string;
  email: string;
  household_size?: number;
  enable_2fa: boolean;
  acct_status: string;
  created_at: string;
  last_login_at?: string;
}

const ProfilePage: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');

    if (!token || !email) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile?email=${email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUserData({
        full_name: localStorage.getItem('userName') || 'User',
        email: localStorage.getItem('userEmail') || '',
        household_size: undefined,
        enable_2fa: false,
        acct_status: 'active',
        created_at: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = () => {
    setShow2FAModal(true);
  };

  const confirmEnable2FA = async () => {
    if (!userData?.user_id) {
      alert('User ID not found. Please refresh the page.');
      return;
    }

    setIsToggling2FA(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/enable-2fa/${userData.user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      alert('A verification code has been sent to your email. Please check your email and click the verification link to complete 2FA setup.');
      setShow2FAModal(false);
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      alert('Failed to send verification code. Please try again.');
    } finally {
      setIsToggling2FA(false);
    }
  };

  const confirmDisable2FA = async () => {
    if (!userData) return;

    setIsToggling2FA(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/enable-2fa/${userData.user_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: userData.email,
          enable_2fa: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      alert('2FA has been disabled.');
      await fetchUserProfile();
      setShow2FAModal(false);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      alert('Failed to disable 2FA. Please try again.');
    } finally {
      setIsToggling2FA(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const cancel2FAModal = () => {
    setShow2FAModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-container">
        <div className="error-container">
          <p>Unable to load profile. Please try again.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper" >
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(userData.full_name)}
          </div>
          <h1>{userData.full_name}</h1>
          <p className="profile-email">{userData.email}</p>
          <span className={`status-badge ${userData.acct_status}`}>
            {userData.acct_status === 'active' ? '✓ Active Account' : 'Pending Verification'}
          </span>
        </div>

        {/* Account Information Section */}
        <div className="profile-section">
          <h2>Account Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Full Name</div>
              <div className="info-value">{userData.full_name}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{userData.email}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Household Size</div>
              <div className="info-value">
                {userData.household_size ? `${userData.household_size} members` : 'Not specified'}
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Member Since</div>
              <div className="info-value">{formatDate(userData.created_at)}</div>
            </div>

            {userData.last_login_at && (
              <div className="info-item">
                <div className="info-label">Last Login</div>
                <div className="info-value">{formatDate(userData.last_login_at)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="profile-section security-section">
          <h2>Privacy & Security</h2>
          
          <div className="security-item">
            <div className="security-info">
              <div className="security-details">
                <h3>Two-Factor Authentication (2FA)</h3>
                <p>Add an extra layer of security to your account</p>
                <span className={`badge ${userData.enable_2fa ? 'enabled' : 'disabled'}`}>
                  {userData.enable_2fa ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            </div>
            <button 
              className={`btn-toggle ${userData.enable_2fa ? 'btn-danger' : 'btn-success'}`}
              onClick={handleToggle2FA}
            >
              {userData.enable_2fa ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-edit" onClick={() => alert('Edit profile feature coming soon!')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Profile
          </button>
          
          <button className="btn-logout" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={confirmLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Toggle Confirmation Modal */}
      {show2FAModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            <h3>{userData.enable_2fa ? 'Disable 2FA' : 'Enable 2FA'}</h3>
            <p>
              {userData.enable_2fa 
                ? 'Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.'
                : 'Enable Two-Factor Authentication for enhanced security. A verification code will be sent to your email, and you\'ll need to set a new password to complete the process.'}
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancel2FAModal} disabled={isToggling2FA}>
                Cancel
              </button>
              <button 
                className={userData.enable_2fa ? 'btn-confirm-danger' : 'btn-confirm'}
                onClick={userData.enable_2fa ? confirmDisable2FA : confirmEnable2FA}
                disabled={isToggling2FA}
              >
                {isToggling2FA ? 'Processing...' : (userData.enable_2fa ? 'Disable 2FA' : 'Enable 2FA')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;