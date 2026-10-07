"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaChevronLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag } from "react-icons/fa";
import axiosInstance from "@/lib/axios";
import { formatGymName } from "@/lib/utils";

export default function SessionDetails() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // Spinner style creation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const fetchSessionDetails = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}/hosted-sessions?page=${page}&limit=${limit}`);
      if (response.data.success) {
        setSessions(response.data.data);
        setTotalSessions(response.data.total_sessions);
        setTotalPages(response.data.total_pages || 1);
        setHasNext(response.data.has_next || false);
        setHasPrev(response.data.has_prev || false);
      } else {
        throw new Error(response.data.message || "Failed to fetch session details");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load session details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId, page, limit]);

  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

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
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", border: "#22c55e" };
      case "completed":
        return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", border: "#3b82f6" };
      case "canceled":
        return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", border: "#ef4444" };
      default:
        return { color: "#888", bg: "rgba(136, 136, 136, 0.1)", border: "#888" };
    }
  };

  if (loading) {
    return (
      <div className="client-detail-container" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3a3a3a",
              borderTop: "4px solid #FF5757",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }} />
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading session details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-container" style={{ padding: "0.5rem 2rem 2rem 2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Row (Title & Metric Card) */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1.5rem"
      }}>
        {/* Left: Back Button & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              color: "#FF5757",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0.5rem 0",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ff4545"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#FF5757"}
          >
            <FaChevronLeft size={16} />
          </button>
          <h2 className="client-detail-title" style={{ margin: 0, fontSize: "1.8rem", fontWeight: "600" }}>
            <span style={{ color: "#FF5757" }}>Gym Mate</span> Session
          </h2>
        </div>

        {/* Right: Total Sessions Metric Card */}
        <div className="client-detail-card" style={{ marginBottom: 0, minWidth: "240px", flexShrink: 0 }}>
          <div className="client-detail-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", gap: "1.5rem" }}>
            <div>
              <h4 style={{ margin: 0, color: "#888", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" }}>Total Sessions</h4>
              <div style={{ fontSize: "1.8rem", fontWeight: "700", color: "#ffffff", marginTop: "0.25rem" }}>
                {totalSessions}
              </div>
            </div>
            <div style={{
              backgroundColor: "rgba(255, 87, 87, 0.1)",
              color: "#FF5757",
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem"
            }}>
              <FaUsers />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      <h3 style={{ color: "#ffffff", fontSize: "1.3rem", fontWeight: "600", marginBottom: "1.5rem" }}>Hosted Session History</h3>
      
      {sessions.length === 0 ? (
        <div className="client-detail-card">
          <div className="client-detail-card-body" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "#ccc" }}>
            <p style={{ margin: 0, fontSize: "1rem" }}>No hosted sessions found for this client.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
          {sessions.map((session) => {
            const statusStyle = getStatusColor(session.status);
            return (
              <div key={session.id} className="client-detail-card" style={{ marginBottom: 0 }}>
                {/* Card Header */}
                <div className="client-detail-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#888", fontWeight: "500" }}>Session ID: #{session.id}</span>
                  <span style={{
                    color: statusStyle.color,
                    backgroundColor: statusStyle.bg,
                    border: `1px solid ${statusStyle.border}`,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    textTransform: "uppercase"
                  }}>
                    {session.status}
                  </span>
                </div>

                {/* Card Body */}
                <div className="client-detail-card-body">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                    
                    {/* Column 1: Date, Time & Gym */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FaCalendarAlt style={{ color: "#FF5757", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "12px", color: "#888" }}>Date</div>
                          <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>{formatDate(session.session_date)}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FaClock style={{ color: "#FF5757", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "12px", color: "#888" }}>Time</div>
                          <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>{formatTime(session.session_time)}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FaMapMarkerAlt style={{ color: "#FF5757", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "12px", color: "#888" }}>Gym Name</div>
                          <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>{formatGymName(session.gym_name)} (ID: {session.gym_id})</div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Preferences & Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#888" }}>Mate Preference</div>
                        <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500", marginTop: "2px" }}>
                          {session.mate_preference ? (session.mate_preference.charAt(0).toUpperCase() + session.mate_preference.slice(1)) : "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#888" }}>Fitness Level</div>
                        <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500", marginTop: "2px" }}>
                          {session.fitness_level ? (session.fitness_level.charAt(0).toUpperCase() + session.fitness_level.slice(1)) : "-"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>Workout Vibes</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {Array.isArray(session.workout_vibes) && session.workout_vibes.length > 0 ? (
                            session.workout_vibes.map((vibe, idx) => (
                              <span key={idx} style={{
                                backgroundColor: "#1e2529",
                                color: "#ccc",
                                border: "1px solid #3a4553",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <FaTag size={8} style={{ color: "#FF5757" }} />
                                {vibe}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "13px", color: "#666" }}>None specified</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Payment & Members */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#888" }}>Payment Mode / Status</div>
                        <div style={{ fontSize: "13px", color: "#fff", fontWeight: "500", marginTop: "2px", display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ backgroundColor: "#1e2529", padding: "2px 6px", borderRadius: "4px", border: "1px solid #3a4553", fontSize: "11px", color: "#ccc" }}>
                            {session.payment_mode ? session.payment_mode.replace('_', ' ').toUpperCase() : "-"}
                          </span>
                          <span style={{ 
                            color: session.payment_status === "paid" ? "#22c55e" : "#f59e0b",
                            fontWeight: "600",
                            fontSize: "12px",
                            textTransform: "uppercase"
                          }}>
                            {session.payment_status}
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #3a4553", paddingTop: "0.75rem" }}>
                        <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaUsers style={{ color: "#FF5757" }} />
                          <span>Joined Members</span>
                        </div>
                        <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                          {session.members && session.members.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {session.members.map((member) => (
                                <span key={member.client_id} style={{ display: "block" }}>
                                  • {member.name || `Client #${member.client_id}`} 
                                  <span style={{ fontSize: "11px", color: "#888", marginLeft: "6px" }}>(ID: {member.client_id})</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "#888", fontStyle: "italic", fontSize: "13px" }}>No members joined yet</span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "2rem",
          padding: "1rem 1.5rem",
          backgroundColor: "#293338",
          border: "1px solid #3a4553",
          borderRadius: "12px",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ fontSize: "14px", color: "#888" }}>
            Showing page <span style={{ color: "#fff", fontWeight: "600" }}>{page}</span> of <span style={{ color: "#fff", fontWeight: "600" }}>{totalPages}</span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              disabled={!hasPrev}
              onClick={() => {
                setPage((p) => Math.max(p - 1, 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                backgroundColor: hasPrev ? "#1e2529" : "#14191c",
                color: hasPrev ? "#fff" : "#666",
                border: "1px solid #3a4553",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: hasPrev ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (hasPrev) e.currentTarget.style.borderColor = "#FF5757";
              }}
              onMouseLeave={(e) => {
                if (hasPrev) e.currentTarget.style.borderColor = "#3a4553";
              }}
            >
              Previous
            </button>
            <button
              disabled={!hasNext}
              onClick={() => {
                setPage((p) => Math.min(p + 1, totalPages));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              style={{
                backgroundColor: hasNext ? "#1e2529" : "#14191c",
                color: hasNext ? "#fff" : "#666",
                border: "1px solid #3a4553",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: hasNext ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (hasNext) e.currentTarget.style.borderColor = "#FF5757";
              }}
              onMouseLeave={(e) => {
                if (hasNext) e.currentTarget.style.borderColor = "#3a4553";
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
