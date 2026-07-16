"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";

export default function AIDietCoach() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const { handleExportTrigger, secureExportProps } = useSecureExport();

  const isFetchingRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPurchases = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const params = { page: currentPage, limit: 10 };
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await axiosInstance.get("/api/admin/purchases/ai-diet-coach", { params });

      if (response.data.success) {
        setPurchases(response.data.data.purchases);
        setTotalPurchases(response.data.data.total);
      } else {
        throw new Error(response.data.message || "Failed to fetch AI diet coach purchases");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch AI diet coach purchases";
      setError(errorMsg);
      setPurchases([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [debouncedSearchTerm, currentPage, startDate, endDate]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        const params = {};
        if (debouncedSearchTerm) params.search = debouncedSearchTerm;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await axiosInstance.get("/api/admin/purchases/export-ai-diet-coach", {
          params,
          responseType: "blob",
        });

        const url = window.URL.createObjectURL(
          new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          })
        );
        const link = document.createElement("a");
        link.href = url;

        const contentDisposition = response.headers["content-disposition"];
        let filename = "ai_diet_coach.xlsx";
        if (contentDisposition) {
          const match = contentDisposition.match(/filename=(.+)/);
          if (match && match[1]) filename = match[1].replace(/"/g, "");
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export AI diet coach purchases. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(totalPurchases / 10);

  return (
    <div>
      {/* ── Filters Card ── */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Row 1: Search + Export */}
        <div className="d-flex gap-3 align-items-center" style={{ marginBottom: "15px" }}>
          {/* Search */}
          <div className="input-group flex-grow-1" style={{ maxWidth: "320px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by client name or mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ backgroundColor: "#222", border: "1px solid #333", color: "#fff" }}
            />
            <button
              className="btn"
              type="button"
              style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
            >
              Search
            </button>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Export */}
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

        {/* Row 2: Date Filters */}
        <div className="d-flex gap-3 align-items-center flex-wrap">
          <span style={{ color: "#888", fontSize: "14px" }}>From:</span>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            style={{ backgroundColor: "#222", border: "1px solid #333", color: "#fff", width: "140px" }}
          />
          <span style={{ color: "#888", fontSize: "14px", marginLeft: "8px" }}>To:</span>
          <input
            type="date"
            className="form-control"
            value={endDate}
            min={startDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            style={{ backgroundColor: "#222", border: "1px solid #333", color: "#fff", width: "140px" }}
          />
          {(startDate || endDate || searchTerm) && (
            <button
              className="btn btn-sm"
              onClick={() => { setSearchTerm(""); setStartDate(""); setEndDate(""); setCurrentPage(1); }}
              style={{ backgroundColor: "#333", border: "1px solid #444", color: "#aaa", fontSize: "13px" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table Area ── */}
      {loading ? (
        <div className="text-center py-5">
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3a3a3a",
              borderTop: "4px solid #06b6d4",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          />
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading AI diet coach purchases...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchPurchases()}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No AI diet coach purchases found</p>
        </div>
      ) : (
        <>
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table purchases-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client Name</th>
                  <th>Contact</th>
                  <th>Purchased Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: "#666", fontSize: "13px" }}>
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>
                    <td className="client-name">{item.client_name || "N/A"}</td>
                    <td className="client-contact">{item.mobile || "N/A"}</td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>{formatDate(item.purchased_date)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>
                        ₹{item.amount?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div style={{ color: "#888", fontSize: "14px" }}>
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, totalPurchases)} of {totalPurchases} entries
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
        </>
      )}

      <SecureExportModal {...secureExportProps} />

      <style jsx global>{`
        .table-responsive { overflow-x: auto !important; position: relative !important; }
        table.purchases-table { width: 100% !important; min-width: 700px !important; border-collapse: separate !important; border-spacing: 0 !important; background-color: #1a1a1a !important; color: #fff !important; border-radius: 8px !important; overflow: hidden !important; }
        table.purchases-table > thead { background-color: #222 !important; border-bottom: 2px solid #06b6d4 !important; }
        table.purchases-table > thead > tr > th { padding: 12px !important; font-weight: 600 !important; text-align: left !important; color: #fff !important; border: none !important; background-color: transparent !important; }
        table.purchases-table > tbody > tr { border-bottom: 1px solid #333 !important; transition: background-color 0.2s ease !important; background-color: transparent !important; }
        table.purchases-table > tbody > tr:hover { background-color: #222 !important; }
        table.purchases-table > tbody > tr:last-child { border-bottom: none !important; }
        table.purchases-table > tbody > tr > td { padding: 12px !important; color: #fff !important; border: none !important; background-color: transparent !important; }
        table.purchases-table .client-name { font-weight: 500 !important; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      `}</style>
    </div>
  );
}
