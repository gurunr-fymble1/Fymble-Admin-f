"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function AttendancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role"); // "BDE" or "BDM"

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);

  // Filters
  const [roleFilter, setRoleFilter] = useState(roleParam || "BDE");
  const [timeFilter, setTimeFilter] = useState("today"); // "today", "all", "custom"
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Export States
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTimeFilter, setExportTimeFilter] = useState("all");
  const [exportCustomStartDate, setExportCustomStartDate] = useState("");
  const [exportCustomEndDate, setExportCustomEndDate] = useState("");

  // Add spinner animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [roleFilter, timeFilter, customStartDate, customEndDate]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Build params
      let params = { role: roleFilter };

      // Add date filters based on timeFilter
      if (timeFilter === "custom" && customStartDate && customEndDate) {
        params.start_date = customStartDate;
        params.end_date = customEndDate;
      } else if (timeFilter === "today") {
        const today = new Date().toISOString().split("T")[0];
        params.start_date = today;
        params.end_date = today;
      }
      // For "all", don't add date parameters

      // Fetch all employees attendance
      const response = await axiosInstance.get(
        "/api/admin/marketing/attendance/today",
        { params }
      );

      if (response.data.status === 200) {
        // Sort by highest total_punch_entries (most attendance records first)
        const sortedData = (response.data.data || []).sort(
          (a, b) => (b.total_punch_entries || 0) - (a.total_punch_entries || 0)
        );
        setAttendanceData(sortedData);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch attendance data"
        );
      }
    } catch (err) {
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employeeId, employeeName) => {
    router.push(
      `/portal/admin/marketing/attendance/${employeeId}?name=${encodeURIComponent(
        employeeName
      )}&role=${roleFilter}`
    );
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleRoleChange = (newRole) => {
    setRoleFilter(newRole);
    setTimeFilter("today"); // Reset to today when changing role
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExportAttendance = async () => {
    try {
      setExportLoading(true);

      let params = { role: roleFilter };

      // Add date filters based on exportTimeFilter
      if (exportTimeFilter === "custom") {
        if (!exportCustomStartDate || !exportCustomEndDate) {
          alert("Please select both start and end dates for custom export");
          setExportLoading(false);
          return;
        }
        params.start_date = exportCustomStartDate;
        params.end_date = exportCustomEndDate;
      } else if (exportTimeFilter === "month") {
        const now = new Date();
        params.month = now.getMonth() + 1;
        params.year = now.getFullYear();
      }
      // For "all", don't add date parameters

      const response = await axiosInstance.get(
        "/api/admin/marketing/attendance/export",
        { params }
      );

      if (response.data.status === 200) {
        const { summary, daily_summary, daily } = response.data.data;

        // Dynamically import xlsx library
        const XLSX = await import("xlsx");

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Create Summary Sheet
        const summaryHeaders = [
          "Date",
          "Name",
          "Role",
          "Total Punch Records",
          "Total Duration",
        ];
        const summaryRows = summary.map((row) => [
          row.date,
          row.name,
          row.role,
          row.total_punch_records,
          row.total_duration,
        ]);
        const summaryData = [summaryHeaders, ...summaryRows];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        // Create Daily Summary Sheet
        const dailySummaryHeaders = [
          "Date",
          "Name",
          "Role",
          "Total Punch Records",
          "Total Duration",
        ];
        const dailySummaryRows = daily_summary.map((row) => [
          row.date,
          row.name,
          row.role,
          row.total_punch_records,
          row.total_duration,
        ]);
        const dailySummaryData = [dailySummaryHeaders, ...dailySummaryRows];
        const dailySummarySheet = XLSX.utils.aoa_to_sheet(dailySummaryData);
        XLSX.utils.book_append_sheet(
          workbook,
          dailySummarySheet,
          "Daily Summary"
        );

        // Create Daily Sheet
        const dailyHeaders = [
          "Date",
          "Name",
          "Role",
          "Punch In",
          "Punch Out",
          "Duration",
          "Punch In Address",
          "Punch Out Address",
        ];
        const dailyRows = daily.map((row) => [
          row.date,
          row.name,
          row.role,
          row.punchin_time,
          row.punchout_time,
          row.duration,
          row.punchin_address,
          row.punchout_address,
        ]);
        const dailyData = [dailyHeaders, ...dailyRows];
        const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily");

        // Generate Excel file
        const excelBuffer = XLSX.write(workbook, {
          bookType: "xlsx",
          type: "array",
        });
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Download file
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        let filename = "attendance";
        if (exportTimeFilter === "custom") {
          filename += `_${exportCustomStartDate}_to_${exportCustomEndDate}`;
        } else if (exportTimeFilter === "month") {
          const now = new Date();
          filename += `_${now.getFullYear()}_${(now.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`;
        } else {
          filename += "_all_time";
        }
        filename += ".xlsx";

        link.setAttribute("download", filename);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowExportModal(false);
      } else {
        throw new Error(
          response.data.message || "Failed to export attendance data"
        );
      }
    } catch (err) {
      alert("Failed to export attendance data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="section-container">
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
              <p style={{ fontSize: "14px", color: "#ccc" }}>
                Loading attendance data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Export Modal */}
      {showExportModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#1e1e1e",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "2rem",
              minWidth: "400px",
              maxWidth: "500px",
            }}
          >
            <h3
              style={{
                color: "white",
                marginBottom: "1.5rem",
                fontSize: "18px",
              }}
            >
              Export Attendance Data
            </h3>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "14px",
                  marginBottom: "0.5rem",
                }}
              >
                Time Period
              </label>
              <div
                style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}
              >
                <button
                  onClick={() => setExportTimeFilter("all")}
                  style={{
                    flex: 1,
                    background:
                      exportTimeFilter === "all" ? "#FF5757" : "transparent",
                    border: `1px solid ${
                      exportTimeFilter === "all" ? "#FF5757" : "#444"
                    }`,
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  All Time
                </button>
                <button
                  onClick={() => setExportTimeFilter("month")}
                  style={{
                    flex: 1,
                    background:
                      exportTimeFilter === "month" ? "#FF5757" : "transparent",
                    border: `1px solid ${
                      exportTimeFilter === "month" ? "#FF5757" : "#444"
                    }`,
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Current Month
                </button>
                <button
                  onClick={() => setExportTimeFilter("custom")}
                  style={{
                    flex: 1,
                    background:
                      exportTimeFilter === "custom" ? "#FF5757" : "transparent",
                    border: `1px solid ${
                      exportTimeFilter === "custom" ? "#FF5757" : "#444"
                    }`,
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  Custom
                </button>
              </div>

              {exportTimeFilter === "custom" && (
                <div
                  style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#888",
                        fontSize: "12px",
                        marginBottom: "0.25rem",
                      }}
                    >
                      From Date
                    </label>
                    <input
                      type="date"
                      value={exportCustomStartDate}
                      onChange={(e) => setExportCustomStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#2a2a2a",
                        border: "1px solid #444",
                        color: "white",
                        padding: "8px",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        color: "#888",
                        fontSize: "12px",
                        marginBottom: "0.25rem",
                      }}
                    >
                      To Date
                    </label>
                    <input
                      type="date"
                      value={exportCustomEndDate}
                      onChange={(e) => setExportCustomEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        background: "#2a2a2a",
                        border: "1px solid #444",
                        color: "white",
                        padding: "8px",
                        borderRadius: "6px",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exportLoading}
                style={{
                  background: "transparent",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExportAttendance}
                disabled={exportLoading}
                style={{
                  background: exportLoading ? "#666" : "#FF5757",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: exportLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {exportLoading ? (
                  <>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Exporting...
                  </>
                ) : (
                  "Export"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="section-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={handleBackClick}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                style={{ width: "20px", height: "20px", fill: "#FF5757" }}
              >
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
              </svg>
            </button>
            <h5 className="section-heading" style={{ marginBottom: 0 }}>
              <span style={{ color: "#FF5757" }}>Attendance</span>
            </h5>
          </div>

          {/* Filters + Export */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{
                minWidth: "150px",
                background: "#1e1e1e",
                border: "1px solid #444",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="BDE">All BDEs</option>
              <option value="BDM">All BDMs</option>
            </select>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                minWidth: "120px",
                background: "#1e1e1e",
                border: "1px solid #444",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <option value="today">Today</option>
              <option value="all">All Time</option>
              <option value="custom">Custom</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExportClick}
              style={{
                background: "#FF5757",
                border: "none",
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontSize: "16px" }}>📥</span>
              Export
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {timeFilter === "custom" && (
          <div
            style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "#2a2a2a",
              borderRadius: "8px",
              border: "1px solid #333",
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                From Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1e1e1e",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  color: "#ccc",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                }}
              >
                To Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  width: "100%",
                  background: "#1e1e1e",
                  border: "1px solid #444",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {attendanceData.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#888",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📋</div>
            <h3 style={{ color: "#ccc", marginBottom: "0.5rem" }}>
              No Attendance Records
            </h3>
            <p style={{ fontSize: "14px" }}>
              No attendance records found for the selected filters
            </p>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              overflowY: "visible",
              WebkitOverflowScrolling: "touch",
              msOverflowStyle: "scrollbar",
              border: "1px solid #333",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                minWidth: "1200px",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid #333",
                    color: "#FF5757",
                    background: "#2a2a2a",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      minWidth: "60px",
                      position: "sticky",
                      left: 0,
                      background: "#2a2a2a",
                      zIndex: 1,
                    }}
                  >
                    Rank
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      minWidth: "150px",
                      position: "sticky",
                      left: "60px",
                      background: "#2a2a2a",
                      zIndex: 1,
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      fontWeight: "600",
                      minWidth: "110px",
                    }}
                  >
                    Total Entries
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      minWidth: "130px",
                    }}
                  >
                    Latest Punch In
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      minWidth: "140px",
                    }}
                  >
                    Latest Punch Out
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      textAlign: "left",
                      fontWeight: "600",
                      minWidth: "400px",
                    }}
                  >
                    Punch In Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((employee, index) => (
                  <tr
                    key={employee.employee_id}
                    onClick={() =>
                      handleEmployeeClick(
                        employee.employee_id,
                        employee.employee_name
                      )
                    }
                    style={{
                      borderBottom: "1px solid #2a2a2a",
                      transition: "background-color 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#2a2a2a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "12px 8px",
                        color: "#ccc",
                        position: "sticky",
                        left: 0,
                        background: "inherit",
                        zIndex: 1,
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        color: "white",
                        fontWeight: "500",
                        position: "sticky",
                        left: "60px",
                        background: "inherit",
                        zIndex: 1,
                      }}
                    >
                      {employee.employee_name}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        textAlign: "center",
                        color: "#ccc",
                      }}
                    >
                      {employee.total_punch_entries || 0}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        color: "#ccc",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {employee.latest_punchin_time
                        ? employee.latest_punchin_time
                            .split(" ")[1]
                            .substring(0, 5)
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        color: "#ccc",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {employee.latest_punchout_time
                        ? employee.latest_punchout_time
                            .split(" ")[1]
                            .substring(0, 5)
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px 8px",
                        color: "#ccc",
                        minWidth: "400px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {employee.latest_punchin_address || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
