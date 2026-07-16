"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from "react-icons/fa";

export default function UnverifiedGyms() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get("search") || "");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort_order") || "desc");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get("limit") || "10"));
  const [totalGyms, setTotalGyms] = useState(0);
  const [registeredUsersFilter, setRegisteredUsersFilter] = useState(searchParams.get("registered_users") || "");
  const [planTypeFilters, setPlanTypeFilters] = useState({
    sessionPlans: searchParams.get("has_session_plans") === "true",
    membershipPlans: searchParams.get("has_membership_plans") === "true",
    dailyPass: searchParams.get("has_daily_pass") === "true",
  });
  const [cityFilter, setCityFilter] = useState(searchParams.get("city") || "");
  const [availableCities, setAvailableCities] = useState([]);

  // Modal state for gym address
  const [selectedGym, setSelectedGym] = useState(null);

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

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Update or remove params based on current state
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }

    params.set("sort_order", sortOrder);

    if (registeredUsersFilter) {
      params.set("registered_users", registeredUsersFilter);
    } else {
      params.delete("registered_users");
    }

    if (planTypeFilters.sessionPlans) {
      params.set("has_session_plans", "true");
    } else {
      params.delete("has_session_plans");
    }

    if (planTypeFilters.membershipPlans) {
      params.set("has_membership_plans", "true");
    } else {
      params.delete("has_membership_plans");
    }

    if (planTypeFilters.dailyPass) {
      params.set("has_daily_pass", "true");
    } else {
      params.delete("has_daily_pass");
    }

    if (cityFilter) {
      params.set("city", cityFilter);
    } else {
      params.delete("city");
    }

    params.set("page", currentPage.toString());
    params.set("limit", itemsPerPage.toString());

    // Replace URL with new params without triggering navigation
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [searchTerm, sortOrder, registeredUsersFilter, planTypeFilters, cityFilter, currentPage, itemsPerPage, searchParams]);

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

      // Add registered users filter
      if (registeredUsersFilter) {
        params.registered_users_filter = registeredUsersFilter;
      }

      // Add city filter
      if (cityFilter) {
        params.city = cityFilter;
      }

      const response = await axiosInstance.get("/api/admin/unverified-gyms", { params });

      if (response.data.success) {
        setGyms(response.data.data.gyms);
        setTotalGyms(response.data.data.total);
        // Update available cities from response
        if (response.data.data.cities) {
          setAvailableCities(response.data.data.cities);
        }
      }
    } catch (error) {
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, sortOrder, currentPage, itemsPerPage, planTypeFilters, registeredUsersFilter, cityFilter]);

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
              <span style={{ color: "#FF5757" }}>Unverified</span> Gyms
            </h2>
          </div>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading verified gyms...</p>
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
            <span style={{ color: "#FF5757" }}>Unverified</span> Gyms
          </h2>
        </div>
        <div className="users-count">Total: {totalGyms} verified gyms</div>
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

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setCurrentPage(1);
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
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {gyms.length > 0 ? (
                gyms.map((gym) => (
                    <tr
                      key={gym.gym_id}
                      onClick={() => router.push(`/portal/admin/gymdetails?id=${gym.gym_id}`)}
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
                        <div className="user-name">{gym.gym_name || "-"}</div>
                        {(gym.address && gym.address !== '-' && gym.address !== 'N/A') ||
                         (gym.street_address && gym.street_address !== '-') ||
                         (gym.area && gym.area !== '-') ||
                         (gym.city && gym.city !== '-') ||
                         (gym.state && gym.state !== '-') ||
                         (gym.pincode && gym.pincode !== '-') ? (
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
                        ) : null}
                      </td>
                      <td>{gym.owner_name || "-"}</td>
                      <td>{gym.contact_number || "-"}</td>
                      <td>{gym.location || "-"}</td>
                      <td>{gym.registered_users || "-"}</td>
                      <td>{formatDate(gym.created_at)}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No verified gyms found matching your criteria
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
              {!selectedGym.street_address && !selectedGym.area && !selectedGym.city && !selectedGym.state && !selectedGym.pincode && (
                <div style={{ color: '#888' }}>No address details available</div>
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
    </div>
  );
}
