"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FaSearch, FaChevronLeft, FaChevronRight, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function TelecallerConvertedClients() {
  const router = useRouter();
  const params = useParams();
  const telecallerId = params.telecallerId;

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [telecaller, setTelecaller] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Track expanded cards and their purchase data
  const [expandedCards, setExpandedCards] = useState({});
  const [purchasesData, setPurchasesData] = useState({});
  const [loadingPurchases, setLoadingPurchases] = useState({});

  // Call count state
  const [todayCallCount, setTodayCallCount] = useState(0);
  const [callCountFilter, setCallCountFilter] = useState("today");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [loadingCallCount, setLoadingCallCount] = useState(false);

  // Refs for filter values to avoid dependency issues
  const filterRef = useRef("today");
  const customStartRef = useRef("");
  const customEndRef = useRef("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get(
        `/api/admin/user-conversion/telecallers/${telecallerId}/converted-clients`,
        { params }
      );

      if (response.data.success) {
        setClients(response.data.data.clients);
        setTelecaller(response.data.data.telecaller);
        setTotalClients(response.data.data.total);
        setTotalRevenue(response.data.data.total_revenue || 0);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [telecallerId, currentPage, itemsPerPage, debouncedSearchTerm]);

  // Fetch purchase history for a client (for toggle)
  const fetchPurchases = async (clientId) => {
    try {
      setLoadingPurchases((prev) => ({ ...prev, [clientId]: true }));

      const response = await axiosInstance.get(`/api/admin/users/${clientId}/last-purchases`);

      if (response.data.success) {
        const data = response.data.data;
        setPurchasesData((prev) => ({ ...prev, [clientId]: data }));
        return data;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching purchases for client ${clientId}:`, error);
      return null;
    } finally {
      setLoadingPurchases((prev) => ({ ...prev, [clientId]: false }));
    }
  };

  // Toggle card expansion
  const toggleCard = async (clientId) => {
    const isCurrentlyExpanded = expandedCards[clientId];

    if (isCurrentlyExpanded) {
      // Collapse
      setExpandedCards((prev) => ({ ...prev, [clientId]: false }));
    } else {
      // Expand - fetch purchases if not already loaded
      setExpandedCards((prev) => ({ ...prev, [clientId]: true }));

      if (!purchasesData[clientId]) {
        await fetchPurchases(clientId);
      }
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch initial call count (today's)
  const fetchInitialCallCount = useCallback(async () => {
    try {
      setLoadingCallCount(true);
      const response = await axiosInstance.get(
        `/api/admin/user-conversion/0/telecallers/${telecallerId}/call-count`,
        { params: { date_filter: "today" } }
      );
      if (response.data.success) {
        setTodayCallCount(response.data.data.call_count);
      }
    } catch (error) {
      console.error("Error fetching initial call count:", error);
    } finally {
      setLoadingCallCount(false);
    }
  }, [telecallerId]);

  // Fetch call count with current filter
  const fetchCallCount = useCallback(async () => {
    try {
      setLoadingCallCount(true);
      const params = { date_filter: filterRef.current };
      if (filterRef.current === "custom") {
        params.start_time = customStartRef.current;
        params.end_time = customEndRef.current;
      }
      const response = await axiosInstance.get(
        `/api/admin/user-conversion/0/telecallers/${telecallerId}/call-count`,
        { params }
      );
      if (response.data.success) {
        setTodayCallCount(response.data.data.call_count);
      }
    } catch (error) {
      console.error("Error fetching call count:", error);
    } finally {
      setLoadingCallCount(false);
    }
  }, [telecallerId]);

  useEffect(() => {
    fetchInitialCallCount();
  }, [fetchInitialCallCount]);

  // Handle filter change
  const onFilterChange = (filterValue) => {
    filterRef.current = filterValue;
    setCallCountFilter(filterValue);
    if (filterValue === "custom") {
      // Reset custom refs when switching to custom
      customStartRef.current = customStartTime;
      customEndRef.current = customEndTime;
    } else {
      // Clear custom refs when switching away
      customStartRef.current = "";
      customEndRef.current = "";
      fetchCallCount();
    }
  };

  // Apply custom filter
  const applyCustomFilter = () => {
    if (customStartRef.current && customEndRef.current) {
      fetchCallCount();
    }
  };

  // Clear custom filter
  const clearFilter = () => {
    customStartRef.current = "";
    customEndRef.current = "";
    setCustomStartTime("");
    setCustomEndTime("");
    filterRef.current = "today";
    setCallCountFilter("today");
    fetchCallCount();
  };

  const handleBack = () => {
    router.push("/portal/admin/user-conversion");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Render purchase item for dropdown
  const renderPurchaseItem = (purchase, type) => {
    if (!purchase) return null;

    // Only show amount for subscription, membership and AI credits types
    const showAmount = type === "subscription" || type === "membership" || type === "ai_credits";

    return (
      <div
        key={type}
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "20px",
          padding: "12px 16px",
          backgroundColor: "#2a2a2a",
          borderRadius: "8px",
          border: "1px solid #333",
          flex: "1 1 0",
          minWidth: "0",
        }}
      >
        <div style={{ flex: 1, minWidth: "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ color: "#28a745", fontWeight: "600", fontSize: "14px" }}>
              {purchase.type === "Session" ? "Fitness class" : purchase.type}
            </span>
            {purchase.gym_name && (
              <>
                <span style={{ color: "#666" }}>•</span>
                <span style={{ color: "#ccc", fontSize: "13px" }}>{purchase.gym_name}</span>
              </>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            Last Purchase: {formatDate(purchase.purchase_date)}
          </div>
        </div>
        {showAmount && purchase.amount_paid !== undefined && (
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", flexShrink: 0 }}>
            ₹{purchase.amount_paid?.toFixed(0) || 0}
          </div>
        )}
        {showAmount && purchase.payable_rupees !== undefined && (
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", flexShrink: 0 }}>
            ₹{purchase.payable_rupees?.toFixed(0) || 0}
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.ceil(totalClients / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <FaChevronLeft /> Back to Telecallers
          </button>
          <h2 className="users-title" style={{ marginLeft: "20px" }}>
            Converted Clients
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            padding: "40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#fff")}
          onMouseLeave={(e) => (e.target.style.color = "#9ca3af")}
        >
          <FaChevronLeft /> Back to Telecallers
        </button>
        <div style={{ marginLeft: "20px", flex: 1 }}>
          <h2 className="users-title">
            {telecaller?.name && (
              <>
                <span style={{ color: "#FF5757" }}>{telecaller.name}</span>
                {" "}
                <span style={{ color: "#ccc", fontSize: "16px", fontWeight: "400" }}>
                  - Converted Clients
                </span>
              </>
            )}
          </h2>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Search and Pagination Card */}
        <div style={{
          flex: "1 1 300px",
          minWidth: "280px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="search-box" style={{ flex: "1 1 200px", minWidth: "180px" }}>
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, mobile, or client ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="filter-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ minWidth: "100px" }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#888" }}>
            <span>Total: {totalClients} clients</span>
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>
        </div>

        {/* Business Card */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: "160px",
          minHeight: "90px",
        }}>
          <div style={{ fontSize: "11px", color: "#d1fae5", marginBottom: "4px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Business by {telecaller?.name || "Telecaller"}
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff" }}>
            ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Call Count Card */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: "200px",
          minHeight: callCountFilter === "custom" ? "auto" : "90px",
          flexGrow: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", gap: "8px" }}>
            <div style={{ fontSize: "11px", color: "#d1fae5", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
              {callCountFilter === "today" ? "Today's" : callCountFilter === "yesterday" ? "Yesterday's" : callCountFilter === "last7days" ? "Last 7 Days" : callCountFilter === "current_month" ? "MTD" : callCountFilter === "last_month" ? "Last Month" : callCountFilter === "overall" ? "Overall" : "Custom"} Calls
            </div>
            <select
              value={callCountFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "10px",
                color: "#fff",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7days">Last 7 Days</option>
              <option value="current_month">MTD</option>
              <option value="last_month">Last Month</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#ffffff" }}>
            {loadingCallCount ? "..." : todayCallCount}
          </div>
          {callCountFilter === "custom" && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "#d1fae5", fontSize: "10px", whiteSpace: "nowrap" }}>From:</span>
                <input
                  type="datetime-local"
                  value={customStartTime}
                  onChange={(e) => {
                    setCustomStartTime(e.target.value);
                    customStartRef.current = e.target.value;
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 6px",
                    fontSize: "10px",
                    color: "#fff",
                    width: "100%",
                    minWidth: "140px",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: "#d1fae5", fontSize: "10px", whiteSpace: "nowrap" }}>To:</span>
                <input
                  type="datetime-local"
                  value={customEndTime}
                  onChange={(e) => {
                    setCustomEndTime(e.target.value);
                    customEndRef.current = e.target.value;
                  }}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 6px",
                    fontSize: "10px",
                    color: "#fff",
                    width: "100%",
                    minWidth: "140px",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button
                  onClick={applyCustomFilter}
                  style={{
                    background: "rgba(255,255,255,0.25)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "10px",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
                <button
                  onClick={clearFilter}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 12px",
                    fontSize: "10px",
                    color: "#d1fae5",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Gym</th>
                <th>Last Purchased</th>
                <th>Converted Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => {
                  const clientId = client.client_id;
                  const rows = [];

                  rows.push(
                    <tr
                      key={clientId}
                      onClick={() => router.push(`/portal/admin/users/${clientId}`)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a1f1f"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td>
                        <div className="user-name">{client.name || "-"}</div>
                        {client.email && (
                          <div className="user-contact" style={{ fontSize: "12px", color: "#888" }}>
                            {client.email}
                          </div>
                        )}
                      </td>
                      <td>{client.contact || "-"}</td>
                      <td>{client.gym_name || "-"}</td>
                      <td>
                        <span
                          className="plan-badge"
                          style={{
                            backgroundColor: "#2a2a2a",
                            borderColor: "#555",
                            color: "#ccc",
                            fontSize: "13px",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            textTransform: "capitalize",
                          }}
                        >
                          {client.latest_purchase_type || "No Data"}
                        </span>
                      </td>
                      <td>{formatDate(client.converted_at)}</td>
                      <td>
                        <button
                          className="toggle-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCard(clientId);
                          }}
                        >
                          {expandedCards[clientId] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                  );

                  if (expandedCards[clientId]) {
                    rows.push(
                      <tr
                        key={`dropdown-${clientId}`}
                        style={{ cursor: "default" }}
                      >
                        <td
                          colSpan="6"
                          style={{
                            padding: "0",
                            border: "none",
                            backgroundColor: "#1a1f1f",
                          }}
                        >
                          <div className="user-row-dropdown">
                            {purchasesData[clientId] ? (
                              <div className="purchases-list">
                                <div style={{ marginBottom: "12px", fontSize: "14px", color: "#888", fontWeight: "500" }}>
                                  Purchase Details
                                </div>
                                <div style={{ display: "flex", flexDirection: "row", gap: "12px", flexWrap: "wrap" }}>
                                  {renderPurchaseItem(purchasesData[clientId].daily_pass, "daily_pass")}
                                  {renderPurchaseItem(purchasesData[clientId].session, "session")}
                                  {renderPurchaseItem(purchasesData[clientId].membership, "membership")}
                                  {renderPurchaseItem(purchasesData[clientId].subscription, "subscription")}
                                  {renderPurchaseItem(purchasesData[clientId].ai_credits, "ai_credits")}
                                </div>
                                {!purchasesData[clientId].daily_pass &&
                                  !purchasesData[clientId].session &&
                                  !purchasesData[clientId].membership &&
                                  !purchasesData[clientId].subscription &&
                                  !purchasesData[clientId].ai_credits && (
                                    <div
                                      style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#666",
                                        fontSize: "14px",
                                      }}
                                    >
                                      No purchase history found
                                    </div>
                                  )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  padding: "20px",
                                  textAlign: "center",
                                  color: "#666",
                                  fontSize: "14px",
                                }}
                              >
                                No purchase data available
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No converted clients found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients}{" "}
            entries
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {getPaginationNumbers().map((page, index) => (
              <button
                key={index}
                className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "dots" : ""}`}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
