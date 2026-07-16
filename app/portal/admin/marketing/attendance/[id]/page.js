"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function EmployeeAttendanceHistory() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = params.id;
  const employeeName = searchParams.get("name");
  const role = searchParams.get("role");

  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month"); // "month" or "all"
  const [expandedDates, setExpandedDates] = useState({});

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
    if (employeeId) {
      fetchAttendanceHistory();
    }
  }, [employeeId, timeFilter]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);

      // Calculate date range based on filter
      let params = { role: role };

      if (timeFilter === "month") {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        params.start_date = firstDay.toISOString().split("T")[0];
        params.end_date = lastDay.toISOString().split("T")[0];
      }
      // For "all", don't add date parameters

      const response = await axiosInstance.get(
        `/admin/marketing/attendance/employee/${employeeId}`,
        { params }
      );

      if (response.data.status === 200) {
        setAttendanceData(response.data.data || []);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch attendance history"
        );
      }
    } catch (err) {
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const toggleDateExpansion = (dateKey) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const groupAttendanceByDate = (attendance) => {
    const grouped = {};

    attendance.forEach((record) => {
      const dateField = record.punchin_time || record.created_at;
      if (dateField) {
        // Extract date directly from string "YYYY-MM-DD HH:MM:SS"
        const dateKey = dateField.split(" ")[0]; // YYYY-MM-DD

        if (!grouped[dateKey]) {
          // Format display date from YYYY-MM-DD
          const [year, month, day] = dateKey.split("-");
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const displayDate = `${monthNames[parseInt(month) - 1]} ${parseInt(
            day
          )}, ${year}`;

          grouped[dateKey] = {
            date: dateKey,
            records: [],
            displayDate: displayDate,
          };
        }
        grouped[dateKey].records.push(record);
      }
    });

    // Convert to array and sort by date string (newest first)
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    // Extract time from "YYYY-MM-DD HH:MM:SS" format
    const timePart = timeString.split(" ")[1]; // HH:MM:SS
    return timePart ? timePart.substring(0, 5) : "-"; // HH:MM
  };

  const formatDuration = (record) => {
    if (!record.punchin_time || !record.punchout_time) return "-";

    // Parse "YYYY-MM-DD HH:MM:SS" format
    const parseTime = (timeStr) => {
      const [date, time] = timeStr.split(" ");
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute, second] = time.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute, second).getTime();
    };

    const punchInMs = parseTime(record.punchin_time);
    const punchOutMs = parseTime(record.punchout_time);
    const durationMs = punchOutMs - punchInMs;
    const minutes = Math.floor(durationMs / (1000 * 60));

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const calculateTotalDuration = (attendance) => {
    let totalMinutes = 0;

    const parseTime = (timeStr) => {
      const [date, time] = timeStr.split(" ");
      const [year, month, day] = date.split("-").map(Number);
      const [hour, minute, second] = time.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute, second).getTime();
    };

    attendance.forEach((record) => {
      // Only calculate for records with both punch in and punch out
      if (!record.punchin_time || !record.punchout_time) return;

      const punchInMs = parseTime(record.punchin_time);
      const punchOutMs = parseTime(record.punchout_time);
      const durationMs = punchOutMs - punchInMs;
      const minutes = Math.floor(durationMs / (1000 * 60));

      totalMinutes += minutes;
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getLocationText = (location) => {
    if (!location) return { text: "-", url: null };

    let text, url;

    if (typeof location === "string") {
      text = location;
      url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    } else if (location.lat && location.lng) {
      text = location.address || `${location.lat}, ${location.lng}`;
      // Use direct coordinates link for exact location
      url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    } else if (location.address) {
      text = location.address;
      url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    } else {
      return { text: "-", url: null };
    }

    return { text, url };
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
                Loading attendance history...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groupedData = groupAttendanceByDate(attendanceData);

  return (
    <div className="dashboard-container">
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
                background: "transparent",
                border: "1px solid #444",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
              }}
            >
              ←
            </button>
            <div>
              <h5
                className="section-heading"
                style={{ marginBottom: "0.25rem" }}
              >
                <span style={{ color: "#FF5757" }}>
                  {employeeName || "Employee"}
                </span>{" "}
                Attendance
              </h5>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                {attendanceData.length} record
                {attendanceData.length !== 1 ? "s" : ""} found
              </p>
              <p
                style={{
                  fontSize: "13px",
                  color: "#FF5757",
                  margin: 0,
                  marginTop: "0.25rem",
                  fontWeight: "600",
                }}
              >
                Total Duration: {calculateTotalDuration(attendanceData)}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setTimeFilter("month")}
              style={{
                background: timeFilter === "month" ? "#FF5757" : "transparent",
                border: `1px solid ${
                  timeFilter === "month" ? "#FF5757" : "#444"
                }`,
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: timeFilter === "month" ? "600" : "400",
              }}
            >
              Current Month
            </button>
            <button
              onClick={() => setTimeFilter("all")}
              style={{
                background: timeFilter === "all" ? "#FF5757" : "transparent",
                border: `1px solid ${
                  timeFilter === "all" ? "#FF5757" : "#444"
                }`,
                color: "white",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: timeFilter === "all" ? "600" : "400",
              }}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Attendance Records by Date */}
        {groupedData.length === 0 ? (
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
              {timeFilter === "month"
                ? "No attendance records found for the current month"
                : "No attendance records found"}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {groupedData.map((dateGroup) => {
              const isExpanded = expandedDates[dateGroup.date];
              const recordCount = dateGroup.records.length;

              return (
                <div
                  key={dateGroup.date}
                  style={{
                    background: "#2a2a2a",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #333",
                  }}
                >
                  {/* Date Header */}
                  <div
                    onClick={() => toggleDateExpansion(dateGroup.date)}
                    style={{
                      padding: "1rem",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: isExpanded ? "1px solid #333" : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "white",
                          fontWeight: "600",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {dateGroup.displayDate}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {recordCount} record{recordCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ color: "#FF5757", fontSize: "20px" }}>
                      {isExpanded ? "▲" : "▼"}
                    </div>
                  </div>

                  {/* Expandable Records */}
                  {isExpanded && (
                    <div style={{ padding: "1rem", background: "#1e1e1e" }}>
                      {dateGroup.records.map((record, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#2a2a2a",
                            borderRadius: "6px",
                            padding: "1rem",
                            marginBottom:
                              idx < dateGroup.records.length - 1
                                ? "0.75rem"
                                : "0",
                            border: "1px solid #333",
                          }}
                        >
                          {/* Record Status */}
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.75rem",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #333",
                            }}
                          >
                            <span
                              style={{
                                background: record.punchout_time
                                  ? "#2d4a2d"
                                  : "#4a4a2d",
                                color: record.punchout_time
                                  ? "#90EE90"
                                  : "#FFD700",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              {record.punchout_time
                                ? "✓ Completed"
                                : "⏱ Active"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#888" }}>
                              #{dateGroup.records.length - idx}
                            </span>
                          </div>

                          {/* Record Details */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.5rem",
                            }}
                          >
                            <div style={{ display: "flex", fontSize: "14px" }}>
                              <span
                                style={{ color: "#888", minWidth: "140px" }}
                              >
                                Punch In:
                              </span>
                              <span style={{ color: "#ccc" }}>
                                {formatTime(record.punchin_time)}
                              </span>
                            </div>
                            <div style={{ display: "flex", fontSize: "14px" }}>
                              <span
                                style={{ color: "#888", minWidth: "140px" }}
                              >
                                Punch Out:
                              </span>
                              <span style={{ color: "#ccc" }}>
                                {record.punchout_time
                                  ? formatTime(record.punchout_time)
                                  : "Still active"}
                              </span>
                            </div>
                            <div style={{ display: "flex", fontSize: "14px" }}>
                              <span
                                style={{ color: "#888", minWidth: "140px" }}
                              >
                                Duration:
                              </span>
                              <span style={{ color: "#ccc" }}>
                                {formatDuration(record)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                fontSize: "14px",
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                style={{ color: "#888", minWidth: "140px" }}
                              >
                                Punch In Location:
                              </span>
                              {(() => {
                                const location = getLocationText(
                                  record.punchin_location
                                );
                                return location.url ? (
                                  <a
                                    href={location.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#4A9EFF",
                                      flex: 1,
                                      textDecoration: "none",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.target.style.textDecoration =
                                        "underline")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.target.style.textDecoration = "none")
                                    }
                                  >
                                    {location.text}
                                  </a>
                                ) : (
                                  <span style={{ color: "#ccc", flex: 1 }}>
                                    {location.text}
                                  </span>
                                );
                              })()}
                            </div>
                            {record.punchout_location && (
                              <div
                                style={{
                                  display: "flex",
                                  fontSize: "14px",
                                  alignItems: "flex-start",
                                }}
                              >
                                <span
                                  style={{ color: "#888", minWidth: "140px" }}
                                >
                                  Punch Out Location:
                                </span>
                                {(() => {
                                  const location = getLocationText(
                                    record.punchout_location
                                  );
                                  return location.url ? (
                                    <a
                                      href={location.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        color: "#4A9EFF",
                                        flex: 1,
                                        textDecoration: "none",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) =>
                                        (e.target.style.textDecoration =
                                          "underline")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.target.style.textDecoration = "none")
                                      }
                                    >
                                      {location.text}
                                    </a>
                                  ) : (
                                    <span style={{ color: "#ccc", flex: 1 }}>
                                      {location.text}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
