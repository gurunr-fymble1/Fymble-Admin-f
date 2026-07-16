"use client";
import React, { useState, useRef } from "react";
import axiosInstance from "@/lib/axios";

export const useSecureDelete = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState("totp"); // "totp" or "otp"
  const [totpCode, setTotpCode] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);
  const [modalTitle, setModalTitle] = useState("Secure Delete Authorization");
  const [modalWarning, setModalWarning] = useState("Assigned to a client. Delete anyway?");
  const [modalSubmitLabel, setModalSubmitLabel] = useState("Verify & Delete");

  const otpRefs = useRef([]);

  const getOrFetchMobileNumber = async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      throw new Error("No active session found. Please log in again.");
    }
    const parsedUser = JSON.parse(storedUser);
    let mobileNumber = parsedUser.mobile_number || parsedUser.contact || parsedUser.contact_number;

    if (!mobileNumber) {
      try {
        const profileRes = await axiosInstance.get("/api/admin/auth/profile");
        if (profileRes.data && profileRes.data.status === 200 && profileRes.data.data) {
          const profileData = profileRes.data.data;
          mobileNumber = profileData.contact_number || profileData.contact || profileData.mobile_number;
          if (mobileNumber) {
            const updatedUser = {
              ...parsedUser,
              mobile_number: mobileNumber,
              contact_number: mobileNumber,
              contact: mobileNumber
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin profile:", err);
      }
    }

    if (!mobileNumber) {
      throw new Error("Registered mobile number not found in session.");
    }

    return mobileNumber;
  };

  const handleDeleteTrigger = async (
    onVerified, 
    title = "Secure Delete Authorization", 
    warning = "Assigned to a client. Delete anyway?", 
    submitLabel = "Verify & Delete"
  ) => {
    try {
      setModalTitle(title);
      setModalWarning(warning);
      setModalSubmitLabel(submitLabel);
      setAuthLoading(true);
      setAuthError("");
      setAuthSuccess("");
      setTotpCode("");
      setOtpCode(["", "", "", "", "", ""]);
      setOnSuccessCallback(() => onVerified);

      // 1. Retrieve the administrator's contact number
      const mobileNumber = await getOrFetchMobileNumber();

      // 2. Check TOTP Status
      const statusResponse = await axiosInstance.get("/api/admin/auth/totp/status");
      
      if (statusResponse.data.status === 200 && statusResponse.data.data.totp_enabled) {
        setAuthType("totp");
        setShowAuthModal(true);
      } else {
        setAuthType("otp");
        setShowAuthModal(true);
        
        // Trigger SMS OTP send API
        const sendOtpRes = await axiosInstance.post("/api/admin/auth/send_otp", {
          mobile_number: mobileNumber
        });
        
        if (sendOtpRes.data.status !== 200) {
          throw new Error(sendOtpRes.data.message || "Failed to dispatch SMS verification OTP.");
        }
      }
    } catch (err) {
      console.error("Auth precheck failed:", err);
      alert(err.response?.data?.detail || err.message || "Security verification precheck failed.");
      setShowAuthModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      setAuthSuccess("");

      const mobileNumber = await getOrFetchMobileNumber();

      const response = await axiosInstance.post("/api/admin/auth/send_otp", {
        mobile_number: mobileNumber
      });

      if (response.data.status === 200) {
        setAuthSuccess("A fresh OTP has been successfully dispatched!");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => setAuthSuccess(""), 3000);
      } else {
        throw new Error(response.data.message || "Failed to dispatch OTP.");
      }
    } catch (err) {
      setAuthError(err.response?.data?.detail || err.message || "Resend failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      const mobileNumber = await getOrFetchMobileNumber();

      if (authType === "totp") {
        if (totpCode.length !== 6) {
          throw new Error("Please enter a valid 6-digit Authenticator code.");
        }
        // Verify Google Authenticator TOTP
        const response = await axiosInstance.post("/api/admin/auth/totp/verify", {
          mobile_number: mobileNumber,
          totp_code: totpCode
        });
        
        if (response.data.status !== 200) {
          throw new Error(response.data.detail || "Invalid TOTP code.");
        }
      } else {
        const otpValue = otpCode.join("");
        if (otpValue.length !== 6) {
          throw new Error("Please enter a complete 6-digit OTP.");
        }
        // Verify SMS OTP
        const response = await axiosInstance.post("/api/admin/auth/verify_otp", {
          mobile_number: mobileNumber,
          otp: otpValue,
          device: "web",
          role: "admin"
        });

        if (response.data.status !== 200) {
          throw new Error(response.data.message || "Incorrect verification OTP.");
        }
      }

      setAuthSuccess("Security verification successful!");

      setTimeout(async () => {
        setShowAuthModal(false);
        if (onSuccessCallback) {
          await onSuccessCallback();
        }
      }, 1200);

    } catch (err) {
      console.error("Verification failed:", err);
      setAuthError(err.response?.data?.detail || err.message || "Verification failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return {
    handleDeleteTrigger,
    secureDeleteProps: {
      showAuthModal,
      setShowAuthModal,
      authType,
      totpCode,
      setTotpCode,
      otpCode,
      setOtpCode,
      authLoading,
      authError,
      authSuccess,
      otpRefs,
      handleResendOtp,
      handleVerificationSubmit,
      handleOtpChange,
      handleOtpKeyDown,
      title: modalTitle,
      warning: modalWarning,
      submitLabel: modalSubmitLabel
    }
  };
};

export const SecureDeleteModal = ({
  showAuthModal,
  setShowAuthModal,
  authType,
  totpCode,
  setTotpCode,
  otpCode,
  authLoading,
  authError,
  authSuccess,
  otpRefs,
  handleResendOtp,
  handleVerificationSubmit,
  handleOtpChange,
  handleOtpKeyDown,
  title,
  warning,
  submitLabel
}) => {
  if (!showAuthModal) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "450px",
        padding: "30px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        color: "#fff",
        fontFamily: "inherit"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 15px",
            border: "1px solid rgba(16, 185, 129, 0.2)"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "600", margin: "0 0 8px 0" }}>
            {title}
          </h3>
          <p style={{ fontSize: "14px", color: "#fbbf24", fontWeight: "600", margin: "0 0 12px 0", lineHeight: "1.5" }}>
            {warning}
          </p>
          <p style={{ fontSize: "13px", color: "#a3a3a3", margin: 0, lineHeight: "1.5" }}>
            {authType === "totp" 
              ? "To proceed, enter the 6-digit verification code from your Google Authenticator app."
              : "Google Authenticator is not enabled. Enter the 6-digit OTP sent to your registered mobile number."
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerificationSubmit}>
          {authType === "totp" ? (
            /* Google Authenticator (TOTP) Input */
            <div style={{ marginBottom: "20px" }}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={totpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  if (val.length <= 6) setTotpCode(val);
                }}
                placeholder="000000"
                style={{
                  width: "100%",
                  padding: "14px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "24px",
                  letterSpacing: "8px",
                  textAlign: "center",
                  fontWeight: "bold",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "#3a3a3a"}
                maxLength={6}
                autoComplete="one-time-code"
                required
                disabled={authLoading}
                autoFocus
              />
            </div>
          ) : (
            /* SMS OTP Input */
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "15px" }}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    style={{
                      width: "48px",
                      height: "54px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "20px",
                      fontWeight: "bold",
                      textAlign: "center",
                      outline: "none",
                      transition: "border-color 0.2s"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#10b981"}
                    onBlur={(e) => e.target.style.borderColor = "#3a3a3a"}
                    maxLength={1}
                    autoComplete="off"
                    disabled={authLoading}
                  />
                ))}
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#10b981",
                    fontSize: "13px",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0
                  }}
                  disabled={authLoading}
                >
                  Didn&apos;t receive code? Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Status Message Badges */}
          {authError && (
            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "6px",
              padding: "10px 12px",
              color: "#ef4444",
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "center",
              lineHeight: "1.4"
            }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{
              backgroundColor: "rgba(74, 222, 128, 0.1)",
              border: "1px solid rgba(74, 222, 128, 0.2)",
              borderRadius: "6px",
              padding: "10px 12px",
              color: "#4ade80",
              fontSize: "13px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              {authSuccess}
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "8px",
                color: "#ccc",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              disabled={authLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#10b981",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer"
              }}
              disabled={authLoading}
            >
              {authLoading ? "Verifying..." : (submitLabel || "Verify & Delete")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
