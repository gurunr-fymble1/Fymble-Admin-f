"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import axiosInstance from "@/lib/axios";
import { Modal } from "react-bootstrap";

const GymDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gymId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [sessionPlans, setSessionPlans] = useState([]);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [dailyPass, setDailyPass] = useState(null);
  const [studioPictures, setStudioPictures] = useState([]);
  const [gymName, setGymName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Divide membership plans into personal training and normal membership
  const personalTrainingPlans = membershipPlans.filter(plan => plan.personal_training);
  const normalMembershipPlans = membershipPlans.filter(plan => !plan.personal_training);

  // Group plans by plan_for field within each category
  const groupPlansBy = (plans) => {
    return plans.reduce((groups, plan) => {
      const groupKey = plan.plan_for || 'Other';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(plan);
      return groups;
    }, {});
  };

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

  // Fetch session plans from backend
  useEffect(() => {
    const fetchSessionPlans = async () => {
      if (!gymId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/api/admin/gym-stats/${gymId}/session-plans`);
        if (response.data.success) {
          setSessionPlans(response.data.data.session_plans);
          setMembershipPlans(response.data.data.membership_plans || []);
          setDailyPass(response.data.data.daily_pass);
          setStudioPictures(response.data.data.studio_pictures || []);
          setGymName(response.data.data.gym_name);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchSessionPlans();
  }, [gymId]);

  return (
    <div className="users-container" style={{ position: "relative" }}>
      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(26, 26, 26, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{ textAlign: "center", color: "#FF5757" }}>
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
              Loading session plans...
            </p>
          </div>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="users-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.back()}
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
            <FaArrowLeft style={{ color: "#FF5757" }} />
          </button>
          <h2 className="users-title">
            {gymName ? `${gymName} - ` : ""}<span style={{ color: "#FF5757" }}>Plans</span>
          </h2>
        </div>
      </div>

      {/* Session Plans Content */}
      <div className="table-container mb-4">
        <div
          className="card"
          style={{ backgroundColor: "#1a1f1f", border: "1px solid #333", minHeight: "120px" }}
        >
          <div className="card-body">
            <h5 style={{ color: "#FF5757", marginBottom: "20px" }}>Session Plans</h5>
            {!loading && sessionPlans.length > 0 ? (
              <div className="row">
                {sessionPlans.map((plan, index) => (
                  <div key={plan.setting_id || index} className="col-lg-4 col-md-6 mb-4">
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: plan.is_enabled ? "#121717" : "#1a1a1a",
                        border: `1px solid ${plan.is_enabled ? "#333" : "#2a2a2a"}`,
                        borderRadius: "8px",
                        opacity: plan.is_enabled ? 1 : 0.6,
                        height: "100%",
                      }}
                    >
                      <div style={{ marginBottom: "15px" }}>
                        <h5 style={{ color: "#FF5757", margin: 0, marginBottom: "10px" }}>
                          {plan.session_name}
                        </h5>
                        {plan.session_description && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#999",
                              margin: 0,
                              marginBottom: "10px",
                            }}
                          >
                            {plan.session_description}
                          </p>
                        )}
                      </div>

                      <div style={{ marginBottom: "15px" }}>
                        {plan.capacity && (
                          <div
                            style={{
                              fontSize: "13px",
                              color: "#cccccc",
                              marginBottom: "5px",
                            }}
                          >
                            👥 Capacity: {plan.capacity}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          marginBottom: "10px",
                          paddingTop: "10px",
                          borderTop: "1px solid #333",
                        }}
                      >
                        <div>
                          {plan.final_price ? (
                            <>
                              <div
                                style={{
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                  color: "white",
                                }}
                              >
                                ₹{plan.final_price}
                              </div>
                              {plan.base_price && plan.base_price !== plan.final_price && (
                                <>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#999",
                                      textDecoration: "line-through",
                                    }}
                                  >
                                    ₹{plan.base_price}
                                  </div>
                                  {plan.discount_percent && plan.discount_percent > 0 && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#FF5757",
                                      }}
                                    >
                                      {plan.discount_percent}% OFF
                                    </div>
                                  )}
                                </>
                              )}
                            </>
                          ) : plan.base_price ? (
                            <div
                              style={{
                                fontSize: "20px",
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              ₹{plan.base_price}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#999",
                              }}
                            >
                              Price not set
                            </div>
                          )}
                        </div>
                      </div>

                      {plan.trainer_id && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#999",
                            borderTop: "1px solid #333",
                            paddingTop: "8px",
                            marginTop: "8px",
                          }}
                        >
                          Trainer ID: {plan.trainer_id}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#999",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  No session plans configured for this gym.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Plans Content */}
      <div className="table-container">
        <div
          className="card"
          style={{ backgroundColor: "#1a1f1f", border: "1px solid #333", minHeight: "120px" }}
        >
          <div className="card-body">
            <h5 style={{ color: "#FF5757", marginBottom: "20px" }}>Membership Plans</h5>

            {!loading && (personalTrainingPlans.length > 0 || normalMembershipPlans.length > 0) ? (
              <>
                {/* Personal Training Plans */}
                {personalTrainingPlans.length > 0 && (
                  <>
                    <h5 style={{ color: "#FF5757", marginBottom: "15px" }}>
                      Personal Training
                    </h5>
                    {Object.entries(groupPlansBy(personalTrainingPlans)).map(([groupKey, plans], groupIndex) => (
                      <div key={groupKey} style={groupIndex > 0 ? { marginTop: "20px" } : {}}>
                        <h6 style={{ color: "#ccc", marginBottom: "10px", fontSize: "14px" }}>
                          {groupKey}
                        </h6>
                        <div className="row mb-4">
                          {plans.map((plan, index) => (
                            <div key={plan.id || index} className="col-lg-4 col-md-6 mb-4">
                              <div
                                onClick={() => setSelectedPlan(plan)}
                                style={{
                                  padding: "20px",
                                  backgroundColor: "#121717",
                                  border: "1px solid #333",
                                  borderRadius: "8px",
                                  height: "100%",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#1a1f1f";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#121717";
                                }}
                              >
                                <div style={{ marginBottom: "15px" }}>
                                  <h5 style={{ color: "#FF5757", margin: 0, marginBottom: "10px" }}>
                                    {plan.plan_name}
                                  </h5>
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#cccccc",
                                      marginBottom: "5px",
                                    }}
                                  >
                                    ⏱️ Duration: {plan.duration} {plan.duration === 1 ? 'month' : 'months'}
                                  </div>
                                  {plan.bonus && (
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#cccccc",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      🎁 Bonus: {plan.bonus} {plan.bonus_type || 'days'}
                                    </div>
                                  )}
                                  {plan.pause && (
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#cccccc",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      ⏸️ Pause: {plan.pause} days
                                    </div>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "10px",
                                    paddingTop: "10px",
                                    borderTop: "1px solid #333",
                                  }}
                                >
                                  <div>
                                    {plan.original_amount ? (
                                      <>
                                        <div
                                          style={{
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            color: "white",
                                          }}
                                        >
                                          ₹{plan.amount}
                                        </div>
                                        {plan.original_amount && plan.original_amount !== plan.amount && (
                                          <>
                                            <div
                                              style={{
                                                fontSize: "13px",
                                                color: "#999",
                                                textDecoration: "line-through",
                                              }}
                                            >
                                              ₹{plan.original_amount}
                                            </div>
                                            {plan.discount_percent && plan.discount_percent > 0 && (
                                              <div
                                                style={{
                                                  fontSize: "12px",
                                                  color: "#FF5757",
                                                }}
                                              >
                                                {plan.discount_percent}% OFF
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <div
                                        style={{
                                          fontSize: "20px",
                                          fontWeight: "bold",
                                          color: "white",
                                        }}
                                      >
                                        ₹{plan.amount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Normal Membership Plans */}
                {normalMembershipPlans.length > 0 && (
                  <>
                    <div style={{
                      borderTop: "1px solid #333",
                      margin: personalTrainingPlans.length > 0 ? "30px 0 20px 0" : "0"
                    }}></div>
                    <h5 style={{ color: "#FF5757", marginBottom: "15px" }}>
                      Normal Membership
                    </h5>
                    {Object.entries(groupPlansBy(normalMembershipPlans)).map(([groupKey, plans], groupIndex) => (
                      <div key={groupKey} style={groupIndex > 0 ? { marginTop: "20px" } : {}}>
                        <h6 style={{ color: "#ccc", marginBottom: "10px", fontSize: "14px" }}>
                          {groupKey}
                        </h6>
                        <div className="row mb-4">
                          {plans.map((plan, index) => (
                            <div key={plan.id || index} className="col-lg-4 col-md-6 mb-4">
                              <div
                                onClick={() => setSelectedPlan(plan)}
                                style={{
                                  padding: "20px",
                                  backgroundColor: "#121717",
                                  border: "1px solid #333",
                                  borderRadius: "8px",
                                  height: "100%",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = "#1a1f1f";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = "#121717";
                                }}
                              >
                                <div style={{ marginBottom: "15px" }}>
                                  <h5 style={{ color: "#FF5757", margin: 0, marginBottom: "10px" }}>
                                    {plan.plan_name}
                                  </h5>
                                </div>

                                <div style={{ marginBottom: "15px" }}>
                                  <div
                                    style={{
                                      fontSize: "13px",
                                      color: "#cccccc",
                                      marginBottom: "5px",
                                    }}
                                  >
                                    ⏱️ Duration: {plan.duration} {plan.duration === 1 ? 'month' : 'months'}
                                  </div>
                                  {plan.bonus && (
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#cccccc",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      🎁 Bonus: {plan.bonus} {plan.bonus_type || 'days'}
                                    </div>
                                  )}
                                  {plan.pause && (
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        color: "#cccccc",
                                        marginBottom: "5px",
                                      }}
                                    >
                                      ⏸️ Pause: {plan.pause} days
                                    </div>
                                  )}
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "10px",
                                    paddingTop: "10px",
                                    borderTop: "1px solid #333",
                                  }}
                                >
                                  <div>
                                    {plan.original_amount ? (
                                      <>
                                        <div
                                          style={{
                                            fontSize: "20px",
                                            fontWeight: "bold",
                                            color: "white",
                                          }}
                                        >
                                          ₹{plan.amount}
                                        </div>
                                        {plan.original_amount && plan.original_amount !== plan.amount && (
                                          <>
                                            <div
                                              style={{
                                                fontSize: "13px",
                                                color: "#999",
                                                textDecoration: "line-through",
                                              }}
                                            >
                                              ₹{plan.original_amount}
                                            </div>
                                            {plan.discount_percent && plan.discount_percent > 0 && (
                                              <div
                                                style={{
                                                  fontSize: "12px",
                                                  color: "#FF5757",
                                                }}
                                              >
                                                {plan.discount_percent}% OFF
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <div
                                        style={{
                                          fontSize: "20px",
                                          fontWeight: "bold",
                                          color: "white",
                                        }}
                                      >
                                        ₹{plan.amount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#999",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  No membership plans configured for this gym.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Pass Pricing */}
      <div className="table-container">
        <div
          className="card"
          style={{ backgroundColor: "#1a1f1f", border: "1px solid #333", minHeight: "150px" }}
        >
          <div className="card-body">
            <h5 style={{ color: "#FF5757", marginBottom: "20px" }}>Daily Pass Pricing</h5>
            {!loading && dailyPass ? (
              <div
                style={{
                  padding: "20px",
                  backgroundColor: "#121717",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  maxWidth: "400px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    {dailyPass.discount_price ? (
                      <>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "bold",
                            color: "white",
                          }}
                        >
                          ₹{dailyPass.discount_price}
                        </div>
                        {dailyPass.price && dailyPass.price !== dailyPass.discount_price && (
                          <>
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#999",
                                textDecoration: "line-through",
                              }}
                            >
                              ₹{dailyPass.price}
                            </div>
                            {dailyPass.discount_percentage && dailyPass.discount_percentage > 0 && (
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#FF5757",
                                }}
                              >
                                {dailyPass.discount_percentage}% OFF
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : dailyPass.price ? (
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "white",
                        }}
                      >
                        ₹{dailyPass.price}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#999",
                        }}
                      >
                        Price not set
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#999",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  No daily pass pricing configured for this gym.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gym Studio Pictures */}
      <div className="table-container">
        <div
          className="card"
          style={{ backgroundColor: "#1a1f1f", border: "1px solid #333", minHeight: "120px" }}
        >
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h5 style={{ color: "#FF5757", margin: 0 }}>Gym Pictures</h5>
              {!loading && studioPictures.length > 0 && (
                <span
                  style={{
                    backgroundColor: String(studioPictures[0]?.photo_id).startsWith("onboarding_") ? "rgba(255, 87, 87, 0.9)" : "rgba(34, 197, 94, 0.9)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {String(studioPictures[0]?.photo_id).startsWith("onboarding_") ? "Onboarding" : "Studio"}
                </span>
              )}
            </div>
            {!loading && studioPictures.length > 0 ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                {/* Main Image Display */}
                <div
                  style={{
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #333",
                    backgroundColor: "#121717",
                  }}
                >
                  <img
                    src={studioPictures[currentImageIndex].image_url}
                    alt={`Studio ${studioPictures[currentImageIndex].type}`}
                    style={{
                      width: "100%",
                      height: "400px",
                      objectFit: "cover",
                      display: "block",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />

                  {/* Navigation Arrows */}
                  {studioPictures.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? studioPictures.length - 1 : prev - 1))}
                        style={{
                          position: "absolute",
                          left: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "18px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)"}
                      >
                        &#8249;
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === studioPictures.length - 1 ? 0 : prev + 1))}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "18px",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)"}
                      >
                        &#8250;
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {studioPictures.length > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "10px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {currentImageIndex + 1} / {studioPictures.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {studioPictures.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    {studioPictures.map((pic, index) => (
                      <button
                        key={pic.photo_id}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: index === currentImageIndex ? "2px solid #FF5757" : "2px solid #333",
                          backgroundColor: "#121717",
                          cursor: "pointer",
                          padding: 0,
                          transition: "border-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (index !== currentImageIndex) {
                            e.currentTarget.style.borderColor = "#555";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (index !== currentImageIndex) {
                            e.currentTarget.style.borderColor = "#333";
                          }
                        }}
                      >
                        <img
                          src={pic.image_url}
                          alt={`Thumbnail ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : !loading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px",
                  color: "#999",
                }}
              >
                <p style={{ margin: 0, fontSize: "14px" }}>
                  No studio pictures available for this gym.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services Modal */}
      <Modal
        show={selectedPlan !== null}
        onHide={() => setSelectedPlan(null)}
        centered
        style={{ color: "white" }}
      >
        <Modal.Header
          closeButton
          closeLabel="Close"
          style={{
            backgroundColor: "#1a1f1f",
            borderBottom: "1px solid #333",
          }}
        >
          <Modal.Title style={{ color: "#FF5757" }}>
            {selectedPlan?.plan_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            backgroundColor: "#121717",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {selectedPlan?.description && (
            <p
              style={{
                fontSize: "14px",
                color: "#ccc",
                marginBottom: "15px",
              }}
            >
              {selectedPlan.description}
            </p>
          )}
          {selectedPlan?.services && Array.isArray(selectedPlan.services) && selectedPlan.services.length > 0 ? (
            <>
              <h6 style={{ color: "#FF5757", marginBottom: "10px" }}>Services:</h6>
              <ul style={{ color: "#ccc", paddingLeft: "20px" }}>
                {selectedPlan.services.map((service, idx) => (
                  <li key={idx} style={{ marginBottom: "5px" }}>
                    {service}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic" }}>No services listed for this plan.</p>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{
            backgroundColor: "#1a1f1f",
            borderTop: "1px solid #333",
          }}
        >
          <button
            onClick={() => setSelectedPlan(null)}
            style={{
              backgroundColor: "#FF5757",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#e64848";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#FF5757";
            }}
          >
            Close
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GymDetails;
