"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";

export default function TodaySchedule() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [todayDate, setTodayDate] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [exporting, setExporting] = useState(false);

  const { handleExportTrigger, secureExportProps } = useSecureExport();

  const isFetchingRef = useRef(false);

  const fetchTodaySchedule = useCallback(async (pageNum) => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/admin/purchases/today-schedule", {
        params: {
          page: pageNum,
          limit: 10,
        },
      });

      if (response.data.success) {
        setSchedule(response.data.data.schedule);
        setTodayDate(response.data.data.date);
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message || "Failed to fetch today's schedule");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch today's schedule";
      setError(errorMsg);
      setSchedule([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchTodaySchedule(page);
  }, [page, fetchTodaySchedule]);

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        const response = await axiosInstance.get("/api/admin/purchases/export-today-schedule", {
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
        let filename = "today_schedule.xlsx";
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
        alert("Failed to export today's schedule. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
      case "booked":
        return "#FFA500";
      case "attended":
        return "#4ade80";
      case "missed":
      case "no_show":
        return "#ef4444";
      case "rescheduled":
        return "#3b82f6";
      case "canceled":
        return "#888";
      default:
        return "#ccc";
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case "scheduled":
      case "booked":
      case "available":
        return "Not Scanned";
      case "attended":
        return "Scanned";
      case "missed":
      case "no_show":
        return "Missed";
      case "rescheduled":
        return "Rescheduled";
      case "canceled":
        return "Canceled";
      default:
        return status || "N/A";
    }
  };

  return (
    <div>
      {/* Date Header and Export Button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 style={{ color: "#888", fontSize: "14px", fontWeight: "400", marginBottom: "0" }}>
            Schedule for:
          </h5>
          <p style={{ color: "#fff", fontSize: "18px", fontWeight: "600", marginBottom: "0" }}>
            {todayDate ? formatDate(todayDate) : "Today"}
          </p>
        </div>
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

      {/* Schedule */}
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading schedule...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchTodaySchedule(page)}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No schedule found for today</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table schedule-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Gym Name</th>
                <th>Type</th>
                <th>Days Used</th>
                <th>Scheduled Date</th>
                <th style={{ width: "140px" }}>Status</th>
                {/* <th>Amount</th> */}
                <th>Purchased At</th>
                <th>Platform</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => {
                const isWeeklyPass = item.pack_size && (
                  item.type === "Session"
                    ? (item.pack_size === 5 || item.pack_size === 10 || item.pack_size === 7 || item.pack_size === 14)
                    : (item.pack_size === 7 || item.pack_size === 14)
                );

                const typeLabel = item.type === "Session" && item.session_name
                  ? (item.pack_size === 5 || item.pack_size === 10
                    ? `${item.pack_size} PT Pack`
                    : (item.pack_size === 7 || item.pack_size === 14
                      ? `${item.pack_size} Session Pack`
                      : `Fitness Class - ${item.session_name}`))
                  : (item.pack_size === 7 || item.pack_size === 14
                    ? `${item.pack_size} Day Pack`
                    : item.type);

                return (
                  <tr key={item.id}>
                    <td className="client-name">{item.client_name || "N/A"}</td>
                    <td className="gym-name">{item.gym_name || "N/A"}</td>
                    <td className="type">
                      {isWeeklyPass ? (
                        item.type === 'Daily Pass' ? (
                          <span className="inactive-pack-btn pack-btn-Daily">
                            {typeLabel}
                          </span>
                        ) : (
                          <span className="inactive-pack-btn pack-btn-Session">
                            {typeLabel}
                          </span>
                        )
                      ) : (
                        <span>{typeLabel}</span>
                      )}
                    </td>
                    <td className="days-used">{isWeeklyPass ? (`${item.days_used} / ${item.pack_size}`) : ("N/A")}</td>
                    <td className="scheduled-date">{formatDate(item.scheduled_date)}</td>
                    <td className="status" style={{ textAlign: "center" }}>
                      {item.status ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <span
                            style={{
                              padding: "3px 10px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                              textTransform: "uppercase",
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              color: getStatusColor(item.status),
                              display: "inline-block"
                            }}
                          >
                            {getStatusDisplayText(item.status)}
                          </span>
                          {item.status === "attended" && item.checkin_at && (
                            <span style={{ fontSize: "10px", color: "#888", fontWeight: "500", whiteSpace: "nowrap" }}>
                              {new Date(item.checkin_at).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#666", fontSize: "12px" }}>N/A</span>
                      )}
                    </td>
                    {/* <td className="amount">{formatAmount(item.amount)}</td> */}
                    <td className="purchased-at">{formatDateTime(item.purchased_at)}</td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && schedule.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div style={{ color: "#888", fontSize: "14px" }}>
            Showing {((page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} schedules
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

        table.schedule-table .gym-name {
          color: #ccc !important;
        }

        table.schedule-table .type {
          font-weight: 500 !important;
          min-width: 140px !important;
        }

        table.schedule-table .inactive-pack-btn {
          display: inline-block !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          border-radius: 20px !important;
          text-align: center !important;
          white-space: nowrap !important;
          cursor: default !important;
          user-select: none !important;
        }

        table.schedule-table .pack-btn-Daily {
          background-color: rgba(37, 99, 235, 0.15) !important;
          color: #3b82f6 !important;
          border: 1px solid rgba(59, 130, 246, 0.4) !important;
        }

        table.schedule-table .pack-btn-Session {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
        }

        table.schedule-table .scheduled-date {
          font-weight: 500 !important;
        }

        table.schedule-table .days-total {
          font-weight: 500 !important;
        }

        table.schedule-table .amount {
          font-weight: 600 !important;
          color: #4ade80 !important;
        }

        table.schedule-table .purchased-at {
          font-size: 14px !important;
          color: #888 !important;
        }

        table.schedule-table .status {
          text-align: center !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
