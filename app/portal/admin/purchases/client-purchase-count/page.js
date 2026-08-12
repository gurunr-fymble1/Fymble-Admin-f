"use client";
import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { useRole } from "../../../layout";

export default function ClientPurchaseCountPage() {
  const { role } = useRole();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const { handleExportTrigger, secureExportProps } = useSecureExport();

  const isInitialMount = useRef(true);

  const fetchData = async (pageNum = 1, currentSearch = search) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/purchases/purchase-count-summary", {
        params: {
          page: pageNum,
          limit: 10,
          search: currentSearch || undefined,
        },
      });
      if (res.data.success) {
        setData(res.data.data);
        setPagination({
          ...res.data.pagination,
          page: pageNum,
          hasNext: pageNum < res.data.pagination.totalPages,
          hasPrev: pageNum > 1
        });
      }
    } catch (error) {
      console.error("Error fetching purchase count summary:", error);
    } finally {
      setLoading(false);
    }
  };

  // Restore state on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem("clientPurchaseCountState");
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.isReturning) {
          sessionStorage.removeItem("clientPurchaseCountState");
          setSearch(state.search || "");
          fetchData(state.page || 1, state.search || "");
          isInitialMount.current = false;
          return;
        }
      } catch (e) {
        console.error("Error parsing saved state:", e);
      }
    }

    fetchData(1, search);
    isInitialMount.current = false;
  }, []);

  // Fetch only on search changes (skipping initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }
    fetchData(1, search);
  }, [search]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage, search);
    }
  };

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);
        const response = await axiosInstance.get("/api/admin/purchases/export-purchase-count-summary", {
          params: { search: search || undefined },
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        
        const contentDisposition = response.headers["content-disposition"];
        let filename = `client_purchase_count_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        alert("Failed to export data. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  return (
    <div style={{ minHeight: "80vh", color: "white" }}>
      {/* Header & Search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h5 style={{ color: "#888", fontSize: "14px", fontWeight: "400", marginBottom: "0" }}>
            Viewing:
          </h5>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: "600", marginBottom: "0" }}>
            Client Purchase Counts
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Search name or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #333",
                backgroundColor: "#1a1a1a",
                color: "white",
                width: "250px",
                outline: "none",
                fontSize: "14px",
              }}
            />
          </div>
          {(role === "admin" || role === "support") && (
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              style={{
                backgroundColor: exporting || loading ? "#444" : "#28a745",
                border: "none",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: exporting || loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => { if(!exporting && !loading) e.target.style.backgroundColor = "#218838"}}
              onMouseLeave={(e) => { if(!exporting && !loading) e.target.style.backgroundColor = "#28a745"}}
            >
              <FaDownload />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      {loading && data.length === 0 ? (
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading records...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No records found</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table schedule-table">
            <thead>
              <tr>
                <th style={{ width: "40%" }}>Client Name</th>
                <th style={{ width: "30%" }}>Contact Number</th>
                <th style={{ width: "30%", textAlign: "center" }}>Total Purchases</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr 
                  key={item.client_id}
                  onClick={() => {
                    const currentState = {
                      search,
                      page: pagination.page,
                      isReturning: true
                    };
                    sessionStorage.setItem("clientPurchaseCountState", JSON.stringify(currentState));
                    router.push(`/portal/admin/purchases/client-purchase-count/${item.client_id}?name=${encodeURIComponent(item.client_name)}`);
                  }}
                  style={{ cursor: "pointer" }}
                  className="clickable-row"
                >
                  <td className="client-name">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {item.dp ? (
                        <img
                          src={item.dp}
                          alt=""
                          style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: "#333",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "#888",
                            border: "1px solid #444"
                          }}
                        >
                          {item.client_name?.charAt(0) || "?"}
                        </div>
                      )}
                      <span>{item.client_name}</span>
                    </div>
                  </td>
                  <td style={{ color: "#aaa" }}>{item.client_contact}</td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        backgroundColor: "rgba(255, 87, 87, 0.1)",
                        color: "#FF5757",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontWeight: "600",
                        fontSize: "13px",
                        border: "1px solid rgba(255, 87, 87, 0.2)"
                      }}
                    >
                      {item.total_purchases}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && data.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div style={{ color: "#888", fontSize: "14px" }}>
            Showing {((pagination.page - 1) * 10) + 1} to{" "}
            {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} clients
          </div>
          <div className="btn-group">
            <button
              className="btn btn-sm"
              disabled={!pagination.hasPrev || loading}
              onClick={() => handlePageChange(pagination.page - 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                padding: "6px 14px",
                color: pagination.hasPrev && !loading ? "#fff" : "#555",
                cursor: pagination.hasPrev && !loading ? "pointer" : "not-allowed",
              }}
            >
              Previous
            </button>
            <button
              className="btn btn-sm"
              disabled={!pagination.hasNext || loading}
              onClick={() => handlePageChange(pagination.page + 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                padding: "6px 14px",
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
        table.schedule-table {
          width: 100% !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }

        table.schedule-table > thead {
          background-color: #222 !important;
          border-bottom: 2px solid #FF5757 !important;
        }

        table.schedule-table > thead > tr > th {
          padding: 12px !important;
          font-weight: 600 !important;
          text-align: left !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.schedule-table > tbody > tr {
          border-bottom: 1px solid #333 !important;
          transition: background-color 0.2s ease !important;
          background-color: transparent !important;
        }

        table.schedule-table > tbody > tr:hover {
          background-color: #222 !important;
        }

        table.schedule-table > tbody > tr:last-child {
          border-bottom: none !important;
        }

        table.schedule-table > tbody > tr > td {
          padding: 12px !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.schedule-table .client-name {
          font-weight: 500 !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
