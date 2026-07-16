"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import axios from "@/lib/axios";
import { FaArrowLeft, FaUtensils, FaDumbbell, FaCalendar, FaFire, FaWeight, FaChevronLeft, FaChevronRight, FaChevronDown, FaTint, FaFileAlt, FaRegCalendarCheck, FaClock, FaHeartbeat, FaListAlt, FaUserMd, FaCalendarAlt } from "react-icons/fa";

export default function ClientDetails() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [client, setClient] = useState(null);
  const [foodLogs, setFoodLogs] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history"); // Start with "history" as default active tab
  const [error, setError] = useState(null);

  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  // Track which tabs have been loaded
  const foodLogsLoaded = useRef(false);
  const workoutLogsLoaded = useRef(false);
  const waterLogsLoaded = useRef(false);

  // Pagination state
  const [foodPagination, setFoodPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    has_next: false,
    has_previous: false
  });
  const [workoutPagination, setWorkoutPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    has_next: false,
    has_previous: false
  });
  const [waterPagination, setWaterPagination] = useState({
    current_page: 1,
    total_pages: 0,
    total_records: 0,
    has_next: false,
    has_previous: false
  });
  const [logsLoading, setLogsLoading] = useState(false);

  // Fetch food logs with pagination
  const fetchFoodLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      const response = await axios.get(
        `/api/admin/nutritionist_sessions/client/${clientId}/food-logs`,
        { params: { page, page_size: 10 } }
      );
      setFoodLogs(response.data.data.food_logs || []);
      setFoodPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Error fetching food logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [clientId]);

  // Fetch workout logs with pagination
  const fetchWorkoutLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      const response = await axios.get(
        `/api/admin/nutritionist_sessions/client/${clientId}/workout-logs`,
        { params: { page, page_size: 10 } }
      );
      setWorkoutLogs(response.data.data.workout_logs || []);
      setWorkoutPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Error fetching workout logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [clientId]);

  // Fetch water logs with pagination
  const fetchWaterLogs = useCallback(async (page = 1) => {
    try {
      setLogsLoading(true);
      const response = await axios.get(
        `/api/admin/nutritionist_sessions/client/${clientId}/water-logs`,
        { params: { page, page_size: 10 } }
      );
      setWaterLogs(response.data.data.water_logs || []);
      setWaterPagination(response.data.data.pagination);
    } catch (err) {
      console.error("Error fetching water logs:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [clientId]);

  // Fetch only client details on mount and reset logs when client ID changes
  useEffect(() => {
    // Reset dynamic pagination & lazy load caches
    foodLogsLoaded.current = false;
    workoutLogsLoaded.current = false;
    waterLogsLoaded.current = false;
    setExpandedSessions([]);

    setFoodLogs([]);
    setWorkoutLogs([]);
    setWaterLogs([]);
    setFoodPagination({
      current_page: 1,
      total_pages: 0,
      total_records: 0,
      has_next: false,
      has_previous: false
    });
    setWorkoutPagination({
      current_page: 1,
      total_pages: 0,
      total_records: 0,
      has_next: false,
      has_previous: false
    });
    setWaterPagination({
      current_page: 1,
      total_pages: 0,
      total_records: 0,
      has_next: false,
      has_previous: false
    });

    const fetchClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch client details and consultation history
        const clientResponse = await axios.get(`/api/admin/nutritionist_sessions/client/${clientId}`);
        setClient(clientResponse.data.data);
        setConsultationHistory(clientResponse.data.data.consultation_history || []);

      } catch (err) {
        console.error("Error fetching client data:", err);
        setError(err.response?.data?.detail || "Failed to load client data");
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Load logs when tab is selected (lazy loading)
  useEffect(() => {
    if (activeTab === "food" && !foodLogsLoaded.current) {
      fetchFoodLogs(1);
      foodLogsLoaded.current = true;
    } else if (activeTab === "workout" && !workoutLogsLoaded.current) {
      fetchWorkoutLogs(1);
      workoutLogsLoaded.current = true;
    } else if (activeTab === "water" && !waterLogsLoaded.current) {
      fetchWaterLogs(1);
      waterLogsLoaded.current = true;
    }
  }, [activeTab, fetchFoodLogs, fetchWorkoutLogs, fetchWaterLogs]);

  // Handle page change
  const handlePageChange = (direction) => {
    let pagination, fetchFn;

    if (activeTab === "food") {
      pagination = foodPagination;
      fetchFn = fetchFoodLogs;
    } else if (activeTab === "workout") {
      pagination = workoutPagination;
      fetchFn = fetchWorkoutLogs;
    } else if (activeTab === "water") {
      pagination = waterPagination;
      fetchFn = fetchWaterLogs;
    } else {
      return;
    }

    if (direction === "next" && pagination.has_next) {
      fetchFn(pagination.current_page + 1);
    } else if (direction === "prev" && pagination.has_previous) {
      fetchFn(pagination.current_page - 1);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const renderHistoryLog = (session, index) => {
    const isExpanded = expandedSessions.includes(session.id);

    return (
      <div 
        key={session.id || index}
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "20px 24px",
          marginBottom: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          position: "relative",
          transition: "all 0.2s",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px"
        }}
        onClick={() => toggleSessionExpand(session.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#10b981";
          e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.05), 0 4px 6px -2px rgba(16, 185, 129, 0.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
        }}
      >
        {/* Left Content Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top Header Row with Date */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <FaCalendarAlt style={{ color: "#10b981", fontSize: "16px" }} />
            <span style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>
              {formatDate(session.slot_date)}
            </span>
            <span style={{ fontSize: "13px", color: "#6b7280", marginLeft: "8px" }}>
              {session.slot_time || ""}
            </span>
          </div>

          {/* Badge / Info Row (Always Visible) */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: isExpanded ? "16px" : "0px", alignItems: "center" }}>
            <span style={{ 
              background: "#f3f4f6", 
              color: "#4b5563",
              fontSize: "11px",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <FaClock size={11} />
              {session.meeting_duration} min
            </span>

            {session.nutritionist_name && (
              <span style={{ 
                background: "#f3f4f6", 
                color: "#4b5563",
                fontSize: "11px",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <FaUserMd size={11} />
                {session.nutritionist_name}
              </span>
            )}

            <span style={{ 
              background: "#f3f4f6", 
              color: "#4b5563",
              fontSize: "11px",
              fontWeight: "700",
              padding: "4px 10px",
              borderRadius: "12px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}>
              <FaHeartbeat size={11} />
              Product: {session.interested_in_nutrition_product ? "Yes" : "No"}
            </span>
          </div>

          {/* Collapsible Details Panel */}
          {isExpanded && (
            <div 
              style={{ 
                marginTop: "16px", 
                borderTop: "1px solid #f3f4f6", 
                paddingTop: "16px",
                display: "flex", 
                flexDirection: "column", 
                gap: "16px" 
              }}
              onClick={(e) => e.stopPropagation()} // Prevent clicking inner text from collapsing
            >
              {session.feedback_advice && (
                <div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>
                    Feedback & Advice Given
                  </div>
                  <div style={{ 
                    background: "#f9fafb", 
                    border: "1px solid #f3f4f6", 
                    padding: "14px 16px", 
                    borderRadius: "8px", 
                    fontSize: "14px", 
                    lineHeight: "1.6", 
                    color: "#374151",
                    whiteSpace: "pre-wrap"
                  }}>
                    {session.feedback_advice}
                  </div>
                </div>
              )}

              {session.notes && (
                <div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>
                    Follow-up / Internal Notes
                  </div>
                  <div style={{ 
                    background: "#fffbeb", 
                    border: "1px solid #fef3c7", 
                    padding: "14px 16px", 
                    borderRadius: "8px", 
                    fontSize: "14px", 
                    lineHeight: "1.6", 
                    color: "#b45309",
                    whiteSpace: "pre-wrap"
                  }}>
                    {session.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Column */}
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px", 
            flexShrink: 0,
            marginTop: "2px"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {session.assigned_diet_template_name ? (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/portal/nutritionist/client/${clientId}/template-view/${session.assigned_diet_template_id}?assigned_date=${session.assigned_date || session.slot_date || ""}`);
              }}
              style={{ 
                background: "#10b981", 
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "700",
                padding: "10px 20px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#059669";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 6px rgba(16, 185, 129, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#10b981";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(16, 185, 129, 0.2)";
              }}
            >
              <FaListAlt size={14} />
              Assigned Template: {session.assigned_diet_template_name}
            </span>
          ) : (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                const clientNameEscaped = encodeURIComponent(client?.name || session.client_name || "");
                router.push(`/portal/nutritionist/completed-list/assign-template?session_id=${session.id}&booking_id=${session.booking_id || ""}&client_name=${clientNameEscaped}`);
              }}
              style={{ 
                background: "white", 
                color: "#10b981",
                border: "1px solid #10b981",
                fontSize: "14px",
                fontWeight: "700",
                padding: "9px 19px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 1px 2px rgba(16, 185, 129, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e6f4ea";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 3px 6px rgba(16, 185, 129, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 2px rgba(16, 185, 129, 0.05)";
              }}
            >
              <FaListAlt size={14} />
              Add Template
            </span>
          )}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              toggleSessionExpand(session.id);
            }}
            style={{ 
              color: "#9ca3af",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center"
            }}
          >
            {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
          </div>
        </div>
      </div>
    );
  };



  const renderFoodLog = (log) => {
    console.log("Rendering food log:", log);
    // diet_data is an array of meal objects
    const meals = Array.isArray(log.diet_data) ? log.diet_data : [];
    console.log("Meals array:", meals);

    // Calculate total calories from all food items
    const totalCalories = meals.reduce((sum, meal) => {
      if (meal.foodList && Array.isArray(meal.foodList)) {
        return sum + meal.foodList.reduce((foodSum, item) => foodSum + (item.calories || 0), 0);
      }
      return sum;
    }, 0);

    // Filter out meals with no food items
    const mealsWithFood = meals.filter(meal => meal.foodList && meal.foodList.length > 0);
    console.log("Meals with food:", mealsWithFood);

    return (
      <div key={log.record_id} style={{
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCalendar style={{ color: "#10b981" }} />
            <span style={{ color: "#111827", fontWeight: "700" }}>
              {formatDate(log.date)}
            </span>
          </div>
          {totalCalories > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FaFire style={{ color: "#FF9800" }} />
              <span style={{ color: "#FF9800", fontWeight: "600" }}>
                {totalCalories} kcal
              </span>
            </div>
          )}
        </div>

        {mealsWithFood.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {mealsWithFood.map((meal) => (
              <div key={meal.id} style={{
                background: "#ffffff",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ color: "#10b981", fontSize: "13px", fontWeight: "700" }}>
                    {meal.title}
                  </div>
                  {meal.timeRange && (
                    <div style={{ color: "#999", fontSize: "11px" }}>
                      {meal.timeRange}
                    </div>
                  )}
                </div>
                {meal.tagline && (
                  <div style={{ color: "#6b7280", fontSize: "11px", marginBottom: "8px", fontStyle: "italic" }}>
                    {meal.tagline}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {meal.foodList.map((food, foodIdx) => (
                    <div key={foodIdx || food.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px",
                      background: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #f3f4f6"
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#374151", fontSize: "12px", fontWeight: "600" }}>
                          {food.name}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: "11px" }}>
                          {food.quantity} • Protein: <strong style={{ color: "#111827" }}>{food.protein}g</strong> • Carbs: <strong style={{ color: "#111827" }}>{food.carbs}g</strong> • Fat: <strong style={{ color: "#111827" }}>{food.fat}g</strong>
                        </div>
                      </div>
                      <div style={{ color: "#FF9800", fontSize: "12px", fontWeight: "600" }}>
                        {food.calories} kcal
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#666", fontStyle: "italic" }}>No meal data recorded</div>
        )}
      </div>
    );
  };

  const renderWorkoutLog = (log, index) => {
    console.log("Rendering workout log:", log);
    // workout_details is an array of muscle group objects
    const muscleGroups = Array.isArray(log.workout_details) ? log.workout_details : [];
    console.log("Muscle groups array:", muscleGroups);

    // Calculate total calories and duration from all exercises
    let totalCalories = 0;
    let totalDuration = 0;

    const allExercises = [];

    muscleGroups.forEach(group => {
      Object.keys(group).forEach(muscleName => {
        const exercises = group[muscleName];
        if (Array.isArray(exercises)) {
          exercises.forEach(exercise => {
            if (exercise.sets && Array.isArray(exercise.sets)) {
              exercise.sets.forEach(set => {
                totalCalories += set.calories || 0;
                totalDuration += set.duration || 0;
              });
            }
            allExercises.push({
              muscle: muscleName,
              name: exercise.name,
              sets: exercise.sets || []
            });
          });
        }
      });
    });

    return (
        <div key={log.record_id || index} style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px"
        }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCalendar style={{ color: "#10b981" }} />
            <span style={{ color: "#111827", fontWeight: "700" }}>
              {formatDate(log.date)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px" }}>
            {totalDuration > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaDumbbell style={{ color: "#4CAF50" }} />
                <span style={{ color: "#4CAF50", fontWeight: "600" }}>
                  {Math.round(totalDuration / 60)} min
                </span>
              </div>
            )}
            {totalCalories > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaFire style={{ color: "#FF9800" }} />
                <span style={{ color: "#FF9800", fontWeight: "600" }}>
                  {totalCalories.toFixed(1)} kcal
                </span>
              </div>
            )}
          </div>
        </div>

        {allExercises.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {allExercises.map((exercise, idx) => {
              // Calculate stats for this exercise
              const exerciseSets = exercise.sets || [];
              const totalReps = exerciseSets.reduce((sum, set) => sum + (set.reps || 0), 0);
              const totalWeight = exerciseSets.reduce((sum, set) => sum + (set.weight || 0), 0);
              const avgWeight = exerciseSets.length > 0 ? totalWeight / exerciseSets.length : 0;

              return (
                <div key={idx} style={{
                  background: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          background: "#10b981",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase"
                        }}>
                          {exercise.muscle}
                        </div>
                        <div style={{ color: "#4b5563", fontSize: "14px", fontWeight: "600" }}>
                          {exercise.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "16px", fontSize: "11px", color: "#6b7280" }}>
                    <div><strong style={{ color: "#111827" }}>{exerciseSets.length}</strong> {exerciseSets.length === 1 ? 'set' : 'sets'}</div>
                    <div><strong style={{ color: "#111827" }}>{totalReps}</strong> reps</div>
                    {avgWeight > 0 && <div><strong style={{ color: "#111827" }}>{avgWeight}</strong> kg</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: "#666", fontStyle: "italic" }}>No workout data recorded</div>
        )}
      </div>
    );
  };

  const renderWaterLog = (log, index) => {
    const waterIntake = log.water_intake || 0;

    return (
        <div key={log.record_id || index} style={{
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "12px"
        }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaCalendar style={{ color: "#10b981" }} />
            <span style={{ color: "#111827", fontWeight: "700" }}>
              {formatDate(log.date)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <FaTint style={{ color: "#2196F3" }} />
            <span style={{ color: "#2196F3", fontWeight: "600" }}>
              {waterIntake} L
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="users-container">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <div style={{ color: "#10b981", fontSize: "18px" }}>Loading client details...</div>
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


      {/* Client Info Card */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        {/* Name Row: Back arrow, profile image, name, and docs button in same line */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "transparent",
                border: "none",
                color: "#4b5563",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                borderRadius: "50%",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#10b981";
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#4b5563";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="Back"
            >
              <FaArrowLeft size={18} />
            </button>


            <h3 style={{ color: "#111827", fontSize: "24px", margin: 0, fontWeight: "700" }}>
              {client?.name || "Client"}
            </h3>
          </div>

          <button
            onClick={() => router.push(`/portal/nutritionist/client/${clientId}/docs`)}
            style={{
              background: "#10b981",
              border: "none",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "700",
              transition: "all 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(16, 185, 129, 0.15)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10b981";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <FaFileAlt size={13} />
            View Docs
          </button>
        </div>

        {/* Client Metadata details row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", color: "#4b5563", fontSize: "14px", paddingLeft: "36px", marginBottom: "8px" }}>
          <div><span style={{ color: "#6b7280", fontWeight: "600" }}>Email:</span> {client?.email || "-"}</div>
          <div><span style={{ color: "#6b7280", fontWeight: "600" }}>Contact:</span> {client?.contact || "-"}</div>
          <div><span style={{ color: "#6b7280", fontWeight: "600" }}>Location:</span> {client?.location || "-"}</div>
          <div><span style={{ color: "#6b7280", fontWeight: "600" }}>Age:</span> {calculateAge(client?.dob) || client?.age || "-"}</div>
          <div><span style={{ color: "#6b7280", fontWeight: "600" }}>Gender:</span> {client?.gender || "-"}</div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "16px",
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb"
        }}>
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb"
          }}>
            <FaWeight style={{ color: "#10b981", fontSize: "20px", marginBottom: "8px" }} />
            <div style={{ color: "#111827", fontSize: "20px", fontWeight: "700" }}>
              {client?.weight || "-"}
            </div>
            <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600" }}>Weight (kg)</div>
          </div>
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ color: "#059669", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              {client?.height || "-"}
            </div>
            <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600" }}>Height (cm)</div>
          </div>
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ color: "#d97706", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              {client?.bmi || "-"}
            </div>
            <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600" }}>BMI</div>
          </div>
          <div style={{
            background: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ color: "#2563eb", fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              {client?.status === "active" ? "Active" : "Inactive"}
            </div>
            <div style={{ color: "#6b7280", fontSize: "12px", fontWeight: "600" }}>Status</div>
          </div>
        </div>

        {/* Goals & Medical */}
        {(client?.goals || client?.medical_issues || client?.lifestyle) && (
          <div style={{ marginTop: "20px" }}>
            {client?.goals && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>GOALS</div>
                <div style={{ color: "#374151", fontSize: "14px", fontWeight: "500" }}>{client.goals}</div>
              </div>
            )}
            {client?.lifestyle && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>LIFESTYLE</div>
                <div style={{ color: "#374151", fontSize: "14px", fontWeight: "500" }}>{client.lifestyle}</div>
              </div>
            )}
            {client?.medical_issues && (
              <div>
                <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>MEDICAL ISSUES</div>
                <div style={{ color: "#374151", fontSize: "14px", fontWeight: "500" }}>{client.medical_issues}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logs Section */}
      <div style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          <button
            onClick={() => setActiveTab("history")}
            style={{
              flex: "1 0 auto",
              whiteSpace: "nowrap",
              background: activeTab === "history" ? "#10b981" : "#f9fafb",
              border: activeTab === "history" ? "none" : "1px solid #d1d5db",
              color: activeTab === "history" ? "#fff" : "#4b5563",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "700",
              transition: "all 0.2s"
            }}
          >
            <FaRegCalendarCheck />
            Consultation History ({consultationHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("food")}
            style={{
              flex: "1 0 auto",
              whiteSpace: "nowrap",
              background: activeTab === "food" ? "#10b981" : "#f9fafb",
              border: activeTab === "food" ? "none" : "1px solid #d1d5db",
              color: activeTab === "food" ? "#fff" : "#4b5563",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "700",
              transition: "all 0.2s"
            }}
          >
            <FaUtensils />
            Food Logs {foodLogsLoaded.current && `(${foodPagination.total_records})`}
          </button>
          <button
            onClick={() => setActiveTab("workout")}
            style={{
              flex: "1 0 auto",
              whiteSpace: "nowrap",
              background: activeTab === "workout" ? "#10b981" : "#f9fafb",
              border: activeTab === "workout" ? "none" : "1px solid #d1d5db",
              color: activeTab === "workout" ? "#fff" : "#4b5563",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "700",
              transition: "all 0.2s"
            }}
          >
            <FaDumbbell />
            Workout Logs {workoutLogsLoaded.current && `(${workoutPagination.total_records})`}
          </button>
          <button
            onClick={() => setActiveTab("water")}
            style={{
              flex: "1 0 auto",
              whiteSpace: "nowrap",
              background: activeTab === "water" ? "#10b981" : "#f9fafb",
              border: activeTab === "water" ? "none" : "1px solid #d1d5db",
              color: activeTab === "water" ? "#fff" : "#4b5563",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontWeight: "700",
              transition: "all 0.2s"
            }}
          >
            <FaTint />
            Water Logs {waterLogsLoaded.current && `(${waterPagination.total_records})`}
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === null ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
              <FaUtensils style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }} />
              <p style={{ fontSize: "16px" }}>Select a tab above to view logs</p>
            </div>
          ) : logsLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              Loading logs...
            </div>
          ) : (
            <>
              <div style={{ maxHeight: "500px", overflowY: "auto", paddingRight: "8px" }}>
                {activeTab === "history" ? (
                  consultationHistory.length > 0 ? (
                    consultationHistory.map(renderHistoryLog)
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No consultation history recorded for this client
                    </div>
                  )
                ) : activeTab === "food" ? (
                  foodLogs.length > 0 ? (
                    foodLogs.map(renderFoodLog)
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No food logs recorded for this client
                    </div>
                  )
                ) : activeTab === "workout" ? (
                  workoutLogs.length > 0 ? (
                    workoutLogs.map(renderWorkoutLog)
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No workout logs recorded for this client
                    </div>
                  )
                ) : activeTab === "water" ? (
                  waterLogs.length > 0 ? (
                    waterLogs.map(renderWaterLog)
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                      No water logs recorded for this client
                    </div>
                  )
                ) : null}
              </div>

              {/* Pagination Controls */}
              {activeTab !== null && (
                (() => {
                  const currentPagination = activeTab === "food" ? foodPagination
                    : activeTab === "workout" ? workoutPagination
                    : activeTab === "water" ? waterPagination
                    : null;
                  return currentPagination && currentPagination.total_records > 0;
                })()
              ) && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #e5e7eb"
                }}>
                  <div style={{ color: "#999", fontSize: "13px" }}>
                    {(() => {
                      const currentPagination = activeTab === "food" ? foodPagination
                        : activeTab === "workout" ? workoutPagination
                        : activeTab === "water" ? waterPagination
                        : { current_page: 1, page_size: 10, total_records: 0 };
                      const start = ((currentPagination.current_page - 1) * currentPagination.page_size) + 1;
                      const end = Math.min(currentPagination.current_page * currentPagination.page_size, currentPagination.total_records);
                      return `Showing ${start}-${end} of ${currentPagination.total_records} logs`;
                    })()}
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => handlePageChange("prev")}
                      disabled={(() => {
                        const currentPagination = activeTab === "food" ? foodPagination
                          : activeTab === "workout" ? workoutPagination
                          : activeTab === "water" ? waterPagination
                          : { has_previous: false };
                        return !currentPagination.has_previous;
                      })()}
                      style={{
                        background: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_previous: false };
                          return !currentPagination.has_previous ? "#f3f4f6" : "#10b981";
                        })(),
                        border: "none",
                        color: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_previous: false };
                          return !currentPagination.has_previous ? "#9ca3af" : "#fff";
                        })(),
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_previous: false };
                          return !currentPagination.has_previous ? "not-allowed" : "pointer";
                        })(),
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        fontWeight: "600",
                        opacity: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_previous: false };
                          return !currentPagination.has_previous ? 0.7 : 1;
                        })()
                      }}
                    >
                      <FaChevronLeft size={12} />
                      Previous
                    </button>

                    <div style={{
                      background: "#f9fafb",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      color: "#4b5563",
                      minWidth: "80px",
                      textAlign: "center",
                      border: "1px solid #e5e7eb",
                      fontWeight: "600"
                    }}>
                      {(() => {
                        const currentPagination = activeTab === "food" ? foodPagination
                          : activeTab === "workout" ? workoutPagination
                          : activeTab === "water" ? waterPagination
                          : { current_page: 1, total_pages: 1 };
                        return `Page ${currentPagination.current_page} of ${currentPagination.total_pages || 1}`;
                      })()}
                    </div>

                    <button
                      onClick={() => handlePageChange("next")}
                      disabled={(() => {
                        const currentPagination = activeTab === "food" ? foodPagination
                          : activeTab === "workout" ? workoutPagination
                          : activeTab === "water" ? waterPagination
                          : { has_next: false };
                        return !currentPagination.has_next;
                      })()}
                      style={{
                        background: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_next: false };
                          return !currentPagination.has_next ? "#f3f4f6" : "#10b981";
                        })(),
                        border: "none",
                        color: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_next: false };
                          return !currentPagination.has_next ? "#9ca3af" : "#fff";
                        })(),
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_next: false };
                          return !currentPagination.has_next ? "not-allowed" : "pointer";
                        })(),
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        opacity: (() => {
                          const currentPagination = activeTab === "food" ? foodPagination
                            : activeTab === "workout" ? workoutPagination
                            : activeTab === "water" ? waterPagination
                            : { has_next: false };
                          return !currentPagination.has_next ? 0.5 : 1;
                        })()
                      }}
                    >
                      Next
                      <FaChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
