"use client";
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCheck, FaSpinner, FaTimes } from "react-icons/fa";
import axios from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";

export default function AssignTemplate() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking_id");
  const clientName = searchParams.get("client_name");

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null);

  // Fetch templates and current assignment in a single API call
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/nutritionist_completed_list/assign-template-data/${sessionId}`);

        if (response.data?.success && response.data?.data) {
          const { templates, current_assignment } = response.data.data;
          setTemplates(templates || []);

          // Set current assignment if exists
          if (current_assignment?.assigned_diet_template_id) {
            setSelectedTemplateId(current_assignment.assigned_diet_template_id.toString());
          }
        } else {
          setTemplates([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId) {
      alert("Please select a template to assign");
      return;
    }

    try {
      setAssigning(true);

      const response = await axios.post("/api/admin/nutritionist_completed_list/assign-diet-template", {
        booking_id: parseInt(bookingId),
        diet_template_id: parseInt(selectedTemplateId),
      });

      if (response.data?.success) {
        alert("Diet template assigned successfully!");
        router.back();
      }
    } catch (err) {
      console.error("Error assigning template:", err);
      alert(err.response?.data?.detail || "Failed to assign template. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTemplate = async () => {
    try {
      setAssigning(true);

      const response = await axios.post("/api/admin/nutritionist_completed_list/assign-diet-template", {
        booking_id: parseInt(bookingId),
        diet_template_id: null,
      });

      if (response.data?.success) {
        alert("Diet template removed successfully!");
        router.back();
      }
    } catch (err) {
      console.error("Error removing template:", err);
      alert(err.response?.data?.detail || "Failed to remove template. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  const handleViewTemplate = async (templateId, e) => {
    e.stopPropagation(); // Prevent row selection when clicking view
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success && response.data?.data) {
        const template = response.data.data;
        // Migrate diet data to new format for consistent display
        template.diet_data = migrateDietData(template.diet_data || []);
        setViewingTemplate(template);
      } else {
        alert(response.data?.message || "Failed to load template data");
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  // Migrate old format to new format for backwards compatibility
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
    return dietData.map(day => ({
      ...day,
      meals: day.meals.map(meal => ({
        ...meal,
        foods: meal.foods.map(migrateFoodFormat)
      }))
    }));
  };

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid #d1d5db",
            color: "#4b5563",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            fontWeight: "600"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = "#10b981";
            e.currentTarget.style.color = "#10b981";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#d1d5db";
            e.currentTarget.style.color = "#4b5563";
          }}
        >
          <FaArrowLeft />
          Back
        </button>
        <h2 className="users-title">
          Assign Diet Template
        </h2>
      </div>

      {/* Client Info */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ color: "#6b7280", fontSize: "13px", marginBottom: "4px", fontWeight: "600" }}>Client</div>
        <div style={{ color: "#111827", fontSize: "18px", fontWeight: "700" }}>
          {decodeURIComponent(clientName || "Unknown")}
        </div>
      </div>

      {/* Templates Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            <FaSpinner className="fa-spin" style={{ fontSize: "24px", marginBottom: "1rem" }} />
            <div>Loading templates...</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#f44" }}>
            {error}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
            No templates found. Create templates first.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}></th>
                    <th>Template Name</th>
                    <th>Session No.</th>
                    <th>Days</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr
                      key={template.id}
                      onClick={() => setSelectedTemplateId(selectedTemplateId === template.id.toString() ? null : template.id.toString())}
                      style={{
                        cursor: "pointer",
                        background: selectedTemplateId === template.id.toString() ? "#ecfdf5" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTemplateId !== template.id.toString()) {
                          e.currentTarget.style.background = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTemplateId !== template.id.toString()) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <td>
                        {selectedTemplateId === template.id.toString() && (
                          <div
                            style={{
                              background: "#10b981",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)"
                            }}
                          >
                            <FaCheck size={14} color="#fff" />
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            color: selectedTemplateId === template.id.toString() ? "#10b981" : "#111827",
                            fontWeight: selectedTemplateId === template.id.toString() ? "700" : "500",
                          }}
                        >
                          {template.template_name}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: selectedTemplateId === template.id.toString() ? "#10b981" : "#4b5563",
                            fontWeight: selectedTemplateId === template.id.toString() ? "700" : "500",
                          }}
                        >
                          {template.session_no ? `Session ${template.session_no}` : "-"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            color: "#10b981",
                            fontWeight: "700",
                          }}
                        >
                          {template.number_of_days}
                        </span>
                      </td>
                      <td style={{ color: "#4b5563", fontSize: "13px" }}>
                        {template.description || "-"}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleViewTemplate(template.id, e)}
                          style={{
                            background: "transparent",
                            border: "1px solid #d1d5db",
                            color: "#4b5563",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f9fafb";
                            e.currentTarget.style.borderColor = "#10b981";
                            e.currentTarget.style.color = "#10b981";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = "#d1d5db";
                            e.currentTarget.style.color = "#4b5563";
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginTop: "2rem",
                justifyContent: "flex-end",
              }}
            >
              {/* Remove Template Button
              <button
                onClick={handleRemoveTemplate}
                disabled={assigning}
                style={{
                  background: "transparent",
                  border: "1px solid #d1d5db",
                  color: "#4b5563",
                  padding: "12px 24px",
                  borderRadius: "6px",
                  cursor: assigning ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: assigning ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!assigning) {
                    e.currentTarget.style.background = "#fef2f2";
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.color = "#ef4444";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.color = "#4b5563";
                }}
              >
                Unassign
              </button>
              */}

              {/* Assign Button */}
              <button
                onClick={handleAssignTemplate}
                disabled={assigning || !selectedTemplateId}
                style={{
                  background: assigning || !selectedTemplateId ? "#f3f4f6" : "#10b981",
                  border: "none",
                  color: assigning || !selectedTemplateId ? "#9ca3af" : "white",
                  padding: "12px 32px",
                  borderRadius: "6px",
                  cursor: assigning || !selectedTemplateId ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "700",
                  opacity: assigning || !selectedTemplateId ? 0.7 : 1,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: assigning || !selectedTemplateId ? "none" : "0 4px 6px -1px rgba(16, 185, 129, 0.3)"
                }}
                onMouseEnter={(e) => {
                  if (!assigning && selectedTemplateId) {
                    e.currentTarget.style.background = "#059669";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!assigning && selectedTemplateId) {
                    e.currentTarget.style.background = "#10b981";
                  }
                }}
              >
                {assigning ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <FaCheck />
                    Assign Template
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* View Template Modal */}
      {viewingTemplate && (
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
          onClick={() => setViewingTemplate(null)}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              minWidth: "800px",
              maxWidth: "900px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#111827", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                {viewingTemplate.template_name}
              </h3>
              <button
                onClick={() => setViewingTemplate(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: "1rem", display: "flex", gap: "2rem" }}>
              <span style={{ color: "#4b5563", fontSize: "13px" }}>
                <strong style={{ color: "#111827" }}>Days:</strong> {viewingTemplate.number_of_days}
              </span>
              {viewingTemplate.session_no && (
                <span style={{ color: "#4b5563", fontSize: "13px" }}>
                  <strong style={{ color: "#111827" }}>Session No:</strong> Session {viewingTemplate.session_no}
                </span>
              )}
              {viewingTemplate.description && (
                <span style={{ color: "#4b5563", fontSize: "13px" }}>
                  <strong style={{ color: "#111827" }}>Description:</strong> {viewingTemplate.description}
                </span>
              )}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              {viewingTemplate.diet_data && viewingTemplate.diet_data.map((day) => (
                <div
                  key={day.day_number}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                  }}
                >
                  <h4 style={{ color: "#10b981", fontSize: "15px", fontWeight: "700", marginBottom: "1rem", margin: 0 }}>
                    Day {day.day_number}
                  </h4>

                  {day.meals && day.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: "700" }}>
                          {meal.title}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "500" }}>{meal.time}</span>
                      </div>

                      {meal.foods && meal.foods.map((food, foodIndex) => (
                        <div
                          key={foodIndex}
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                          }}
                        >
                          <div style={{ color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                            {food.name || food.name_quantity}
                            {(food.quantity !== undefined && food.quantity !== null && food.quantity !== "") ? ` (Qty: ${food.quantity})` : ""}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "12px", color: "#6b7280" }}>
                            <span>Cal: <strong style={{ color: "#111827" }}>{food.nutrition?.calories || 0}</strong></span>
                            <span>Protein: <strong style={{ color: "#111827" }}>{food.nutrition?.protein || 0}g</strong></span>
                            <span>Fat: <strong style={{ color: "#111827" }}>{food.nutrition?.fat || 0}g</strong></span>
                            <span>Carbs: <strong style={{ color: "#111827" }}>{food.nutrition?.carbs || 0}g</strong></span>
                            <span>Fiber: {food.nutrition?.fiber || 0}g</span>
                            <span>Sugar: {food.nutrition?.sugar || 0}g</span>
                            <span>Sodium: {food.nutrition?.sodium || 0}mg</span>
                            <span>Calcium: {food.nutrition?.calcium || 0}mg</span>
                            <span>Iron: {food.nutrition?.iron || 0}mg</span>
                            <span>Magnesium: {food.nutrition?.magnesium || 0}mg</span>
                            <span>Potassium: {food.nutrition?.potassium || 0}mg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={() => setViewingTemplate(null)}
                style={{
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
