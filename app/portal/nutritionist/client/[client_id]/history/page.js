"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaCalendarAlt, FaClock, FaCommentMedical, FaHeartbeat, FaInfoCircle, FaListAlt, FaRegCalendarCheck, FaSpinner, FaUserMd } from "react-icons/fa";
import axios from "@/lib/axios";

export default function ClientHistory() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [sessions, setSessions] = useState([]);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch client details first to get client name
        const clientRes = await axios.get(`/api/admin/nutritionist_sessions/client/${clientId}`);
        if (clientRes.data?.success && clientRes.data?.data) {
          setClientName(clientRes.data.data.name);
        }

        // Fetch completed sessions history
        const response = await axios.get(`/api/admin/nutritionist_completed_list/client/${clientId}`);
        if (response.data?.success && response.data?.data) {
          setSessions(response.data.data.sessions || []);
        }
      } catch (err) {
        console.error("Error fetching client history:", err);
        setError(err.response?.data?.detail || "Failed to load consultation history.");
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchHistory();
    }
  }, [clientId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="users-container">
      {/* Client Name Banner */}
      {clientId && (
        <div
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: "12px",
            padding: "20px 24px",
            color: "white",
            marginBottom: "32px",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Simple Back Arrow Icon Button */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push(`/portal/nutritionist/client/${clientId}`);
                }
              }}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                border: "none",
                color: "white",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                e.currentTarget.style.transform = "scale(1)";
              }}
              title="Back to Details"
            >
              <FaArrowLeft size={16} />
            </button>
            
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "600", opacity: 0.8, letterSpacing: "1px", marginBottom: "2px" }}>
                Client Name
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800" }}>
                {clientName || <span style={{ opacity: 0.6 }}>Loading...</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "20px" }}>
            <FaRegCalendarCheck />
            <span style={{ fontSize: "14px", fontWeight: "600" }}>{sessions.length} Completed Sessions</span>
          </div>
        </div>
      )}

      {/* Content Section */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "40vh", gap: "12px" }}>
          <FaSpinner className="fa-spin" style={{ color: "#10b981", fontSize: "32px" }} />
          <div style={{ color: "#6b7280", fontSize: "15px" }}>Loading consultation details...</div>
        </div>
      ) : error ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "30vh" }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "16px 24px", borderRadius: "8px", color: "#ef4444", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaInfoCircle />
            <span>{error}</span>
          </div>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ 
          background: "#ffffff", 
          border: "1px solid #e5e7eb", 
          borderRadius: "12px", 
          padding: "60px 20px", 
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <FaCommentMedical style={{ fontSize: "64px", color: "#d1d5db", marginBottom: "20px" }} />
          <h3 style={{ color: "#374151", fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>No Consultation History</h3>
          <p style={{ color: "#6b7280", fontSize: "14px", maxWidth: "400px", margin: "0 auto" }}>
            There are no recorded completed consultation sessions found for this client.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {sessions.map((session, index) => (
            <div 
              key={session.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                position: "relative",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#10b981";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.05), 0 4px 6px -2px rgba(16, 185, 129, 0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
              }}
            >
              {/* Badge Indicators */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                <span style={{ 
                  background: "#e0f2fe", 
                  color: "#0369a1",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FaClock size={11} />
                  Duration: {session.meeting_duration} min
                </span>

                <span style={{ 
                  background: session.interested_in_nutrition_product ? "#ecfdf5" : "#f3f4f6", 
                  color: session.interested_in_nutrition_product ? "#047857" : "#4b5563",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FaHeartbeat size={11} />
                  Product Interest: {session.interested_in_nutrition_product ? "Yes" : "No"}
                </span>

                <span style={{ 
                  background: session.assigned_diet_template_id ? "#f0fdf4" : "#f9fafb", 
                  color: session.assigned_diet_template_id ? "#15803d" : "#9ca3af",
                  border: session.assigned_diet_template_id ? "none" : "1px solid #e5e7eb",
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  <FaListAlt size={11} />
                  {session.assigned_diet_template_name ? `Template: ${session.assigned_diet_template_name}` : "No Diet Template"}
                </span>
              </div>

              {/* Slot and Consultant Details */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start",
                  borderBottom: "1px solid #f3f4f6",
                  paddingBottom: "16px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                  gap: "16px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <FaCalendarAlt style={{ color: "#10b981" }} />
                    <span style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>
                      {formatDate(session.slot_date)}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500", marginLeft: "22px" }}>
                    Time Slot: {session.slot_time || "-"}
                  </div>
                </div>

                {session.nutritionist_name && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f9fafb", padding: "8px 14px", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
                    <FaUserMd style={{ color: "#10b981", fontSize: "16px" }} />
                    <div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" }}>Nutritionist</div>
                      <div style={{ fontSize: "13px", color: "#374151", fontWeight: "700" }}>{session.nutritionist_name}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Advice and Notes Blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {session.feedback_advice && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", tracking: "0.5px" }}>
                      Feedback & Advice Given
                    </div>
                    <div style={{ 
                      background: "#f9fafb", 
                      border: "1px solid #f3f4f6", 
                      padding: "14px 16px", 
                      borderRadius: "8px", 
                      fontSize: "14px", 
                      lineHeight: "1.6", 
                      color: "#374151",
                      whiteSpace: "pre-wrap"
                    }}>
                      {session.feedback_advice}
                    </div>
                  </div>
                )}

                {session.notes && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", tracking: "0.5px" }}>
                      Follow-up / Internal Notes
                    </div>
                    <div style={{ 
                      background: "#fffbeb", 
                      border: "1px solid #fef3c7", 
                      padding: "14px 16px", 
                      borderRadius: "8px", 
                      fontSize: "14px", 
                      lineHeight: "1.6", 
                      color: "#b45309",
                      whiteSpace: "pre-wrap"
                    }}>
                      {session.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
