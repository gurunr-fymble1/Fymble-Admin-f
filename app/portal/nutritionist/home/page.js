"use client";
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp, FaEdit, FaClock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";

// Helper function to convert date to IST format (YYYY-MM-DD)
// Since the database stores dates in IST, we need to format them correctly
const toISTDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse 24-hour time "HH:MM" to 12-hour components
const parse24h = (val) => {
  if (!val) return { hour: 10, minute: 0, ampm: "AM" };
  const [hStr, mStr] = val.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour: h, minute: m, ampm };
};

// Format 12-hour components back to 24-hour time "HH:MM"
const to24h = (h, m, ampm) => {
  let hour24 = h;
  if (ampm === "PM" && h !== 12) hour24 += 12;
  if (ampm === "AM" && h === 12) hour24 = 0;
  return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Clock-based Time Picker Component
const ClockTimePicker = ({ value, onChange, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("hours"); // "hours" or "minutes"

  const { hour, minute, ampm } = parse24h(value);

  const handleSelectHour = (h) => {
    const newVal = to24h(h, minute, ampm);
    onChange(newVal);
    setMode("minutes"); // Auto-switch to minutes for faster selection
  };

  const handleSelectMinute = (m) => {
    const newVal = to24h(hour, m, ampm);
    onChange(newVal);
  };

  const handleToggleAmPm = (newAmPm) => {
    const newVal = to24h(hour, minute, newAmPm);
    onChange(newVal);
  };

  const displayValue = value ? (() => {
    const { hour: h, minute: m, ampm: ap } = parse24h(value);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`;
  })() : "";

  // Pointer angles
  const handAngle = mode === "hours" ? (hour % 12) * 30 : minute * 6;
  const tipAngle = mode === "hours"
    ? (hour % 12) * 30 * Math.PI / 180
    : (Math.round(minute / 5) * 5 % 60) * 6 * Math.PI / 180;
  const tipR = 70;
  const tipX = 100 + tipR * Math.sin(tipAngle);
  const tipY = 100 - tipR * Math.cos(tipAngle);

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          readOnly
          value={displayValue}
          onClick={() => {
            setIsOpen(true);
            setMode("hours");
          }}
          placeholder="Select time"
          style={{
            width: "100%",
            background: "#ffffff",
            border: "1px solid #d1d5db",
            color: "#111827",
            padding: "10px 36px 10px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        />
        <FaClock
          style={{
            position: "absolute",
            right: "12px",
            color: "#9ca3af",
            pointerEvents: "none"
          }}
        />
      </div>
      
      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: align === "left" ? 0 : "auto",
              right: align === "right" ? 0 : "auto",
              marginBottom: "8px",
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "16px",
              zIndex: 10000,
              width: "250px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Header: Displays selected hour and minute */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "20px", fontWeight: "700" }}>
              <span
                onClick={() => setMode("hours")}
                style={{
                  color: mode === "hours" ? "#10b981" : "#4b5563",
                  cursor: "pointer",
                  padding: "4px 8px",
                  background: mode === "hours" ? "#ecfdf5" : "transparent",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
              >
                {String(hour).padStart(2, '0')}
              </span>
              <span style={{ color: "#9ca3af" }}>:</span>
              <span
                onClick={() => setMode("minutes")}
                style={{
                  color: mode === "minutes" ? "#10b981" : "#4b5563",
                  cursor: "pointer",
                  padding: "4px 8px",
                  background: mode === "minutes" ? "#ecfdf5" : "transparent",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
              >
                {String(minute).padStart(2, '0')}
              </span>
              
              {/* AM/PM toggle */}
              <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "6px", padding: "2px", marginLeft: "12px" }}>
                <button
                  onClick={() => handleToggleAmPm("AM")}
                  style={{
                    border: "none",
                    background: ampm === "AM" ? "#ffffff" : "transparent",
                    color: ampm === "AM" ? "#10b981" : "#6b7280",
                    fontWeight: "600",
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: ampm === "AM" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  AM
                </button>
                <button
                  onClick={() => handleToggleAmPm("PM")}
                  style={{
                    border: "none",
                    background: ampm === "PM" ? "#ffffff" : "transparent",
                    color: ampm === "PM" ? "#10b981" : "#6b7280",
                    fontWeight: "600",
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    boxShadow: ampm === "PM" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Circular Clock Face */}
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "#f3f4f6",
                position: "relative",
                marginBottom: "12px",
              }}
            >
              {/* Center point */}
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                }}
              />

              {/* Clock hand */}
              <div
                style={{
                  width: "2px",
                  height: "70px",
                  background: "#10b981",
                  position: "absolute",
                  bottom: "50%",
                  left: "calc(50% - 1px)",
                  transformOrigin: "bottom center",
                  transform: `rotate(${handAngle}deg)`,
                  zIndex: 4,
                }}
              />

              {/* Hand indicator tip */}
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "2px solid #10b981",
                  position: "absolute",
                  left: `${tipX}px`,
                  top: `${tipY}px`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 3,
                  pointerEvents: "none",
                }}
              />

              {/* Render Numbers */}
              {(mode === "hours" ? hoursList : minutesList).map((num, idx) => {
                const angle = (idx * 30) * Math.PI / 180;
                const r = 70; // radius of number centers
                const x = 100 + r * Math.sin(angle);
                const y = 100 - r * Math.cos(angle);
                const isSelected = mode === "hours" ? hour === num : minute === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => mode === "hours" ? handleSelectHour(num) : handleSelectMinute(num)}
                    style={{
                      position: "absolute",
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      border: "none",
                      background: isSelected ? "#10b981" : "transparent",
                      color: isSelected ? "#ffffff" : "#1f2937",
                      fontSize: "12px",
                      fontWeight: isSelected ? "700" : "500",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 6,
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "#e5e7eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {mode === "minutes" ? String(num).padStart(2, '0') : num}
                  </button>
                );
              })}
            </div>
            
            {/* Done button */}
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#10b981",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 8px"
                }}
              >
                DONE
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nutritionist_selected_date");
      if (saved) {
        const parsed = new Date(saved);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
    }
    return null;
  });
  const [sessions, setSessions] = useState([]);
  const [dateCounts, setDateCounts] = useState({}); // Store session counts per date
  const [dateRescheduled, setDateRescheduled] = useState({}); // Track which dates have rescheduled sessions
  const [expandedRow, setExpandedRow] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(false); // Loading state for date details
  const [error, setError] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: "",
    time: "",
    reason: "",
  });
  const [completionData, setCompletionData] = useState({
    duration: "",
    feedback: "",
    interestedInProduct: "",
    dietTemplateId: "",
    notes: "",
  });
  const [dietTemplates, setDietTemplates] = useState([]);
  const [dietTemplatesLoaded, setDietTemplatesLoaded] = useState(false);

  // Create Session state
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false);
  const [createSessionStep, setCreateSessionStep] = useState(1); // 1 = select user, 2 = schedule
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [eligibleMembersLoading, setEligibleMembersLoading] = useState(false);
  const [eligibleMembersSearch, setEligibleMembersSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [createSessionData, setCreateSessionData] = useState({ startTime: "", endTime: "", scheduleId: null });
  const [createSessionSubmitting, setCreateSessionSubmitting] = useState(false);

  // New plan-based client and weekly schedules states
  const [activeTab, setActiveTab] = useState("membership"); // "membership" or "plan"
  const [planMembers, setPlanMembers] = useState([]);
  const [planMembersLoading, setPlanMembersLoading] = useState(false);
  const [memberType, setMemberType] = useState("membership"); // "membership" or "plan"
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch session counts for calendar - extracted as reusable function
  const fetchCalendarCounts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range: today to 30 days ahead (using IST format)
      const startDate = toISTDateString(today);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = toISTDateString(endDate);

      const response = await axios.get("/api/admin/nutritionist_sessions/calendar/counts", {
        params: {
          start_date: startDate,
          end_date: endDateStr,
          _t: Date.now(),
        },
      });

      if (response.data?.success && response.data?.data?.date_counts) {
        setDateCounts(response.data.data.date_counts);
        setDateRescheduled(response.data.data.date_rescheduled || {});
      } else {
        setDateCounts({});
        setDateRescheduled({});
      }
    } catch (err) {
      console.error("Error fetching calendar counts:", err);
      setError("Failed to load calendar. Please try again.");
      setDateCounts({});
      setDateRescheduled({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch session counts for calendar on initial load
  useEffect(() => {
    fetchCalendarCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch diet templates for the nutritionist
  const fetchDietTemplates = async () => {
    try {
      const response = await axios.get("/api/admin/nutritionist_diet_templates/list");
      if (response.data?.success && response.data?.data?.templates) {
        setDietTemplates(response.data.data.templates);
      }
    } catch (err) {
      console.error("Error fetching diet templates:", err);
    }
  };


  // Fetch eligible members for Create Session
  const fetchEligibleMembers = async (searchTerm = "") => {
    try {
      setEligibleMembersLoading(true);
      const params = { _t: Date.now() };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await axios.get("/api/admin/nutritionist_sessions/eligible-members", { params });
      if (response.data?.success && response.data?.data?.members) {
        setEligibleMembers(response.data.data.members);
      } else {
        setEligibleMembers([]);
      }
    } catch (err) {
      console.error("Error fetching eligible members:", err);
      setEligibleMembers([]);
    } finally {
      setEligibleMembersLoading(false);
    }
  };

  // Fetch eligible plan members for Create Session
  const fetchEligiblePlanMembers = async (searchTerm = "") => {
    try {
      setPlanMembersLoading(true);
      const params = { _t: Date.now() };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await axios.get("/api/admin/nutritionist_sessions/eligible-plan-members", { params });
      if (response.data?.success && response.data?.data?.members) {
        const filtered = response.data.data.members.filter(
          m => !m.plan_name?.toLowerCase().startsWith("gym membership")
        );
        setPlanMembers(filtered);
      } else {
        setPlanMembers([]);
      }
    } catch (err) {
      console.error("Error fetching plan members:", err);
      setPlanMembers([]);
    } finally {
      setPlanMembersLoading(false);
    }
  };

  // Fetch nutritionist weekly schedules
  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true);
      const response = await axios.get("/api/admin/nutritionist_sessions/schedules", {
        params: { _t: Date.now() }
      });
      if (response.data?.success && response.data?.data?.schedules) {
        setSchedules(response.data.data.schedules);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleOpenCreateSession = () => {
    setShowCreateSessionModal(true);
    setCreateSessionStep(1);
    setSelectedMember(null);
    setEligibleMembersSearch("");
    setCreateSessionData({ startTime: "", endTime: "", scheduleId: null });
    setActiveTab("membership");
    setMemberType("membership");
    fetchEligibleMembers();
    fetchEligiblePlanMembers();
    fetchSchedules();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEligibleMembersSearch("");
    if (tab === "membership") {
      fetchEligibleMembers();
    } else {
      fetchEligiblePlanMembers();
    }
  };

  const handleSelectMember = (member, type) => {
    setSelectedMember(member);
    setMemberType(type);
    setCreateSessionStep(2);
    setCreateSessionData({ startTime: "", endTime: "", scheduleId: null });
  };

  const handleStartTimeChange = (timeVal) => {
    setCreateSessionData(prev => {
      let endTime = "";
      if (timeVal) {
        const [h, m] = timeVal.split(":").map(Number);
        const endDate = new Date(2000, 0, 1, h, m + 30);
        endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      }
      return { ...prev, startTime: timeVal, endTime };
    });
  };

  const handleSlotChange = (slotId) => {
    if (!slotId) {
      setCreateSessionData({ startTime: "", endTime: "", scheduleId: null });
      return;
    }
    const slot = schedules.find(s => s.id === parseInt(slotId));
    if (slot) {
      setCreateSessionData({
        startTime: slot.start_time,
        endTime: slot.end_time,
        scheduleId: slot.id
      });
    }
  };

  const submitCreateSession = async () => {
    if (!selectedMember || !createSessionData.startTime || !createSessionData.endTime || !selectedDate) {
      alert("Please fill all required fields.");
      return;
    }
    if (memberType === "plan" && !createSessionData.scheduleId) {
      alert("Please select a valid schedule slot.");
      return;
    }
    try {
      setCreateSessionSubmitting(true);
      let response;
      if (memberType === "plan") {
        response = await axios.post("/api/admin/nutritionist_sessions/create-plan-session", {
          eligibility_id: selectedMember.eligibility_id,
          client_id: selectedMember.client_id,
          booking_date: toISTDateString(selectedDate),
          start_time: createSessionData.startTime,
          end_time: createSessionData.endTime,
          schedule_id: createSessionData.scheduleId,
        });
      } else {
        response = await axios.post("/api/admin/nutritionist_sessions/create-membership-session", {
          payment_id: selectedMember.payment_id,
          client_id: selectedMember.client_id,
          booking_date: toISTDateString(selectedDate),
          start_time: createSessionData.startTime,
          end_time: createSessionData.endTime,
        });
      }
      if (response.data?.success) {
        alert("Session created successfully!");
        setShowCreateSessionModal(false);
        await fetchCalendarCounts();
        if (selectedDate) {
          const currentDate = selectedDate;
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(currentDate), 0);
        }
      }
    } catch (err) {
      console.error("Error creating session:", err);
      alert(err.response?.data?.detail || "Failed to create session. Please try again.");
    } finally {
      setCreateSessionSubmitting(false);
    }
  };

  // Fetch sessions for a specific date when clicked
  useEffect(() => {
    const fetchSessionsForDate = async () => {
      if (!selectedDate) return;

      try {
        setSessionsLoading(true);
        const formattedDate = toISTDateString(selectedDate);

        const response = await axios.get("/api/admin/nutritionist_sessions/sessions/by-date", {
          params: {
            target_date: formattedDate,
            _t: Date.now(),
          },
        });

        if (response.data?.success && response.data?.data?.sessions) {
          setSessions(response.data.data.sessions);
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.error("Error fetching sessions for date:", err);
        setSessions([]);
      } finally {
        setSessionsLoading(false);
      }
    };

    fetchSessionsForDate();
  }, [selectedDate]);

  // Generate 30 days from today
  const generateCalendarDates = () => {
    const allDates = [];
    const startDate = new Date(today);

    for (let i = 0; i < 30; i++) {
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
      localStorage.removeItem("nutritionist_selected_date");
      setSessions([]);
    } else {
      setSelectedDate(date);
      localStorage.setItem("nutritionist_selected_date", date.toISOString());
    }
    setExpandedRow(null);
  };

  const isSelected = (date) => {
    return selectedDate && selectedDate.toDateString() === date.toDateString();
  };

  const handleGenerateLink = async (sessionId) => {
    try {
      // Call the backend API to generate Zoom meeting link
      const response = await axios.post("/api/admin/nutritionist_sessions/generate-meeting-link", {
        booking_id: sessionId
      });

      if (response.data?.success) {
        // Update the session with the generated meeting link (keep the same status)
        const updatedSessions = sessions.map((session) =>
          session.id === sessionId
            ? { ...session, meeting_link: response.data.data.meeting_link }
            : session
        );
        setSessions(updatedSessions);
        alert("Meeting link generated successfully!");
      }
    } catch (err) {
      console.error("Error generating link:", err);
      alert("Failed to generate meeting link. Please try again.");
    }
  };

  const handleReschedule = (session) => {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  };

  const submitReschedule = async () => {
    if (!rescheduleData.date || !rescheduleData.time || !rescheduleData.reason) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Call the reschedule API
      const response = await axios.post("/api/admin/nutritionist_sessions/reschedule", {
        booking_id: selectedSession.id,
        new_date: rescheduleData.date,
        new_time: rescheduleData.time,
        reason: rescheduleData.reason,
      });

      if (response.data?.success) {
        const responseData = response.data.data;

        // Update local state with new rescheduled info from API
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? {
                ...session,
                status: responseData.status,
                meeting_link: null,
                reschedule_reason: responseData.reason,
                rescheduled_at: responseData.rescheduled_at,
                // Store original and new times for display
                original_slot: responseData.original_time,
                original_date: responseData.original_date,
                slot: responseData.new_time
              }
            : session
        );
        setSessions(updatedSessions);

        setShowRescheduleModal(false);
        setRescheduleData({ date: "", time: "", reason: "" });

        alert(`Session rescheduled successfully to ${responseData.new_date} at ${responseData.new_time}`);

        // Refresh the calendar counts to show updated session counts
        await fetchCalendarCounts();

        // Refresh the sessions list for the currently selected date
        if (selectedDate) {
          // Trigger a re-fetch by temporarily setting selectedDate to null and back
          const currentDate = selectedDate;
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(currentDate), 0);
        }
      } else {
        alert("Failed to reschedule session. Please try again.");
      }
    } catch (err) {
      console.error("Error rescheduling session:", err);
      alert(err.response?.data?.detail || "Failed to reschedule session. Please try again.");
    }
  };

  const handleMarkAsCompleted = async (session) => {
    setSelectedSession(session);

    // Lazy load diet templates only when opening the completion modal
    if (!dietTemplatesLoaded) {
      await fetchDietTemplates();
      setDietTemplatesLoaded(true);
    }

    setShowCompletionModal(true);
  };

  const submitCompletion = async () => {
    if (!completionData.duration || !completionData.feedback || completionData.interestedInProduct === "") {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await axios.post("/api/admin/nutritionist_sessions/complete-session", {
        booking_id: selectedSession.id,
        meeting_duration: parseInt(completionData.duration),
        feedback_advice: completionData.feedback,
        interested_in_nutrition_product: completionData.interestedInProduct === "Yes",
        diet_template_id: completionData.dietTemplateId ? parseInt(completionData.dietTemplateId) : null,
        notes: completionData.notes,
      });

      if (response.data?.success) {
        // Update the session status locally
        const updatedSessions = sessions.map((session) =>
          session.id === selectedSession.id
            ? { ...session, status: "Completed" }
            : session
        );
        setSessions(updatedSessions);
        setShowCompletionModal(false);
        setCompletionData({ duration: "", feedback: "", interestedInProduct: "", dietTemplateId: "", notes: "" });
        alert("Session completed successfully!");

        // Automatically sync calendar counts, client selection lists and active selected date sessions
        fetchCalendarCounts();
        fetchEligibleMembers();
        fetchEligiblePlanMembers();

        if (selectedDate) {
          const currentDate = selectedDate;
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(currentDate), 0);
        }
      }
    } catch (err) {
      console.error("Error completing session:", err);
      const errorMessage = err.response?.data?.detail || "Failed to complete session. Please try again.";
      alert(errorMessage);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return { color: "#d97706", backgroundColor: "#fffbeb" };
      case "Scheduled":
        return { color: "#059669", backgroundColor: "#ecfdf5" };
      case "Booked":
        return { color: "#059669", backgroundColor: "#ecfdf5" };
      case "Rescheduled":
        return { color: "#2563eb", backgroundColor: "#eff6ff" };
      case "Completed":
        return { color: "#059669", backgroundColor: "#ecfdf5" };
      default:
        return { color: "#6b7280", backgroundColor: "#f3f4f6" };
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderMonth = (monthData) => {
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
      <div style={{ marginBottom: "24px" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
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
                  color: "#999",
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
              key={weekIndex}
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
                      key={`empty-${dateIndex}`}
                      style={{
                        minHeight: "70px",
                      }}
                    />
                  );
                }

                const selected = isSelected(date);
                const isToday = date.toDateString() === today.toDateString();
                const count = getSessionCount(date);

                return (
                  <div
                    key={dateIndex}
                    onClick={() => handleDateClick(date)}
                    style={{
                      background: selected
                        ? "#10b981"
                        : isToday
                        ? "#ecfdf5"
                        : "#ffffff",
                      border:
                        isToday && !selected
                          ? "2px solid #10b981"
                          : "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "12px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      minHeight: "70px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) {
                        e.currentTarget.style.background = isToday
                          ? "#ecfdf5"
                          : "#ffffff";
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: "18px",
                        color: selected
                          ? "white"
                          : isToday
                          ? "#10b981"
                          : "#374151",
                        fontWeight: "600",
                        marginBottom: count > 0 ? "4px" : "0",
                      }}
                    >
                      {date.getDate()}
                      
      </div>
                    {count > 0 && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: selected ? "white" : "#10b981",
                          fontWeight: "600",
                        }}
                      >
                        {count} session{count > 1 ? "s" : ""}
                        
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

  if (loading) {
    return (
      <div className="users-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ color: "#10b981", fontSize: "18px" }}>Loading calendar...</div>
          
      </div>
        
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ color: "#ff4444", fontSize: "16px" }}>{error}</div>
          
      </div>
        
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#10b981" }}>Session</span> Calendar
        </h2>
        
      </div>

      {/* Calendar */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {monthsData.map((monthData) => (
          <div key={monthData.month}>{renderMonth(monthData)}</div>
        ))}
        
      </div>

      {/* Sessions Table */}
      {selectedDate && (
        <div className="table-container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              marginBottom: "0.5rem",
            }}
          >
            <h3
              style={{
                color: "#111827",
                margin: 0,
                fontSize: "18px",
                fontWeight: "700",
              }}
            >
              Sessions for {formatDate(selectedDate)}
            </h3>
            <button
              id="create-session-btn"
              onClick={handleOpenCreateSession}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
              }}
            >
              + Create Session
            </button>
          </div>

          {sessionsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
              Loading sessions...
              
      </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Slot</th>
                    <th>Client Name</th>
                    <th>Plan</th>
                    <th>Meeting Link</th>
                    <th>Info</th>
                    <th>Status</th>
                    <th>Remark</th>
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
                          <td>{session.slot}</td>
                          <td>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/portal/nutritionist/client/${session.client_id}`);
                              }}
                              style={{
                                color: "#10b981",
                                cursor: "pointer",
                                textDecoration: "underline",
                                textDecorationColor: "transparent",
                                transition: "textDecorationColor 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.textDecorationColor = "#10b981";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.textDecorationColor = "transparent";
                              }}
                            >
                              {session.client_name || "Client #" + session.client_id}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                background: session.plan && session.plan !== "-"
                                  ? "rgba(16,185,129,0.08)"
                                  : "#f3f4f6",
                                border: session.plan && session.plan !== "-"
                                  ? "1px solid rgba(16,185,129,0.3)"
                                  : "1px solid #e5e7eb",
                                color: session.plan && session.plan !== "-"
                                  ? "#065f46"
                                  : "#9ca3af",
                                padding: "3px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: "600",
                                letterSpacing: "0.03em",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {session.plan || "-"}
                            </span>
                          </td>
                          <td>
                            {session.status === "Rescheduled" ? (
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#9ca3af",
                                  fontStyle: "italic",
                                }}
                              >
                                -
                              </span>
                            ) : !session.meeting_link ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateLink(session.id);
                                }}
                                style={{
                                  background: "rgba(16, 185, 129, 0.1)",
                                  border: "1px solid #10b981",
                                  color: "#10b981",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                  e.currentTarget.style.color = "white";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                  e.currentTarget.style.color = "#10b981";
                                }}
                              >
                                Generate Link
                              </button>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <a
                                  href={session.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (session.status === "Completed") {
                                      e.preventDefault();
                                    } else {
                                      e.stopPropagation();
                                    }
                                  }}
                                  style={{
                                    background: "#10b981",
                                    border: "none",
                                    color: "white",
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    opacity: session.status === "Completed" ? 0.5 : 1,
                                    cursor: session.status === "Completed" ? "not-allowed" : "pointer"
                                  }}
                                >
                                  Join Meeting
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleReschedule(session);
                                  }}
                                  disabled={session.status === "Completed"}
                                  style={{
                                    background: "transparent",
                                    border: "1px solid #374151",
                                    color: "#6b7280",
                                    padding: "6px 8px",
                                    borderRadius: "4px",
                                    cursor: session.status === "Completed" ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: session.status === "Completed" ? 0.5 : 1,
                                  }}
                                >
                                  <FaEdit size={12} />
                                </button>
                                
      </div>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/portal/nutritionist/consultation/${session.client_id}`);
                              }}
                              style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid #10b981",
                                color: "#10b981",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                                transition: "all 0.2s"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#10b981";
                                e.currentTarget.style.color = "white";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                e.currentTarget.style.color = "#10b981";
                              }}
                            >
                              View
                            </button>
                          </td>
                          <td>
                            <span
                              style={{
                                ...getStatusStyle(session.status),
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "500",
                                display: "inline-block",
                              }}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td>
                            {session.status === "Scheduled" || session.status === "Pending" || session.status === "Booked" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsCompleted(session);
                                }}
                                style={{
                                  background: "#10b981",
                                  border: "none",
                                  color: "white",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#059669";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#10b981";
                                }}
                              >
                                Click
                              </button>
                            ) : (
                              <button
                                disabled
                                style={{
                                  background: "#f3f4f6",
                                  border: "1px solid #e5e7eb",
                                  color: "#9ca3af",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  cursor: "not-allowed",
                                  fontSize: "12px",
                                  fontWeight: "600"
                                }}
                              >
                                Click
                              </button>
                            )}
                          </td>
                          <td>
                            {expandedRow === index ? (
                              <FaChevronUp />
                            ) : (
                              <FaChevronDown />
                            )}
                          </td>
                        </tr>
                         {expandedRow === index && (
                          <tr>
                            <td colSpan="9">
                              <div
                                style={{
                                  background: "#f9fafb",
                                  padding: "1rem",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                  display: "grid",
                                  gridTemplateColumns: session.rescheduled_at ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
                                  gap: "1rem",
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      marginBottom: "4px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Client ID
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", color: "#111827", fontWeight: "600" }}
                                  >
                                    {session.client_id || "-"}
                                  </div>
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "#6b7280",
                                      marginBottom: "4px",
                                      fontWeight: "600",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    Booking ID
                                  </div>
                                  <div
                                    style={{ fontSize: "14px", color: "#111827", fontWeight: "600" }}
                                  >
                                    {session.id || "-"}
                                  </div>
                                </div>
                                {session.rescheduled_at ? (
                                  <>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#2563eb",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Original Schedule
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}
                                      >
                                        {session.original_date || "-"}
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#374151", marginTop: "2px" }}
                                      >
                                        {session.original_slot || "-"}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#059669",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Rescheduled To
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}
                                      >
                                        {session.rescheduled_at ? new Date(session.rescheduled_at).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        }) : "-"}
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#374151", marginTop: "2px" }}
                                      >
                                        {session.slot || "-"}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Reschedule Reason
                                      </div>
                                      <div
                                        style={{ fontSize: "13px", color: "#374151" }}
                                      >
                                        {session.reschedule_reason || "-"}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: "11px",
                                          color: "#6b7280",
                                          marginBottom: "4px",
                                          fontWeight: "600",
                                          textTransform: "uppercase",
                                        }}
                                      >
                                        Meeting Link
                                      </div>
                                      <div
                                        style={{ fontSize: "14px", color: "#111827" }}
                                      >
                                        {session.meeting_link ? (
                                          <a
                                            href={session.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "#10b981", fontWeight: "600" }}
                                          >
                                            Open Link
                                          </a>
                                        ) : (
                                          <span style={{ color: "#9ca3af" }}>Not generated</span>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        No sessions scheduled for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
      </div>
          )}
          
      </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
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
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              minWidth: "400px",
              maxWidth: "600px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <h3
              style={{
                color: "#111827",
                marginBottom: "1.5rem",
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              Complete Meeting
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Meeting Duration
              </label>
              <input
                type="text"
                placeholder="e.g., 25:30 min"
                value={completionData.duration}
                onChange={(e) =>
                  setCompletionData({ ...completionData, duration: e.target.value })
                }
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              
      </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Feedback/Advice
              </label>
              <textarea
                value={completionData.feedback}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    feedback: e.target.value,
                  })
                }
                rows={4}
                placeholder="Enter your feedback or advice for the client..."
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              
      </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Interested in Nutrition Product
              </label>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                >
                  <input
                    type="radio"
                    name="interestedInProduct"
                    value="Yes"
                    checked={completionData.interestedInProduct === "Yes"}
                    onChange={(e) =>
                      setCompletionData({
                        ...completionData,
                        interestedInProduct: e.target.value,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  Yes
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                >
                  <input
                    type="radio"
                    name="interestedInProduct"
                    value="No"
                    checked={completionData.interestedInProduct === "No"}
                    onChange={(e) =>
                      setCompletionData({
                        ...completionData,
                        interestedInProduct: e.target.value,
                      })
                    }
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                    }}
                  />
                  No
                </label>
                
      </div>
              
      </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Assign Diet Template (Optional)
              </label>
              <select
                value={completionData.dietTemplateId}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    dietTemplateId: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="">No template selected</option>
                {dietTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name} {template.session_no ? `(Session ${template.session_no})` : ""}
                  </option>
                ))}
              </select>
              
      </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Followup notes
              </label>
              <textarea
                value={completionData.notes}
                onChange={(e) =>
                  setCompletionData({
                    ...completionData,
                    notes: e.target.value,
                  })
                }
                rows={3}
                placeholder="Enter any additional notes..."
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletionData({ duration: "", feedback: "", interestedInProduct: "", dietTemplateId: "", notes: "" });
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  color: "#4b5563",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCompletion}
                style={{
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)"
                }}
              >
                Submit
              </button>
              
      </div>
            
      </div>
          
      </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
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
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              minWidth: "400px",
              maxWidth: "500px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <h3
              style={{
                color: "#111827",
                marginBottom: "1.5rem",
                fontSize: "20px",
                fontWeight: "700",
              }}
            >
              Reschedule Meeting
            </h3>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, date: e.target.value })
                }
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              
      </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Time
              </label>
              <input
                type="time"
                value={rescheduleData.time}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, time: e.target.value })
                }
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              
      </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#4b5563",
                  fontSize: "13px",
                  marginBottom: "0.5rem",
                  fontWeight: "600"
                }}
              >
                Reason
              </label>
              <textarea
                value={rescheduleData.reason}
                onChange={(e) =>
                  setRescheduleData({
                    ...rescheduleData,
                    reason: e.target.value,
                  })
                }
                rows={3}
                style={{
                  width: "100%",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              
      </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setRescheduleData({ date: "", time: "", reason: "" });
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  color: "#4b5563",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                style={{
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "700",
                  boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)"
                }}
              >
                Reschedule
              </button>
              
      </div>
            
      </div>
          
      </div>
      )}

      {/* Create Session Modal */}
      {showCreateSessionModal && (
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateSessionModal(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              width: createSessionStep === 1 ? "800px" : "500px",
              maxWidth: "90vw",
              maxHeight: "85vh",
              overflow: createSessionStep === 1 ? "hidden" : "visible",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#111827", margin: 0, fontSize: "20px", fontWeight: "700" }}>
                {createSessionStep === 1 ? "Select a Client" : "Schedule Session"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {createSessionStep === 2 && (
                  <button
                    onClick={() => { setCreateSessionStep(1); setSelectedMember(null); }}
                    style={{
                      background: "transparent",
                      border: "1px solid #d1d5db",
                      color: "#6b7280",
                      padding: "6px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={() => setShowCreateSessionModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    fontSize: "24px",
                    cursor: "pointer",
                    lineHeight: 1,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Step 1: Select Client */}
            {createSessionStep === 1 && (
              <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb", marginBottom: "1rem", gap: "1.5rem" }}>
                  <button
                    onClick={() => handleTabChange("membership")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === "membership" ? "3px solid #10b981" : "3px solid transparent",
                      color: activeTab === "membership" ? "#10b981" : "#6b7280",
                      padding: "10px 4px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      outline: "none",
                    }}
                  >
                    Gym Memberships
                  </button>
                  <button
                    onClick={() => handleTabChange("plan")}
                    style={{
                      background: "none",
                      border: "none",
                      borderBottom: activeTab === "plan" ? "3px solid #10b981" : "3px solid transparent",
                      color: activeTab === "plan" ? "#10b981" : "#6b7280",
                      padding: "10px 4px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      outline: "none",
                    }}
                  >
                    Nutrition Plans
                  </button>
                </div>

                {/* Search */}
                <div style={{ marginBottom: "1rem" }}>
                  <input
                    type="text"
                    placeholder="Search by client name or contact..."
                    value={eligibleMembersSearch}
                    onChange={(e) => {
                      setEligibleMembersSearch(e.target.value);
                      if (activeTab === "membership") {
                        fetchEligibleMembers(e.target.value);
                      } else {
                        fetchEligiblePlanMembers(e.target.value);
                      }
                    }}
                    style={{
                      width: "100%",
                      background: "#f9fafb",
                      border: "1px solid #d1d5db",
                      color: "#111827",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Members list */}
                <div style={{ flex: 1, overflow: "auto" }}>
                  {activeTab === "membership" ? (
                    eligibleMembersLoading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
                        Loading eligible members...
                      </div>
                    ) : eligibleMembers.length === 0 ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
                        No eligible members found.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Client Name</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Contact</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Gym</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Amount</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Status</th>
                            <th style={{ textAlign: "center", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eligibleMembers.map((member, idx) => (
                            <tr
                              key={member.payment_id}
                              style={{
                                borderBottom: "1px solid #f3f4f6",
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <td style={{ padding: "12px 8px", fontSize: "14px", color: "#111827", fontWeight: "500" }}>
                                {member.client_name}
                              </td>
                              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#6b7280" }}>
                                {member.client_contact}
                              </td>
                              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#6b7280" }}>
                                {member.gym_name}
                              </td>
                              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#111827", fontWeight: "500" }}>
                                ₹{member.amount?.toLocaleString()}
                              </td>
                              <td style={{ padding: "12px 8px" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    background: member.membership_status === "active" ? "#ecfdf5" : "#fffbeb",
                                    color: member.membership_status === "active" ? "#059669" : "#d97706",
                                    padding: "3px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {member.membership_status}
                                </span>
                              </td>
                              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                <button
                                  onClick={() => handleSelectMember(member, "membership")}
                                  style={{
                                    background: "#10b981",
                                    border: "none",
                                    color: "white",
                                    padding: "6px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#10b981"; }}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  ) : (
                    planMembersLoading ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
                        Loading plan members...
                      </div>
                    ) : planMembers.length === 0 ? (
                      <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "#999" }}>
                        No plan members found.
                      </div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Client Name</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Contact</th>
                            <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Plan Name</th>
                            <th style={{ textAlign: "center", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Progress</th>
                            <th style={{ textAlign: "center", padding: "10px 8px", fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planMembers.map((member, idx) => (
                            <tr
                              key={member.eligibility_id}
                              style={{
                                borderBottom: "1px solid #f3f4f6",
                                cursor: "pointer",
                                transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f9fafb"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                              <td style={{ padding: "12px 8px", fontSize: "14px", color: "#111827", fontWeight: "500" }}>
                                {member.client_name}
                              </td>
                              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#6b7280" }}>
                                {member.client_contact}
                              </td>
                              <td style={{ padding: "12px 8px", fontSize: "13px", color: "#6b7280" }}>
                                {member.plan_name}
                              </td>
                              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    background: "#f3f4f6",
                                    color: "#374151",
                                    padding: "3px 10px",
                                    borderRadius: "999px",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}
                                >
                                  {member.progress}
                                </span>
                              </td>
                              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                <button
                                  onClick={() => handleSelectMember(member, "plan")}
                                  style={{
                                    background: "#10b981",
                                    border: "none",
                                    color: "white",
                                    padding: "6px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = "#059669"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = "#10b981"; }}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )
                  )}
                </div>

                <div style={{ marginTop: "1rem", fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>
                  {activeTab === "membership" ? (
                    `${eligibleMembers.length} eligible member${eligibleMembers.length !== 1 ? "s" : ""} found`
                  ) : (
                    `${planMembers.length} eligible plan member${planMembers.length !== 1 ? "s" : ""} found`
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Schedule Session */}
            {createSessionStep === 2 && selectedMember && (
              <div>
                {/* Selected client info */}
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    marginBottom: "1.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                      {selectedMember.client_name}
                    </div>
                    <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                      {selectedMember.client_contact}
                      {memberType === "membership" && selectedMember.gym_name && ` • ${selectedMember.gym_name}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {memberType === "membership" ? (
                      <>
                        <div style={{ fontSize: "13px", color: "#059669", fontWeight: "600" }}>
                          ₹{selectedMember.amount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                          {selectedMember.plan_name}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "13px", color: "#059669", fontWeight: "600" }}>
                          Progress: {selectedMember.progress}
                        </div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                          {selectedMember.plan_name}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Date display */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#4b5563", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                    Consultation Date
                  </label>
                  <div
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #d1d5db",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      color: "#111827",
                      fontWeight: "500",
                    }}
                  >
                    {formatDate(selectedDate)}
                  </div>
                </div>

                {/* Time inputs / schedules dropdown */}
                {memberType === "plan" ? (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", color: "#4b5563", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                      Available Schedule Slot
                    </label>
                    {schedulesLoading ? (
                      <div style={{ color: "#6b7280", fontSize: "13px" }}>Loading slots...</div>
                    ) : (() => {
                      const jsDay = selectedDate ? selectedDate.getDay() : 0;
                      const dbWeekday = jsDay === 0 ? 6 : jsDay - 1;
                      const filtered = schedules.filter(s => s.weekday === dbWeekday);
                      if (filtered.length === 0) {
                        return (
                          <div style={{
                            background: "#fffbeb",
                            border: "1px solid #fef3c7",
                            borderRadius: "6px",
                            padding: "12px",
                            color: "#b45309",
                            fontSize: "13px",
                            fontWeight: "500",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}>
                            <span>⚠️ No active weekly schedules configured for this day.</span>
                            <span style={{ fontSize: "12px", color: "#d97706" }}>
                              Please select a different date or configure weekly schedules.
                            </span>
                          </div>
                        );
                      }
                      return (
                        <select
                          value={createSessionData.scheduleId || ""}
                          onChange={(e) => handleSlotChange(e.target.value)}
                          style={{
                            width: "100%",
                            background: "#f9fafb",
                            border: "1px solid #d1d5db",
                            color: "#111827",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            outline: "none",
                            cursor: "pointer"
                          }}
                        >
                          <option value="">-- Select a slot --</option>
                          {filtered.map(slot => (
                            <option key={slot.id} value={slot.id}>
                              {slot.start_time} - {slot.end_time}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ display: "block", color: "#4b5563", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                        Start Time
                      </label>
                      <ClockTimePicker
                        value={createSessionData.startTime}
                        onChange={handleStartTimeChange}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "#4b5563", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                        End Time
                      </label>
                      <ClockTimePicker
                        value={createSessionData.endTime}
                        onChange={(val) => setCreateSessionData({ ...createSessionData, endTime: val })}
                        align="right"
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowCreateSessionModal(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid #d1d5db",
                      color: "#4b5563",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitCreateSession}
                    disabled={
                      createSessionSubmitting ||
                      !createSessionData.startTime ||
                      (memberType === "plan" && !createSessionData.scheduleId)
                    }
                    style={{
                      background: createSessionSubmitting ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "white",
                      padding: "10px 24px",
                      borderRadius: "6px",
                      cursor: createSessionSubmitting ? "not-allowed" : "pointer",
                      fontSize: "13px",
                      fontWeight: "700",
                      boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    {createSessionSubmitting ? "Creating..." : "Create Session"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
