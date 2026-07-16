"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { FaSpinner, FaChevronLeft, FaFileExport, FaDownload, FaTimes, FaChevronRight, FaTicketAlt } from "react-icons/fa";

export default function SupportTickets() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleExportTrigger, secureExportProps } = useSecureExport();
  const ticketType = searchParams.get("type") || "client"; // gym or client
  const statusFilter = searchParams.get("status") || "all"; // all, resolved, unresolved, follow_up

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAllTime, setIsAllTime] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [ticketType, statusFilter, pagination.page]);

  const handleExport = async (e) => {
    if (e) e.preventDefault();
    handleExportTrigger(async () => {
      setExporting(true);
      try {
        const source = ticketType === "gym" ? "Fittbot Business" : "Fittbot";
        const response = await axiosInstance.get(
          `/api/admin/dashboard/support-tickets-export`,
          {
            params: { 
              source, 
              start_date: isAllTime ? undefined : (startDate || undefined), 
              end_date: isAllTime ? undefined : (endDate || undefined) 
            },
            responseType: 'blob'
          }
        );

        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        const filenamePrefix = isAllTime ? "All_Time_" : "";
        link.setAttribute('download', `${filenamePrefix}Support_Tickets_${source.replace(/ /g, '_')}_${dateStr}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        setIsExportModalOpen(false);
        setStartDate("");
        setEndDate("");
        setIsAllTime(false);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export tickets. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        sort_order: "desc",
      });

      // Filter by source - Gym = "Fittbot Business", Client = "Fittbot"
      params.append("source", ticketType === "gym" ? "Fittbot Business" : "Fittbot");

      // Always add status filter - map to API values
      if (statusFilter !== "all") {
        const statusMap = {
          "resolved": "Resolved",
          "unresolved": "Pending",
          "follow_up": "Follow Up"
        };
        params.append("status", statusMap[statusFilter] || statusFilter);
      }

      if (searchTerm) params.append("search", searchTerm);

      const response = await axiosInstance.get(
        `/api/admin/dashboard/support-tickets-list?${params.toString()}`
      );

      if (response.data.success) {
        setTickets(response.data.data.tickets);
        setPagination(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch tickets");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch tickets";
      setError(errorMsg);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchTickets();
  };

  const handleStatusFilter = (status) => {
    setPagination({ ...pagination, page: 1 });
    router.push(`/portal/support/tickets?type=${ticketType}&status=${status}`);
  };

  const handleTypeFilter = (type) => {
    setPagination({ ...pagination, page: 1 });
    router.push(`/portal/support/tickets?type=${type}&status=${statusFilter}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Resolved":
        return { backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "#059669", color: "#34d399" };
      case "Follow Up":
        return { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: "#d97706", color: "#fbbf24" };
      case "Working":
        return { backgroundColor: "rgba(59, 130, 246, 0.2)", borderColor: "#2563eb", color: "#60a5fa" };
      case "Pending":
      default:
        return { backgroundColor: "rgba(239, 68, 68, 0.2)", borderColor: "#dc2626", color: "#f87171" };
    }
  };

  const getStatusLabel = (status) => {
    return status || "Pending";
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

  return (
    <div style={{ padding: "1.5rem", minHeight: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "white",
            marginBottom: "0.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <FaTicketAlt style={{ color: "#FF5757" }} />
          Support Tickets
        </h1>
      </div>

      {/* Type Tabs - Fymble / Fymble Business */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #374151",
          paddingBottom: "0",
        }}
      >
        <button
          onClick={() => handleTypeFilter("client")}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: ticketType === "client" ? "#FF5757" : "transparent",
            border: "none",
            borderRadius: "0.5rem 0.5rem 0 0",
            color: ticketType === "client" ? "white" : "#9ca3af",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "0.875rem",
            fontWeight: "500",
            borderBottom: ticketType === "client" ? "2px solid #FF5757" : "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (ticketType !== "client") {
              e.target.style.color = "white";
              e.target.style.backgroundColor = "#374151";
            }
          }}
          onMouseLeave={(e) => {
            if (ticketType !== "client") {
              e.target.style.color = "#9ca3af";
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Fymble
        </button>
        <button
          onClick={() => handleTypeFilter("gym")}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: ticketType === "gym" ? "#FF5757" : "transparent",
            border: "none",
            borderRadius: "0.5rem 0.5rem 0 0",
            color: ticketType === "gym" ? "white" : "#9ca3af",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "0.875rem",
            fontWeight: "500",
            borderBottom: ticketType === "gym" ? "2px solid #FF5757" : "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (ticketType !== "gym") {
              e.target.style.color = "white";
              e.target.style.backgroundColor = "#374151";
            }
          }}
          onMouseLeave={(e) => {
            if (ticketType !== "gym") {
              e.target.style.color = "#9ca3af";
              e.target.style.backgroundColor = "transparent";
            }
          }}
        >
          Fymble Business
        </button>
      </div>

      {/* Status Filters + Search Bar */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => handleStatusFilter("all")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: statusFilter === "all" ? "#FF5757" : "#1f2937",
              border: statusFilter === "all" ? "none" : "1px solid #374151",
              borderRadius: "0.5rem",
              color: statusFilter === "all" ? "white" : "#9ca3af",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== "all") {
                e.target.style.backgroundColor = "#374151";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== "all") {
                e.target.style.backgroundColor = "#1f2937";
                e.target.style.color = "#9ca3af";
              }
            }}
          >
            All Tickets
          </button>
          <button
            onClick={() => handleStatusFilter("resolved")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: statusFilter === "resolved" ? "#10b981" : "#1f2937",
              border: statusFilter === "resolved" ? "none" : "1px solid #374151",
              borderRadius: "0.5rem",
              color: statusFilter === "resolved" ? "white" : "#9ca3af",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== "resolved") {
                e.target.style.backgroundColor = "#374151";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== "resolved") {
                e.target.style.backgroundColor = "#1f2937";
                e.target.style.color = "#9ca3af";
              }
            }}
          >
            Resolved
          </button>
          <button
            onClick={() => handleStatusFilter("unresolved")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: statusFilter === "unresolved" ? "#ef4444" : "#1f2937",
              border: statusFilter === "unresolved" ? "none" : "1px solid #374151",
              borderRadius: "0.5rem",
              color: statusFilter === "unresolved" ? "white" : "#9ca3af",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== "unresolved") {
                e.target.style.backgroundColor = "#374151";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== "unresolved") {
                e.target.style.backgroundColor = "#1f2937";
                e.target.style.color = "#9ca3af";
              }
            }}
          >
            Unresolved
          </button>
          <button
            onClick={() => handleStatusFilter("follow_up")}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: statusFilter === "follow_up" ? "#9333ea" : "#1f2937",
              border: statusFilter === "follow_up" ? "none" : "1px solid #374151",
              borderRadius: "0.5rem",
              color: statusFilter === "follow_up" ? "white" : "#9ca3af",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "0.875rem",
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== "follow_up") {
                e.target.style.backgroundColor = "#374151";
                e.target.style.color = "white";
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== "follow_up") {
                e.target.style.backgroundColor = "#1f2937";
                e.target.style.color = "#9ca3af";
              }
            }}
          >
            Follow Up
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
          <input
            type="text"
            placeholder="Search by ticket ID, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
              color: "white",
              fontSize: "0.875rem",
              minWidth: "280px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#FF5757",
              border: "none",
              borderRadius: "0.5rem",
              color: "white",
              cursor: "pointer",
              transition: "background-color 0.2s",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#dc2626";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#FF5757";
            }}
          >
            Search
          </button>
        </form>

        <button
          onClick={() => setIsExportModalOpen(true)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#10b981",
                    border: "none",
                    borderRadius: "0.5rem",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#059669";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#10b981";
                  }}
                >
                  <FaFileExport /> Export
          </button>
      </div>

      {/* Tickets Table */}
      <div
        style={{
          backgroundColor: "#1f2937",
          borderRadius: "0.5rem",
          overflow: "hidden",
          border: "1px solid #374151",
        }}
      >
        {/* Table Header - Different columns based on filter */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: statusFilter === "all" ? "180px 1fr 100px 140px 150px 150px" : "180px 1fr 130px 150px 150px",
            gap: "1rem",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#374151",
            borderBottom: "1px solid #4b5563",
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
            Ticket ID
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
            Subject
          </div>
          {statusFilter === "all" && (
            <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
              Status
            </div>
          )}
          <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
            Assigned To
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
            Created At
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: "500", color: "#d1d5db", textTransform: "uppercase" }}>
            Solved At
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem 0",
            }}
          >
            <FaSpinner style={{ fontSize: "2rem", color: "#FF5757", animation: "spin 1s linear infinite" }} />
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>
            <button
              onClick={fetchTickets}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#FF5757",
                border: "none",
                borderRadius: "0.5rem",
                color: "white",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center", color: "#9ca3af" }}>
            <FaTicketAlt style={{ fontSize: "3rem", color: "#4b5563", marginBottom: "0.75rem" }} />
            <p>No tickets found</p>
          </div>
        ) : (
          <div>
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => router.push(`/portal/support/tickets/${ticket.ticket_id}?source=${ticket.source}`)}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid #374151",
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
                    display: "grid",
                    gridTemplateColumns: statusFilter === "all" ? "180px 1fr 100px 140px 150px 150px" : "180px 1fr 130px 150px 150px",
                    gap: "1rem",
                    padding: "1rem 1.5rem",
                    alignItems: "center",
                  }}
                >
                  {/* Ticket ID */}
                  <div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#60a5fa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.ticket_id || "N/A"}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <div
                      style={{
                        fontSize: "0.875rem",
                        color: "#d1d5db",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ticket.subject}
                    </div>
                  </div>

                  {/* Status - only show for All */}
                  {statusFilter === "all" && (
                    <div>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          borderRadius: "0.25rem",
                          border: "1px solid",
                          ...getStatusBadgeStyle(ticket.status),
                        }}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                  )}

                  {/* Assigned To */}
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#d1d5db", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ticket.assigned_to || "N/A"}
                    </div>
                  </div>

                  {/* Created At */}
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                      {formatDate(ticket.created_at)}
                    </div>
                  </div>

                  {/* Solved At */}
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                      {ticket.resolved_at ? formatDate(ticket.resolved_at) : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && !loading && (
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} tickets
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev || loading}
              style={{
                padding: "0.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                color: "#9ca3af",
                cursor: !pagination.hasPrev || loading ? "not-allowed" : "pointer",
                opacity: !pagination.hasPrev || loading ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (pagination.hasPrev && !loading) {
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
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext || loading}
              style={{
                padding: "0.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                color: "#9ca3af",
                cursor: !pagination.hasNext || loading ? "not-allowed" : "pointer",
                opacity: !pagination.hasNext || loading ? 0.5 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (pagination.hasNext && !loading) {
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
      )}

      {isExportModalOpen && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 1000,
                }}
                onClick={(e) => {
                   if (e.target === e.currentTarget) setIsExportModalOpen(false);
                }}
              >
                <div
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "1rem",
                    padding: "2rem",
                    width: "100%",
                    maxWidth: "400px",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    animation: "fadeIn 0.3s ease-out",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "white", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <FaDownload style={{ color: "#10b981" }} />
                      Export Support Tickets
                    </h2>
                    <button 
                      onClick={() => setIsExportModalOpen(false)}
                      style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "0.5rem" }}
                    >
                      <FaTimes size={18} />
                    </button>
                  </div>
                  
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                    Select a date range for <strong>{ticketType === "gym" ? "Fymble Business" : "Fymble"}</strong>.
                  </p>
                  
                  <form onSubmit={handleExport}>
                    <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <input
                        type="checkbox"
                        id="allTime"
                        checked={isAllTime}
                        onChange={(e) => setIsAllTime(e.target.checked)}
                        style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer", accentColor: "#10b981" }}
                      />
                      <label htmlFor="allTime" style={{ color: "white", fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                        Export All Time (ignores date range)
                      </label>
                    </div>
      
                    {!isAllTime && (
                      <>
                        <div style={{ marginBottom: "1rem" }}>
                          <label style={{ display: "block", color: "white", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            required={!isAllTime}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "0.5rem",
                              color: "white",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: "1.5rem" }}>
                          <label style={{ display: "block", color: "white", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
                            End Date
                          </label>
                          <input
                            type="date"
                            required={!isAllTime}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              backgroundColor: "#1f2937",
                              border: "1px solid #374151",
                              borderRadius: "0.5rem",
                              color: "white",
                              outline: "none",
                            }}
                          />
                        </div>
                      </>
                    )}
                    <button
                      type="submit"
                      disabled={exporting}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        backgroundColor: "#10b981",
                        borderRadius: "0.5rem",
                        color: "white",
                        fontWeight: "600",
                        cursor: exporting ? "not-allowed" : "pointer",
                      }}
                    >
                      {exporting ? "Exporting..." : "Download Excel"}
                    </button>
                  </form>
                </div>
              </div>
            )}

      <SecureExportModal {...secureExportProps} />

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}