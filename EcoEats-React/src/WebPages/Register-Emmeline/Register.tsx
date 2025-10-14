import React, { useState } from "react";
import "./register.css";
import { API_BASE_URL } from "../../config";

const Register: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | "">("");
  const [enable2FA, setEnable2FA] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCreating, setIsCreating] = useState(false);
   const [registrationSuccess, setRegistrationSuccess] = useState(false);
  

  // --- Validation --- 
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 8;

  const togglePassword = (field: string) => {
    const input = document.getElementById(field) as HTMLInputElement;
    if (input) input.type = input.type === "password" ? "text" : "password";
  };

  // --- Register Function ---
  const handleRegister = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!fullName) newErrors.fullName = "Full name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Please enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (!validatePassword(password)) newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsCreating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          household_size: householdSize || null,
          enable_2fa: enable2FA,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");

       // Show success message
      setRegistrationSuccess(true);
    } catch (err: any) {
      alert(err.message || "Error during registration.");
      console.error("Registration error:", err);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Show success message if registration completed
  if (registrationSuccess) {
  return (
      <div className="register-wrapper">
        <div className="container">
          <div className="success-message-container">
            <h1>✓ Registration Successful!</h1>
            {enable2FA ? (
              <>
                <p>We've sent a verification email to <strong>{email}</strong></p>
                <p>Please check your inbox and click the confirmation link to verify your account and set your password.</p>
                <p className="note">The verification link will expire in 5 minutes.</p>
              </>
            ) : (
              <>
                <p>Your account has been created successfully!</p>
                <p>You can now log in with your credentials.</p>
              </>
            )}
            <button 
              className="btn-primary" 
              onClick={() => window.location.href = "/login"}
              style={{ marginTop: "2rem" }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-wrapper">
      <div className="container">
        <h1>Create Account</h1>

        {/* Form Fields */}
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={errors.fullName ? "error" : ""}
            placeholder="John Doe"
          />
          {errors.fullName && <div className="error-message">{errors.fullName}</div>}
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "error" : ""}
            placeholder="you@example.com"
          />
          {errors.email && <div className="error-message">{errors.email}</div>}
        </div>

        <div className="form-group">
          <label>Password *</label>
          <div className="input-wrapper">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "error" : ""}
              placeholder="At least 8 characters"
            />
            <button type="button" onClick={() => togglePassword("password")}>Show</button>
          </div>
          {errors.password && <div className="error-message">{errors.password}</div>}
        </div>

        <div className="form-group">
          <label>Confirm Password *</label>
          <div className="input-wrapper">
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? "error" : ""}
              placeholder="Re-enter password"
            />
            <button type="button" onClick={() => togglePassword("confirmPassword")}>Show</button>
          </div>
          {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
        </div>

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

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e) => setEnable2FA(e.target.checked)}
            />
            Enable Two-Factor Authentication (2FA)
          </label>
          {enable2FA && (
            <p className="info-text">
              A verification link will be sent to your email to activate your account.
            </p>
          )}
        </div>

        <button className="btn-primary" onClick={handleRegister} disabled={isCreating}>
          {isCreating ? "Creating account..." : "Create Account"}
        </button>

        <div className="login-link">
          Already have an account? <a href="/login">  Sign in</a>
        </div>

        
          </div>
        </div>
      )}

     

export default Register;
