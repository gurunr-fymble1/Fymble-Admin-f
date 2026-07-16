"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaChevronDown, FaChevronUp, FaEdit } from "react-icons/fa";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function CompletedList() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: "session" or "client"
  const [viewMode, setViewMode] = useState("session");
  const [mounted, setMounted] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interestedInProduct, setInterestedInProduct] = useState("");

  // Fetch sessions from API
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        page_size: pageSize,
      };

      if (search) params.search = search;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (interestedInProduct !== "") {
        params.interested_in_product = interestedInProduct === "true";
      }
      if (viewMode === "client") {
        params.client_wise = true;
      }

      const response = await axios.get("/api/admin/nutritionist_completed_list/sessions", {
        params,
      });

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setSessions(data.sessions || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 0);
      } else {
        setSessions([]);
        setTotalCount(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
      setSessions([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, startDate, endDate, interestedInProduct, viewMode]);

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem("completed_list_view_mode");
    if (savedViewMode && (savedViewMode === "session" || savedViewMode === "client")) {
      setViewMode(savedViewMode);
    }
    setMounted(true);
  }, []);

  // Fetch sessions on initial load and when filters/page change
  useEffect(() => {
    if (mounted) {
      fetchSessions();
    }
  }, [fetchSessions, mounted]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("completed_list_view_mode", mode);
    setSessions([]);
    setPage(1);
  };

  // Handle edit button click - navigate to template assignment page
  const handleEditTemplate = (sessionId, bookingId, clientName) => {
    router.push(
      `/portal/nutritionist/completed-list/assign-template?session_id=${sessionId}&booking_id=${bookingId}&client_name=${encodeURIComponent(clientName)}`
    );
  };

  const handleDateFilter = () => {
    setPage(1);
    // useEffect will trigger fetchSessions
  };

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setInterestedInProduct("");
    setPage(1);
    // useEffect will trigger fetchSessions
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (slotTime) => {
    return slotTime || "-";
  };

  return (
    <div className="users-container">
      <div className="users-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <h2 className="users-title">
          <span style={{ color: "#10b981" }}>Completed</span> List
        </h2>
        {/* Toggle view mode */}
        <div style={{ display: "flex", background: "#f3f4f6", padding: "4px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <button
            onClick={() => handleViewModeChange("session")}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: viewMode === "session" ? "#ffffff" : "transparent",
              color: viewMode === "session" ? "#10b981" : "#4b5563",
              boxShadow: viewMode === "session" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Session Wise
          </button>
          <button
            onClick={() => handleViewModeChange("client")}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              background: viewMode === "client" ? "#ffffff" : "transparent",
              color: viewMode === "client" ? "#10b981" : "#4b5563",
              boxShadow: viewMode === "client" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}
          >
            Client Wise
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            alignItems: "end",
          }}
        >
          {/* Search by client name */}
          <div>
            <label
              style={{
                display: "block",
                color: "#4b5563",
                fontSize: "13px",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}
            >
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or booking ID..."
              style={{
                width: "100%",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                color: "#111827",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Start Date */}
          <div>
            <label
              style={{
                display: "block",
                color: "#4b5563",
                fontSize: "13px",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}
            >
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: "100%",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                color: "#111827",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label
              style={{
                display: "block",
                color: "#4b5563",
                fontSize: "13px",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}
            >
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: "100%",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                color: "#111827",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            />
          </div>

          {/* Product Interest */}
          <div>
            <label
              style={{
                display: "block",
                color: "#4b5563",
                fontSize: "13px",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}
            >
              Product Interest
            </label>
            <select
              value={interestedInProduct}
              onChange={(e) => setInterestedInProduct(e.target.value)}
              style={{
                width: "100%",
                background: "#f9fafb",
                border: "1px solid #d1d5db",
                color: "#111827",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "14px",
              }}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Apply & Clear Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleDateFilter}
              style={{
                background: "#10b981",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              style={{
                background: "transparent",
                border: "1px solid #d1d5db",
                color: "#4b5563",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            Loading sessions...
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#f44" }}>
            {error}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  {viewMode === "client" ? (
                    <tr>
                      <th>Client Name</th>
                      <th>Contact</th>
                      <th>Last Session</th>
                      <th>Slot</th>
                      <th>Info</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>S.No</th>
                      {/* <th>Booking ID</th> */}
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Client Name</th>
                      <th>Contact</th>
                      <th>Plan</th>
                      <th>Duration</th>
                      {/* <th>Interested in Product</th> */}
                      <th>Diet Template</th>
                      <th>Info</th>
                      <th></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {sessions.length > 0 ? (
                    sessions.map((session, index) => {
                      if (viewMode === "client") {
                        return (
                          <tr key={`${session.client_id}-${index}`}>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: "#00C853",
                                  }}
                                />
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/portal/nutritionist/client/${session.client_id}`);
                                  }}
                                  style={{
                                    color: "#111827",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    textDecorationColor: "transparent",
                                    transition: "textDecorationColor 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.textDecorationColor = "#111827";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.textDecorationColor = "transparent";
                                  }}
                                >
                                  {session.client_name || "Client #" + session.client_id}
                                </span>
                              </div>
                            </td>
                            <td>{session.client_contact || "-"}</td>
                            <td>{formatDate(session.slot_date)}</td>
                            <td>{formatTime(session.slot_time)}</td>
                            <td>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/portal/nutritionist/consultation/${session.client_id}`);
                                }}
                                style={{
                                  background: "rgba(16, 185, 129, 0.1)",
                                  border: "1px solid #10b981",
                                  color: "#10b981",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                  e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                  e.currentTarget.style.color = "#10b981";
                                }}
                              >
                                Info
                              </button>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <React.Fragment key={session.id}>
                          <tr
                            onClick={() =>
                              setExpandedRow(expandedRow === index ? null : index)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <td>{(page - 1) * pageSize + index + 1}</td>
                            {/* <td>{session.booking_id || "-"}</td> */}
                            <td>{formatDate(session.slot_date)}</td>
                            <td>{formatTime(session.slot_time)}</td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: "#00C853",
                                  }}
                                />
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/portal/nutritionist/client/${session.client_id}`);
                                  }}
                                  style={{
                                    color: "#111827",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    textDecoration: "underline",
                                    textDecorationColor: "transparent",
                                    transition: "textDecorationColor 0.2s"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.textDecorationColor = "#111827";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.textDecorationColor = "transparent";
                                  }}
                                >
                                  {session.client_name || "Client #" + session.client_id}
                                </span>
                              </div>
                            </td>
                            <td>{session.client_contact || "-"}</td>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  background: session.plan && session.plan !== "-"
                                    ? "rgba(16,185,129,0.08)"
                                    : "#f3f4f6",
                                  border: session.plan && session.plan !== "-"
                                    ? "1px solid rgba(16,185,129,0.3)"
                                    : "1px solid #e5e7eb",
                                  color: session.plan && session.plan !== "-"
                                    ? "#065f46"
                                    : "#9ca3af",
                                  padding: "3px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  letterSpacing: "0.03em",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {session.plan || "-"}
                              </span>
                            </td>
                            <td>{session.meeting_duration} min</td>
                            {/* <td>
                              <span
                                style={{
                                  color: session.interested_in_nutrition_product
                                    ? "#059669"
                                    : "#6b7280",
                                  backgroundColor:
                                    session.interested_in_nutrition_product
                                      ? "#ecfdf5"
                                      : "#f3f4f6",
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {session.interested_in_nutrition_product ? "Yes" : "No"}
                              </span>
                            </td> */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "13px",
                                    color: session.assigned_diet_template_name ? "#111827" : "#9ca3af",
                                  }}
                                >
                                  {session.assigned_diet_template_name || "Not assigned"}
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginTop: "4px",
                                }}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTemplate(session.id, session.booking_id, session.client_name);
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "1px solid #d1d5db",
                                    color: "#4b5563",
                                    padding: "4px 8px",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#f9fafb";
                                    e.currentTarget.style.borderColor = "#10b981";
                                    e.currentTarget.style.color = "#10b981";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.borderColor = "#d1d5db";
                                    e.currentTarget.style.color = "#4b5563";
                                  }}
                                >
                                  <FaEdit size={12} />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/portal/nutritionist/consultation/${session.client_id}`);
                                }}
                                style={{
                                  background: "rgba(16, 185, 129, 0.1)",
                                  border: "1px solid #10b981",
                                  color: "#10b981",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                  e.currentTarget.style.color = "white";
                                }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                    e.currentTarget.style.color = "#10b981";
                                  }}
                                >
                                  Info
                                </button>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {expandedRow === index ? (
                                  <FaChevronUp />
                                ) : (
                                  <FaChevronDown />
                                )}
                              </td>
                            </tr>
                            {expandedRow === index && (session.feedback_advice || session.notes) && (
                              <tr>
                                <td colSpan="10">
                                  <div
                                    style={{
                                      background: "#f9fafb",
                                      padding: "1rem",
                                      borderRadius: "8px",
                                      border: "1px solid #e5e7eb",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "1rem"
                                    }}
                                  >
                                    {session.feedback_advice && (
                                      <div>
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "#6b7280",
                                            marginBottom: "8px",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Nutritionist Feedback
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            color: "#374151",
                                            lineHeight: "1.6",
                                            backgroundColor: "#ffffff",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            border: "1px solid #e5e7eb"
                                          }}
                                        >
                                          {session.feedback_advice}
                                        </div>
                                      </div>
                                    )}
                                    {session.notes && (
                                      <div>
                                        <div
                                          style={{
                                            fontSize: "11px",
                                            color: "#6b7280",
                                            marginBottom: "8px",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Followup Notes
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "13px",
                                            color: "#374151",
                                            lineHeight: "1.6",
                                            backgroundColor: "#ffffff",
                                            padding: "12px",
                                            borderRadius: "6px",
                                            border: "1px solid #e5e7eb"
                                          }}
                                        >
                                          {session.notes}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={viewMode === "client" ? 5 : 10} className="no-data">
                          {viewMode === "client" ? "No clients found" : "No completed sessions found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1.5rem",
                  padding: "0 1rem",
                }}
              >
                <div style={{ color: "#999", fontSize: "13px" }}>
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} {viewMode === "client" ? "clients" : "sessions"}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        background: page === 1 ? "#f3f4f6" : "#10b981",
                        border: "none",
                        color: page === 1 ? "#9ca3af" : "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: page === 1 ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "600"
                      }}
                    >
                      Previous
                    </button>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.25rem",
                      alignItems: "center",
                    }}
                  >
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            style={{
                              background:
                                page === pageNum ? "#10b981" : "#ffffff",
                              border: page === pageNum ? "none" : "1px solid #d1d5db",
                              color: page === pageNum ? "white" : "#4b5563",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "13px",
                              minWidth: "36px",
                              fontWeight: page === pageNum ? "600" : "400"
                            }}
                          >
                            {pageNum}
                          </button>
                      );
                    })}
                  </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      style={{
                        background:
                          page === totalPages ? "#f3f4f6" : "#10b981",
                        border: "none",
                        color: page === totalPages ? "#9ca3af" : "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor:
                          page === totalPages ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        fontWeight: "600"
                      }}
                    >
                      Next
                    </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
