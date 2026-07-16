"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaCheckCircle,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function GymVisitDetail() {
  const router = useRouter();
  const params = useParams();
  const visitId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitData, setVisitData] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState([]);

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
    if (visitId) {
      fetchVisitData();
    }
  }, [visitId]);

  useEffect(() => {
    if (visitData) {
      const photosList = [];
      if (visitData.exterior_photo)
        photosList.push({
          url: visitData.exterior_photo,
          label: "Exterior Photo",
        });
      if (visitData.attendance_selfie)
        photosList.push({
          url: visitData.attendance_selfie,
          label: "Attendance Selfie",
        });
      setPhotos(photosList);
    }
  }, [visitData]);

  const fetchVisitData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        `/marketing/gym-visits/get/${visitId}`
      );

      if (response.data.status === 200) {
        setVisitData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch visit details"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load visit details"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "converted":
        return "#10b981";
      case "followup":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "converted":
        return "Converted";
      case "followup":
        return "Follow Up";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const openPhotoModal = (index) => {
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <div className="users-container">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
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
              Loading visit details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#ff5757" }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!visitData) {
    return (
      <div className="users-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Visit not found
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
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
            <span style={{ color: "#FF5757" }}>Gym Visit</span> Details
          </h2>
        </div>
        {visitData.final_status && (
          <span
            style={{
              padding: "6px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: "600",
              background: getStatusColor(visitData.final_status),
              color: "white",
            }}
          >
            {getStatusLabel(visitData.final_status)}
          </span>
        )}
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          height: "calc(100vh - 120px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "10px",
          paddingBottom: "40px",
        }}
      >
        {/* Gym Visit Details Section */}
        <div className="section-container" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}
          >
            {visitData.gym_name && (
              <div>
                <label
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Gym Name
                </label>
                <div style={{ color: "#fff", fontSize: "14px" }}>
                  {visitData.gym_name}
                </div>
              </div>
            )}
            {visitData.gym_address && (
              <div>
                <label
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  <FaMapMarkerAlt
                    style={{ marginRight: "0.5rem", color: "#FF5757" }}
                  />
                  Address
                </label>
                <div style={{ color: "#fff", fontSize: "14px" }}>
                  {visitData.gym_address}
                </div>
              </div>
            )}
            {(visitData.contact_person || visitData.contact_phone) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                {visitData.contact_person && (
                  <div>
                    <label
                      style={{
                        color: "#999",
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <FaUser
                        style={{ marginRight: "0.5rem", color: "#FF5757" }}
                      />
                      Contact Person
                    </label>
                    <div style={{ color: "#fff", fontSize: "14px" }}>
                      {visitData.contact_person}
                    </div>
                  </div>
                )}
                {visitData.contact_phone && (
                  <div>
                    <label
                      style={{
                        color: "#999",
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <FaPhone
                        style={{ marginRight: "0.5rem", color: "#FF5757" }}
                      />
                      Contact Phone
                    </label>
                    <div style={{ color: "#fff", fontSize: "14px" }}>
                      {visitData.contact_phone}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Photos Section */}
        {photos.length > 0 && (
          <div className="section-container" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                overflowX: "auto",
                paddingBottom: "0.5rem",
              }}
            >
              {photos.map((photo, index) => (
                <div key={index} style={{ minWidth: "200px" }}>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {photo.label}
                  </label>
                  <img
                    src={photo.url}
                    alt={photo.label}
                    style={{
                      width: "200px",
                      height: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                    onClick={() => openPhotoModal(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Section */}
        {(visitData.gym_size ||
          (visitData.total_member_count && visitData.total_member_count > 0) ||
          visitData.conversion_probability ||
          (visitData.overall_rating && visitData.overall_rating > 0)) && (
          <div className="section-container" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
              }}
            >
              {visitData.gym_size && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Gym Size
                  </label>
                  <div style={{ color: "#fff", fontSize: "14px" }}>
                    {visitData.gym_size}
                  </div>
                </div>
              )}
              {visitData.total_member_count &&
                visitData.total_member_count > 0 && (
                  <div>
                    <label
                      style={{
                        color: "#999",
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Total Members
                    </label>
                    <div style={{ color: "#fff", fontSize: "14px" }}>
                      {visitData.total_member_count}
                    </div>
                  </div>
                )}
              {visitData.conversion_probability && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Conversion Probability
                  </label>
                  <div style={{ color: "#fff", fontSize: "14px" }}>
                    {visitData.conversion_probability}
                  </div>
                </div>
              )}
              {visitData.overall_rating && visitData.overall_rating > 0 && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Overall Rating
                  </label>
                  <div style={{ color: "#fff", fontSize: "14px" }}>
                    {visitData.overall_rating}/5
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visit Details Section */}
        {(visitData.visit_purpose ||
          visitData.people_met ||
          visitData.visit_summary ||
          visitData.next_steps) && (
          <div className="section-container" style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "1rem",
              }}
            >
              {visitData.people_met && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    People Met
                  </label>
                  <div style={{ color: "#fff", fontSize: "14px" }}>
                    {visitData.people_met}
                  </div>
                </div>
              )}
              {visitData.visit_summary && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Visit Summary
                  </label>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {visitData.visit_summary}
                  </div>
                </div>
              )}
              {visitData.next_steps && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Next Steps
                  </label>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {visitData.next_steps}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamps Section */}
        <div className="section-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label
                style={{
                  color: "#999",
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                <FaClock style={{ marginRight: "0.5rem", color: "#FF5757" }} />
                Created At
              </label>
              <div style={{ color: "#fff", fontSize: "14px" }}>
                {formatDate(visitData.created_at)}
              </div>
            </div>
            <div>
              <label
                style={{
                  color: "#999",
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                <FaClock style={{ marginRight: "0.5rem", color: "#FF5757" }} />
                Last Updated
              </label>
              <div style={{ color: "#fff", fontSize: "14px" }}>
                {formatDate(visitData.updated_at)}
              </div>
            </div>
            {visitData.check_in_time && (
              <div>
                <label
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  <FaCheckCircle
                    style={{ marginRight: "0.5rem", color: "#10b981" }}
                  />
                  Check-In Time
                </label>
                <div style={{ color: "#fff", fontSize: "14px" }}>
                  {formatDate(visitData.check_in_time)}
                </div>
              </div>
            )}
            {visitData.final_status === "followup" &&
              visitData.next_follow_up_date && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <FaClock
                      style={{ marginRight: "0.5rem", color: "#f59e0b" }}
                    />
                    Next Follow-Up Date
                  </label>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {formatDate(visitData.next_follow_up_date)}
                  </div>
                </div>
              )}
            {visitData.final_status === "rejected" &&
              visitData.rejection_reason && (
                <div>
                  <label
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <FaTimes
                      style={{ marginRight: "0.5rem", color: "#ef4444" }}
                    />
                    Rejection Reason
                  </label>
                  <div
                    style={{
                      color: "#fff",
                      fontSize: "14px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {visitData.rejection_reason}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && photos.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={closePhotoModal}
        >
          {/* Close Button */}
          <button
            onClick={closePhotoModal}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "white",
              fontSize: "24px",
              cursor: "pointer",
              padding: "10px 15px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10001,
            }}
          >
            <FaTimes />
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
              style={{
                position: "absolute",
                left: "20px",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                padding: "15px 20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10001,
              }}
            >
              <FaChevronLeft />
            </button>
          )}

          {/* Photo Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <img
              src={photos[currentPhotoIndex].url}
              alt={photos[currentPhotoIndex].label}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <div
              style={{ color: "white", fontSize: "16px", fontWeight: "500" }}
            >
              {photos[currentPhotoIndex].label}
            </div>
          </div>

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
              style={{
                position: "absolute",
                right: "20px",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
                padding: "15px 20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10001,
              }}
            >
              <FaChevronRight />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
