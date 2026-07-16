"use client";
import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { HiOutlineShieldCheck, HiOutlineSearch, HiOutlineRefresh, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaSpinner } from "react-icons/fa";

export default function ExportLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // 1. Debounce Mechanism (runs when searchTerm changes)
  useEffect(() => {
    const trimmed = searchTerm.trim();

    // If empty search, clear debounced state immediately for instant feedback
    if (trimmed === "") {
      setDebouncedSearchTerm("");
      setPage(1);
      return;
    }

    // Minimum character threshold (3 characters) before triggering search.
    // If it's 1 or 2 characters, we do NOT trigger an API request for that term.
    // However, we reset the debounced term to "" (which displays all results) to avoid displaying stale results.
    const targetTerm = trimmed.length >= 3 ? trimmed : "";

    const delay = setTimeout(() => {
      setDebouncedSearchTerm(targetTerm);
      setPage(1); // Reset page to 1 on a new search term
    }, 400); // 400ms Debounce

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchLogs = async () => {
    // Cancel any previous pending request in progress to prevent stale race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Cache key representing the state signature
    const cacheKey = `page_${page}_limit_${limit}_search_${debouncedSearchTerm}`;

    // Client-side cache check
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setLogs(cached.data);
      setPagination(cached.pagination);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/admin/auth/export_logs", {
        params: {
          page: page,
          limit: limit,
          search: debouncedSearchTerm || undefined
        },
        signal: controller.signal
      });

      if (response.data && response.data.status === 200) {
        const payload = {
          data: response.data.data,
          pagination: response.data.pagination || {
            total: response.data.data.length,
            page: page,
            limit: limit,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        };

        // Cache response for future repeated lookups
        cacheRef.current[cacheKey] = payload;

        setLogs(payload.data);
        setPagination(payload.pagination);
      } else {
        throw new Error(response.data.message || "Failed to fetch logs.");
      }
    } catch (err) {
      // Ignore request cancellations as they are triggered intentionally
      if (err.name === "CanceledError" || axiosInstance.isCancel(err) || err.message === "canceled") {
        return;
      }
      console.error("Failed to load export logs:", err);
      setError(err.response?.data?.detail || err.message || "An error occurred while loading audit logs.");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  // Trigger fetch when page, limit, or debounced search term updates
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearchTerm]);

  // Clean up any pending AbortControllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  };

  // Clear cache and refresh logs from server manually
  const handleManualRefresh = () => {
    cacheRef.current = {};
    fetchLogs();
  };

  const isTypingOrLoading = loading || (searchTerm.trim() !== debouncedSearchTerm && searchTerm.trim().length >= 3);

  return (
    <div style={{ padding: "2rem", minHeight: "calc(100vh - 80px)", color: "white", fontFamily: "inherit" }}>
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
            <HiOutlineShieldCheck style={{ color: "#FF5757", fontSize: "2.25rem" }} />
            Data Export Audit Logs
          </h1>
          <p style={{ color: "#aaa", fontSize: "0.875rem", marginTop: "0.25rem", margin: 0 }}>
            A secure compliance history of all spreadsheet and data exports performed across the platform.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.2rem",
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#374151"; }}
          onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#1f2937"; }}
        >
          <HiOutlineRefresh size={18} className={loading ? "animate-spin" : ""} />
          Refresh Logs
        </button>
      </div>

      {/* Control Panel (Dynamic Search Bar) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ flex: 1, maxWidth: "580px", minWidth: "320px" }}>
          <div style={{ position: "relative" }}>
            {isTypingOrLoading ? (
              <FaSpinner
                className="animate-spin"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#FF5757",
                  fontSize: "1rem"
                }}
              />
            ) : (
              <HiOutlineSearch
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  fontSize: "1.25rem"
                }}
              />
            )}
            <input
              type="text"
              placeholder="Type name, role, or export URL to search (min 3 chars)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#FF5757"}
              onBlur={(e) => e.target.style.borderColor = "#374151"}
            />
          </div>
        </div>
        <div style={{ fontSize: "0.875rem", color: "#aaa" }}>
          {pagination.total > 0 ? (
            <span>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} audit records</span>
          ) : (
            <span>0 audit records</span>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#262626", borderBottom: "1px solid #333", color: "#aaa" }}>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Timestamp (IST)</th>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Role</th>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Source Export URL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // 5 Skeleton rows for dynamic, responsive loading state
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} style={{ borderBottom: "1px solid #262626" }}>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.25rem", width: "140px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.25rem", width: "160px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.5rem", width: "70px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.25rem", width: "320px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="4" style={{ padding: "4rem 2rem", textAlign: "center", color: "#ef4444" }}>
                    <p style={{ margin: "0 0 1rem 0" }}>{error}</p>
                    <button
                      onClick={fetchLogs}
                      style={{
                        padding: "0.5rem 1.25rem",
                        backgroundColor: "#FF5757",
                        border: "none",
                        borderRadius: "6px",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(255, 87, 87, 0.25)"
                      }}
                    >
                      Retry Load
                    </button>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div style={{
                      padding: "5rem 2rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "radial-gradient(circle at center, rgba(255, 87, 87, 0.03) 0%, transparent 70%)"
                    }}>
                      <div style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255, 87, 87, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "1.5rem",
                        border: "1px solid rgba(255, 87, 87, 0.2)"
                      }}>
                        <HiOutlineSearch style={{ fontSize: "2rem", color: "#FF5757" }} />
                      </div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#fff", marginBottom: "0.5rem" }}>No logs found</h3>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#9ca3af", maxWidth: "360px", lineHeight: "1.5" }}>
                        We couldn&apos;t find any export logs matching &quot;{searchTerm}&quot;. Try checking your spelling or search for a different name, role, or URL.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={log.id || index}
                    style={{
                      borderBottom: "1px solid #262626",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 87, 87, 0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: "1rem 1.5rem", color: "#f3f4f6", whiteSpace: "nowrap" }}>
                      {formatDateTime(log.created_at)}
                    </td>
                    {/* Exporter Name */}
                    <td style={{ padding: "1rem 1.5rem", color: "#fff", fontWeight: "500" }}>
                      {log.name}
                    </td>
                    {/* Exporter Role */}
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        padding: "0.25rem 0.6rem",
                        backgroundColor: log.role?.toLowerCase() === "admin" ? "rgba(255, 87, 87, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        border: log.role?.toLowerCase() === "admin" ? "1px solid rgba(255, 87, 87, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "4px",
                        color: log.role?.toLowerCase() === "admin" ? "#FF5757" : "#60a5fa",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "capitalize"
                      }}>
                        {log.role}
                      </span>
                    </td>
                    {/* Source Export URL */}
                    <td style={{ padding: "1rem 1.5rem", maxWidth: "450px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <a
                        href={log.export_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#60a5fa", textDecoration: "none" }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                      >
                        {log.export_page_url}
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Backend Pagination Controls */}
      {pagination.totalPages > 1 && !loading && (
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
            Page {page} of {pagination.totalPages}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={!pagination.hasPrev}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                color: "#9ca3af",
                cursor: !pagination.hasPrev ? "not-allowed" : "pointer",
                opacity: !pagination.hasPrev ? 0.5 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center"
              }}
              onMouseEnter={(e) => { if (pagination.hasPrev) { e.currentTarget.style.color = "white"; e.currentTarget.style.backgroundColor = "#374151"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.backgroundColor = "#1f2937"; }}
            >
              <HiChevronLeft size={20} />
            </button>
            <span style={{ fontSize: "0.875rem", color: "#f3f4f6", padding: "0 0.5rem" }}>
              {page}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!pagination.hasNext}
              style={{
                padding: "0.5rem",
                borderRadius: "8px",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                color: "#9ca3af",
                cursor: !pagination.hasNext ? "not-allowed" : "pointer",
                opacity: !pagination.hasNext ? 0.5 : 1,
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center"
              }}
              onMouseEnter={(e) => { if (pagination.hasNext) { e.currentTarget.style.color = "white"; e.currentTarget.style.backgroundColor = "#374151"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.backgroundColor = "#1f2937"; }}
            >
              <HiChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Keyframe Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
