import React, { useState } from 'react';
import './register.css';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [householdSize, setHouseholdSize] = useState<number | ''>('');
  const [enable2FA, setEnable2FA] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationEmail, setRegistrationEmail] = useState('');

  const togglePassword = (field: 'password' | 'confirmPassword') => {
    const input = document.getElementById(field) as HTMLInputElement;
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const handleRegister = () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (!validatePassword(password)) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsCreating(true);
      setTimeout(() => {
        setRegistrationEmail(email);
        setIsVerificationOpen(true);
        setIsCreating(false);
      }, 1500);
    }
  };

  const handleVerification = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verificationCode: 'Please enter a valid 6-digit code' });
      return;
    }
    setIsCreating(true);
    setTimeout(() => {
      alert('Account activated successfully! You can now log in.');
      window.location.href = '/login';
    }, 1000);
  };

  const resendCode = () => alert('Verification code resent to ' + registrationEmail);

  return (
    <div className="register-wrapper">
      <div className="container">
        <h1>Create Account</h1>

        {/* Full Name */}
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={errors.fullName ? 'error' : ''}
            placeholder="John Doe"
          />
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'error' : ''}
            placeholder="you@example.com"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label>Password *</label>
          <div className="input-wrapper">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? 'error' : ''}
              placeholder="At least 8 characters"
            />
            <button type="button" onClick={() => togglePassword('password')}>Show</button>
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label>Confirm Password *</label>
          <div className="input-wrapper">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Re-enter password"
            />
            <button type="button" onClick={() => togglePassword('confirmPassword')}>Show</button>
          </div>
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>

        {/* Household Size */}
        <div className="form-group">
          <label>Household Size (Optional)</label>
          <input
            type="number"
            min={1}
            value={householdSize}
            onChange={(e) => setHouseholdSize(Number(e.target.value))}
            placeholder="e.g., 4"
          />
        </div>

        {/* 2FA */}
        <div className="form-group">
          <label>
            <input type="checkbox" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} />
            Enable Two-Factor Authentication (2FA)
          </label>
        </div>

        <button onClick={handleRegister} disabled={isCreating}>
          {isCreating ? 'Creating account...' : 'Create Account'}
        </button>

        <p>Already have an account? <a href="/login">Sign in</a></p>

        {/* Verification Modal */}
        {isVerificationOpen && (
          <div className="modal active">
            <div className="modal-content">
              <h2>Verify Your Email</h2>
              <p>We've sent a 6-digit verification code to {registrationEmail}</p>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className={errors.verificationCode ? 'error' : ''}
              />
              {errors.verificationCode && <div className="error-message">{errors.verificationCode}</div>}
              <button onClick={handleVerification}>Verify & Activate Account</button>
              <button onClick={resendCode}>Resend Code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
