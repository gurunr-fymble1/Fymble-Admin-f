"use client";
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "@/lib/axios";

// Helper function to convert date to IST format (YYYY-MM-DD)
const toISTDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Completed() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [dateCounts, setDateCounts] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch calendar counts on initial load
  useEffect(() => {
    fetchCalendarCounts();
  }, []);

  // Fetch sessions when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchSessionsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchCalendarCounts = async () => {
    try {
      setCalendarLoading(true);
      setError(null);

      // Calculate date range: 30 days back to 30 days forward from today
      const endDateObj = new Date(today);
      endDateObj.setDate(endDateObj.getDate() + 30);
      const endDate = toISTDateString(endDateObj);
      const startDateObj = new Date(today);
      startDateObj.setDate(startDateObj.getDate() - 29);
      const startDate = toISTDateString(startDateObj);

      const response = await axios.get("/api/admin/nutritionist_completed_sessions/calendar/counts", {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });

      if (response.data?.success && response.data?.data?.date_counts) {
        setDateCounts(response.data.data.date_counts);
      }
    } catch (err) {
      console.error("Error fetching calendar counts:", err);
      setError("Failed to load calendar");
      setDateCounts({});
    } finally {
      setCalendarLoading(false);
    }
  };

  const fetchSessionsForDate = async (date) => {
    try {
      setLoading(true);
      setError(null);

      const formattedDate = toISTDateString(date);

      const response = await axios.get("/api/admin/nutritionist_completed_sessions/sessions/by-date", {
        params: {
          target_date: formattedDate
        }
      });

      if (response.data?.success && response.data?.data?.sessions) {
        setSessions(response.data.data.sessions);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate dates from 30 days back to 30 days forward
  const generateCalendarDates = () => {
    const allDates = [];
    const startDate = new Date(today);

    // Go back 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      allDates.push(date);
    }

    // Go forward 30 days (excluding today which is already included)
    for (let i = 1; i <= 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      allDates.push(date);
    }

    // Group by month
    const datesByMonth = {};
    allDates.forEach((date) => {
      const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
      if (!datesByMonth[monthKey]) {
        datesByMonth[monthKey] = {
          month: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          dates: [],
        };
      }
      datesByMonth[monthKey].dates.push(date);
    });

    return Object.values(datesByMonth);
  };

  const monthsData = generateCalendarDates();

  const getSessionCount = (date) => {
    const formattedDate = toISTDateString(date);
    return dateCounts[formattedDate] || 0;
  };

  const handleDateClick = (date) => {
    if (selectedDate && selectedDate.toDateString() === date.toDateString()) {
      setSelectedDate(null);
      setSessions([]);
    } else {
      setSelectedDate(date);
    }
    setExpandedRow(null);
  };

  const isSelected = (date) => {
    return selectedDate && selectedDate.toDateString() === date.toDateString();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (slotTime) => {
    return slotTime; // Already formatted from backend
  };

  const renderMonth = (monthData, monthIndex) => {
    const dates = monthData.dates;
    const weeks = [];
    let currentWeek = [];

    // Add empty slots for the first week
    const firstDay = dates[0].getDay();
    const emptySlots = firstDay;

    for (let i = 0; i < emptySlots; i++) {
      currentWeek.push(null);
    }

    dates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Add remaining dates
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div key={`${monthData.month}-${monthIndex}`} style={{ marginBottom: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#111827",
                margin: 0,
              }}
            >
              {monthData.month}
            </h3>
        </div>

        {/* Week day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day, index) => (
              <div
                key={index}
                style={{
                  textAlign: "center",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                {day}
              </div>
            )
          )}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${monthData.month}-${weekIndex}`}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: "10px",
              }}
            >
              {week.map((date, dateIndex) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${monthData.month}-${weekIndex}-${dateIndex}`}
                      style={{
                        minHeight: "70px",
                      }}
                    />
                  );
                }

                const selected = isSelected(date);
                const isToday = date.toDateString() === today.toDateString();
                const count = getSessionCount(date);
                const isFuture = date > today;

                return (
                  <div
                    key={toISTDateString(date)}
                    onClick={() => !isFuture && handleDateClick(date)}
                    style={{
                      background: selected
                        ? "#10b981"
                        : isToday
                        ? "#f0fdf4"
                        : "#ffffff",
                      border:
                        isToday && !selected
                          ? "2px solid #10b981"
                          : "1px solid #e5e7eb",
                      borderRadius: "12px",
                      padding: "12px 8px",
                      textAlign: "center",
                      cursor: isFuture ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      minHeight: "70px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isFuture ? 0.4 : 1,
                      boxShadow: selected ? "0 4px 6px -1px rgba(16, 185, 129, 0.4)" : "none"
                    }}
                    onMouseEnter={(e) => {
                      if (!selected && !isFuture) {
                        e.currentTarget.style.background = "#f0fdf4";
                        e.currentTarget.style.borderColor = "#10b981";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected && !isFuture) {
                        e.currentTarget.style.background = isToday
                          ? "#f0fdf4"
                          : "#ffffff";
                        e.currentTarget.style.borderColor = isToday ? "#10b981" : "#e5e7eb";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        color: selected
                          ? "white"
                          : "#111827",
                        fontWeight: "600",
                        marginBottom: count > 0 ? "4px" : "0",
                      }}
                    >
                      {date.getDate()}
                    </div>
                    {count > 0 && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: selected ? "#ecfdf5" : "#059669",
                          fontWeight: "600",
                          backgroundColor: selected ? "rgba(255,255,255,0.2)" : "#ecfdf5",
                          padding: "2px 6px",
                          borderRadius: "10px"
                        }}
                      >
                        {count} {count > 1 ? "sessions" : "session"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#10b981" }}>Completed</span> Sessions
        </h2>
      </div>

      {/* Calendar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        {calendarLoading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            Loading calendar...
          </div>
        ) : (
          monthsData.map((monthData, index) => renderMonth(monthData, index))
        )}
      </div>

      {/* Sessions Table */}
      {selectedDate && (
        <div className="table-container">
          <h3
            style={{
              color: "#111827",
              marginBottom: "1rem",
              fontSize: "16px",
              padding: "10px",
              fontWeight: "700"
            }}
          >
            Completed Sessions for {formatDate(selectedDate)}
          </h3>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              Loading sessions...
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#f44" }}>
              {error}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Slot</th>
                    <th>Client Name</th>
                    <th>Duration</th>
                    <th>Interested in Product</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length > 0 ? (
                    sessions.map((session, index) => (
                      <React.Fragment key={session.id}>
                        <tr
                          onClick={() =>
                            setExpandedRow(expandedRow === index ? null : index)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <td>{index + 1}</td>
                          <td>{formatTime(session.slot_time)}</td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: "#10b981",
                                }}
                              />
                              {session.client_name || "-"}
                            </div>
                          </td>
                          <td>{session.meeting_duration} min</td>
                          <td>
                            <span
                              style={{
                                color: session.interested_in_nutrition_product ? "#059669" : "#6b7280",
                                backgroundColor: session.interested_in_nutrition_product
                                  ? "#ecfdf5"
                                  : "#f3f4f6",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            >
                              {session.interested_in_nutrition_product ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            {expandedRow === index ? (
                              <FaChevronUp style={{ color: "#10b981" }} />
                            ) : (
                              <FaChevronDown style={{ color: "#6b7280" }} />
                            )}
                          </td>
                        </tr>
                        {expandedRow === index && session.feedback_advice && (
                          <tr>
                            <td colSpan="6">
                                <div
                                  style={{
                                    background: "#f9fafb",
                                    padding: "1rem",
                                    borderRadius: "8px",
                                    border: "1px solid #e5e7eb"
                                  }}
                                >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#999",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Nutritionist Feedback
                                </div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#374151",
                                    lineHeight: "1.6",
                                    backgroundColor: "#ffffff",
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #e5e7eb"
                                  }}
                                >
                                  {session.feedback_advice}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No completed sessions for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
