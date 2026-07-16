"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FaInfoCircle } from "react-icons/fa";

export default function GymClientDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.client_id;
  const gymId = searchParams.get("gymId");

  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState(null);
  const [showGymAddressModal, setShowGymAddressModal] = useState(false);

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

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/${clientId}`);
      if (response.data.success) {
        setClientData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch client data");
      }
    } catch (err) {
      alert("Failed to load client details. Please try again.");
      router.push(`/portal/admin/gym-details/inactive-clients?id=${gymId}`);
    } finally {
      setLoading(false);
    }
  }, [clientId, gymId, router]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatText = (text) => {
    if (!text) return "-";
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="client-detail-container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading client details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="client-detail-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ fontSize: "16px", color: "#ccc" }}>Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-detail-container">
      {/* Header Section */}
      <div className="client-detail-header">
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ← Back
        </button>
        <h2 className="client-detail-title">
          <span style={{ color: "#FF5757" }}>Client</span> Details
        </h2>
      </div>

      {/* Profile Card */}
      <div className="client-detail-card">
        <div className="client-detail-card-header">
          <h3 className="client-detail-card-title">Profile Information</h3>
        </div>
        <div className="client-detail-card-body">
          <div className="client-detail-grid">
            {/* Profile Picture */}
            <div className="client-detail-profile-section">
              <div className="client-detail-avatar">
                {clientData.profile ? (
                  <img
                    src={clientData.profile}
                    alt={clientData.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="client-detail-avatar-placeholder">
                    {clientData.name ? clientData.name.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
              </div>
              <div className="client-detail-name-section">
                <h4 className="client-detail-name">{clientData.name || "-"}</h4>
                <p className="client-detail-id">ID: {clientData.client_id}</p>
              </div>
            </div>

            {/* Personal Details */}
            <div className="client-detail-info-section">
              <div className="client-detail-info-grid">
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Email</label>
                  <span className="client-detail-value">{clientData.email || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Contact</label>
                  <span className="client-detail-value">{clientData.contact || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Gender</label>
                  <span className="client-detail-value">{clientData.gender || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Age</label>
                  <span className="client-detail-value">{clientData.age || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Date of Birth</label>
                  <span className="client-detail-value">{formatDate(clientData.dob)}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Location</label>
                  <span className="client-detail-value">{clientData.location || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Pincode</label>
                  <span className="client-detail-value">{clientData.pincode || "-"}</span>
                </div>
                <div className="client-detail-info-item">
                  <label className="client-detail-label">Joined Date</label>
                  <span className="client-detail-value">{formatDate(clientData.joined_date)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical and Fitness Cards Row */}
      <div className="client-detail-cards-row">
        {/* Physical Details Card */}
        <div className="client-detail-card">
          <div className="client-detail-card-header">
            <h3 className="client-detail-card-title">Physical Information</h3>
          </div>
          <div className="client-detail-card-body">
            <div className="client-detail-info-grid">
              <div className="client-detail-info-item">
                <label className="client-detail-label">Height</label>
                <span className="client-detail-value">{clientData.height ? `${clientData.height} cm` : "-"}</span>
              </div>
              <div className="client-detail-info-item">
                <label className="client-detail-label">Weight</label>
                <span className="client-detail-value">{clientData.weight ? `${clientData.weight} kg` : "-"}</span>
              </div>
              <div className="client-detail-info-item">
                <label className="client-detail-label">BMI</label>
                <span className="client-detail-value">{clientData.bmi || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness & Health Card */}
        <div className="client-detail-card">
          <div className="client-detail-card-header">
            <h3 className="client-detail-card-title">Fitness & Health</h3>
          </div>
          <div className="client-detail-card-body">
            <div className="client-detail-full-width">
              <div className="client-detail-info-item">
                <label className="client-detail-label">Goals</label>
                <p className="client-detail-text">{formatText(clientData.goals) || "Not specified"}</p>
              </div>
              <div className="client-detail-info-item">
                <label className="client-detail-label">Lifestyle</label>
                <p className="client-detail-text">{formatText(clientData.lifestyle) || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Details Card */}
      <div className="client-detail-card">
        <div className="client-detail-card-header">
          <h3 className="client-detail-card-title">Gym Information</h3>
        </div>
        <div className="client-detail-card-body">
          <div className="client-detail-info-grid">
            <div className="client-detail-info-item">
              <label className="client-detail-label">Gym Name</label>
              <span className="client-detail-value">{clientData.gym_name || "-"}</span>
            </div>
            <div className="client-detail-info-item">
              <label className="client-detail-label">Gym Location</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="client-detail-value">{clientData.gym_location || "-"}</span>
                {(clientData.gym_street || clientData.gym_area || clientData.gym_city || clientData.gym_state || clientData.gym_pincode) && (
                  <FaInfoCircle
                    style={{
                      color: "#FF5757",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                    onClick={() => setShowGymAddressModal(true)}
                    title="View full address"
                  />
                )}
              </div>
            </div>
            <div className="client-detail-info-item">
              <label className="client-detail-label">Gym Contact</label>
              <span className="client-detail-value">{clientData.gym_contact || "-"}</span>
            </div>
            <div className="client-detail-info-item">
              <label className="client-detail-label">Batch ID</label>
              <span className="client-detail-value">{clientData.batch_id || "-"}</span>
            </div>
            <div className="client-detail-info-item">
              <label className="client-detail-label">Training ID</label>
              <span className="client-detail-value">{clientData.training_id || "-"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase History Button */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
        <button
          onClick={() => router.push(`/portal/admin/gym-details/inactive-clients/${clientId}/purchase-history?gymId=${gymId}`)}
          style={{
            backgroundColor: "#FF5757",
            color: "white",
            border: "none",
            padding: "12px 32px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
        >
          Purchase History
        </button>
      </div>

      {/* Gym Address Modal */}
      {showGymAddressModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowGymAddressModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "20px",
                fontSize: "20px",
                fontWeight: "600",
              }}
            >
              Gym Address
            </h3>
            <div
              style={{
                color: "#ffffff",
                fontSize: "15px",
                lineHeight: "1.8",
              }}
            >
              {clientData.gym_street && clientData.gym_street !== "-" && (
                <div style={{ marginBottom: "8px", fontSize: "16px", fontWeight: "500" }}>
                  {clientData.gym_street}
                </div>
              )}
              {clientData.gym_area && clientData.gym_area !== "-" && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "#888", fontSize: "13px" }}>Area: </span>
                  <span>{clientData.gym_area}</span>
                </div>
              )}
              {clientData.gym_city && clientData.gym_city !== "-" && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "#888", fontSize: "13px" }}>City: </span>
                  <span>{clientData.gym_city}</span>
                </div>
              )}
              {clientData.gym_state && clientData.gym_state !== "-" && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "#888", fontSize: "13px" }}>State: </span>
                  <span>{clientData.gym_state}</span>
                </div>
              )}
              {clientData.gym_pincode && clientData.gym_pincode !== "-" && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ color: "#888", fontSize: "13px" }}>Pincode: </span>
                  <span>{clientData.gym_pincode}</span>
                </div>
              )}
              {!clientData.gym_street && !clientData.gym_area && !clientData.gym_city && !clientData.gym_state && !clientData.gym_pincode && (
                <div style={{ color: "#888" }}>No address details available</div>
              )}
            </div>
            <button
              onClick={() => setShowGymAddressModal(false)}
              style={{
                backgroundColor: "#FF5757",
                color: "white",
                border: "none",
                padding: "10px 25px",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s ease",
                marginTop: "20px",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
