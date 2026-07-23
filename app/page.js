"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import axiosInstance, { verifyToken } from "@/lib/axios";

export default function AdminLogin() {
  const [step, setStep] = useState("mobile"); // "mobile", "totp", "otp", "set-password", "forgot-mobile", "forgot-otp", "forgot-password"
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [totpCode, setTotpCode] = useState("");
  const [backupCode, setBackupCode] = useState(""); // Separate state for backup code
  const [role, setRole] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [totpSetupData, setTotpSetupData] = useState(null); // Store TOTP setup data
  const otpRefs = useRef([]);
  const router = useRouter();

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Skip authentication check if we're in the middle of login/OTP/TOTP flow
        if (step !== "mobile") {
          setCheckingAuth(false);
          return;
        }

        // Check if user data exists in localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          setCheckingAuth(false);
          return;
        }

        const user = JSON.parse(userData);

        // Check if role is admin
        if (user.role !== "admin") {
          localStorage.removeItem("user");
          setCheckingAuth(false);
          return;
        }

        // Verify token with backend (checks cookies)
        const verifyResponse = await verifyToken();

        if (verifyResponse && verifyResponse.status === 200) {
          // Token is valid, redirect to admin portal
          if (user.role === "admin") {
            router.push("/portal/admin/home");
          } else if (user.role === "support") {
            router.push("/portal/support/home");
          } else if (user.role === "nutritionist") {
            router.push("/portal/nutritionist/home");
          }
        } else {
          // Verification failed, stay on login
          localStorage.removeItem("user");
          setCheckingAuth(false);
        }
      } catch (error) {
        // If verification fails, the axios interceptor will handle token refresh
        // If refresh also fails, user stays on login page
        localStorage.removeItem("user");
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router, step]);


  useEffect(() => {
    if (step === "otp" || step === "forgot-otp") {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);


  // Handle mobile number submission
  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    if (mobileNumber.length >= 10) {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.post("/api/admin/auth/login", {
          mobile_number: mobileNumber,
          password: password,
          role: role,
          source: role,
        });

        if (response.data.require_totp) {
          // TOTP is enabled, show TOTP verification step
          setStep("totp");
        } else if (response.data.status === 200) {
          localStorage.setItem("user", JSON.stringify(response.data.data));
          if (response.data.data.role === "admin") {
            router.push("/portal/admin/home");
          } else if (response.data.data.role === "support") {
            router.push("/portal/support/home");
          } else if (response.data.data.role === "nutritionist") {
            router.push("/portal/nutritionist/home");
          } else {
            setError("Only nutritionists are allowed to access this portal");
            localStorage.removeItem("user");
            handleBack();
          }
        } else {
          setError(response?.data?.detail || "Failed to Login");
        }
      } catch (err) {
        if (err.response?.status === 400) {
          setError("Only admins are allowed to access this portal");
        } else {
          setError(
            err.response?.data?.detail || "Failed to Login. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP key events
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleOtpSubmit(e);
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.post("/api/admin/auth/verify_otp", {
          mobile_number: mobileNumber,
          otp: otpValue,
          device: "web",
          role: "admin",
        });

        if (response.data.status === 200) {
          // Check if user is admin

          setStep("set-password");
          setOtp(["", "", "", "", "", ""]);
        } else {
          setError(response.data.message || "Incorrect OTP");
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Only admins are allowed to access this portal");
        } else {
          setError(
            err.response?.data?.detail || "Incorrect OTP. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle TOTP verification
  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.post("/api/admin/auth/totp/verify", {
          mobile_number: mobileNumber,
          totp_code: totpCode,
        });

        if (response.data.status === 200) {
          localStorage.setItem("user", JSON.stringify(response.data.data));
          if (response.data.data.role === "admin") {
            router.push("/portal/admin/home");
          } else if (response.data.data.role === "support") {
            router.push("/portal/support/fittbotbusiness");
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.detail || "Invalid TOTP code. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle backup code submission
  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    if (backupCode.length > 0) {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.post("/api/admin/auth/totp/verify", {
          mobile_number: mobileNumber,
          backup_code: backupCode,
        });

        if (response.data.status === 200) {
          localStorage.setItem("user", JSON.stringify(response.data.data));
          if (response.data.data.role === "admin") {
            router.push("/portal/admin/home");
          } else if (response.data.data.role === "support") {
            router.push("/portal/support/fittbotbusiness");
          }
        }
      } catch (err) {
        setError(
          err.response?.data?.detail || "Invalid backup code. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle password setup after OTP verification
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // API call to set password after OTP verification
      const response = await axiosInstance.post("/api/admin/auth/change_password", {
        mobile_number: mobileNumber,
        new_password: newPassword,
      });

      if (response.data.status === 200) {
        setStep("mobile");
      } else {
        setError(response?.data?.detail || "Failed to set password");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to set password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle back to mobile step
  const handleBack = () => {
    setStep("mobile");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/admin/auth/resend-otp", {
        data: mobileNumber,
      });

      if (response.data.status === 200) {
        // Clear existing OTP inputs
        setOtp(["", "", "", "", "", ""]);
        // Show success message temporarily
        setError("OTP sent successfully!");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password - mobile submission
  const handleForgotPasswordMobile = async (e) => {
    e.preventDefault();
    if (mobileNumber.length >= 10) {
      setLoading(true);
      setError("");

      try {
        // Using same login endpoint as placeholder
        const response = await axiosInstance.post("/api/admin/auth/send_otp", {
          mobile_number: mobileNumber,
        });

        if (response.data.status === 200) {
          setStep("forgot-otp");
        } else {
          setError(response?.data?.detail || "Failed to send OTP");
        }
      } catch (err) {
        setError(
          err.response?.data?.detail || "Failed to send OTP. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle forgot password - OTP verification
  const handleForgotPasswordOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length === 6) {
      setLoading(true);
      setError("");

      try {
        const response = await axiosInstance.post("/api/admin/auth/verify_otp", {
          mobile_number: mobileNumber,
          otp: otpValue,
          device: "web",
          role: "admin",
        });

        if (response.data.status === 200) {
          setStep("forgot-password");
          setOtp(["", "", "", "", "", ""]);
        } else {
          setError(response.data.message || "Incorrect OTP");
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Only admins are allowed to access this portal");
        } else {
          setError(
            err.response?.data?.detail || "Incorrect OTP. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle new password submission (forgot password flow)
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Call the change_password endpoint to update the password in database
      const response = await axiosInstance.post("/api/admin/auth/change_password", {
        mobile_number: mobileNumber,
        new_password: newPassword,
      });

      if (response.data.status === 200) {
        // Show success message and redirect to login
        setError("Password changed successfully! Please login with your new password.");

        // Wait a moment to show the success message, then redirect to login
        setTimeout(() => {
          handleCancelForgotPassword();
        }, 2000);
      } else {
        setError(response?.data?.detail || "Failed to reset password");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Failed to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password cancel/back
  const handleCancelForgotPassword = () => {
    setStep("mobile");
    setMobileNumber("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.brandContainer}>
            <h1 className={styles.brandName}>
              <span className={styles.fitt}>Fy</span>
              <span className={styles.bot}>mble</span>
            </h1>
            <p className={styles.subtitle}>Admin Dashboard</p>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <div className={styles.loader}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Brand Logo */}
        <div className={styles.brandContainer}>
          <h1 className={styles.brandName}>
            <span className={styles.fitt}>Fy</span>
            <span className={styles.bot}>mble</span>
          </h1>
          <p className={styles.subtitle}>Admin Dashboard</p>
        </div>

        {/* Mobile Number Step */}
        {step === "mobile" && (
          <form onSubmit={handleMobileSubmit} className={styles.form}>
            {/* <div className={styles.roleSelector}>
              <label className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                />
                <span>Admin</span>
              </label> */}
              {/* <label className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value="nutritionist"
                  checked={role === "nutritionist"}
                  onChange={() => setRole("nutritionist")}
                />
                <span>Nutritionist</span>
              </label> */}
            {/* </div> */}

            <div className={styles.inputGroup}>
              <label htmlFor="mobile" className={styles.label}>
                Mobile Number
              </label>
              <div className={styles.phoneInputContainer}>
                <span className={styles.countryCode}>+91</span>
                <input
                  id="mobile"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                  className={styles.phoneInput}
                  maxLength="10"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.phoneInputContainer}>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  className={styles.phoneInput}
                  required
                />
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={mobileNumber.length < 10 || !password || loading}
            >
              {loading ? <div className={styles.loader}></div> : "Login"}
            </button>

            <button
              type="button"
              onClick={() => setStep("forgot-mobile")}
              className={styles.forgotPasswordButton}
              disabled={loading}
            >
              Forgot Password
            </button>
          </form>
        )}

        {/* TOTP Verification Step */}
        {step === "totp" && (
          <div className={styles.otpContainer}>
            <button onClick={handleBack} className={styles.backButton}>
              ← Back
            </button>

            <div className={styles.otpHeader}>
              <h2 className={styles.otpTitle}>Two-Factor Authentication</h2>
              <p className={styles.otpSubtitle}>
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <form onSubmit={handleTotpSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="totp" className={styles.label}>
                  Authentication Code
                </label>
                <div className={styles.phoneInputContainer}>
                  <input
                    id="totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className={styles.phoneInput}
                    maxLength="6"
                    autoComplete="one-time-code"
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={totpCode.length < 6 || loading}
              >
                {loading ? <div className={styles.loader}></div> : "Verify"}
              </button>
            </form>

            <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setTotpCode("");
                  setError("");
                }}
                className={styles.resendButton}
                style={{ fontSize: "0.875rem" }}
                disabled={loading}
              >
                Lost your device? Use backup code
              </button>
              <input
                type="text"
                inputMode="text"
                pattern="[A-Za-z0-9]*"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="Enter backup code"
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "0.5rem",
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  textAlign: "center",
                }}
                maxLength="8"
              />
              <button
                type="button"
                onClick={handleBackupCodeSubmit}
                className={styles.submitButton}
                style={{ marginTop: "0.5rem", width: "100%" }}
                disabled={!backupCode || loading}
              >
                {loading ? <div className={styles.loader}></div> : "Use Backup Code"}
              </button>
            </div>
          </div>
        )}

        {/* OTP Step */}
        {step === "otp" && (
          <div className={styles.otpContainer}>
            <button onClick={handleBack} className={styles.backButton}>
              ← Back
            </button>

            <div className={styles.otpHeader}>
              <h2 className={styles.otpTitle}>Enter OTP</h2>
              <p className={styles.otpSubtitle}>
                We&rsquo;ve sent a 6-digit code to +91 {mobileNumber}
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <div className={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={styles.otpInput}
                    maxLength="1"
                    autoComplete="off"
                  />
                ))}
              </div>

              {error && (
                <div
                  className={
                    error.includes("successfully")
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={otp.join("").length < 6 || loading}
              >
                {loading ? <div className={styles.loader}></div> : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResendOtp}
              className={styles.resendButton}
              disabled={loading}
            >
              Didn&rsquo;t receive code? Resend
            </button>
          </div>
        )}

        {/* Set Password Step (After OTP Verification) */}
        {step === "set-password" && (
          <div>
            <button onClick={handleBack} className={styles.backButton}>
              ← Back
            </button>

            <div className={styles.otpHeader}>
              <h2 className={styles.otpTitle}>Set Your Password</h2>
              <p className={styles.otpSubtitle}>
                Create a password for your account
              </p>
            </div>

            <form onSubmit={handleSetPasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="set-password" className={styles.label}>
                  Password
                </label>
                <div className={styles.phoneInputContainer}>
                  <input
                    id="set-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={styles.phoneInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="set-confirm-password" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.phoneInputContainer}>
                  <input
                    id="set-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={styles.phoneInput}
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!newPassword || !confirmPassword || loading}
              >
                {loading ? (
                  <div className={styles.loader}></div>
                ) : (
                  "Set Password"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Forgot Password - Mobile Number Step */}
        {step === "forgot-mobile" && (
          <div>
            <button
              onClick={handleCancelForgotPassword}
              className={styles.backButton}
            >
              ← Back
            </button>

            <div
              className={styles.otpHeader}
              style={{
                paddingTop: "1rem",
                paddingBottom: "1.5rem",
              }}
            >
              <h3 className={[styles.otpTitle]}>
                Forgot Password
              </h3>
            </div>

            <form onSubmit={handleForgotPasswordMobile} className={styles.form}>
              <div
                className={styles.inputGroup}
                style={{ paddingBottom: "1rem" }}
              >
                <label
                  htmlFor="forgot-mobile"
                  className={styles.label}
                  style={{ paddingBottom: "0.5rem" }}
                >
                  Mobile Number
                </label>

                <div className={styles.phoneInputContainer}>
                  <span className={styles.countryCode}>+91</span>

                  <input
                    id="forgot-mobile"
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter your mobile number"
                    className={styles.phoneInput}
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  className={styles.errorMessage}
                  style={{ paddingBottom: "1rem" }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={mobileNumber.length < 10 || loading}
                style={{ marginTop: "1rem" }}
              >
                {loading ? <div className={styles.loader}></div> : "Send OTP"}
              </button>
            </form>
          </div>
        )}

        {/* Forgot Password - OTP Step */}
        {step === "forgot-otp" && (
          <div className={styles.otpContainer}>
            <button
              onClick={handleCancelForgotPassword}
              className={styles.backButton}
            >
              ← Back
            </button>

            <div className={styles.otpHeader}>
              <h2 className={styles.otpTitle}>Enter OTP</h2>
              <p className={styles.otpSubtitle}>
                We&rsquo;ve sent a 6-digit code to +91 {mobileNumber}
              </p>
            </div>

            <form onSubmit={handleForgotPasswordOtp} className={styles.form}>
              <div className={styles.otpInputContainer}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={styles.otpInput}
                    maxLength="1"
                    autoComplete="off"
                  />
                ))}
              </div>

              {error && (
                <div
                  className={
                    error.includes("successfully")
                      ? styles.successMessage
                      : styles.errorMessage
                  }
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={otp.join("").length < 6 || loading}
              >
                {loading ? <div className={styles.loader}></div> : "Verify OTP"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResendOtp}
              className={styles.resendButton}
              disabled={loading}
            >
              Didn&rsquo;t receive code? Resend
            </button>
          </div>
        )}

        {/* Forgot Password - New Password Step */}
        {step === "forgot-password" && (
          <div>
            <button
              onClick={handleCancelForgotPassword}
              className={styles.backButton}
            >
              ← Back
            </button>

            <div className={styles.otpHeader}>
              <h2 className={styles.otpTitle}>Set New Password</h2>
            </div>

            <form onSubmit={handleNewPasswordSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  New Password
                </label>
                <div className={styles.phoneInputContainer}>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={styles.phoneInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="confirm-password" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.phoneInputContainer}>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={styles.phoneInput}
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}

              <button
                type="submit"
                className={styles.submitButton}
                disabled={!newPassword || !confirmPassword || loading}
              >
                {loading ? (
                  <div className={styles.loader}></div>
                ) : (
                  "Reset Password & Login"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
