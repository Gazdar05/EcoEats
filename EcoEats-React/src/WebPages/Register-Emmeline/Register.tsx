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
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

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

      setUserId(data.user_id);
      setRegistrationEmail(email);

      if (enable2FA) {
        setIsVerificationOpen(true);
      } else {
        alert("Registration successful! You can now log in.");
        window.location.href = "/login";
      }
    } catch (err: any) {
      alert(err.message || "Error during registration.");
      console.error("Registration error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  // --- Verification ---
  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verificationCode: "Please enter a valid 6-digit code" });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registrationEmail,
          code: verificationCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Verification failed");

      // ✅ After successful verification, open the "Set Password" modal
      setIsVerificationOpen(false);
      setIsSetPasswordOpen(true);
    } catch (err: any) {
      alert(err.message || "Verification error");
    } finally {
      setIsCreating(false);
    }
  };

  // --- Set New Password ---
  const handleSetPassword = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!newPassword) newErrors.newPassword = "New password is required";
    else if (!validatePassword(newPassword)) newErrors.newPassword = "Password must be at least 8 characters";
    if (newPassword !== confirmNewPassword) newErrors.confirmNewPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registrationEmail,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to set password");

      alert("Password updated successfully! You can now log in.");
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message || "Error setting password.");
    } finally {
      setIsCreating(false);
    }
  };

  const resendCode = async () => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE_URL}/auth/enable-2fa/${userId}`, { method: "POST" });
      alert("Verification code resent to " + registrationEmail);
    } catch {
      alert("Failed to resend verification code.");
    }
  };

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
        </div>

        <button className="btn-primary" onClick={handleRegister} disabled={isCreating}>
          {isCreating ? "Creating account..." : "Create Account"}
        </button>

        <div className="login-link">
          Already have an account? <a href="/login">  Sign in</a>
        </div>

        {/* 2FA Modal */}
        {isVerificationOpen && (
          <div className="modal active">
            <div className="modal-content">
              <h2>Verify Your Email</h2>
              <p>We’ve sent a 6-digit verification code to {registrationEmail}</p>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className={errors.verificationCode ? "error" : ""}
              />
              {errors.verificationCode && <div className="error-message">{errors.verificationCode}</div>}
              <button className="btn-primary" onClick={handleVerification} disabled={isCreating}>
                {isCreating ? "Verifying..." : "Verify Code"}
              </button>
              <button className="btn-primary" onClick={resendCode}>Resend Code</button>
            </div>
          </div>
        )}

        {/* ✅ Set New Password Modal */}
        {isSetPasswordOpen && (
          <div className="modal active">
            <div className="modal-content">
              <h2>Set New Password</h2>
              <p>Email: <strong>{registrationEmail}</strong></p>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={errors.newPassword ? "error" : ""}
              />
              {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}

              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={errors.confirmNewPassword ? "error" : ""}
              />
              {errors.confirmNewPassword && <div className="error-message">{errors.confirmNewPassword}</div>}

              <button className="btn-primary" onClick={handleSetPassword} disabled={isCreating}>
                {isCreating ? "Saving..." : "Save Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
