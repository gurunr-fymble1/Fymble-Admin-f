"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaDownload, FaChevronLeft } from "react-icons/fa";
import axiosInstance from "@/lib/axios";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";

export default function PurchaseHistory() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dailypass");
  const [dailyPassData, setDailyPassData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [gymMembershipData, setGymMembershipData] = useState([]);
  const [gymMembershipLoading, setGymMembershipLoading] = useState(false);
  const [aiCreditsData, setAiCreditsData] = useState([]);
  const [aiCreditsLoading, setAiCreditsLoading] = useState(false);
  const [aiDietCoachData, setAiDietCoachData] = useState([]);
  const [aiDietCoachLoading, setAiDietCoachLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Security Verification Flow Hook
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  // Fetch daily pass data
  const fetchDailyPassData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/daily-pass-purchases`);
      if (response.data.success) {
        setDailyPassData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load daily pass data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Fetch session bookings data
  const fetchSessionData = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/session-bookings`);
      if (response.data.success) {
        setSessionData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load session data. Please try again.");
    } finally {
      setSessionsLoading(false);
    }
  }, [clientId]);

  // Fetch Fittbot subscription data
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/fittbot-subscription`);
      if (response.data.success) {
        setSubscriptionData(response.data.data);
      } else {
      }
    } catch (err) {
      alert("Failed to load subscription data. Please try again.");
    } finally {
      setSubscriptionLoading(false);
    }
  }, [clientId]);

  // Fetch Gym Membership data
  const fetchGymMembershipData = useCallback(async () => {
    try {
      setGymMembershipLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/gym-membership`);
      if (response.data.success) {
        setGymMembershipData(response.data.data);
      }
    } catch (err) {
      alert("Failed to load gym membership data. Please try again.");
    } finally {
      setGymMembershipLoading(false);
    }
  }, [clientId]);
  // Fetch AI Credits data
  const fetchAiCreditsData = useCallback(async () => {
    try {
      setAiCreditsLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/ai-credits-purchases`);
      if (response.data.success) {
        setAiCreditsData(response.data.data);
      }
    } catch (err) {
      alert("Failed to load AI credits data. Please try again.");
    } finally {
      setAiCreditsLoading(false);
    }
  }, [clientId]);

  // Fetch AI Diet Coach data
  const fetchAiDietCoachData = useCallback(async () => {
    try {
      setAiDietCoachLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/ai-diet-coach-purchases`);
      if (response.data.success) {
        setAiDietCoachData(response.data.data);
      }
    } catch (err) {
      alert("Failed to load AI Diet Coach data. Please try again.");
    } finally {
      setAiDietCoachLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchDailyPassData();
  }, [fetchDailyPassData]);

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessionData();
    } else if (activeTab === "subscription") {
      fetchSubscriptionData();
    } else if (activeTab === "gym-membership") {
      fetchGymMembershipData();
    } else if (activeTab === "ai-credits") {
      fetchAiCreditsData();
    } else if (activeTab === "ai-diet-coach") {
      fetchAiDietCoachData();
    }
  }, [activeTab, fetchSessionData, fetchSubscriptionData, fetchGymMembershipData, fetchAiCreditsData, fetchAiDietCoachData]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", border: "#22c55e" };
      case "completed":
        return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6" };
      case "expired":
        return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", border: "#f59e0b" };
      case "canceled":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444" };
      default:
        return { color: "#888", bg: "rgba(136, 136, 136, 0.1)", border: "#888" };
    }
  };

  // Export to Excel function - calls backend to generate Excel file
  const exportToExcel = useCallback(() => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);
        const response = await axiosInstance.get(`/api/admin/users/${clientId}/export-purchases`, {
          responseType: "blob", // Important for binary data
        });

        // Create a URL for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        const filename = `purchase_history_user_${clientId}_${new Date().toISOString().split("T")[0]}.xlsx`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to export purchase history. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  }, [clientId, handleExportTrigger]);

  return (
    <div className="purchase-history-container">
      {/* Header */}
      <div className="purchase-history-header">
        <button
          className="back-button"
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "#FF5757",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => e.target.style.color = "#ff4545"}
          onMouseLeave={(e) => e.target.style.color = "#FF5757"}
        >
          <FaChevronLeft size={16} />
        </button>
        <h2 className="purchase-history-title" style={{ margin: 0, marginLeft: "1rem" }}>
          <span style={{ color: "#FF5757" }}>Purchase</span> History
        </h2>
        <button
          onClick={exportToExcel}
          disabled={
            exporting || (
              dailyPassData.length === 0 &&
              sessionData.length === 0 &&
              subscriptionData.length === 0 &&
              gymMembershipData.length === 0 &&
              aiCreditsData.length === 0 &&
              aiDietCoachData.length === 0
            )
          }
          style={{
            background: "#FF5757",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: exporting ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            opacity:
              exporting || (
                dailyPassData.length === 0 &&
                sessionData.length === 0 &&
                subscriptionData.length === 0 &&
                gymMembershipData.length === 0 &&
                aiCreditsData.length === 0 &&
                aiDietCoachData.length === 0
              )
                ? 0.5
                : 1,
          }}
          onMouseEnter={(e) => {
            if (
              !exporting && !(
                dailyPassData.length === 0 &&
                sessionData.length === 0 &&
                subscriptionData.length === 0 &&
                gymMembershipData.length === 0 &&
                aiCreditsData.length === 0 &&
                aiDietCoachData.length === 0
              )
            ) {
              e.target.style.backgroundColor = "#e64c4c";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#FF5757";
          }}
        >
          <FaDownload />
          {exporting ? "Exporting..." : "Export Excel"}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "dailypass" ? "active" : ""}`}
          onClick={() => setActiveTab("dailypass")}
        >
          Daily Pass
        </button>
        <button
          className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          Fitness Classes
        </button>
        <button
          className={`tab-button ${activeTab === "subscription" ? "active" : ""}`}
          onClick={() => setActiveTab("subscription")}
        >
          Nutrition Plan
        </button>
        <button
          className={`tab-button ${activeTab === "gym-membership" ? "active" : ""}`}
          onClick={() => setActiveTab("gym-membership")}
        >
          Gym Membership
        </button>
        <button
          className={`tab-button ${activeTab === "ai-credits" ? "active" : ""}`}
          onClick={() => setActiveTab("ai-credits")}
        >
          AI Credits
        </button>
        <button
          className={`tab-button ${activeTab === "ai-diet-coach" ? "active" : ""}`}
          onClick={() => setActiveTab("ai-diet-coach")}
        >
          AI Diet Coach
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "dailypass" && (
          <div className="dailypass-tab">
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : dailyPassData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📋</div>
                <p>No daily pass purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Gym Name</th>
                      <th>Valid From</th>
                      <th>Valid Until</th>
                      <th>Total Days</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyPassData.map((pass) => {
                      return (
                        <tr key={pass.id}>
                          <td>{formatDateTime(pass.created_at)}</td>
                          <td>{pass.gym_name || "-"}</td>
                          <td>{formatDate(pass.valid_from)}</td>
                          <td>{formatDate(pass.valid_until)}</td>
                          <td>{pass.days_total || "-"}</td>
                          <td>
                            {pass.amount_paid
                              ? `₹${(pass.amount_paid / 100).toFixed(2)}`
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="sessions-tab">
            {sessionsLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : sessionData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🏋️</div>
                <p>No fitness class bookings found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Booking Date</th>
                      <th>Session Name</th>
                      <th>Gym Name</th>
                      <th>Time</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionData.map((session) => {
                      const statusStyle = getStatusColor(session.status);
                      const timeRange =
                        session.start_time && session.end_time
                          ? `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`
                          : session.start_time
                          ? formatTime(session.start_time)
                          : "-";
                      return (
                        <tr key={session.id}>
                          <td>{formatDateTime(session.created_at)}</td>
                          <td>{formatDate(session.booking_date)}</td>
                          <td>
                            <span
                              style={{
                                textTransform: "capitalize",
                                fontWeight: "500",
                              }}
                            >
                              {session.session_name
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </span>
                          </td>
                          <td>{session.gym_name || "-"}</td>
                          <td>{timeRange}</td>
                          <td>
                            {session.price_paid
                              ? `₹${session.price_paid}`
                              : "-"}
                          </td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                color: statusStyle.color,
                                backgroundColor: statusStyle.bg,
                                borderColor: statusStyle.border,
                              }}
                            >
                              {session.status || "-"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="subscription-tab">
            {subscriptionLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : subscriptionData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>💎</div>
                <p>No Nutrition Plan found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionData.map((sub) => (
                      <tr key={sub.id}>
                        <td>{formatDateTime(sub.captured_at || sub.created_at)}</td>
                        <td>
                          {sub.amount
                            ? `₹${(sub.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "gym-membership" && (
          <div className="gym-membership-tab">
            {gymMembershipLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : gymMembershipData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🏋️</div>
                <p>No Gym Membership purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Gym Name</th>
                      <th>Provider</th>
                      <th>Order Status</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gymMembershipData.map((membership) => (
                      <tr key={membership.id}>
                        <td>{formatDateTime(membership.captured_at || membership.created_at)}</td>
                        <td>{membership.gym_name || "-"}</td>
                        <td>
                          <span
                            style={{
                              textTransform: "capitalize",
                              fontWeight: "500",
                            }}
                          >
                            {membership.provider?.replace(/_/g, " ") || "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{
                              color: "#22c55e",
                              backgroundColor: "rgba(34, 197, 94, 0.1)",
                              borderColor: "#22c55e",
                            }}
                          >
                            {membership.order_status || membership.status || "-"}
                          </span>
                        </td>
                        <td>
                          {membership.amount
                            ? `₹${(membership.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "ai-credits" && (
          <div className="ai-credits-tab">
            {aiCreditsLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : aiCreditsData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🪄</div>
                <p>No AI Credit purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiCreditsData.map((ai) => (
                      <tr key={ai.id}>
                        <td>{formatDateTime(ai.captured_at || ai.created_at)}</td>
                        <td>
                          {ai.amount
                            ? `₹${(ai.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "ai-diet-coach" && (
          <div className="ai-diet-coach-tab">
            {aiDietCoachLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "200px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #3a3a3a",
                    borderTop: "3px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : aiDietCoachData.length === 0 ? (
              <div className="no-data-message">
                <div style={{ fontSize: "48px", marginBottom: "1rem" }}>🍎</div>
                <p>No AI Diet Coach purchases found</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Purchase Date</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiDietCoachData.map((ai) => (
                      <tr key={ai.id}>
                        <td>{formatDateTime(ai.captured_at || ai.created_at)}</td>
                        <td>
                          {ai.amount
                            ? `₹${(ai.amount / 100).toFixed(2)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <SecureExportModal {...secureExportProps} />
    </div>
  );
}
