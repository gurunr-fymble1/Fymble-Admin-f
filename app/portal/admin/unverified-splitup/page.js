"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaTag,
  FaLayerGroup,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

export default function UnverifiedSplitup() {
  const router = useRouter();
  // State variables
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("red"); // 'red' or 'hold'
  const [gyms, setGyms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // Plans modal state
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedGymPlans, setSelectedGymPlans] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Status modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedGymStatus, setSelectedGymStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

  const fetchGyms = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: activeTab,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      if (cityFilter) {
        params.city = cityFilter;
      }

      const response = await axiosInstance.get("/api/admin/unverified-gyms/splitup", {
        params,
      });

      if (response.data.success) {
        setGyms(response.data.data.gyms || []);
        setTotalCount(response.data.data.total);
        setTotalPages(response.data.data.totalPages);
        // Update available cities from response
        if (response.data.data.cities) {
          setAvailableCities(response.data.data.cities);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch gyms");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, activeTab, debouncedSearchTerm, cityFilter]);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
        window.scrollTo({  behavior: "smooth" }); //top: 0,
    }
  };

  // const totalPages = Math.ceil(totalCount / itemsPerPage);

  const getPaginationNumber = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    else if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } 
    else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } 
    else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  }

  const handleCityChange = (city) => {
    setCityFilter(city);
    setCurrentPage(1);
  };

  const handlePlansClick = async (gym) => {
    setSelectedGym(gym);
    setShowPlansModal(true);
    setLoadingPlans(true);
    setSelectedGymPlans(null);

    try {
      const response = await axiosInstance.get(`/api/admin/unverified-gyms/gym-plans/${gym.gym_id}`);
      setSelectedGymPlans(response.data.data);
    } catch (error) {
      console.error("Failed to fetch gym plans:", error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPlansButtonColor = (score) => {
    if (score >= 70) return "border-green-700 bg-green-900/30 text-green-400";
    if (score >= 40) return "border-green-700 bg-green-900/30 text-green-400";
    return "border-green-700 bg-green-900/30 text-green-400";
  };

  const getPlansScoreColor = (score) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Status modal functions
  const handleStatusClick = async (gym) => {
    setSelectedGym(gym);
    setShowStatusModal(true);
    setLoadingStatus(true);
    setSelectedGymStatus(null);

    try {
      const response = await axiosInstance.get(`/api/admin/unverified-gyms/gym-registration-status/${gym.gym_id}`);
      setSelectedGymStatus(response.data.data);
    } catch (error) {
      console.error("Failed to fetch gym status:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const calculateCompletionPercentage = (registrationSteps) => {
    if (!registrationSteps) return 40;

    let trueCount = 0;

    if (registrationSteps.account_details) trueCount++;
    if (registrationSteps.services) trueCount++;
    if (registrationSteps.operating_hours) trueCount++;
    if (registrationSteps.agreement) trueCount++;

    if (registrationSteps.documents && registrationSteps.documents.length > 0) {
      const completedDocsCount = registrationSteps.documents.filter(doc => {
        const value = Object.values(doc)[0];
        return value === true;
      }).length;

      if (completedDocsCount >= 2) {
        trueCount++;
      }
    }

    if (registrationSteps.onboarding_pics && registrationSteps.onboarding_pics.length > 0) {
      const completedPicsCount = registrationSteps.onboarding_pics.filter(pic => {
        const value = Object.values(pic)[0];
        return value === true;
      }).length;

      if (completedPicsCount >= 3) {
        trueCount++;
      }
    }

    return Math.min(100, 40 + (trueCount * 10));
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return "#4ade80"; // green-400
    if (percentage >= 60) return "#facc15"; // yellow-400
    return "#f87171"; // red-400
  };

  const getPercentageBgColor = (percentage) => {
    if (percentage >= 80) return "rgba(34, 197, 94, 0.15)"; // green
    if (percentage >= 60) return "rgba(234, 179, 8, 0.15)"; // yellow
    return "rgba(239, 68, 68, 0.15)"; // red
  };

  const getPercentageBorderColor = (percentage) => {
    if (percentage >= 80) return "#166534"; // green-700
    if (percentage >= 60) return "#a16207"; // yellow-700
    return "#991b1b"; // red-700
  };

  if (loading && gyms.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <button
            className="back-button"
            onClick={() => router.back()}
            style={{
              background: "none",
              border: "none",
              color: "#FF5757",
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => e.target.style.color = "#ff4545"}
            onMouseLeave={(e) => e.target.style.color = "#FF5757"}
          >
            <FaChevronLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
            <h2 className="users-title" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Unverified</span> Splitup
            </h2>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
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
              Loading gyms...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <button
          className="back-button"
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "#FF5757",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 0",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => e.target.style.color = "#ff4545"}
          onMouseLeave={(e) => e.target.style.color = "#FF5757"}
        >
          <FaChevronLeft size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
          <h2 className="users-title" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Unverified</span> Splitup
          </h2>
        </div>
        <div className="users-count">Total: {totalCount} gyms</div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              setActiveTab("red");
              setCurrentPage(1);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: activeTab === "red" ? "#ef4444" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "red" ? "600" : "400",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaTag size={16} />
            Red Gyms
          </button>
          <button
            onClick={() => {
              setActiveTab("hold");
              setCurrentPage(1);
            }}
            style={{
              padding: "10px 20px",
              backgroundColor: activeTab === "hold" ? "#eab308" : "#2a2a2a",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: activeTab === "hold" ? "600" : "400",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaTag size={16} />
            Hold Gyms
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            minWidth: "300px",
            maxWidth: "500px",
          }}
        >
          <FaSearch
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888",
            }}
          />
          <input
            type="text"
            placeholder="Search by gym name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px 12px 45px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        {/* City Filter */}
        <div
          style={{
            minWidth: "200px",
          }}
        >
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 15px",
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "white",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">All Cities</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #333",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#2a2a2a",
                  borderBottom: "1px solid #333",
                }}
              >
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Gym Name
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Daily Pass
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Session
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Membership
                </th>
                {/* <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Plans
                </th> */}
                <th
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Registration Status
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody>
              {gyms.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      padding: "60px",
                      textAlign: "center",
                      color: "#888",
                    }}
                  >
                    <div style={{ marginBottom: "16px" }}>
                      <FaTag
                        size={48}
                        style={{
                          opacity: 0.3,
                          color: activeTab === "red" ? "#ef4444" : "#eab308",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                      {searchTerm
                        ? `No ${activeTab} gyms found`
                        : `No ${activeTab} gyms found`}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} gyms will appear here`}
                    </div>
                  </td>
                </tr>
              ) : (
                gyms.map((gym, index) => (
                  <tr
                    key={gym.gym_id}
                    style={{
                      borderBottom:
                        index !== gyms.length - 1 ? "1px solid #333" : "none",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#2a2a2a")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td style={{ padding: "16px", color: "#fff" }}>
                      {gym.gym_name || "-"}
                    </td>
                    <td style={{ padding: "16px", color: "#ccc" }}>
                      {gym.city || gym.location || "-"}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      {gym.has_daily_pass ? (
                        <FaCheckCircle size={18} style={{ color: "#4ade80" }} />
                      ) : (
                        <FaTimes size={18} style={{ color: "#f87171" }} />
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      {gym.has_session ? (
                        <FaCheckCircle size={18} style={{ color: "#4ade80" }} />
                      ) : (
                        <FaTimes size={18} style={{ color: "#f87171" }} />
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      {gym.has_membership ? (
                        <FaCheckCircle size={18} style={{ color: "#4ade80" }} />
                      ) : (
                        <FaTimes size={18} style={{ color: "#f87171" }} />
                      )}
                    </td>
                    {/* <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handlePlansClick(gym)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1px solid #166534",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                          backgroundColor: "rgba(34, 197, 94, 0.15)",
                          color: "#4ade80",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.05)";
                          e.target.style.opacity = "0.8";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.opacity = "1";
                        }}
                      >
                        <FaLayerGroup size={14} />
                        {gym.plans_completion_score !== undefined && gym.plans_completion_score > 0
                          ? `${gym.plans_completion_score}%`
                          : "Plans"}
                      </button>
                    </td> */}
                    <td
                      style={{
                        padding: "16px",
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleStatusClick(gym)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: `1px solid ${getPercentageBorderColor(gym.registration_completion || 40)}`,
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.2s",
                          backgroundColor: getPercentageBgColor(gym.registration_completion || 40),
                          color: getPercentageColor(gym.registration_completion || 40),
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.05)";
                          e.target.style.opacity = "0.8";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.opacity = "1";
                        }}
                      >
                        {gym.registration_completion || 40}%
                      </button>
                    </td>
                    <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                      {formatDate(gym.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              borderTop: "1px solid #333",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div style={{ color: "#888", fontSize: "14px" }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
              gyms
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >

              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  backgroundColor:
                    currentPage === 1 ? "#333" : "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  color: currentPage === 1 ? "#666" : "#fff",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1)
                    e.target.style.backgroundColor = "#3a3a3a";
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1)
                    e.target.style.backgroundColor = "#2a2a2a";
                }}
              >
                <FaChevronLeft size={12} />
                Previous
              </button>

              {getPaginationNumber().map((pageNum, idx) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(pageNum)}
                    // disabled={pageNum === '...'}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: isActive ? "#FF5757" : "transparent",
                      border: "none",
                      borderRadius: "4px",
                      color: isActive ? "#fff" : "#ccc",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: isActive ? "600" : "400",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.target.style.backgroundColor = "#3a3a3a";

                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.target.style.backgroundColor = "transparent";
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* <div
                style={{
                  display: "flex",
                  gap: "4px",
                  backgroundColor: "#2a2a2a",
                  padding: "4px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                }} */}
              {/* > */}
                {/* {[...Array(totalPages)].slice(0, 5).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isActive = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: isActive ? "#FF5757" : "transparent",
                        border: "none",
                        borderRadius: "4px",
                        color: isActive ? "#fff" : "#ccc",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: isActive ? "600" : "400",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.target.style.backgroundColor = "#3a3a3a";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.target.style.backgroundColor = "transparent";
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })} */}
              {/* </div> */}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  backgroundColor:
                    currentPage === totalPages ? "#333" : "#2a2a2a",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  color: currentPage === totalPages ? "#666" : "#fff",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages)
                    e.target.style.backgroundColor = "#3a3a3a";
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages)
                    e.target.style.backgroundColor = "#2a2a2a";
                }}
              >
                Next
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plans Modal */}
      {showPlansModal && selectedGym && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowPlansModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid #333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#fff",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FaLayerGroup style={{ color: "#FF5757" }} />
                Plans - {selectedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowPlansModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "0",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => e.target.style.color = "#fff"}
                onMouseLeave={(e) => e.target.style.color = "#888"}
              >
                ×
              </button>
            </div>

            {loadingPlans ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #3a3a3a",
                    borderTop: "4px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : selectedGymPlans ? (
              <div>
                {/* Completion Score */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Plans Completion Score
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: getPlansScoreColor(selectedGymPlans.completion_score),
                      }}
                    >
                      {selectedGymPlans.completion_score}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#3a3a3a",
                      borderRadius: "4px",
                      height: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor:
                          selectedGymPlans.completion_score >= 75
                            ? "#22c55e"
                            : selectedGymPlans.completion_score >= 50
                            ? "#eab308"
                            : "#ef4444",
                        width: `${selectedGymPlans.completion_score}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginTop: "8px",
                      margin: 0,
                    }}
                  >
                    Based on: Daily Pass (33.33%), Sessions (33.33%), Gym Plans (33.34%)
                  </p>
                </div>

                {/* Daily Pass Section */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <FaTag size={18} style={{ color: "#3b82f6" }} />
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      Daily Pass
                    </h4>
                  </div>
                  {selectedGymPlans.daily_pass.count > 0 ? (
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#ccc",
                          marginBottom: "12px",
                        }}
                      >
                        {selectedGymPlans.daily_pass.count} daily pass option(s) available
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gap: "8px",
                        }}
                      >
                        {selectedGymPlans.daily_pass.entries.map((pass, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: "#1e1e1e",
                              padding: "12px",
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "14px",
                                color: "#fff",
                              }}
                            >
                              ₹{(pass.price / 100).toFixed(2)}
                            </span>
                            {pass.discount_price && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "12px",
                                    color: "#888",
                                    textDecoration: "line-through",
                                  }}
                                >
                                  ₹{(pass.price / 100).toFixed(2)}
                                </span>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    color: "#22c55e",
                                    fontWeight: "600",
                                  }}
                                >
                                  ₹{(pass.discount_price / 100).toFixed(2)}
                                </span>
                                {pass.discount_percentage && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 8px",
                                      backgroundColor: "rgba(34, 197, 94, 0.2)",
                                      color: "#22c55e",
                                      borderRadius: "12px",
                                    }}
                                  >
                                    {pass.discount_percentage}% off
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: "14px", color: "#888" }}>
                      No daily pass options available
                    </p>
                  )}
                </div>

                {/* Sessions Section */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <FaLayerGroup size={18} style={{ color: "#a855f7" }} />
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      Sessions
                    </h4>
                  </div>
                  {selectedGymPlans.sessions.count > 0 ? (
                    <div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#ccc",
                          marginBottom: "12px",
                        }}
                      >
                        {selectedGymPlans.sessions.count} session(s) created
                      </p>
                      {selectedGymPlans.sessions.lowest_price && (
                        <div
                          style={{
                            backgroundColor: "#1e1e1e",
                            padding: "12px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "14px", color: "#fff" }}>
                            Starting from{" "}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              color: "#22c55e",
                              fontWeight: "600",
                            }}
                          >
                            {selectedGymPlans.sessions.lowest_price}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: "14px", color: "#888" }}>
                      No sessions created
                    </p>
                  )}
                </div>

                {/* Gym Plans Section */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <FaTag size={18} style={{ color: "#f97316" }} />
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#fff",
                        margin: 0,
                      }}
                    >
                      Gym Plans
                    </h4>
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#ccc",
                    }}
                  >
                    {selectedGymPlans.gym_plans.count} plan(s) created
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowPlansModal(false)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#FF5757",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#ff4545"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#FF5757"}
                >
                  Close
                </button>
              </div>
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Failed to load plans data
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedGym && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setShowStatusModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "1px solid #333",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#fff",
                  margin: 0,
                }}
              >
                Status - {selectedGym.gym_name}
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "0",
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => e.target.style.color = "#fff"}
                onMouseLeave={(e) => e.target.style.color = "#888"}
              >
                ×
              </button>
            </div>

            {loadingStatus ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "40px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #3a3a3a",
                    borderTop: "4px solid #FF5757",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : selectedGymStatus?.registration_steps ? (
              <div>
                {/* Account Details */}
                <div
                  style={{
                    backgroundColor: selectedGymStatus.registration_steps.account_details ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${selectedGymStatus.registration_steps.account_details ? "#166534" : "#991b1b"}`,
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Account Details
                    </span>
                    {selectedGymStatus.registration_steps.account_details ? (
                      <FaCheckCircle style={{ color: "#4ade80" }} />
                    ) : (
                      <FaTimes style={{ color: "#f87171" }} />
                    )}
                  </div>
                </div>

                {/* Services */}
                <div
                  style={{
                    backgroundColor: selectedGymStatus.registration_steps.services ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${selectedGymStatus.registration_steps.services ? "#166534" : "#991b1b"}`,
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Services
                    </span>
                    {selectedGymStatus.registration_steps.services ? (
                      <FaCheckCircle style={{ color: "#4ade80" }} />
                    ) : (
                      <FaTimes style={{ color: "#f87171" }} />
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div
                  style={{
                    backgroundColor: selectedGymStatus.registration_steps.operating_hours ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${selectedGymStatus.registration_steps.operating_hours ? "#166534" : "#991b1b"}`,
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Operating Hours
                    </span>
                    {selectedGymStatus.registration_steps.operating_hours ? (
                      <FaCheckCircle style={{ color: "#4ade80" }} />
                    ) : (
                      <FaTimes style={{ color: "#f87171" }} />
                    )}
                  </div>
                </div>

                {/* Agreement */}
                <div
                  style={{
                    backgroundColor: selectedGymStatus.registration_steps.agreement ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    border: `1px solid ${selectedGymStatus.registration_steps.agreement ? "#166534" : "#991b1b"}`,
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Agreement
                    </span>
                    {selectedGymStatus.registration_steps.agreement ? (
                      <FaCheckCircle style={{ color: "#4ade80" }} />
                    ) : (
                      <FaTimes style={{ color: "#f87171" }} />
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Documents (PAN & Passbook)
                    </span>
                  </div>
                  {selectedGymStatus.registration_steps.documents?.map((doc, idx) => {
                    const [key, value] = Object.entries(doc)[0];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginLeft: "12px",
                          marginBottom: idx < selectedGymStatus.registration_steps.documents.length - 1 ? "4px" : "0",
                        }}
                      >
                        {value ? (
                          <FaCheckCircle size={12} style={{ color: "#4ade80" }} />
                        ) : (
                          <FaTimes size={12} style={{ color: "#f87171" }} />
                        )}
                        <span
                          style={{
                            fontSize: "12px",
                            color: value ? "#4ade80" : "#f87171",
                          }}
                        >
                          {key === "pancard" ? "PAN Card" : "Passbook"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Onboarding Pictures */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Onboarding Pictures
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px",
                      marginLeft: "12px",
                    }}
                  >
                    {selectedGymStatus.registration_steps.onboarding_pics?.map((pic, idx) => {
                      const [key, value] = Object.entries(pic)[0];
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {value ? (
                            <FaCheckCircle size={12} style={{ color: "#4ade80" }} />
                          ) : (
                            <FaTimes size={12} style={{ color: "#f87171" }} />
                          )}
                          <span
                            style={{
                              fontSize: "11px",
                              color: value ? "#4ade80" : "#f87171",
                            }}
                          >
                            {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Overall Progress */}
                <div
                  style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#ccc",
                      }}
                    >
                      Overall Progress
                    </span>
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: getPercentageColor(
                          calculateCompletionPercentage(selectedGymStatus.registration_steps)
                        ),
                      }}
                    >
                      {calculateCompletionPercentage(selectedGymStatus.registration_steps)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      backgroundColor: "#3a3a3a",
                      borderRadius: "4px",
                      height: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor:
                          calculateCompletionPercentage(selectedGymStatus.registration_steps) >= 80
                            ? "#22c55e"
                            : calculateCompletionPercentage(selectedGymStatus.registration_steps) >= 60
                            ? "#eab308"
                            : "#ef4444",
                        width: `${calculateCompletionPercentage(selectedGymStatus.registration_steps)}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "#FF5757",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = "#ff4545"}
                  onMouseLeave={(e) => e.target.style.backgroundColor = "#FF5757"}
                >
                  Close
                </button>
              </div>
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Failed to load status data
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}