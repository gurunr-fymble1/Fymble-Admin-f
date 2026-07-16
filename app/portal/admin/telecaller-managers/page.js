"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { FaSearch, FaPhone, FaChevronRight, FaDownload, FaTimes } from "react-icons/fa";

function exportToCSV(data, filename) {
  const rows = [];

  // Header — GYM columns first, then CLIENT columns
  rows.push([
    "Telecaller Name",
    "Mobile Number",
    "Manager",
    // Gym section
    "Gym Total",
    "Gym Interested",
    "Gym Converted",
    "Gym Rejected",
    "Gym Follow Up",
    "Gym No Response",
    "Gym Not Interested",
    "Gym Contacted",
    "Gym Out of Service",
    "Gym Closed",
    // Client section
    "Client Total",
    "Client Interested",
    "Client Converted",
    "Client Not Interested",
    "Client Follow Up",
    "Client Callback",
    "Client No Answer",
  ]);

  for (const tc of data) {
    const g = tc.summary.gym_calls;
    const c = tc.summary.client_calls;
    rows.push([
      tc.name,
      tc.mobile_number,
      tc.manager_name || "",
      // Gym
      g.total,
      g.interested,
      g.converted,
      g.rejected,
      g.follow_up,
      g.no_response,
      g.not_interested,
      g.contacted,
      g.out_of_service,
      g.closed,
      // Client
      c.total,
      c.interested,
      c.converted,
      c.not_interested,
      c.follow_up,
      c.callback,
      c.no_answer,
    ]);
  }

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TelecallerManagers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredManagers, setFilteredManagers] = useState([]);

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFilter, setExportFilter] = useState("today");
  const [exportDate, setExportDate] = useState(today());
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportStartDate, setExportStartDate] = useState(today());
  const [exportEndDate, setExportEndDate] = useState(today());

  // Security Verification Flow Hook
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/admin/telecaller-managers/list");

        if (response.data.success) {
          setManagers(response.data.data.managers || []);
          setFilteredManagers(response.data.data.managers || []);
        }
      } catch (error) {
        console.error("Error fetching managers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = managers.filter((manager) =>
        manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manager.mobile_number.includes(searchTerm)
      );
      setFilteredManagers(filtered);
    } else {
      setFilteredManagers(managers);
    }
  }, [searchTerm, managers]);

  const handleExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        const params = { date_filter: exportFilter };
        if (exportFilter === "date") params.date = exportDate;
        if (exportFilter === "month") {
          params.month = exportMonth;
          params.year = exportYear;
        }
        if (exportFilter === "custom") {
          params.start_date = exportStartDate;
          params.end_date = exportEndDate;
        }

        const response = await axiosInstance.get("/api/admin/telecaller-activity/daily-report", { params });

        if (response.data.success) {
          const { telecallers, date_range } = response.data.data;
          const filename = `telecaller-activity-${date_range.replace(/ /g, "_")}.csv`;
          exportToCSV(telecallers, filename);
          setShowExportModal(false);
        }
      } catch (error) {
        console.error("Export failed:", error);
        alert("Export failed. Please try again.");
      } finally {
        setExporting(false);
      }
    });
  };

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Stats Summary */}
        <div style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap"
        }}>
          <div style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            minWidth: "200px",
            flex: 1,
          }}>
            <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
              Total Managers
            </div>
            <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
              {managers.length}
            </div>
          </div>
        </div>

        {/* Search Bar + Export Button */}
        <div style={{
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div style={{
            position: "relative",
            flex: 1,
            minWidth: "300px",
            maxWidth: "500px"
          }}>
            <FaSearch
              style={{
                position: "absolute",
                left: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#888"
              }}
            />
            <input
              type="text"
              placeholder="Search by name or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px 12px 45px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={() => setShowExportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              backgroundColor: "#FF5757",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <FaDownload style={{ fontSize: "13px" }} />
            Export Activity
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "40px",
          }}>
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
              <p style={{ fontSize: "14px", color: "#ccc" }}>
                Loading managers...
              </p>
            </div>
          </div>
        ) : (
          /* Table */
          <div style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #333"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#2a2a2a",
                    borderBottom: "1px solid #333"
                  }}>
                    <th style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ccc",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ccc",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Mobile Number
                    </th>
                    <th style={{
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ccc",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Team Count
                    </th>
                    <th style={{ width: "50px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{
                        padding: "60px",
                        textAlign: "center",
                        color: "#888"
                      }}>
                        <div style={{ marginBottom: "16px" }}>
                          <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ opacity: 0.3 }}
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                              fill="#888"
                            />
                          </svg>
                        </div>
                        <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                          {searchTerm ? "No managers found" : "No managers found"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Managers will appear here"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredManagers.map((manager, index) => (
                      <tr
                        key={manager.id}
                        style={{
                          borderBottom: index !== filteredManagers.length - 1 ? "1px solid #333" : "none",
                          transition: "background-color 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={() => router.push(`/portal/admin/telecaller-managers/${manager.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a2a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "16px", color: "#ccc" }}>
                          {manager.name}
                        </td>
                        <td style={{ padding: "16px", color: "#ccc" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            <FaPhone style={{ color: "#FF5757", fontSize: "12px" }} />
                            {manager.mobile_number}
                          </div>
                        </td>
                        <td style={{
                          padding: "16px",
                          textAlign: "center",
                          color: "#ccc"
                        }}>
                          <span style={{
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            color: "#f59e0b",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}>
                            {manager.team_count || 0}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <FaChevronRight style={{ color: "#666", fontSize: "12px" }} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "12px",
            border: "1px solid #333",
            padding: "28px",
            width: "420px",
            maxWidth: "90vw",
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#fff" }}>
                Export Activity Report
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Date Filter Selector */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>
                Date Range
              </label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["today", "date", "week", "month", "custom"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setExportFilter(f)}
                    style={{
                      padding: "7px 14px",
                      borderRadius: "6px",
                      border: "1px solid",
                      fontSize: "13px",
                      cursor: "pointer",
                      borderColor: exportFilter === f ? "#FF5757" : "#444",
                      backgroundColor: exportFilter === f ? "rgba(255,87,87,0.15)" : "#2a2a2a",
                      color: exportFilter === f ? "#FF5757" : "#ccc",
                      textTransform: "capitalize",
                    }}
                  >
                    {f === "date" ? "Specific Date" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional inputs */}
            {exportFilter === "date" && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={exportDate}
                  onChange={(e) => setExportDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    color: "white",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {exportFilter === "month" && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>Month</label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  >
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>Year</label>
                  <input
                    type="number"
                    value={exportYear}
                    onChange={(e) => setExportYear(Number(e.target.value))}
                    min="2020"
                    max="2099"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {exportFilter === "custom" && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>Start Date</label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", color: "#888", fontSize: "13px", marginBottom: "8px" }}>End Date</label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "14px",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: exporting ? "#444" : "#FF5757",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: exporting ? "not-allowed" : "pointer",
                }}
              >
                <FaDownload style={{ fontSize: "12px" }} />
                {exporting ? "Exporting..." : "Download CSV"}
              </button>
            </div>
          </div>
        </div>
      )}
      <SecureExportModal {...secureExportProps} />
    </div>
  );
}
