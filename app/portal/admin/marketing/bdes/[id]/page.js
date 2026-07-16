"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCopy,
  FaBuilding,
} from "react-icons/fa";

export default function BDETracker() {
  const router = useRouter();
  const params = useParams();
  const bdeId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [bdeName, setBdeName] = useState("");
  const [trackerSummary, setTrackerSummary] = useState(null);
  const [gymVisits, setGymVisits] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [followupVisits, setFollowupVisits] = useState([]);
  const [convertedVisits, setConvertedVisits] = useState([]);
  const [rejectedVisits, setRejectedVisits] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    followup: 0,
    converted: 0,
    rejected: 0
  });

  // Add spinner animation
  useEffect(() => {
    const style = document.createElement('style');
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
    if (bdeId) {
      fetchTrackerData();
    }
  }, [bdeId]);

  // Fetch data when tab changes
  useEffect(() => {
    if (bdeId && activeTab) {
      fetchTabData(activeTab);
    }
  }, [activeTab, bdeId]);

  const fetchTrackerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tracker summary for user profile
      const summaryResponse = await axiosInstance.get(
        `/marketing/gym-visits/tracker/${bdeId}/BDE`
      );

      if (summaryResponse.data.status === 200) {
        setTrackerSummary(summaryResponse.data.summary);
        setBdeName(summaryResponse.data.user_profile?.name || "Executive");
      }

      // Fetch all tab counts in parallel
      const [pendingRes, followupRes, convertedRes, rejectedRes] = await Promise.all([
        axiosInstance.get(`/marketing/gym-visits/tracker/pending?user_id=${bdeId}&role=BDE`),
        axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/followups`),
        axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/converted`),
        axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/rejected`)
      ]);

      // Extract counts from responses
      const pendingData = pendingRes.data.status === 200 ? (pendingRes.data.data || pendingRes.data) : [];
      const followupData = followupRes.data.status === 200 ? (followupRes.data.data || followupRes.data) : [];
      const convertedData = convertedRes.data.status === 200 ? (convertedRes.data.data || convertedRes.data) : [];
      const rejectedData = rejectedRes.data.status === 200 ? (rejectedRes.data.data || rejectedRes.data) : [];

      // Store all data
      setPendingVisits(pendingData);
      setFollowupVisits(followupData);
      setConvertedVisits(convertedData);
      setRejectedVisits(rejectedData);

      // Set counts
      setTabCounts({
        pending: Array.isArray(pendingData) ? pendingData.length : 0,
        followup: Array.isArray(followupData) ? followupData.length : 0,
        converted: Array.isArray(convertedData) ? convertedData.length : 0,
        rejected: Array.isArray(rejectedData) ? rejectedData.length : 0
      });

      // Set displayed visits for active tab
      if (activeTab === "pending") {
        setGymVisits(pendingData);
      } else if (activeTab === "followup") {
        setGymVisits(followupData);
      } else if (activeTab === "converted") {
        setGymVisits(convertedData);
      } else if (activeTab === "rejected") {
        setGymVisits(rejectedData);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load tracker data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    // Check if data already loaded for this tab
    const isDataLoaded = {
      pending: pendingVisits.length > 0,
      followup: followupVisits.length > 0,
      converted: convertedVisits.length > 0,
      rejected: rejectedVisits.length > 0
    };

    // If already loaded, just switch to it
    if (isDataLoaded[tab]) {
      switch (tab) {
        case "pending":
          setGymVisits(pendingVisits);
          return;
        case "followup":
          setGymVisits(followupVisits);
          return;
        case "converted":
          setGymVisits(convertedVisits);
          return;
        case "rejected":
          setGymVisits(rejectedVisits);
          return;
      }
    }

    try {
      setLoading(true);
      let response;

      switch (tab) {
        case "pending":
          response = await axiosInstance.get(`/marketing/gym-visits/tracker/pending?user_id=${bdeId}&role=BDE`);
          if (response.data.status === 200) {
            const visits = response.data.data || response.data;
            setPendingVisits(visits);
            setGymVisits(visits);
          }
          break;
        case "followup":
          response = await axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/followups`);
          if (response.data.status === 200) {
            const visits = response.data.data || response.data;
            setFollowupVisits(visits);
            setGymVisits(visits);
          }
          break;
        case "converted":
          response = await axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/converted`);
          if (response.data.status === 200) {
            const visits = response.data.data || response.data;
            setConvertedVisits(visits);
            setGymVisits(visits);
          }
          break;
        case "rejected":
          response = await axiosInstance.get(`/marketing/gym-visits/tracker/${bdeId}/BDE/rejected`);
          if (response.data.status === 200) {
            const visits = response.data.data || response.data;
            setRejectedVisits(visits);
            setGymVisits(visits);
          }
          break;
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = (gymName, address) => {
    navigator.clipboard.writeText(address);
    alert(`Address of ${gymName} copied to clipboard!`);
  };

  const handleOpenMaps = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  };

  const getStepName = (step) => {
    const stepNames = ["Pre-Visit", "Check-In", "Photos", "Assessment", "Final Status"];
    return stepNames[step] || "Unknown";
  };

  const getProgressPercentage = (currentStep, totalSteps = 5) => {
    return Math.round((currentStep / totalSteps) * 100);
  };

  const tabs = [
    { id: "pending", label: "Pending", count: tabCounts.pending },
    { id: "followup", label: "Follow Ups", count: tabCounts.followup },
    { id: "converted", label: "Converted", count: tabCounts.converted },
    { id: "rejected", label: "Rejected", count: tabCounts.rejected },
  ];

  if (loading && !trackerSummary) {
    return (
      <div className="users-container">
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading tracker data...
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

  return (
    <div className="users-container">
      {/* Header with Back Button */}
      <div className="users-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/portal/admin/marketing/bdes")}
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
            <span style={{ color: "#FF5757" }}>{bdeName}</span> Report
          </h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div style={{
        height: "calc(100vh - 120px)",
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "10px",
        paddingBottom: "40px",
        paddingTop: "20px"
      }}>
        {/* Tabs Section */}
        <div className="section-container">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "transparent",
                color: activeTab === tab.id ? "#FF5757" : "#ccc",
                border: activeTab === tab.id ? "2px solid #FF5757" : "2px solid #3a3a3a",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab.id ? "600" : "500",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              {tab.label}
              <span
                style={{
                  background: activeTab === tab.id ? "#FF5757" : "#3a3a3a",
                  color: "white",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gym Visits Cards */}
      <div className="section-container" style={{ position: "relative", minHeight: "400px" }}>
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "40px"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "50px",
                height: "50px",
                border: "4px solid #3a3a3a",
                borderTop: "4px solid #FF5757",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 1rem"
              }} />
              <p style={{ fontSize: "14px", color: "#ccc" }}>Loading visits...</p>
            </div>
          </div>
        ) : gymVisits.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {gymVisits.map((visit) => {
              const progressPercentage = activeTab === "pending" ? getProgressPercentage(visit.current_step) : 100;
              const stepName = activeTab === "pending" ? getStepName(visit.current_step) : "";

              return (
                <div
                  key={visit.id}
                  onClick={() => router.push(`/portal/admin/marketing/gym-visits/${visit.id}`)}
                  style={{
                    background: "#2a2a2a",
                    borderRadius: "12px",
                    overflow: "hidden",
                    border: "1px solid #3a3a3a",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    minHeight: "350px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 87, 87, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Gym Image */}
                  <div style={{ position: "relative", height: "150px", background: "#1a1a1a" }}>
                    {visit.exterior_photo ? (
                      <img
                        src={visit.exterior_photo}
                        alt={visit.gym_name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#666" }}>
                        <FaBuilding size={48} />
                      </div>
                    )}
                    {visit.is_self_assigned && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          background: "#8b5cf6",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Self-Assigned
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "1.25rem" }}>
                    {/* Gym Name */}
                    <h3 style={{ color: "white", fontSize: "16px", fontWeight: "600", marginBottom: "0.75rem" }}>
                      {visit.gym_name || "New Visit"}
                    </h3>

                    {/* Address */}
                    <div style={{ display: "flex", alignItems: "start", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <FaMapMarkerAlt style={{ color: "#FF5757", marginTop: "4px", flexShrink: 0 }} />
                      <p style={{ color: "#ccc", fontSize: "13px", margin: 0, flex: 1 }}>
                        {visit.gym_address || "Address not specified"}
                      </p>
                      {visit.gym_address && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(visit.gym_name, visit.gym_address);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#8b5cf6",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                            title="Copy address"
                          >
                            <FaCopy size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMaps(visit.gym_address);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#4285F4",
                              cursor: "pointer",
                              padding: "4px",
                            }}
                            title="Open in Google Maps"
                          >
                            <FaMapMarkerAlt size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Referral ID */}
                    {visit.referal_id && (
                      <p style={{ color: "#999", fontSize: "12px", marginBottom: "0.75rem" }}>
                        Referral ID: <span style={{ color: "#FF5757" }}>{visit.referal_id}</span>
                      </p>
                    )}

                    {/* Progress Bar for Pending */}
                    {activeTab === "pending" && (
                      <div style={{ marginTop: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ color: "#ccc", fontSize: "12px" }}>
                            Step {visit.current_step + 1}/5 - {stepName}
                          </span>
                          <span style={{ color: "#FF5757", fontSize: "12px", fontWeight: "600" }}>
                            {progressPercentage}%
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: "8px",
                            background: "#3a3a3a",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${progressPercentage}%`,
                              height: "100%",
                              background: "linear-gradient(90deg, #FF5757, #FF8A80)",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "calc(100vh - 300px)",
            color: "#666"
          }}>
            <FaBuilding size={48} style={{ marginBottom: "1rem", opacity: 0.5 }} />
            <p style={{ fontSize: "16px", margin: 0 }}>No {activeTab} visits found</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
