"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function TicketDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const ticketId = params.ticketId;
  const source = searchParams.get("source") || "Fittbot Business";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const isMounted = useRef(true);

  // Track fetched IDs to avoid duplicate calls
  const fetchedIdRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Only fetch if ticketId or source has changed
    const currentKey = `${ticketId}-${source}`;
    if (fetchedIdRef.current === currentKey) {
      return;
    }
    fetchedIdRef.current = currentKey;

    const fetchData = async () => {
      if (!isMounted.current) return;

      try {
        setLoading(true);
        setError(null);

        const endpoint =
          source === "Fittbot Business"
            ? "/api/admin/dashboard/gym-ticket-detail"
            : "/api/admin/dashboard/client-ticket-detail";
        const response = await axiosInstance.get(
          `${endpoint}?ticket_id=${ticketId}`,
        );

        if (response.data.success && isMounted.current) {
          setTicket(response.data.data);
        } else if (isMounted.current) {
          throw new Error(
            response.data.message || "Failed to fetch ticket details",
          );
        }
      } catch (err) {
        if (!isMounted.current) return;
        const errorMsg =
          err.response?.data?.detail ||
          err.message ||
          "Failed to fetch ticket details";
        setError(errorMsg);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [ticketId, source]);

  const handleMarkResolved = async () => {
    try {
      const endpoint =
        source === "Fittbot Business"
          ? "/api/admin/dashboard/gym-ticket-resolve"
          : "/api/admin/dashboard/client-ticket-resolve";
      await axiosInstance.post(endpoint, { ticket_id: ticketId });

      // Manually refresh after marking resolved
      if (isMounted.current) {
        setLoading(true);
        const endpointDetail =
          source === "Fittbot Business"
            ? "/api/admin/dashboard/gym-ticket-detail"
            : "/api/admin/dashboard/client-ticket-detail";
        const response = await axiosInstance.get(
          `${endpointDetail}?ticket_id=${ticketId}`,
        );

        if (response.data.success && isMounted.current) {
          setTicket(response.data.data);
        }
        setLoading(false);
      }
      setShowConfirmDialog(null);
    } catch (err) {
      alert("Failed to mark ticket as resolved");
    }
  };

  const handleMarkFollowUp = async () => {
    try {
      const sourceValue = source === "Fittbot Business" ? "owner" : "client";
      await axiosInstance.post("/api/admin/dashboard/ticket_followup", {
        ticket_id: ticketId,
        source: sourceValue,
        status: "follow_up",
      });

      // Manually refresh after marking follow up
      if (isMounted.current) {
        setLoading(true);
        const endpointDetail =
          source === "Fittbot Business"
            ? "/api/admin/dashboard/gym-ticket-detail"
            : "/api/admin/dashboard/client-ticket-detail";
        const response = await axiosInstance.get(
          `${endpointDetail}?ticket_id=${ticketId}`,
        );

        if (response.data.success && isMounted.current) {
          setTicket(response.data.data);
        }
        setLoading(false);
      }
      setShowConfirmDialog(null);
    } catch (err) {
      alert("Failed to mark ticket as follow up");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const sourceValue = source === "Fittbot Business" ? "owner" : "client";
      await axiosInstance.post("/api/admin/dashboard/ticket_followup", {
        ticket_id: ticketId,
        source: sourceValue,
        comment: newComment,
        status: null,
      });

      // Refresh ticket data
      if (isMounted.current) {
        setLoading(true);
        const endpointDetail =
          source === "Fittbot Business"
            ? "/api/admin/dashboard/gym-ticket-detail"
            : "/api/admin/dashboard/client-ticket-detail";
        const response = await axiosInstance.get(
          `${endpointDetail}?ticket_id=${ticketId}`,
        );

        if (response.data.success && isMounted.current) {
          setTicket(response.data.data);
        }
        setLoading(false);
        setNewComment("");
        setShowCommentInput(false);
      }
    } catch (err) {
      alert("Failed to add comment");
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Resolved":
      case "resolved":
        return { backgroundColor: "#10b981", color: "white" };
      case "Follow Up":
      case "follow_up":
        return { backgroundColor: "#f59e0b", color: "white" };
      case "Working":
      case "working":
        return { backgroundColor: "#3b82f6", color: "white" };
      case "Pending":
      case "pending":
      default:
        return { backgroundColor: "#ef4444", color: "white" };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "Resolved":
      case "resolved":
        return "Resolved";
      case "Follow Up":
      case "follow_up":
        return "Follow Up";
      case "Working":
      case "working":
        return "Working";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="section-container">
          <div className="text-center py-5">
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #3a3a3a",
                borderTop: "4px solid #FF5757",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ fontSize: "14px", color: "#ccc" }}>
              Loading ticket details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="dashboard-container">
        <div className="section-container">
          <button
            className="btn btn-outline-secondary btn-sm mb-4"
            onClick={() => router.back()}
            style={{
              borderColor: "#444",
              color: "#ccc",
              backgroundColor: "transparent",
            }}
          >
            ← Back
          </button>
          <div className="text-center py-5">
            <p style={{ fontSize: "16px", color: "#ef4444" }}>
              {error || "Ticket not found"}
            </p>
          </div>
        </div>
      </div>
    );
  }
  const normalizedStatus = ticket.status?.toLowerCase().trim();
  const isPending = normalizedStatus === "pending";
  const isResolved = normalizedStatus === "resolved";

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <button
              className="btn btn-outline-secondary btn-sm mb-3"
              onClick={() => router.back()}
              style={{
                borderColor: "#444",
                color: "#ccc",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#222";
                e.target.style.borderColor = "#FF5757";
                e.target.style.color = "#FF5757";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.borderColor = "#444";
                e.target.style.color = "#ccc";
              }}
            >
              ← Back to Tickets
            </button>
            <h3 className="section-heading mb-2">
              <span style={{ color: "#FF5757" }}>
                {source === "Fittbot Business" ? "Gym" : "Client"}
              </span>{" "}
              Support Ticket
            </h3>
            <p style={{ color: "#888", fontSize: "14px" }}>
              Ticket ID:{" "}
              <code style={{ color: "#FF5757" }}>{ticket.ticket_id}</code>
            </p>
          </div>

          <div>
            <span
              style={{
                padding: "8px 16px",
                borderRadius: "16px",
                fontSize: "14px",
                ...getStatusBadgeStyle(ticket.status),
              }}
            >
              {getStatusLabel(ticket.status)}
            </span>
          </div>
        </div>

        {/* Ticket Details Card */}
        <div
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div className="row">
            <div className="col-md-4">
              <div className="mb-4">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Name
                </label>
                <div style={{ fontSize: "16px", color: "#fff" }}>
                  {ticket.name || "N/A"}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-4">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <div style={{ fontSize: "16px", color: "#fff" }}>
                  {ticket.email || "N/A"}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-4">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Contact Number
                </label>
                <div style={{ fontSize: "16px", color: "#fff" }}>
                  {ticket.contact || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="mb-4">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Subject
                </label>
                <div style={{ fontSize: "16px", color: "#fff" }}>
                  {ticket.subject || "No subject"}
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-4">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Created At
                </label>
                <div style={{ fontSize: "16px", color: "#fff" }}>
                  {formatDate(ticket.created_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#888",
                marginBottom: "6px",
              }}
            >
              Issue Description
            </label>
            <div
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "16px",
                fontSize: "15px",
                lineHeight: "1.6",
                color: "#fff",
                minHeight: "100px",
                whiteSpace: "pre-wrap",
              }}
            >
              {ticket.issue || "No issue description provided"}
            </div>
          </div>

          {ticket.comments && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "#888",
                    marginBottom: "6px",
                  }}
                >
                  Comments
                </label>
                {!showCommentInput && (
                  <button
                    className="btn btn-sm"
                    onClick={() => setShowCommentInput(true)}
                    style={{
                      backgroundColor: "#3b82f6",
                      border: "none",
                      color: "#fff",
                      padding: "6px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Add Comment
                  </button>
                )}
              </div>
              {showCommentInput && (
                <div className="mb-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Enter your comment..."
                    style={{
                      width: "100%",
                      backgroundColor: "#222",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#fff",
                      minHeight: "80px",
                      resize: "vertical",
                    }}
                  />
                  <div className="d-flex gap-2 mt-2">
                    <button
                      className="btn btn-sm"
                      onClick={handleAddComment}
                      style={{
                        backgroundColor: "#10b981",
                        border: "none",
                        color: "#fff",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      Submit
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setShowCommentInput(false);
                        setNewComment("");
                      }}
                      style={{
                        backgroundColor: "#333",
                        border: "1px solid #444",
                        color: "#ccc",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#ccc",
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticket.comments}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="d-flex gap-3 mt-4">
            {!isResolved && (
              <>
                {isPending && (
                  <button
                    className="btn"
                    onClick={() => setShowConfirmDialog("followup")}
                    style={{
                      backgroundColor: "#f59e0b",
                      border: "none",
                      color: "#fff",
                      padding: "10px 24px",
                      borderRadius: "8px",
                    }}
                  >
                    Mark as Follow Up
                  </button>
                )}
                <button
                  className="btn"
                  onClick={() => setShowConfirmDialog("resolved")}
                  style={{
                    backgroundColor: "#10b981",
                    border: "none",
                    color: "#fff",
                    padding: "10px 24px",
                    borderRadius: "8px",
                  }}
                >
                  Mark as Resolved
                </button>
              </>
            )}
            <button
              className="btn"
              onClick={() => router.back()}
              style={{
                backgroundColor: "#333",
                border: "1px solid #444",
                color: "#fff",
                padding: "10px 24px",
                borderRadius: "8px",
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowConfirmDialog(null)}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              {showConfirmDialog === "resolved" ? (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              ) : (
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245, 158, 11, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              )}
              <h4
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {showConfirmDialog === "resolved"
                  ? "Mark as Resolved"
                  : "Mark as Follow Up"}
              </h4>
            </div>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#aaa",
                lineHeight: "1.5",
              }}
            >
              {showConfirmDialog === "resolved"
                ? "Are you sure you want to mark this ticket as resolved? This action can be reverted."
                : "Are you sure you want to mark this ticket for follow up? This will help you track pending issues."}
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn"
                onClick={() => setShowConfirmDialog(null)}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #444",
                  color: "#ccc",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#222";
                  e.target.style.borderColor = "#555";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "#444";
                }}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={
                  showConfirmDialog === "resolved"
                    ? handleMarkResolved
                    : handleMarkFollowUp
                }
                style={{
                  backgroundColor:
                    showConfirmDialog === "resolved" ? "#10b981" : "#f59e0b",
                  border: "none",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
