import React, { useState, useEffect, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import './login.css';
import { API_BASE_URL } from '../../config';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  // Auto-redirect after 2 seconds on success
  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loginSuccess]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const newErrors: LoginErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email';

    if (!formData.password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.detail || 'Invalid email or password. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      // ✅ Store token in localStorage
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userName', data.user.full_name);

      // Show success screen
      setUserName(data.user.full_name);
      setLoginSuccess(true);

    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  // Success Screen
  if (loginSuccess) {
    return (
      <div className="login-container">
        <div className="login-wrapper">
          <div className="container">
            <div className="success-message-container">
              <div className="success-icon">✓</div>
              <h1>Login Successful!</h1>
              <p>Welcome back, <strong>{userName}</strong>!</p>
              <p className="redirect-text">Redirecting you to the home page...</p>
              <div className="loading-spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="container">
          <div className="login-header">
            <h1>EcoEats</h1>
            <p>Reduce waste, save money, help the planet</p>
          </div>

          <div className="login-card">
            <h2>Welcome Back</h2>

            <form onSubmit={handleLogin}>
              {errors.general && (
                <div className="error-message general-error">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  placeholder="you@example.com"
                />
                {errors.email && <div className="error-message"><span>{errors.email}</span></div>}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="password-toggle-outside"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    Show
                  </button>
                </div>
                {errors.password && <div className="error-message"><span>{errors.password}</span></div>}
              </div>

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="signup-link">
              Don't have an account? <a href="/register">Sign up</a>
            </div>
          </div>

          <p className="footer">
            By continuing, you agree to EcoEats' <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;