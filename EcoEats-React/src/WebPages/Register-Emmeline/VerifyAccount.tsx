import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./verifyAccount.css";
import { API_BASE_URL } from "../../config";

const VerifyAccount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"verify" | "setPassword" | "success">("verify");
  const [resendMessage, setResendMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  useEffect(() => {
    // Get email from URL parameters
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const validatePassword = (password: string) => password.length >= 8;

  const togglePassword = (field: string) => {
    const input = document.getElementById(field) as HTMLInputElement;
    if (input) input.type = input.type === "password" ? "text" : "password";
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (!email) {
      alert("Email not found. Please try registering again.");
      return;
    }

    setIsResending(true);
    setResendMessage("");

    try {
      // First, get user ID by email (you might need to add this endpoint)
      const userRes = await fetch(`${API_BASE_URL}/auth/get-user-by-email?email=${email}`);
      const userData = await userRes.json();
      
      if (!userRes.ok) {
        throw new Error("User not found. Please register again.");
      }

      // Resend the code
      const resendRes = await fetch(`${API_BASE_URL}/auth/enable-2fa/${userData.user_id}`, {
        method: "POST",
      });

      if (!resendRes.ok) {
        throw new Error("Failed to resend verification code");
      }

      setResendMessage("✓ Verification code resent! Please check your email.");
      setTimeout(() => setResendMessage(""), 5000); // Clear message after 5 seconds
    } catch (err: any) {
      alert(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Step 1: Verify the code
  const handleVerifyCode = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!verificationCode || verificationCode.length !== 6) {
      newErrors.verificationCode = "Please enter a valid 6-digit code";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const verifyRes = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.detail || "Verification failed");

      // ✅ Move to password setting step
      setStep("setPassword");
    } catch (err: any) {
      alert(err.message || "Verification error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Set the password
  const handleSetPassword = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const passwordRes = await fetch(`${API_BASE_URL}/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          new_password: newPassword,
        }),
      });

      const passwordData = await passwordRes.json();
      if (!passwordRes.ok) throw new Error(passwordData.detail || "Failed to set password");

      // Success!
      setStep("success");
    } catch (err: any) {
      alert(err.message || "Error setting password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (step === "success") {
    return (
      <div className="verify-wrapper">
        <div className="verify-container">
          <div className="success-message-container">
            <h1>✓ Account Activated!</h1>
            <p>Your account has been successfully verified and your password has been set.</p>
            <p>You can now log in with your credentials.</p>
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

  // Set Password screen
  if (step === "setPassword") {
    return (
      <div className="verify-wrapper">
        <div className="verify-container">
          <h1>Set New Password</h1>
          <p className="subtitle">Create a secure password for your account</p>

          <div className="email-display">
            <strong>Email:</strong> {email}
          </div>

          {/* New Password */}
          <div className="form-group">
            <label>New Password *</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={errors.newPassword ? "error" : ""}
                placeholder="At least 8 characters"
              />
              <button type="button" onClick={() => togglePassword("newPassword")}>
                Show
              </button>
            </div>
            {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label>Confirm Password *</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={errors.confirmNewPassword ? "error" : ""}
                placeholder="Re-enter password"
              />
              <button type="button" onClick={() => togglePassword("confirmNewPassword")}>
                Show
              </button>
            </div>
            {errors.confirmNewPassword && (
              <div className="error-message">{errors.confirmNewPassword}</div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleSetPassword}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Password & Activate Account"}
          </button>
        </div>
      </div>
    );
  }

  // Verification Code screen (default)
  return (
    <div className="verify-wrapper">
      <div className="verify-container">
        <h1>Verify Your Account</h1>
        <p className="subtitle">Welcome to EcoEats! Please enter your verification code.</p>

        <div className="email-display">
          <strong>Email:</strong> {email}
        </div>

        {/* Verification Code */}
        <div className="form-group">
          <label>Verification Code *</label>
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            className={errors.verificationCode ? "error" : ""}
            placeholder="Enter 6-digit code"
          />
          {errors.verificationCode && (
            <div className="error-message">{errors.verificationCode}</div>
          )}
          <p className="helper-text">Check your email for the 6-digit verification code</p>
        </div>

        {/* Success message for resend */}
        {resendMessage && (
          <div className="success-message">{resendMessage}</div>
        )}

        <button
          className="btn-primary"
          onClick={handleVerifyCode}
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>

        {/* Resend Code Button */}
        <button
          className="btn-secondary"
          onClick={handleResendCode}
          disabled={isResending}
        >
          {isResending ? "Resending..." : "Resend Verification Code"}
        </button>

        <div className="help-link">
          Didn't receive the code? <a href="/register">Register again</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;