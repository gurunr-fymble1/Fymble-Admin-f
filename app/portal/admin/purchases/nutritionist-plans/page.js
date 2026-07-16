"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";

export default function NutritionistPlans() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [exporting, setExporting] = useState(false);

  const { handleExportTrigger, secureExportProps } = useSecureExport();

  const isFetchingRef = useRef(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 10,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get("/api/admin/purchases/nutritionist-plans", { params });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalUsers(response.data.data.total);
      } else {
        throw new Error(response.data.message || "Failed to fetch nutrition plans");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch nutrition plans";
      setError(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearchTerm, currentPage]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    if (!status || status === "N/A") return <span style={{ color: "#888" }}>N/A</span>;
    const colors = {
      attended: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981", border: "rgba(16, 185, 129, 0.2)" },
      booked: { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.2)" },
      pending: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" },
      rescheduled: { bg: "rgba(139, 92, 246, 0.1)", text: "#8b5cf6", border: "rgba(139, 92, 246, 0.2)" },
      cancelled: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.2)" },
      no_show: { bg: "rgba(107, 114, 128, 0.1)", text: "#6b7280", border: "rgba(107, 114, 128, 0.2)" },
    };
    const style = colors[status.toLowerCase()] || { bg: "rgba(255, 255, 255, 0.05)", text: "#fff", border: "rgba(255, 255, 255, 0.1)" };
    return (
      <span
        style={{
          backgroundColor: style.bg,
          color: style.text,
          border: `1px solid ${style.border}`,
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          display: "inline-block",
        }}
      >
        {status}
      </span>
    );
  };

  const totalPages = Math.ceil(totalUsers / 10);

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        const response = await axiosInstance.get("/api/admin/purchases/export-nutritionist-plans", {
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
        let filename = "nutritionist_plans.xlsx";
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
        alert("Failed to export nutrition plans. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Search by client name or mobile..."
              value={searchTerm}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
              }}
            />
            <button
              className="btn"
              type="button"
              style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
            >
              Search
            </button>
          </div>
        </div>
        <div className="col-md-8 text-end">
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
        </div>
      </div>

      {/* Loading State */}
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading nutrition plans...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchUsers()}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No nutrition plans found</p>
        </div>
      ) : (
        <>
          {/* Table Section */}
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table purchases-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact</th>
                  <th>Purchased Date</th>
                  <th>Scheduled Date</th>
                  <th>Timing</th>
                  <th>Status</th>
                  <th>Session count</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="client-name">
                      <div>{user.client_name || "N/A"}</div>
                    </td>
                    <td className="client-contact">
                      <div>{user.mobile || "N/A"}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>
                        {formatDate(user.purchased_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>
                        {formatDate(user.booked_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>
                        {user.timing || "N/A"}
                      </div>
                    </td>
                    <td>
                      <div>{getStatusBadge(user.status)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc", fontWeight: "500" }}>
                        {user.session_count ?? 0}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>
                        ₹{user.amount?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div style={{ color: "#888", fontSize: "14px" }}>
                Showing {((currentPage - 1) * 10) + 1} to{" "}
                {Math.min(currentPage * 10, totalUsers)} of {totalUsers} entries
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-sm"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: currentPage > 1 && !loading ? "#fff" : "#555",
                    cursor: currentPage > 1 && !loading ? "pointer" : "not-allowed",
                  }}
                >
                  Previous
                </button>
                <button
                  className="btn btn-sm"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: currentPage < totalPages && !loading ? "#fff" : "#555",
                    cursor: currentPage < totalPages && !loading ? "pointer" : "not-allowed",
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SecureExportModal {...secureExportProps} />

      <style jsx global>{`
        .table-responsive {
          overflow-x: auto !important;
          position: relative !important;
        }

        table.purchases-table {
          width: 100% !important;
          min-width: 1200px !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          overflow: visible !important;
        }

        table.purchases-table > thead {
          background-color: #222 !important;
          border-bottom: 2px solid #FF5757 !important;
        }

        table.purchases-table > thead > tr > th {
          padding: 12px !important;
          font-weight: 600 !important;
          text-align: left !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr {
          border-bottom: 1px solid #333 !important;
          transition: background-color 0.2s ease !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr:hover {
          background-color: #222 !important;
        }

        table.purchases-table > tbody > tr:last-child {
          border-bottom: none !important;
        }

        table.purchases-table > tbody > tr > td {
          padding: 12px !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.purchases-table .client-name {
          font-weight: 500 !important;
        }

        table.purchases-table .gym-name {
          color: #ccc !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
