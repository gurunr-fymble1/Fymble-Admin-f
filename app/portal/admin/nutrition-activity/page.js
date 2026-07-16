"use client";
import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { HiOutlineUsers, HiOutlineRefresh, HiOutlineSearch, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaSpinner } from "react-icons/fa";

export default function NutritionActivityPage() {
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

  const [filter, setFilter] = useState("overall");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [nutritionistsList, setNutritionistsList] = useState([]);

  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // 1. Debounce Mechanism for Search Box
  useEffect(() => {
    const trimmed = searchTerm.trim();

    if (trimmed === "") {
      setDebouncedSearchTerm("");
      setPage(1);
      return;
    }

    const delay = setTimeout(() => {
      setDebouncedSearchTerm(trimmed);
      setPage(1); // Reset to page 1 on new search term
    }, 400); // 400ms Debounce

    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 2. Fetch Logs from optimized paginated backend
  const fetchLogs = async () => {
    // Cancel any previous pending request in progress to prevent stale race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Cache key representing the state signature
    const cacheKey = `page_${page}_limit_${limit}_search_${debouncedSearchTerm}_name_${selectedName}_start_${startDate}_end_${endDate}`;

    // Client-side cache check
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setLogs(cached.data);
      setPagination(cached.pagination);
      if (cached.nutritionists) {
        setNutritionistsList(cached.nutritionists);
      }
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/admin/auth/nutrition-activity", {
        params: {
          page: page,
          limit: limit,
          search: debouncedSearchTerm || undefined,
          name: selectedName || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
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
          },
          nutritionists: response.data.nutritionists || []
        };

        // Cache response for future repeated lookups
        cacheRef.current[cacheKey] = payload;

        setLogs(payload.data);
        setPagination(payload.pagination);
        if (response.data.nutritionists) {
          setNutritionistsList(response.data.nutritionists);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch logs.");
      }
    } catch (err) {
      // Ignore request cancellations as they are triggered intentionally
      if (err.name === "CanceledError" || axiosInstance.isCancel(err) || err.message === "canceled") {
        return;
      }
      console.error("Failed to load activity logs:", err);
      setError(err.response?.data?.detail || err.message || "An error occurred while loading activity logs.");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };

  // Trigger fetch when page, limit, debounced search term, name filter, or date filters update
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearchTerm, selectedName, startDate, endDate]);

  // Clean up any pending AbortControllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const parts = dateString.split(/[- :]/);
    if (parts.length >= 6) {
      const date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }
    return dateString;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1); // Reset page to 1
    if (value !== "custom") {
      const today = new Date();
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      let start = "";
      let end = "";
      
      if (value === "today") {
        start = end = formatDate(today);
      } else if (value === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        start = end = formatDate(yesterday);
      } else if (value === "last_7") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        start = formatDate(sevenDaysAgo);
        end = formatDate(today);
      } else if (value === "last_30") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        start = formatDate(thirtyDaysAgo);
        end = formatDate(today);
      } else if (value === "last_60") {
        const sixtyDaysAgo = new Date(today);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        start = formatDate(sixtyDaysAgo);
        end = formatDate(today);
      } else if (value === "last_90") {
        const ninetyDaysAgo = new Date(today);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        start = formatDate(ninetyDaysAgo);
        end = formatDate(today);
      }
      
      setStartDate(start);
      setEndDate(end);
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  // Clear cache and refresh logs from server manually
  const handleManualRefresh = () => {
    cacheRef.current = {};
    fetchLogs();
  };

  const isTypingOrLoading = loading || (searchTerm.trim() !== debouncedSearchTerm);

  return (
    <div style={{ padding: "2rem", minHeight: "calc(100vh - 80px)", color: "white", fontFamily: "inherit" }}>
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.75rem", margin: 0 }}>
            <HiOutlineUsers style={{ color: "#FF5757", fontSize: "2.25rem" }} />
            Nutritionist Login Activity
          </h1>
          <p style={{ color: "#aaa", fontSize: "0.875rem", marginTop: "0.25rem", margin: 0 }}>
            Session logs and active connection tracking history for nutritionist user accounts.
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

      {/* Control Panel (Dynamic Search Bar & Date/Name Filters) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", flex: 1, maxWidth: "1050px", gap: "1rem", flexWrap: "nowrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
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
              placeholder="Search nutrition name..."
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

          {/* Name Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", backgroundColor: "#1f2937", borderRadius: "8px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem", fontWeight: "500" }}>Name:</span>
            <select
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                cursor: "pointer",
                maxWidth: "180px"
              }}
            >
              <option value="" style={{ backgroundColor: "#1f2937" }}>All Nutritionists</option>
              {nutritionistsList.map((name) => (
                <option key={name} value={name} style={{ backgroundColor: "#1f2937" }}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", backgroundColor: "#1f2937", borderRadius: "8px", border: "1px solid #374151" }}>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem", fontWeight: "500" }}>Date Filter:</span>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: "transparent",
                border: "none",
                color: "white",
                fontSize: "0.875rem",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="overall" style={{ backgroundColor: "#1f2937" }}>Overall</option>
              <option value="today" style={{ backgroundColor: "#1f2937" }}>Today</option>
              <option value="yesterday" style={{ backgroundColor: "#1f2937" }}>Yesterday</option>
              <option value="last_7" style={{ backgroundColor: "#1f2937" }}>Last 7 Days</option>
              <option value="last_30" style={{ backgroundColor: "#1f2937" }}>Last 30 Days</option>
              <option value="last_60" style={{ backgroundColor: "#1f2937" }}>Last 60 Days</option>
              <option value="last_90" style={{ backgroundColor: "#1f2937" }}>Last 90 Days</option>
              <option value="custom" style={{ backgroundColor: "#1f2937" }}>Custom</option>
            </select>
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

      {/* Custom Date Range Panel */}
      {filter === "custom" && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", padding: "12px 16px", backgroundColor: "#1f2937", borderRadius: "8px", border: "1px solid #374151", flexWrap: "wrap", alignItems: "center", maxWidth: "480px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "white",
                fontSize: "0.875rem",
                outline: "none"
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "0.75rem", color: "#9ca3af" }}>End Date:</label>
            <input
              type="date"
              value={endDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: "6px 10px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "white",
                fontSize: "0.875rem",
                outline: "none"
              }}
            />
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#262626", borderBottom: "1px solid #333", color: "#aaa" }}>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Name</th>
                <th style={{ padding: "1rem 1.5rem", fontWeight: "600" }}>Login Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} style={{ borderBottom: "1px solid #262626" }}>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.25rem", width: "160px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                    <td style={{ padding: "1.2rem 1.5rem" }}>
                      <div className="skeleton-pulse" style={{ height: "1.25rem", width: "240px", backgroundColor: "#262626", borderRadius: "4px" }} />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="2" style={{ padding: "4rem 2rem", textAlign: "center", color: "#ef4444" }}>
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
                  <td colSpan="2">
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
                        We couldn&apos;t find any login activity records for &quot;{searchTerm}&quot;.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <tr
                    key={index}
                    style={{
                      borderBottom: "1px solid #262626",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 87, 87, 0.03)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "1rem 1.5rem", color: "#fff", fontWeight: "500" }}>
                      {log.name}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "#f3f4f6", whiteSpace: "nowrap" }}>
                      {formatDateTime(log.login_time)}
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
