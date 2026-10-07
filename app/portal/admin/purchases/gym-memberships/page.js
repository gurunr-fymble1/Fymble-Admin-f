"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { useRole } from "../../../layout";
import { formatGymName } from "@/lib/utils";

export default function GymMemberships() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [distinctClients, setDistinctClients] = useState(new Set());
  const [distinctGyms, setDistinctGyms] = useState(new Set());
  const [distinctClientsFilter, setDistinctClientsFilter] = useState(false);
  const [distinctGymsFilter, setDistinctGymsFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [exporting, setExporting] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const { handleExportTrigger, secureExportProps } = useSecureExport();

  const isFetchingRef = useRef(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchGymMemberships = useCallback(async (pageNum) => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: 10,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (distinctClientsFilter) params.distinct_clients = true;
      if (distinctGymsFilter) params.distinct_gyms = true;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axiosInstance.get("/api/admin/purchases/gym-memberships", {
        params,
      });

      if (response.data.success) {
        setMemberships(response.data.data.memberships);
        setPagination(response.data.data.pagination);
        // Store distinct clients and gyms from backend response
        if (response.data.data.distinctClients) {
          setDistinctClients(new Set(response.data.data.distinctClients));
        }
        if (response.data.data.distinctGyms) {
          setDistinctGyms(new Set(response.data.data.distinctGyms));
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch gym memberships");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch gym memberships";
      setError(errorMsg);
      setMemberships([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearch, distinctClientsFilter, distinctGymsFilter, startDate, endDate]);

  useEffect(() => {
    fetchGymMemberships(page);
  }, [page, fetchGymMemberships]);

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (distinctClientsFilter) params.distinct_clients = true;
        if (distinctGymsFilter) params.distinct_gyms = true;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await axiosInstance.get("/api/admin/purchases/export-gym-memberships", {
          params,
          responseType: "blob",
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        }));
        const link = document.createElement("a");
        link.href = url;

        // Extract filename from Content-Disposition header or generate default
        const contentDisposition = response.headers["content-disposition"];
        let filename = "gym_memberships.xlsx";
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=(.+)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/"/g, "");
          }
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export gym memberships. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    // Check if it has a time component
    const hasTime = dateString.includes("T") || (dateString.includes(" ") && /\d{2}:\d{2}/.test(dateString));
    const date = new Date(dateString);
    
    if (!hasTime) {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatType = (type) => {
    if (type === "gym_membership") return "Gym Membership";
    if (type === "personal_training") return "Personal Training";
    return type || "N/A";
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount?.toFixed(2) || "0.00"}`;
  };

  // Check if client has exactly 1 booking (using backend data)
  const getClientDistinctStatus = (clientName) => {
    return distinctClients.has(clientName);
  };

  // Check if gym has exactly 1 booking (using backend data)
  const getGymDistinctStatus = (gymName) => {
    return distinctGyms.has(gymName);
  };

  return (
    <div>
      {/* Filters Card */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {/* First Row: Search, Export */}
        <div className="d-flex gap-3 align-items-center" style={{ marginBottom: "15px" }}>
          {/* Search */}
          <div className="input-group flex-grow-1" style={{ maxWidth: "320px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, contact, or gym..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
              }}
            />
            <button
              className="btn"
              type="button"
              onClick={() => setDebouncedSearch(search)}
              style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
            >
              Search
            </button>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* Export Button */}
          {(role === "admin" || role === "support" || role === "accountant") && (
            <button
              className="btn"
              onClick={handleExport}
              disabled={exporting || loading}
              style={{
                backgroundColor: exporting || loading ? "#444" : "#28a745",
                border: "none",
                color: "#fff",
                padding: "8px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: exporting || loading ? "not-allowed" : "pointer",
              }}
            >
              <FaDownload />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>

        {/* Second Row: Date Filters, Distinct Filters */}
        <div className="d-flex gap-3 align-items-center flex-wrap">
          {/* Date Filters */}
          <div className="d-flex gap-2 align-items-center">
            <span style={{ color: "#888", fontSize: "14px" }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
            <span style={{ color: "#888", fontSize: "14px", marginLeft: "8px" }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "30px", backgroundColor: "#333", margin: "0 10px" }}></div>

          {/* Distinct Filters */}
          <div className="d-flex gap-4">
            {/* Distinct Clients */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctClients"
                checked={distinctClientsFilter}
                onChange={(e) => {
                  setDistinctClientsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#28a745",
                }}
              />
              <label
                htmlFor="distinctClients"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Clients
              </label>
            </div>

            {/* Distinct Gyms */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctGyms"
                checked={distinctGymsFilter}
                onChange={(e) => {
                  setDistinctGymsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#ffc107",
                }}
              />
              <label
                htmlFor="distinctGyms"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Gyms
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Memberships Table */}
      {loading ? (
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading gym memberships...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchGymMemberships(page)}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : memberships.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No gym memberships found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table memberships-table">
            <thead>
              <tr>
                <th style={{ minWidth: "40px", width: "40px" }}></th>
                <th style={{ minWidth: "160px", width: "160px" }}>Client Name</th>
                <th>Contact</th>
                <th style={{ minWidth: "160px", width: "160px" }}>Gym Name</th>
                <th>City</th>
                <th>area</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Purchased At</th>
                <th>Status</th>
                <th style={{ minWidth: "160px", width: "160px" }}>Joined At</th>
                <th style={{ minWidth: "160px", width: "160px" }}>Expire At</th>
                <th>Platform</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((item) => {
                const hasContacts = !!(item.gym_contact || item.owner_contact || item.client_contact || item.gym_area || item.owner_name);
                const isExpanded = expandedRows.has(item.id);

                return (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td style={{ padding: "8px !important" }}>
                        {hasContacts && (
                          <button
                            onClick={() => toggleRow(item.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#FF5757",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "16px",
                              transition: "transform 0.2s",
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >
                            ▶
                          </button>
                        )}
                      </td>
                      <td className="client-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getClientDistinctStatus(item.client_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {item.client_name || "N/A"}
                        </span>
                      </td>
                      <td className="client-contact">{item.client_contact || "N/A"}</td>
                      <td className="gym-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getGymDistinctStatus(item.gym_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {formatGymName(item.gym_name) || "N/A"}
                        </span>
                      </td>
                      <td className="city">{item.gym_city || "N/A"}</td>
                      <td className="area">{item.gym_area || "N/A"}</td>
                      <td className="type">{formatType(item.type)}</td>
                      <td className="amount">{formatAmount(item.amount)}</td>
                      <td className="purchased-at">{formatDate(item.purchased_at)}</td>
                      <td className="status">
                        {item.status ? (
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: item.status === "active" ? "#4ade80" : item.status === "expired" ? "#ef4444" : "#888",
                            }}
                          >
                            {item.status}
                          </span>
                        ) : (
                          <span style={{ color: "#666", fontSize: "11px" }}>N/A</span>
                        )}
                      </td>
                      <td className="joined-at">{item.joined_at ? formatDate(item.joined_at) : "N/A"}</td>
                      <td className="expire-at">{item.expire_at ? formatDate(item.expire_at) : "N/A"}</td>
                      <td className="platform">
                        <span
                          style={{
                            color: item.platform === "android" ? "#a8d5a2" : item.platform === "ios" ? "#a2c4d5" : "#888",
                            backgroundColor: item.platform === "android" ? "rgba(100, 200, 80, 0.1)" : item.platform === "ios" ? "rgba(80, 150, 200, 0.1)" : "rgba(128,128,128,0.1)",
                            border: `1px solid ${item.platform === "android" ? "#4caf50" : item.platform === "ios" ? "#5097c8" : "#555"}`,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 500,
                            textTransform: "capitalize",
                            display: "inline-block"
                          }}
                        >
                          {item.platform || "N/A"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="schedule-row">
                        <td colSpan="13" style={{ padding: "0 !important" }}>
                          <div
                            style={{
                              backgroundColor: "#151515",
                              padding: "16px",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                              {item.owner_name && (
                                <div style={{ fontSize: "13px" }}>
                                  <span style={{ color: "#888" }}>Owner Name: </span>
                                  <span style={{ color: "#fff", fontWeight: "500" }}>{item.owner_name}</span>
                                </div>
                              )}
                              {item.gym_contact && (
                                <div style={{ fontSize: "13px" }}>
                                  <span style={{ color: "#888" }}>Gym Contact: </span>
                                  <span style={{ color: "#fff", fontWeight: "500" }}>{item.gym_contact}</span>
                                </div>
                              )}
                              {item.owner_contact && (
                                <div style={{ fontSize: "13px" }}>
                                  <span style={{ color: "#888" }}>Owner Contact: </span>
                                  <span style={{ color: "#fff", fontWeight: "500" }}>{item.owner_contact}</span>
                                </div>
                              )}
                              {item.gym_area && (
                                <div style={{ fontSize: "13px" }}>
                                  <span style={{ color: "#888" }}>Gym Area: </span>
                                  <span style={{ color: "#fff", fontWeight: "500" }}>{item.gym_area}</span>
                                </div>
                              )}

                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && memberships.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div style={{ color: "#888", fontSize: "14px" }}>
            Showing {((page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} memberships
          </div>
          <div className="btn-group">
            <button
              className="btn btn-sm"
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPage(page - 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasPrev && !loading ? "#fff" : "#555",
                cursor: pagination.hasPrev && !loading ? "pointer" : "not-allowed",
              }}
            >
              Previous
            </button>
            <button
              className="btn btn-sm"
              disabled={!pagination.hasNext || loading}
              onClick={() => setPage(page + 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasNext && !loading ? "#fff" : "#555",
                cursor: pagination.hasNext && !loading ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <SecureExportModal {...secureExportProps} />

      <style jsx global>{`
        .table-responsive {
          overflow-x: auto !important;
          position: relative !important;
        }

        table.memberships-table {
          width: 100% !important;
          min-width: 1400px !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          overflow: visible !important;
        }

        table.memberships-table > thead {
          background-color: #222 !important;
          border-bottom: 2px solid #FF5757 !important;
        }

        table.memberships-table > thead > tr > th {
          padding: 12px !important;
          font-weight: 600 !important;
          text-align: left !important;
          color: #fff !important;
          border: none !important;
          background-color: #1a1a1a !important;
        }

        table.memberships-table > tbody > tr {
          border-bottom: 1px solid #333 !important;
          transition: background-color 0.2s ease !important;
          background-color: #1a1a1a !important;
        }

        table.memberships-table > tbody > tr:hover {
          background-color: #222 !important;
        }

        table.memberships-table > tbody > tr:last-child {
          border-bottom: none !important;
        }

        table.memberships-table > tbody > tr > td {
          padding: 12px !important;
          color: #fff !important;
          border: none !important;
          background-color: #1a1a1a !important;
        }

        table.memberships-table .client-name {
          font-weight: 500 !important;
        }

        table.memberships-table .gym-name {
          color: #ccc !important;
          text-transform: capitalize;
        }

        table.memberships-table .type {
          font-weight: 500 !important;
        }

        table.memberships-table .amount {
          font-weight: 600 !important;
          color: #4ade80 !important;
        }

        table.memberships-table .purchased-at {
          font-size: 14px !important;
          color: #888 !important;
        }

        table.memberships-table .schedule-row {
          background-color: #151515 !important;
        }

        table.memberships-table .schedule-row:hover {
          background-color: #151515 !important;
        }

        /* Sticky columns - keep first 4 columns fixed while scrolling */
        table.memberships-table > thead > tr > th:nth-child(1),
        table.memberships-table > tbody > tr:not(.schedule-row) > td:nth-child(1) {
          position: sticky !important;
          left: 0 !important;
          z-index: 11 !important;
          background-color: #1a1a1a !important;
          border-right: 1px solid #333 !important;
        }

        table.memberships-table > thead > tr > th:nth-child(2),
        table.memberships-table > tbody > tr:not(.schedule-row) > td:nth-child(2) {
          position: sticky !important;
          left: 40px !important;
          width: 160px !important;
          min-width: 160px !important;
          z-index: 11 !important;
          background-color: #1a1a1a !important;
          border-right: 1px solid #333 !important;
        }

        table.memberships-table > thead > tr > th:nth-child(3),
        table.memberships-table > tbody > tr:not(.schedule-row) > td:nth-child(3) {
          position: sticky !important;
          left: 200px !important;
          width: 120px !important;
          min-width: 120px !important;
          z-index: 11 !important;
          background-color: #1a1a1a !important;
          border-right: 1px solid #333 !important;
        }

        table.memberships-table > thead > tr > th:nth-child(4),
        table.memberships-table > tbody > tr:not(.schedule-row) > td:nth-child(4) {
          position: sticky !important;
          left: 320px !important;
          width: 160px !important;
          min-width: 160px !important;
          z-index: 11 !important;
          background-color: #1a1a1a !important;
          border-right: 2px solid #333 !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
