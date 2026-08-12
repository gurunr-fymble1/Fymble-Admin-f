"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaSync,
} from "react-icons/fa";

export default function KyraPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");


  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  // Load subscriptions data
  const loadKyraData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/api/admin/purchases/kyra-subscription");
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to retrieve subscription data");
      }
    } catch (err) {
      console.error("Error loading Kyra data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load Kyra subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKyraData();
  }, [loadKyraData]);


  // Helper: Format Date
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (includeTime) {
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  // Helper: Expiry/Days Remaining display
  const getExpiryDisplay = (activeUntilStr) => {
    if (!activeUntilStr) return "N/A";
    const activeUntil = new Date(activeUntilStr);
    if (isNaN(activeUntil.getTime())) return activeUntilStr;

    const now = new Date();
    if (now > activeUntil) {
      return <span style={{ color: "#ffffffff" }}>0 days left</span>;
    }

    const diffTime = activeUntil - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 10) {
      return <span style={{ color: "#f59e0b" }}>Expires in {diffDays}d</span>;
    }
    return <span style={{ color: "#10b981" }}>{diffDays} days left</span>;
  };



  // Filtered and Sorted list
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search term matching
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const clientName = (item.client?.name || "").toLowerCase();
        const contact = (item.client?.contact || "").toLowerCase();

        return (
          clientName.includes(term) ||
          contact.includes(term)
        );
      });
    }

    // Status filter logic
    if (statusFilter !== "all") {
      result = result.filter((item) => {
        const status = item.subscription?.status;
        if (statusFilter === "active") {
          return status === "active" || status === "renewed";
        }
        if (statusFilter === "expired") {
          return status === "expired";
        }
        if (statusFilter === "canceled") {
          return status === "canceled";
        }
        return status === statusFilter;
      });
    }

    // Sorting logic
    result.sort((a, b) => {
      let valA, valB;
      if (sortField === "created_at") {
        valA = a.subscription?.created_at ? new Date(a.subscription.created_at).getTime() : 0;
        valB = b.subscription?.created_at ? new Date(b.subscription.created_at).getTime() : 0;
      } else if (sortField === "active_until") {
        valA = a.subscription?.active_until ? new Date(a.subscription.active_until).getTime() : 0;
        valB = b.subscription?.active_until ? new Date(b.subscription.active_until).getTime() : 0;
      } else {
        valA = 0;
        valB = 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, statusFilter, sortField, sortOrder]);

  // Pagination indexing
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Adjust page boundary if filters shrink the set size
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // CSS Styles objects for custom premium layout
  const containerStyle = {
    color: "#fff",
    fontFamily: "'Inter', sans-serif"
  };

  const cardStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "20px",
    textAlign: "left",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease",
  };

  const cardLabelStyle = {
    color: "#888",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const cardValueStyle = {
    fontSize: "30px",
    fontWeight: "700",
    color: "#fff"
  };

  const filterContainerStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    alignItems: "center"
  };

  const searchWrapperStyle = {
    position: "relative",
    flex: "1 1 300px",
    maxWidth: "450px"
  };

  const searchInputStyle = {
    width: "100%",
    padding: "10px 15px 10px 40px",
    backgroundColor: "#222",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    outline: "none"
  };

  const selectStyle = {
    backgroundColor: "#222",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    padding: "10px 15px",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none"
  };

  const statusBadgeStyle = (status) => {
    let color = "#888";
    let bgColor = "rgba(136, 136, 136, 0.15)";
    
    if (status === "active" || status === "renewed") {
      color = "#4ade80";
      bgColor = "rgba(74, 222, 128, 0.15)";
    } else if (status === "expired") {
      color = "#f79c00ff";
      bgColor = "rgba(245, 158, 11, 0.15)";
    } else if (["canceled"].includes(status)) {
      color = "#ef4444";
      bgColor = "rgba(239, 68, 68, 0.15)";
    }

    return {
      color,
      backgroundColor: bgColor,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
      display: "inline-block",
    };
  };

  return (
    <div style={containerStyle}>
      {/* Title Header with Refresh Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
          <span style={{ color: "#FF5757" }}>Kyra AI</span> Subscriptions
        </h2>
        <button
          onClick={loadKyraData}
          disabled={loading}
          style={{
            backgroundColor: "#222",
            border: "1px solid #333",
            color: "#fff",
            borderRadius: "6px",
            padding: "8px 14px",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#333"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#222"}
        >
          <FaSync className={loading ? "spin-animation" : ""} style={{ animation: loading ? "spin 1.5s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>



      {/* Search and Filters */}
      <div style={filterContainerStyle}>
        {/* Search Input */}
        <div style={searchWrapperStyle}>
          <FaSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <input
            type="text"
            placeholder="Search by client name or contact number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="canceled">Canceled</option>
        </select>

        {/* Spacer */}
        <div style={{ flex: 1 }}></div>

        {/* Items Per Page */}
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={selectStyle}
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      </div>

      {/* Loader / Error Handling / Data Grid */}
      {loading && data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div
            style={{
              width: "45px",
              height: "45px",
              border: "4px solid #333",
              borderTop: "4px solid #FF5757",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 15px"
            }}
          />
          <p style={{ color: "#aaa", fontSize: "14px" }}>Loading Kyra AI subscriptions...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "50px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a" }}>
          <p style={{ color: "#ef4444", fontSize: "16px", margin: "0 0 15px 0" }}>Error: {error}</p>
          <button
            onClick={loadKyraData}
            style={{
              backgroundColor: "#FF5757",
              border: "none",
              color: "#fff",
              borderRadius: "6px",
              padding: "8px 18px",
              fontSize: "14px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Retry Loading
          </button>
        </div>
      ) : paginatedData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a", color: "#888" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4, marginBottom: "15px" }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#888" />
          </svg>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#ccc", marginBottom: "5px" }}>No Subscriptions Found</div>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Try clearing filters or search term.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
              <thead>
                <tr style={{ backgroundColor: "#222", borderBottom: "1px solid #333", textAlign: "left" }}>
                  {/* <th style={{ padding: "16px", width: "40px" }}></th> */}
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Client Name</th>
                  {/* <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Customer ID</th> */}
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Contact</th>
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Status</th>
                  {/* <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Auto-Renew</th> */}
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Days Left</th>
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Created At</th>
                  <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Expires At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item) => {
                  const sub = item.subscription || {};

                  return (
                    <tr
                      key={sub.id || Math.random()}
                      style={{
                        borderBottom: "1px solid #333",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#242424"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "16px", fontWeight: "500" }}>{item.client?.name || "N/A"}</td>
                      {/* <td style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>{sub.customer_id || "N/A"}</td> */}
                      <td style={{ padding: "16px", color: "#ccc", fontSize: "13px" }}>
                        <span style={{ backgroundColor: "#2b2b2b", padding: "4px 8px", borderRadius: "4px" }}>
                          {item.client?.contact || "N/A"}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <span style={statusBadgeStyle(sub.status)}>
                          {sub.status || "N/A"}
                        </span>
                      </td>
                      
                      <td style={{ padding: "16px", fontSize: "13px" }}>{getExpiryDisplay(sub.active_until)}</td>
                      <td style={{ padding: "16px", color: "#888", fontSize: "13px" }}>{formatDate(sub.created_at)}</td>
                      <td style={{ padding: "16px", color: "#ccc", fontSize: "13px" }}>{formatDate(sub.active_until)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination bar */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 20px",
              borderTop: "1px solid #333",
              backgroundColor: "#222",
              flexWrap: "wrap",
              gap: "15px"
            }}>
              <div style={{ color: "#888", fontSize: "14px" }}>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    backgroundColor: currentPage === 1 ? "#2c2c2c" : "#333",
                    border: "1px solid #444",
                    color: currentPage === 1 ? "#555" : "#fff",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "13px"
                  }}
                >
                  <FaChevronLeft style={{ verticalAlign: "middle" }} /> Previous
                </button>
                
                <span style={{ color: "#ccc", display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px" }}>
                  Page <strong>{currentPage}</strong> of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    backgroundColor: currentPage === totalPages ? "#2c2c2c" : "#333",
                    border: "1px solid #444",
                    color: currentPage === totalPages ? "#555" : "#fff",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    fontSize: "13px"
                  }}
                >
                  Next <FaChevronRight style={{ verticalAlign: "middle" }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Embed local style for loading spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
