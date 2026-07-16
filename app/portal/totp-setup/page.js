"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance, { verifyToken } from "@/lib/axios";
import styles from "./totp-setup.module.css";

export default function TOTPSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState("status"); // "status", "setup", "verify"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User role for redirects
  const [userRole, setUserRole] = useState("admin"); // admin, support, nutritionist

  // TOTP setup data
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [backupCodesHashed, setBackupCodesHashed] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // TOTP status
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);

  // Get home page based on user role
  const getHomePage = () => {
    if (userRole === "support") return "/portal/support/fittbotbusiness";
    if (userRole === "nutritionist") return "/portal/nutritionist/home";
    return "/portal/admin/home";
  };

  useEffect(() => {
    const checkAuthAndStatus = async () => {
      try {
        // Verify token
        const verifyResponse = await verifyToken();
        if (!verifyResponse || verifyResponse.status !== 200) {
          router.push("/");
          return;
        }

        // Store user role - check localStorage first, then verify response
        let userRoleValue = "admin"; // default

        // Check localStorage for user data (set during login)
        if (typeof window !== "undefined") {
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.role) {
                userRoleValue = parsedUser.role;
              }
            } catch (e) {
              console.error("Error parsing stored user:", e);
            }
          }
        }

        // Fallback to verify response if not found in localStorage
        if (userRoleValue === "admin" && verifyResponse.data?.data?.role) {
          userRoleValue = verifyResponse.data.data.role;
        }

        setUserRole(userRoleValue);

        // Get TOTP status
        const statusResponse = await axiosInstance.get("/api/admin/auth/totp/status");
        if (statusResponse.data.status === 200) {
          const data = statusResponse.data.data;
          setTotpEnabled(data.totp_enabled);
          setBackupCodesRemaining(data.backup_codes_remaining || 0);
        }
      } catch (err) {
        router.push("/");
      }
    };

    checkAuthAndStatus();
  }, [router]);

  const handleSetupTOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/admin/auth/totp/setup");
      if (response.data.status === 200) {
        const data = response.data.data;
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setBackupCodes(data.backup_codes);
        setBackupCodesHashed(data.backup_codes_hashed);
        setStep("setup");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to setup TOTP");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/admin/auth/totp/enable", {
        totp_code: totpCode,
        secret: secret,
        backup_codes_hashed: backupCodesHashed,
      });

      if (response.data.status === 200) {
        setSuccess("TOTP enabled successfully! Please save your backup codes securely.");
        setTotpEnabled(true);
        setBackupCodesRemaining(10);

        // Show backup codes one more time before redirecting
        setTimeout(() => {
          setStep("backup-codes");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to enable TOTP");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    const password = prompt("Enter your password to disable TOTP:");
    if (!password) return;

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post("/api/admin/auth/totp/disable", {
        password: password,
      });

      if (response.data.status === 200) {
        setSuccess("TOTP disabled successfully.");
        setTotpEnabled(false);
        setBackupCodesRemaining(0);
        setTimeout(() => {
          router.push(getHomePage());
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to disable TOTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setSuccess("Backup codes copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading && step === "status") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loader}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Two-Factor Authentication</h1>

        {/* Status View */}
        {step === "status" && (
          <>
            <div className={styles.statusContainer}>
              {totpEnabled ? (
                <>
                  <div className={styles.enabledBadge}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>Enabled</span>
                  </div>
                  <p className={styles.statusText}>
                    Your account is protected with two-factor authentication.
                  </p>
                  <div className={styles.backupInfo}>
                    <span>Backup codes remaining: <strong>{backupCodesRemaining}</strong></span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.disabledBadge}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <span>Disabled</span>
                  </div>
                  <p className={styles.statusText}>
                    Enable two-factor authentication to add an extra layer of security to your account.
                  </p>
                </>
              )}
            </div>

            <div className={styles.actions}>
              {totpEnabled ? (
                // Commented out - Disable TOTP button hidden
                // <button
                //   onClick={handleDisableTOTP}
                //   className={styles.disableButton}
                //   disabled={loading}
                // >
                //   {loading ? <div className={styles.loader}></div> : "Disable TOTP"}
                // </button>
                <div style={{ padding: '1rem', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                  TOTP is currently enabled
                </div>
              ) : (
                <button
                  onClick={handleSetupTOTP}
                  className={styles.enableButton}
                  disabled={loading}
                >
                  {loading ? <div className={styles.loader}></div> : "Enable TOTP"}
                </button>
              )}

              <button
                onClick={() => router.push(getHomePage())}
                className={styles.backButton}
              >
                Back to Dashboard
              </button>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}
          </>
        )}

        {/* Setup View - QR Code */}
        {step === "setup" && (
          <>
            <button onClick={() => setStep("status")} className={styles.backButton}>
              ← Back
            </button>

            <h2 className={styles.stepTitle}>Setup Authenticator App</h2>
            <p className={styles.stepDescription}>
              1. Install Google Authenticator or Authy on your phone<br/>
              2. Scan the QR code below<br/>
              3. Save your backup codes securely<br/>
              4. Enter the code from your app to verify
            </p>

            <div className={styles.qrContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {qrCode && <img src={qrCode} alt="QR Code" className={styles.qrCode} />}
            </div>

            <div className={styles.manualEntry}>
              <p className={styles.manualLabel}>Or enter this code manually:</p>
              <code className={styles.secretCode}>{secret}</code>
            </div>

            <div className={styles.backupCodesContainer}>
              <h3 className={styles.backupCodesTitle}>Backup Codes</h3>
              <p className={styles.backupCodesWarning}>
                ⚠️ Save these codes somewhere safe. Each code can only be used once!
              </p>
              <div className={styles.backupCodesList}>
                {backupCodes.map((code, index) => (
                  <div key={index} className={styles.backupCode}>{code}</div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className={styles.copyButton}
              >
                Copy All Codes
              </button>
            </div>

            <button
              onClick={() => setStep("verify")}
              className={styles.nextButton}
            >
              I&apos;ve Scanned the QR Code →
            </button>
          </>
        )}

        {/* Verify View */}
        {step === "verify" && (
          <>
            <button onClick={() => setStep("setup")} className={styles.backButton}>
              ← Back
            </button>

            <h2 className={styles.stepTitle}>Verify Setup</h2>
            <p className={styles.stepDescription}>
              Enter the 6-digit code from your authenticator app to complete the setup.
            </p>

            <form onSubmit={handleEnableTOTP}>
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className={styles.codeInput}
                  maxLength="6"
                  autoComplete="one-time-code"
                  required
                />
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}
              {success && <div className={styles.successMessage}>{success}</div>}

              <button
                type="submit"
                className={styles.verifyButton}
                disabled={totpCode.length < 6 || loading}
              >
                {loading ? <div className={styles.loader}></div> : "Verify & Enable TOTP"}
              </button>
            </form>
          </>
        )}

        {/* Backup Codes Final View */}
        {step === "backup-codes" && (
          <>
            <h2 className={styles.stepTitle}>Setup Complete!</h2>
            <p className={styles.stepDescription}>
              Your backup codes are shown below one last time. Please save them now!
            </p>

            <div className={styles.backupCodesContainer}>
              <div className={styles.backupCodesList}>
                {backupCodes.map((code, index) => (
                  <div key={index} className={styles.backupCode}>{code}</div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className={styles.copyButton}
              >
                Copy All Codes
              </button>
            </div>

            {success && <div className={styles.successMessage}>{success}</div>}

            <button
              onClick={() => router.push(getHomePage())}
              className={styles.doneButton}
            >
              Done →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
