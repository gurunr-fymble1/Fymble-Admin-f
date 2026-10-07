"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaComment,
  FaPlus,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { formatGymName } from "@/lib/utils";

export default function GymStats() {
  const router = useRouter();
  // State variables
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalGyms, setTotalGyms] = useState(0);
  const [registeredUsersFilter, setRegisteredUsersFilter] = useState("");
  const [planTypeFilters, setPlanTypeFilters] = useState({
    sessionPlans: false,
    membershipPlans: false,
    dailyPass: false,
  });

  // Modal state for gym address
  const [selectedGym, setSelectedGym] = useState(null);

  // Modal state for gym reviews
  const [selectedReviewGym, setSelectedReviewGym] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Add review form state
  const [showAddReview, setShowAddReview] = useState(false);
  const [newAction, setNewAction] = useState("approve");
  const [newReviewText, setNewReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const fetchGymReviews = async (gymId) => {
    try {
      setReviewsLoading(true);
      const response = await axiosInstance.get(`/support-app/gym-review/gym/${gymId}/reviews`);
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error fetching gym reviews:", error?.response?.data || error?.message || error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddReview = async (e) => {
    e?.preventDefault();
    if (!newAction.trim()) {
      setReviewError("Please enter an action type.");
      return;
    }
    if (!newReviewText.trim()) {
      setReviewError("Please enter review comments.");
      return;
    }
    if (!selectedReviewGym?.gym_id) return;

    try {
      setSubmittingReview(true);
      setReviewError("");
      await axiosInstance.post("/support-app/gym-review/gym/review", {
        gym_id: selectedReviewGym.gym_id,
        action: newAction.trim(),
        review: newReviewText.trim(),
      });
      setReviewSuccess("Review added successfully!");
      setNewReviewText("");
      setNewAction("Approve");
      setShowAddReview(false);
      await fetchGymReviews(selectedReviewGym.gym_id);
      setTimeout(() => setReviewSuccess(""), 3000);
    } catch (err) {
      console.error("Error adding review:", err);
      setReviewError(err.response?.data?.detail || "Failed to add review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
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
        sort_order: sortOrder,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      // Add plan type filters
      if (planTypeFilters.sessionPlans) {
        params.has_session_plans = true;
      }
      if (planTypeFilters.membershipPlans) {
        params.has_membership_plans = true;
      }
      if (planTypeFilters.dailyPass) {
        params.has_daily_pass = true;
      }

      const response = await axiosInstance.get("/api/admin/gym-stats", { params });

      if (response.data.success) {
        setGyms(response.data.data.gyms);
        setTotalGyms(response.data.data.total);
      }
    } catch (error) {
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, sortOrder, currentPage, itemsPerPage, planTypeFilters]);

  // Fetch gyms when filters change
  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
  };

  const handlePlanTypeFilterChange = (filterType) => {
    setPlanTypeFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  const totalPages = Math.ceil(totalGyms / itemsPerPage);

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading && gyms.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Business Users
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading gyms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Business Users
        </h2>
        <div className="users-count">Total: {totalGyms} gyms</div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="row pb-0">
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by gym, owner, mobile, city..."
                value={searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <button
              className="sort-btn"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
              Sort Date
            </button>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={registeredUsersFilter}
              onChange={(e) => {
                setRegisteredUsersFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All gyms</option>
              <option value="50">&gt; 50 Clients</option>
              <option value="100">&gt; 100 Clients</option>
              <option value="150">&gt; 150 Clients</option>
              <option value="200">&gt; 200 Clients</option>
              <option value="250">&gt; 250 Clients</option>
            </select>
          </div>
        </div>

        {/* Plan Type Filter Toggle Buttons */}
        <div className="row" style={{ marginTop: "10px" }}>
          <div className="col-12">
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => handlePlanTypeFilterChange("sessionPlans")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.sessionPlans
                    ? "#FF5757"
                    : "#252525",
                  border: planTypeFilters.sessionPlans
                    ? "1px solid #FF5757"
                    : "1px solid #444",
                  color: planTypeFilters.sessionPlans ? "white" : "#999",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontWeight: "500",
                }}
              >
                {planTypeFilters.sessionPlans ? "✓ " : ""}Session Plans
              </button>

              <button
                onClick={() => handlePlanTypeFilterChange("membershipPlans")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.membershipPlans
                    ? "#FF5757"
                    : "#252525",
                  border: planTypeFilters.membershipPlans
                    ? "1px solid #FF5757"
                    : "1px solid #444",
                  color: planTypeFilters.membershipPlans ? "white" : "#999",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontWeight: "500",
                }}
              >
                {planTypeFilters.membershipPlans ? "✓ " : ""}Membership Plans
              </button>

              <button
                onClick={() => handlePlanTypeFilterChange("dailyPass")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.dailyPass
                    ? "#FF5757"
                    : "#252525",
                  border: planTypeFilters.dailyPass
                    ? "1px solid #FF5757"
                    : "1px solid #444",
                  color: planTypeFilters.dailyPass ? "white" : "#999",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontWeight: "500",
                }}
              >
                {planTypeFilters.dailyPass ? "✓ " : ""}Daily Pass Pricing
              </button>

              {(planTypeFilters.sessionPlans ||
                planTypeFilters.membershipPlans ||
                planTypeFilters.dailyPass) && (
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setPlanTypeFilters({
                      sessionPlans: false,
                      membershipPlans: false,
                      dailyPass: false,
                    });
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    border: "1px solid #666",
                    color: "#999",
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontWeight: "500",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#333";
                    e.target.style.borderColor = "#888";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.borderColor = "#666";
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Gym Name</th>
                <th>Owner</th>
                <th>Mobile</th>
                <th>City</th>
                <th>Clients</th>
                <th>Verified</th>
                <th>Review</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {gyms.length > 0 ? (
                gyms.map((gym) => (
                    <tr
                      key={gym.gym_id}
                      onClick={() => router.push(`/portal/support/gymdetails?id=${gym.gym_id}`)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1f1f';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ position: 'relative' }}>
                        <div className="user-name">{formatGymName(gym.gym_name) || "-"}</div>
                        {gym.address && (
                          <FaInfoCircle
                            style={{
                              color: '#FF5757',
                              cursor: 'pointer',
                              fontSize: '14px',
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGym(gym);
                            }}
                            title="View full address"
                          />
                        )}
                      </td>
                      <td>{gym.owner_name || "-"}</td>
                      <td>{gym.contact_number || "-"}</td>
                      <td>{gym.location || "-"}</td>
                      <td>{gym.registered_users || "-"}</td>
                      <td>
                        <span className="plan-badge" style={{
                          backgroundColor: gym.fittbot_verified ? '#16a34a' : '#ef4444',
                          color: 'white'
                        }}>
                          {gym.fittbot_verified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          {gym.has_review && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReviewGym(gym);
                                setShowAddReview(false);
                                fetchGymReviews(gym.gym_id);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="View Reviews"
                            >
                              <FaComment style={{ color: '#FF5757', fontSize: '15px' }} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReviewGym(gym);
                              setShowAddReview(true);
                              fetchGymReviews(gym.gym_id);
                            }}
                            style={{
                              background: 'rgba(255, 87, 87, 0.15)',
                              border: '1px solid rgba(255, 87, 87, 0.35)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FF5757',
                              cursor: 'pointer',
                              padding: 0,
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FF5757';
                              e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 87, 87, 0.15)';
                              e.currentTarget.style.color = '#FF5757';
                            }}
                            title="Add New Review"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      </td>
                      <td>{formatDate(gym.created_at)}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    No gyms found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalGyms)} of {totalGyms}{" "}
            entries
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <FaChevronLeft />
            </button>

            {getPaginationNumbers().map((page, index) => (
              <button
                key={index}
                className={`pagination-btn ${
                  page === currentPage ? "active" : ""
                } ${page === "..." ? "dots" : ""}`}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Gym Address Modal */}
      {selectedGym && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedGym(null)}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: '#FF5757',
                marginBottom: '20px',
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              Gym Address
            </h3>
            <div
              style={{
                color: '#ffffff',
                fontSize: '15px',
                lineHeight: '1.8',
              }}
            >
              {selectedGym.street_address && selectedGym.street_address !== '-' && (
                <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
                  {selectedGym.street_address}
                </div>
              )}
              {selectedGym.area && selectedGym.area !== '-' && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#888', fontSize: '13px' }}>Area: </span>
                  <span>{selectedGym.area}</span>
                </div>
              )}
              {selectedGym.city && selectedGym.city !== '-' && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#888', fontSize: '13px' }}>City: </span>
                  <span>{selectedGym.city}</span>
                </div>
              )}
              {selectedGym.state && selectedGym.state !== '-' && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#888', fontSize: '13px' }}>State: </span>
                  <span>{selectedGym.state}</span>
                </div>
              )}
              {selectedGym.pincode && selectedGym.pincode !== '-' && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#888', fontSize: '13px' }}>Pincode: </span>
                  <span>{selectedGym.pincode}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedGym(null)}
              style={{
                backgroundColor: '#FF5757',
                color: 'white',
                border: 'none',
                padding: '10px 25px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '20px',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e64c4c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#FF5757'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Gym Reviews Modal */}
      {selectedReviewGym && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.76)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => {
            setSelectedReviewGym(null);
            setReviews([]);
          }}
        >
          <div
            style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3
                  style={{
                    color: '#FF5757',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: 0,
                  }}
                >
                  Reviews for {formatGymName(selectedReviewGym.gym_name)}
                </h3>
                <span style={{ fontSize: '12px', color: '#71717a' }}>Gym ID #{selectedReviewGym.gym_id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowAddReview(!showAddReview);
                    setReviewError("");
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: showAddReview ? '#3f3f46' : '#FF5757',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {showAddReview ? <FaTimes size={11} /> : <FaPlus size={11} />}
                  {showAddReview ? 'Cancel' : 'Add Review'}
                </button>
                <button
                  onClick={() => {
                    setSelectedReviewGym(null);
                    setReviews([]);
                    setShowAddReview(false);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '2px 6px',
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Notification messages */}
            {reviewSuccess && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaCheck size={12} /> {reviewSuccess}
              </div>
            )}
            {reviewError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {reviewError}
              </div>
            )}

            {/* Add Review Form Dropdown */}
            {showAddReview && (
              <form
                onSubmit={handleAddReview}
                style={{
                  backgroundColor: '#202024',
                  border: '1px solid #3f3f46',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#e4e4e7', marginBottom: '6px' }}>
                    Action Type:
                  </label>
                  <input
                    type="text"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    placeholder="Enter action type (e.g. Approve, Reject, Follow-up, Verified...)"
                    style={{
                      width: '100%',
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#f4f4f5',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '8px',
                    }}
                  />
                  {/* Quick suggestion chips */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#71717a' }}>Quick select:</span>
                    {['Approve', 'Reject', 'Reviewed', 'Follow Up', 'Needs Verification'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNewAction(preset)}
                        style={{
                          backgroundColor: newAction.toLowerCase() === preset.toLowerCase() ? '#FF5757' : '#18181b',
                          color: newAction.toLowerCase() === preset.toLowerCase() ? '#fff' : '#a1a1aa',
                          border: newAction.toLowerCase() === preset.toLowerCase() ? '1px solid #FF5757' : '1px solid #27272a',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '12px', fontWeight: '600', color: '#e4e4e7', marginBottom: '6px' }}>
                  Review Comments:
                </div>
                <textarea
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="Enter notes, observations, or review details..."
                  rows={3}
                  style={{
                    width: '100%',
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#f4f4f5',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddReview(false);
                      setReviewError("");
                    }}
                    style={{
                      backgroundColor: '#27272a',
                      color: '#a1a1aa',
                      border: '1px solid #3f3f46',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    style={{
                      backgroundColor: '#FF5757',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 16px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: submittingReview ? 'not-allowed' : 'pointer',
                      opacity: submittingReview ? 0.7 : 1,
                    }}
                  >
                    {submittingReview ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              </form>
            )}
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {reviewsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #3f3f46',
                      borderTop: '3px solid #FF5757',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                </div>
              ) : reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reviews.map((rev, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#202024',
                        border: '1px solid #2e2e33',
                        borderRadius: '10px',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            backgroundColor:
                              /approve/i.test(rev.action || '')
                                ? 'rgba(16, 185, 129, 0.15)'
                                : /reject/i.test(rev.action || '')
                                ? 'rgba(239, 68, 68, 0.15)'
                                : 'rgba(56, 189, 248, 0.15)',
                            color:
                              /approve/i.test(rev.action || '')
                                ? '#34d399'
                                : /reject/i.test(rev.action || '')
                                ? '#f87171'
                                : '#38bdf8',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {rev.action || "Reviewed"}
                        </span>
                        <span style={{ fontSize: '12px', color: '#71717a' }}>
                          {formatDate(rev.reviewed_on)}
                        </span>
                      </div>
                      <p style={{ color: '#e4e4e7', fontSize: '14px', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {rev.review || "No comments written."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717a', fontSize: '14px' }}>
                  No reviews found for this gym.
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => {
                  setSelectedReviewGym(null);
                  setReviews([]);
                }}
                style={{
                  backgroundColor: '#27272a',
                  color: '#f4f4f5',
                  border: '1px solid #3f3f46',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#27272a';
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
