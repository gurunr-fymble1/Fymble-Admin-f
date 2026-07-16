"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaBuilding,
  FaEye,
  FaBox,
  FaShoppingCart,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaCalendar,
  FaTicketAlt,
  FaDumbbell,
  FaComment,
  FaSpinner,
  FaCoins,
  FaAppleAlt,
} from "react-icons/fa";
import axiosInstance from "@/lib/axios";

export default function AdminClientTrackingDetail() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPagination, setEventsPagination] = useState({
    total: 0,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [expandedGyms, setExpandedGyms] = useState({});
  const [expandedAi, setExpandedAi] = useState(false);
  const [expandedNutrition, setExpandedNutrition] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    data: [],
    loading: false,
    page: 1,
    totalPages: 0,
  });

  const fetchClientDetail = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `telecaller/client-tracking/client-detail/${clientId}`,
        {
          params: { page, limit: 10 },
        },
      );

      if (response.data.status === 200) {
        setClientData(response.data.data);
        setEventsPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching client detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientDetail(1);
  }, [clientId]);

  const handleEventsPageChange = (newPage) => {
    if (newPage < 1 || newPage > eventsPagination.totalPages) return;
    setEventsPage(newPage);
    fetchClientDetail(newPage);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleGymExpansion = (gymId) => {
    setExpandedGyms((prev) => ({
      ...prev,
      [gymId]: !prev[gymId],
    }));
  };

  const openFeedbackModal = async () => {
    setFeedbackModal((prev) => ({
      ...prev,
      isOpen: true,
      loading: true,
      data: [],
    }));
    try {
      const response = await axiosInstance.get(
        `/telecaller/client-tracking/call-feedback/${clientId}`,
      );
      if (response.data.status === 200) {
        setFeedbackModal((prev) => ({
          ...prev,
          data: response.data.data,
          totalPages: response.data.pagination?.totalPages || 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setFeedbackModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const closeFeedbackModal = () => {
    setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "interested":
        return { backgroundColor: "#14532d4d", borderColor: "#166534", color: "#4ade80" };
      case "not_interested":
        return { backgroundColor: "#7f1d1d4d", borderColor: "#991b1b", color: "#f87171" };
      case "callback":
        return { backgroundColor: "#78350f4d", borderColor: "#92400e", color: "#fbbf24" };
      case "no_answer":
        return { backgroundColor: "#374151", borderColor: "#4b5563", color: "#9ca3af" };
      case "converted":
        return { backgroundColor: "#1e3a8a4d", borderColor: "#1e40af", color: "#60a5fa" };
      case "follow_up":
        return { backgroundColor: "#581c874d", borderColor: "#6b21a8", color: "#c084fc" };
      default:
        return { backgroundColor: "#374151", borderColor: "#4b5563", color: "#9ca3af" };
    }
  };

  const getStatusLabel = (status) => {
    return (
      status?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      status
    );
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType?.toLowerCase()) {
      case "view":
        return { backgroundColor: "#1e3a8a4d", borderColor: "#1e40af", color: "#60a5fa" };
      case "checkout_attempt":
        return { backgroundColor: "#78350f4d", borderColor: "#92400e", color: "#fbbf24" };
      case "purchase":
        return { backgroundColor: "#14532d4d", borderColor: "#166534", color: "#4ade80" };
      case "inquiry":
        return { backgroundColor: "#581c874d", borderColor: "#6b21a8", color: "#c084fc" };
      default:
        return { backgroundColor: "#374151", borderColor: "#4b5563", color: "#d1d5db" };
    }
  };

  const getEventTypeLabel = (eventType, productType) => {
    const typeToCheck = (productType || eventType || "").toLowerCase().trim();

    switch (typeToCheck) {
      case "gym_viewed":
        return "Viewed Gym Details";
      case "dailypass_viewed":
        return "Viewed Daily Pass";
      case "session_viewed":
        return "Viewed Sessions";
      case "membership_viewed":
        return "Viewed Membership Plans";
      case "view":
        return "Viewed";
      case "checkout_attempt":
        return "Checkout Attempt";
      case "purchase":
        return "Purchased";
      case "inquiry":
        return "Inquired";
      case "gymmeate_viewed":
      case "gymmate_viewed":
        return "Gymmate Viewed";
      default:
        return (productType || eventType || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FaSpinner
          style={{
            fontSize: "3rem",
            color: "#FF5757",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "#9ca3af" }}>Client not found</div>
      </div>
    );
  }

  const totalViews =
    clientData.gym_summaries?.reduce(
      (sum, gym) => sum + (gym.total_views || 0),
      0,
    ) || 0;
  const totalAttempts =
    clientData.gym_summaries?.reduce(
      (sum, gym) => sum + (gym.checkout_attempts || 0),
      0,
    ) || 0;
  const totalPurchases = clientData.recent_purchases?.length || 0;
  const uniqueGyms = clientData.gym_summaries?.length || 0;

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", backgroundColor: "#111827" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push(`/portal/admin/tracking`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              color: "white",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#1f2937";
            }}
          >
            <FaChevronLeft style={{ fontSize: "1rem" }} />
            Back to Tracking
          </button>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
            <span style={{ color: "#ef4444" }}>Client</span> Activity
          </h2>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={() => router.push(`/portal/admin/tracking/${clientId}/track-all`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              border: "none",
              color: "white",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#1d4ed8";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#2563eb";
            }}
          >
            <FaEye style={{ fontSize: "1rem" }} />
            Track All
          </button>
          <button
            onClick={openFeedbackModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#9333ea",
              border: "none",
              color: "white",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#7e22ce";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#9333ea";
            }}
          >
            <FaComment style={{ fontSize: "1rem" }} />
            Call History
          </button>
        </div>
      </div>

      {/* Client Profile Card */}
      <div
        style={{
          backgroundColor: "#1f2937",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          border: "1px solid #374151",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {clientData.dp ? (
            <img
              src={clientData.dp}
              alt={clientData.client_name}
              style={{
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #ef4444",
              }}
            />
          ) : (
            <div
              style={{
                width: "4rem",
                height: "4rem",
                backgroundColor: "#374151",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #4b5563",
              }}
            >
              <FaUser style={{ fontSize: "2rem", color: "#9ca3af" }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "white",
              }}
            >
              {clientData.client_name}
            </h3>
            <span
              style={{
                fontSize: "0.875rem",
                color: "#9ca3af",
              }}
            >
              {clientData.phone || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "0.5rem",
            padding: "1rem",
            border: "1px solid #374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Gyms Visited</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>{uniqueGyms}</p>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                backgroundColor: "#1e3a8a4d",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaBuilding style={{ fontSize: "1.5rem", color: "#3b82f6" }} />
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "0.5rem",
            padding: "1rem",
            border: "1px solid #374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Total Views</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>{totalViews}</p>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                backgroundColor: "#581c874d",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaEye style={{ fontSize: "1.5rem", color: "#a855f7" }} />
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "0.5rem",
            padding: "1rem",
            border: "1px solid #374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Checkout Attempts</p>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", color: "white" }}>{totalAttempts}</p>
            </div>
            <div
              style={{
                width: "3rem",
                height: "3rem",
                backgroundColor: "#78350f4d",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaShoppingCart style={{ fontSize: "1.5rem", color: "#f59e0b" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases Section */}
      <div
        style={{
          backgroundColor: "#1f2937",
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: "1px solid #374151",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            backgroundColor: "#374151",
            borderBottom: "1px solid #4b5563",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaShoppingCart style={{ fontSize: "1.25rem", color: "#4ade80" }} />
            Recent Purchases
          </h3>
        </div>
        <div>
          {clientData.recent_purchases &&
          clientData.recent_purchases.length > 0 ? (
            clientData.recent_purchases.map((purchase, idx) => {
              const getPurchaseIcon = (type) => {
                switch (type) {
                  case "dailypass":
                    return <FaTicketAlt style={{ fontSize: "1.25rem", color: "#a855f7" }} />;
                  case "session":
                    return <FaCalendar style={{ fontSize: "1.25rem", color: "#3b82f6" }} />;
                  case "membership":
                    return <FaDumbbell style={{ fontSize: "1.25rem", color: "#4ade80" }} />;
                  default:
                    return <FaBox style={{ fontSize: "1.25rem", color: "#9ca3af" }} />;
                }
              };

              const getPurchaseLabel = (type) => {
                switch (type) {
                  case "dailypass":
                    return "Daily Pass";
                  case "session":
                    return "Session Booking";
                  case "membership":
                    return "Gym Membership";
                  default:
                    return type;
                }
              };

              const getPurchaseColor = (type) => {
                switch (type) {
                  case "dailypass":
                    return { borderColor: "#6b21a880", backgroundColor: "#581c8733" };
                  case "session":
                    return { borderColor: "#1d4ed880", backgroundColor: "#1e3a8a33" };
                  case "membership":
                    return { borderColor: "#16653480", backgroundColor: "#14532d33" };
                  default:
                    return { borderColor: "#4b556380", backgroundColor: "#37415180" };
                }
              };

              const colors = getPurchaseColor(purchase.type);

              return (
                <div
                  key={idx}
                  style={{
                    padding: "1rem",
                    borderBottom: idx < clientData.recent_purchases.length - 1 ? "1px solid #374151" : "none",
                    borderLeft: "4px solid",
                    transition: "background-color 0.2s",
                    ...colors,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#37415180";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div
                        style={{
                          width: "3rem",
                          height: "3rem",
                          backgroundColor: "#374151",
                          borderRadius: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {getPurchaseIcon(purchase.type)}
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "white" }}>
                          {getPurchaseLabel(purchase.type)}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          {purchase.gym_name}{purchase.gym_area ? ` - ${purchase.gym_area}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1.125rem", fontWeight: "600", color: "#4ade80" }}>
                        ₹{purchase.amount?.toFixed(2) || "0.00"}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#9ca3af", justifyContent: "flex-end" }}>
                        <span
                          style={{
                            padding: "0.125rem 0.5rem",
                            borderRadius: "0.25rem",
                            backgroundColor:
                              purchase.status === "active" || purchase.status === "paid"
                                ? "#14532d4d"
                                : purchase.status === "expired" || purchase.status === "canceled"
                                  ? "#7f1d1d4d"
                                  : "#374151",
                            color:
                              purchase.status === "active" || purchase.status === "paid"
                                ? "#4ade80"
                                : purchase.status === "expired" || purchase.status === "canceled"
                                  ? "#f87171"
                                  : "#9ca3af",
                          }}
                        >
                          {purchase.status}
                        </span>
                        <span>{formatDate(purchase.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", fontSize: "0.75rem", color: "#9ca3af" }}>
                    {purchase.days && <span>Duration: {purchase.days} days</span>}
                    {purchase.sessions_count && <span>Sessions: {purchase.sessions_count}</span>}
                    {purchase.expires_at && <span>Expires: {formatDate(purchase.expires_at)}</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              <FaShoppingCart
                style={{
                  fontSize: "3rem",
                  color: "#4b5563",
                  marginBottom: "0.75rem",
                }}
              />
              <p>No recent purchases found</p>
            </div>
          )}
        </div>
      </div>

      {/* AI & Nutritionist Summaries */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* AI Credits Activity Summary */}
        {clientData && clientData.ai_credits_summary && (
          <div
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "0.5rem",
              overflow: "hidden",
              border: "1px solid #374151",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                backgroundColor: "#374151",
                borderBottom: "1px solid #4b5563",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaCoins style={{ fontSize: "1.25rem", color: "#c084fc" }} />
                AI Credits Activity Summary
              </h3>
            </div>
            <div>
              <div
                style={{
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    margin: "-0.5rem",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => setExpandedAi(!expandedAi)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#37415180";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    <FaCoins style={{ fontSize: "1.25rem", color: "#9ca3af" }} />
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "white" }}>
                        Food Scanner & AI Diet Coach
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        Last active: {clientData.ai_credits_summary.last_viewed_at ? formatDateTime(clientData.ai_credits_summary.last_viewed_at) : "Never"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                        <span style={{ fontWeight: 600 }}>{clientData.ai_credits_summary.total_views || 0}</span> views
                      </p>
                    </div>
                    {expandedAi ? (
                      <FaChevronUp style={{ fontSize: "1rem", color: "#9ca3af" }} />
                    ) : (
                      <FaChevronDown style={{ fontSize: "1rem", color: "#9ca3af" }} />
                    )}
                  </div>
                </div>

                {expandedAi && (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingLeft: "2rem",
                      borderLeft: "2px solid #4b5563",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                      <div
                        style={{
                          backgroundColor: "#111827",
                          borderRadius: "0.5rem",
                          padding: "0.75rem",
                        }}
                      >
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Checkout Attempts</p>
                        <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                          {clientData.ai_credits_summary.checkout_attempts || 0}
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#111827",
                          borderRadius: "0.5rem",
                          padding: "0.75rem",
                        }}
                      >
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Purchases</p>
                        <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                          {clientData.ai_credits_summary.purchases || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nutritionist Bookings Activity Summary */}
        {clientData && clientData.nutrition_summary && (
          <div
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "0.5rem",
              overflow: "hidden",
              border: "1px solid #374151",
            }}
          >
            <div
              style={{
                padding: "1rem 1.5rem",
                backgroundColor: "#374151",
                borderBottom: "1px solid #4b5563",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaAppleAlt style={{ fontSize: "1.25rem", color: "#22c55e" }} />
                Nutritionist Bookings Activity Summary
              </h3>
            </div>
            <div>
              <div
                style={{
                  padding: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                    margin: "-0.5rem",
                    transition: "background-color 0.2s",
                  }}
                  onClick={() => setExpandedNutrition(!expandedNutrition)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#37415180";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    <FaAppleAlt style={{ fontSize: "1.25rem", color: "#9ca3af" }} />
                    <div>
                      <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "white" }}>
                        Nutritionist Plans & Consultations
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                        Last active: {clientData.nutrition_summary.last_viewed_at ? formatDateTime(clientData.nutrition_summary.last_viewed_at) : "Never"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                        <span style={{ fontWeight: 600 }}>{clientData.nutrition_summary.total_views || 0}</span> views
                      </p>
                    </div>
                    {expandedNutrition ? (
                      <FaChevronUp style={{ fontSize: "1rem", color: "#9ca3af" }} />
                    ) : (
                      <FaChevronDown style={{ fontSize: "1rem", color: "#9ca3af" }} />
                    )}
                  </div>
                </div>

                {expandedNutrition && (
                  <div
                    style={{
                      marginTop: "1rem",
                      paddingLeft: "2rem",
                      borderLeft: "2px solid #4b5563",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                      <div
                        style={{
                          backgroundColor: "#111827",
                          borderRadius: "0.5rem",
                          padding: "0.75rem",
                        }}
                      >
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Checkout Attempts</p>
                        <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                          {clientData.nutrition_summary.checkout_attempts || 0}
                        </p>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#111827",
                          borderRadius: "0.5rem",
                          padding: "0.75rem",
                        }}
                      >
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Purchases</p>
                        <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                          {clientData.nutrition_summary.purchases || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gym Activity & Event Timeline Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Gym Summaries */}
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "0.5rem",
            overflow: "hidden",
            border: "1px solid #374151",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              backgroundColor: "#374151",
              borderBottom: "1px solid #4b5563",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FaBuilding style={{ fontSize: "1.25rem", color: "#3b82f6" }} />
              Gym Activity Summary
            </h3>
          </div>
          <div>
            {clientData.gym_summaries && clientData.gym_summaries.length > 0 ? (
              clientData.gym_summaries.map((gym) => (
                <div
                  key={gym.gym_id}
                  style={{
                    padding: "1rem",
                    borderBottom: gym.gym_id !== clientData.gym_summaries[clientData.gym_summaries.length - 1].gym_id ? "1px solid #374151" : "none",
                  }}
                >
                  {/* Gym Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                      margin: "-0.5rem",
                      transition: "background-color 0.2s",
                    }}
                    onClick={() => toggleGymExpansion(gym.gym_id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#37415180";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                      <FaBuilding style={{ fontSize: "1.25rem", color: "#9ca3af" }} />
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "white" }}>
                          {gym.gym_name || `Gym ${gym.gym_id}`}{gym.gym_area ? ` - ${gym.gym_area}` : ""}
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                          Last visited: {formatDateTime(gym.last_viewed_at)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "0.875rem", color: "#d1d5db" }}>
                          <span style={{ fontWeight: 600 }}>{gym.total_views || 0}</span> views
                        </p>
                      </div>
                      {expandedGyms[gym.gym_id] ? (
                        <FaChevronUp style={{ fontSize: "1rem", color: "#9ca3af" }} />
                      ) : (
                        <FaChevronDown style={{ fontSize: "1rem", color: "#9ca3af" }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedGyms[gym.gym_id] && (
                    <div
                      style={{
                        marginTop: "1rem",
                        paddingLeft: "2rem",
                        borderLeft: "2px solid #4b5563",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      {/* Interested Products */}
                      {gym.interested_products && gym.interested_products.length > 0 && (
                        <div>
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                            Interested Products:
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {gym.interested_products.map((product, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "0.25rem 0.5rem",
                                  backgroundColor: "#581c874d",
                                  border: "1px solid #6b21a8",
                                  color: "#d8b4fe",
                                  fontSize: "0.75rem",
                                  borderRadius: "0.25rem",
                                }}
                              >
                                {product}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
                        <div
                          style={{
                            backgroundColor: "#111827",
                            borderRadius: "0.5rem",
                            padding: "0.75rem",
                          }}
                        >
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Checkout Attempts</p>
                          <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                            {gym.checkout_attempts || 0}
                          </p>
                        </div>
                        <div
                          style={{
                            backgroundColor: "#111827",
                            borderRadius: "0.5rem",
                            padding: "0.75rem",
                          }}
                        >
                          <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Purchases</p>
                          <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "white" }}>
                            {gym.purchases || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No gym activity found
              </div>
            )}
          </div>
        </div>

        {/* Event History */}
        <div
          style={{
            backgroundColor: "#1f2937",
            borderRadius: "0.5rem",
            overflow: "hidden",
            border: "1px solid #374151",
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              backgroundColor: "#374151",
              borderBottom: "1px solid #4b5563",
            }}
          >
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <FaClock style={{ fontSize: "1.25rem", color: "#f59e0b" }} />
              Activity Timeline
            </h3>
          </div>
          <div>
            {clientData.events && clientData.events.length > 0 ? (
              clientData.events.map((event) => {
                const colors = getEventTypeColor(event.event_type);
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: "1rem",
                      borderBottom:
                        event.id !== clientData.events[clientData.events.length - 1].id
                          ? "1px solid #374151"
                          : "none",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#37415180";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "1rem",
                      }}
                    >
                      {/* Event Details - Left */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <FaBuilding style={{ fontSize: "0.75rem", color: "#6b7280" }} />
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#d1d5db",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {event.gym_name || `Gym ${event.gym_id}`}{event.gym_area ? ` - ${event.gym_area}` : ""}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6b7280" }}>
                          <FaCalendar style={{ fontSize: "0.75rem" }} />
                          {formatDateTime(event.created_at)}
                        </div>
                      </div>

                      {/* Event Type Badge - Right */}
                      <div style={{ flexShrink: 0 }}>
                        <span
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            borderRadius: "0.25rem",
                            border: "1px solid",
                            ...colors,
                          }}
                        >
                          {getEventTypeLabel(event.event_type, event.product_type)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                No activity events found
              </div>
            )}
          </div>

          {/* Events Pagination */}
          {eventsPagination.totalPages > 1 && (
            <div
              style={{
                padding: "1rem 1.5rem",
                backgroundColor: "#37415180",
                borderTop: "1px solid #4b5563",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                  Showing {(eventsPage - 1) * eventsPagination.limit + 1} to{" "}
                  {Math.min(eventsPage * eventsPagination.limit, eventsPagination.total)}{" "}
                  of {eventsPagination.total} events
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleEventsPageChange(eventsPage - 1)}
                    disabled={!eventsPagination.hasPrev}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#9ca3af",
                      cursor: eventsPagination.hasPrev ? "pointer" : "not-allowed",
                      opacity: eventsPagination.hasPrev ? 1 : 0.5,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (eventsPagination.hasPrev) {
                        e.target.style.color = "white";
                        e.target.style.backgroundColor = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "#9ca3af";
                      e.target.style.backgroundColor = "#1f2937";
                    }}
                  >
                    <FaChevronLeft style={{ fontSize: "1rem" }} />
                  </button>
                  <span style={{ fontSize: "0.875rem", color: "#9ca3af", padding: "0 0.5rem" }}>
                    {eventsPage} / {eventsPagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleEventsPageChange(eventsPage + 1)}
                    disabled={!eventsPagination.hasNext}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "0.5rem",
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#9ca3af",
                      cursor: eventsPagination.hasNext ? "pointer" : "not-allowed",
                      opacity: eventsPagination.hasNext ? 1 : 0.5,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (eventsPagination.hasNext) {
                        e.target.style.color = "white";
                        e.target.style.backgroundColor = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = "#9ca3af";
                      e.target.style.backgroundColor = "#1f2937";
                    }}
                  >
                    <FaChevronRight style={{ fontSize: "1rem" }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call Feedback History Modal */}
      {feedbackModal.isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              width: "100%",
              maxWidth: "42rem",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.5rem",
                borderBottom: "1px solid #374151",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FaComment style={{ fontSize: "1.25rem", color: "#4ade80" }} />
                Call Feedback History
              </h3>
              <button
                onClick={closeFeedbackModal}
                style={{
                  padding: "0.25rem",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#374151";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.5rem",
              }}
            >
              {feedbackModal.loading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem 0",
                  }}
                >
                  <FaSpinner
                    style={{
                      fontSize: "2rem",
                      color: "#FF5757",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                </div>
              ) : feedbackModal.data.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem 0",
                    color: "#9ca3af",
                  }}
                >
                  <FaComment
                    style={{
                      fontSize: "3rem",
                      color: "#4b5563",
                      marginBottom: "0.75rem",
                    }}
                  />
                  <p>No call feedback found</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {feedbackModal.data.map((feedback) => {
                    const colors = getStatusColor(feedback.status);
                    return (
                      <div
                        key={feedback.id}
                        style={{
                          backgroundColor: "#374151",
                          borderRadius: "0.5rem",
                          padding: "1rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            marginBottom: "0.75rem",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: "white",
                              }}
                            >
                              {feedback.executive_name || "Executive"}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                              {formatDateTime(feedback.created_at)}
                            </p>
                          </div>
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.75rem",
                              fontWeight: "500",
                              borderRadius: "0.25rem",
                              border: "1px solid",
                              ...colors,
                            }}
                          >
                            {getStatusLabel(feedback.status)}
                          </span>
                        </div>
                        {feedback.feedback && (
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#d1d5db",
                              backgroundColor: "#1f2937",
                              borderRadius: "0.375rem",
                              padding: "0.75rem",
                            }}
                          >
                            {feedback.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid #374151",
              }}
            >
              <button
                onClick={closeFeedbackModal}
                style={{
                  width: "100%",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#374151",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#4b5563";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#374151";
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scroll-container::-webkit-scrollbar {
          height: 8px;
        }
        .scroll-container::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: #ef4444;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
