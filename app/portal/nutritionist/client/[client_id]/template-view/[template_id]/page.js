"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaCalendarAlt, FaClock, FaListAlt, FaRegClock, FaSpinner, FaTimes, FaUtensils, FaEdit } from "react-icons/fa";
import axios from "@/lib/axios";

// Migrate old food format to new format for backwards compatibility
const migrateFoodFormat = (food) => {
  if (food.name && food.quantity !== undefined) {
    return food;
  }
  return {
    name: food.name_quantity || "",
    quantity: "",
    nutrition: food.nutrition || {
      calories: 0, protein: 0, fat: 0, carbs: 0,
      fiber: 0, sugar: 0, sodium: 0, calcium: 0,
      iron: 0, magnesium: 0, potassium: 0
    }
  };
};

const migrateDietData = (dietData) => {
  if (!Array.isArray(dietData)) return [];
  return dietData.map(day => ({
    ...day,
    meals: Array.isArray(day.meals) ? day.meals.map(meal => ({
      ...meal,
      foods: Array.isArray(meal.foods) ? meal.foods.map(migrateFoodFormat) : []
    })) : []
  }));
};

export default function TemplateDayWiseView() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const clientId = params.client_id;
  const templateId = params.template_id;
  const assignedDateStr = searchParams.get("assigned_date");

  const [template, setTemplate] = useState(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (clientId && templateId) {
          const response = await axios.get(`/api/admin/nutritionist_sessions/client/${clientId}/template-view/${templateId}`);
          if (response.data?.success && response.data?.data) {
            const { client_name, template: templateData } = response.data.data;
            setClientName(client_name || "");
            if (templateData) {
              templateData.diet_data = migrateDietData(templateData.diet_data);
              setTemplate(templateData);
            }
          } else {
            setError(response.data?.message || "Failed to load template data.");
          }
        }
      } catch (err) {
        console.error("Error fetching template data:", err);
        setError(err.response?.data?.detail || "Failed to load diet template.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, templateId]);

  const getCalculatedDate = (assignedStr, dayNumber) => {
    if (!assignedStr) return "";
    const dateObj = new Date(assignedStr);
    if (isNaN(dateObj.getTime())) return "";
    
    // Add dayNumber days to the assigned date (Day 1 = assignedDate + 1, Day 2 = assignedDate + 2, etc.)
    dateObj.setDate(dateObj.getDate() + dayNumber);
    
    return dateObj.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="users-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "60vh", gap: "12px" }}>
        <FaSpinner className="fa-spin" style={{ color: "#10b981", fontSize: "32px" }} />
        <div style={{ color: "#6b7280", fontSize: "15px", fontWeight: "600" }}>Loading template schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "20px 24px", borderRadius: "10px", color: "#ef4444", maxWidth: "500px", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 8px 0", fontWeight: "700" }}>Failed to Load</h3>
          <p style={{ margin: 0, fontSize: "14px" }}>{error}</p>
          <button 
            onClick={() => router.back()} 
            style={{ marginTop: "16px", background: "#ef4444", border: "none", color: "white", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      {/* Template Info Card */}
      {template && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "32px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <span 
                  onClick={() => router.back()}
                  style={{
                    cursor: "pointer",
                    color: "#4b5563",
                    display: "inline-flex",
                    alignItems: "center",
                    marginRight: "4px",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#10b981";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#4b5563";
                  }}
                  title="Back"
                >
                  <FaArrowLeft size={18} style={{ display: "block" }} />
                </span>
                <FaListAlt style={{ color: "#10b981", fontSize: "18px" }} />
                <h3 style={{ color: "#111827", fontSize: "22px", fontWeight: "800", margin: 0 }}>
                  {template.template_name}
                </h3>
              </div>
              <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 0 34px", lineHeight: "1.5" }}>
                {template.description || "No description provided."}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {template.session_no && (
                <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "20px" }}>
                  Session {template.session_no}
                </span>
              )}
              <span style={{ background: "#ecfdf5", color: "#047857", fontSize: "12px", fontWeight: "700", padding: "6px 12px", borderRadius: "20px" }}>
                {template.number_of_days} Days Plan
              </span>
              <button
                onClick={() => router.push(`/portal/nutritionist/create-template?template_id=${template.id}`)}
                style={{
                  background: "white",
                  border: "1px solid #10b981",
                  color: "#10b981",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  transition: "all 0.2s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(16, 185, 129, 0.05)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e6f4ea";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <FaEdit size={12} />
                Edit Template
              </button>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "16px", marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "#4b5563" }}>
            <div><strong style={{ color: "#111827" }}>Client:</strong> {clientName || "Unknown"}</div>
            {assignedDateStr && (
              <div><strong style={{ color: "#111827" }}>Assigned Date:</strong> {new Date(assignedDateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
            )}
          </div>
        </div>
      )}

      {/* Day Wise Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {template?.diet_data && template.diet_data.map((day) => {
          const calculatedDateStr = getCalculatedDate(assignedDateStr, day.day_number);

          return (
            <div
              key={day.day_number}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)"
              }}
            >
              {/* Day Header */}
              <div 
                style={{ 
                  borderLeft: "4px solid #10b981", 
                  paddingLeft: "12px", 
                  marginBottom: "20px" 
                }}
              >
                {calculatedDateStr ? (
                  <>
                    <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "800", margin: "0 0 2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaCalendarAlt style={{ color: "#10b981" }} size={14} />
                      {calculatedDateStr}
                    </h4>
                    <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "600", marginTop: "2px" }}>
                      Day {day.day_number}
                    </div>
                  </>
                ) : (
                  <h4 style={{ color: "#111827", fontSize: "16px", fontWeight: "800", margin: "0" }}>
                    Day {day.day_number}
                  </h4>
                )}
              </div>

              {/* Meals Grid */}
              {day.meals && day.meals.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {day.meals.map((meal, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #f3f4f6",
                        borderRadius: "8px",
                        padding: "16px"
                      }}
                    >
                      {/* Meal Title & Time */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}>
                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: "700" }}>
                          {meal.title}
                        </span>
                        {meal.time && (
                          <span style={{ color: "#6b7280", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                            <FaRegClock size={12} />
                            {meal.time}
                          </span>
                        )}
                      </div>

                      {/* Food Items List */}
                      {meal.foods && meal.foods.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {meal.foods.map((food, foodIdx) => (
                            <div 
                              key={foodIdx}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #f3f4f6",
                                borderRadius: "6px",
                                padding: "12px"
                              }}
                            >
                              <div style={{ color: "#374151", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                                {food.name || food.name_quantity}
                                {food.quantity ? ` (${food.quantity})` : ""}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "#6b7280" }}>
                                <span>Calories: <strong style={{ color: "#111827" }}>{food.nutrition?.calories || 0} kcal</strong></span>
                                <span>Protein: <strong style={{ color: "#111827" }}>{food.nutrition?.protein || 0}g</strong></span>
                                <span>Fat: <strong style={{ color: "#111827" }}>{food.nutrition?.fat || 0}g</strong></span>
                                <span>Carbs: <strong style={{ color: "#111827" }}>{food.nutrition?.carbs || 0}g</strong></span>
                                {food.nutrition?.fiber > 0 && <span>Fiber: {food.nutrition.fiber}g</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No food items added.</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>No meals scheduled for this day.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
