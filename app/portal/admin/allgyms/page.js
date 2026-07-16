"use client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function AllGyms() {
  // Dummy data for gyms
  const [allGyms] = useState([
    {
      id: 1,
      gymName: "Fitness First Premium",
      area: "Koramangala",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560034",
      isAssigned: true,
      bdmName: "Rajesh Kumar",
      bdeName: "Priya Sharma",
      status: "converted",
      createdDate: "2024-01-15",
      hasSessionPlans: true,
      hasMembershipPlans: true,
      hasDailyPass: true,
    },
    {
      id: 2,
      gymName: "PowerGym Elite",
      area: "Bandra West",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400050",
      isAssigned: true,
      bdmName: "Amit Singh",
      bdeName: "Sneha Reddy",
      status: "followup",
      createdDate: "2024-02-20",
      hasSessionPlans: true,
      hasMembershipPlans: false,
      hasDailyPass: false,
    },
    {
      id: 3,
      gymName: "Iron Paradise",
      area: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      isAssigned: false,
      bdmName: null,
      bdeName: null,
      status: null,
      createdDate: "2024-01-10",
      hasSessionPlans: false,
      hasMembershipPlans: true,
      hasDailyPass: true,
    },
    {
      id: 4,
      gymName: "Fitness Hub Pro",
      area: "Anna Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600040",
      isAssigned: true,
      bdmName: "Vikram Patel",
      bdeName: "Kavya Nair",
      status: "pending",
      createdDate: "2024-03-05",
      hasSessionPlans: false,
      hasMembershipPlans: false,
      hasDailyPass: true,
    },
    {
      id: 5,
      gymName: "Muscle Factory",
      area: "Hitech City",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500081",
      isAssigned: true,
      bdmName: "Rohit Gupta",
      bdeName: "Meera Joshi",
      status: "rejected",
      createdDate: "2024-02-12",
      hasSessionPlans: true,
      hasMembershipPlans: true,
      hasDailyPass: false,
    },
    {
      id: 6,
      gymName: "FitZone Ultimate",
      area: "Satellite",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380015",
      isAssigned: false,
      bdmName: null,
      bdeName: null,
      status: null,
      createdDate: "2024-01-25",
      hasSessionPlans: true,
      hasMembershipPlans: false,
      hasDailyPass: false,
    },
    {
      id: 7,
      gymName: "Elite Fitness Center",
      area: "Whitefield",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
      isAssigned: true,
      bdmName: "Rajesh Kumar",
      bdeName: "Arjun Rao",
      status: "converted",
      createdDate: "2024-03-12",
      hasSessionPlans: true,
      hasMembershipPlans: true,
      hasDailyPass: true,
    },
    {
      id: 8,
      gymName: "Total Fitness",
      area: "Andheri East",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400069",
      isAssigned: true,
      bdmName: "Amit Singh",
      bdeName: "Divya Iyer",
      status: "followup",
      createdDate: "2024-02-28",
      hasSessionPlans: false,
      hasMembershipPlans: true,
      hasDailyPass: false,
    },
    {
      id: 9,
      gymName: "Strength Zone",
      area: "Lajpat Nagar",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110024",
      isAssigned: false,
      bdmName: null,
      bdeName: null,
      status: null,
      createdDate: "2024-01-08",
      hasSessionPlans: false,
      hasMembershipPlans: false,
      hasDailyPass: true,
    },
    {
      id: 10,
      gymName: "Flex Fitness",
      area: "T. Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600017",
      isAssigned: true,
      bdmName: "Vikram Patel",
      bdeName: "Karthik Menon",
      status: "pending",
      createdDate: "2024-03-18",
      hasSessionPlans: true,
      hasMembershipPlans: false,
      hasDailyPass: true,
    },
    {
      id: 11,
      gymName: "Body Builders Gym",
      area: "Madhapur",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500033",
      isAssigned: true,
      bdmName: "Rohit Gupta",
      bdeName: "Ananya Das",
      status: "converted",
      createdDate: "2024-02-05",
      hasSessionPlans: true,
      hasMembershipPlans: true,
      hasDailyPass: false,
    },
    {
      id: 12,
      gymName: "Fitness Revolution",
      area: "Vastrapur",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380054",
      isAssigned: false,
      bdmName: null,
      bdeName: null,
      status: null,
      createdDate: "2024-01-30",
      hasSessionPlans: false,
      hasMembershipPlans: true,
      hasDailyPass: true,
    },
    {
      id: 13,
      gymName: "Gold's Gym Express",
      area: "HSR Layout",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560102",
      isAssigned: true,
      bdmName: "Rajesh Kumar",
      bdeName: "Suresh Pillai",
      status: "rejected",
      createdDate: "2024-03-08",
      hasSessionPlans: true,
      hasMembershipPlans: false,
      hasDailyPass: false,
    },
    {
      id: 14,
      gymName: "Fitness First Basic",
      area: "Powai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400076",
      isAssigned: true,
      bdmName: "Amit Singh",
      bdeName: "Pooja Agarwal",
      status: "followup",
      createdDate: "2024-02-15",
      hasSessionPlans: false,
      hasMembershipPlans: true,
      hasDailyPass: true,
    },
    {
      id: 15,
      gymName: "CrossFit Arena",
      area: "Karol Bagh",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110005",
      isAssigned: false,
      bdmName: null,
      bdeName: null,
      status: null,
      createdDate: "2024-01-20",
      hasSessionPlans: false,
      hasMembershipPlans: false,
      hasDailyPass: false,
    },
  ]);

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [planTypeFilters, setPlanTypeFilters] = useState({
    sessionPlans: false,
    membershipPlans: false,
    dailyPass: false,
  });
  const router = useRouter();
  const statuses = ["converted", "rejected", "followup", "pending"];

  // Filtered and sorted data
  const filteredAndSortedGyms = useMemo(() => {
    let filtered = allGyms.filter((gym) => {
      const matchesSearch =
        gym.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.pincode.includes(searchTerm);

      const matchesAssignment =
        assignmentFilter === "all" ||
        (assignmentFilter === "assigned" && gym.isAssigned) ||
        (assignmentFilter === "not-assigned" && !gym.isAssigned);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "na" && !gym.isAssigned) ||
        (gym.isAssigned && gym.status === statusFilter);

      // Plan type filters - ALL selected filters must match
      const activePlanFilters = Object.entries(planTypeFilters).filter(([_, value]) => value);
      const matchesPlanTypes = activePlanFilters.length === 0 || activePlanFilters.every(([filterType, _]) => {
        if (filterType === "sessionPlans") return gym.hasSessionPlans;
        if (filterType === "membershipPlans") return gym.hasMembershipPlans;
        if (filterType === "dailyPass") return gym.hasDailyPass;
        return true;
      });

      return matchesSearch && matchesAssignment && matchesStatus && matchesPlanTypes;
    });

    // Sort by created date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate);
      const dateB = new Date(b.createdDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [allGyms, searchTerm, assignmentFilter, statusFilter, sortOrder, planTypeFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedGyms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGyms = filteredAndSortedGyms.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "assignment") setAssignmentFilter(value);
    if (filterType === "status") setStatusFilter(value);
  };

  // Handle plan type filter change
  const handlePlanTypeFilterChange = (filterType) => {
    setCurrentPage(1);
    setPlanTypeFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "converted":
        return <FaCheckCircle />;
      case "rejected":
        return <FaTimesCircle />;
      case "followup":
        return <FaClock />;
      case "pending":
        return <FaExclamationTriangle />;
      default:
        return null;
    }
  };

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

  return (
    <div
      className="users-container"
      style={{
        backgroundColor: "#121717",
        color: "#ffffff",
        minHeight: "100vh",
      }}
    >
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>All</span> Gyms
        </h2>
        <div className="users-count">
          Total: {filteredAndSortedGyms.length} gyms
        </div>
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
                placeholder="Search by gym, area, city, state, pincode..."
                value={searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={assignmentFilter}
              onChange={(e) => handleFilterChange("assignment", e.target.value)}
            >
              <option value="all">All Gyms</option>
              <option value="assigned">Assigned</option>
              <option value="not-assigned">Not Assigned</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="na">NA</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
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
            </select>
          </div>
        </div>

        {/* Plan Type Filters */}
        <div className="row" style={{ marginTop: "15px" }}>
          <div className="col-12">
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
                padding: "10px 15px",
                backgroundColor: "#252525",
                borderRadius: "8px",
                border: "1px solid #444",
              }}
            >
              <span style={{ color: "#999", fontSize: "13px", fontWeight: "500" }}>
                <FaFilter style={{ marginRight: "8px" }} />
                Plan Types:
              </span>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.sessionPlans ? "#FF5757" : "transparent",
                  border: planTypeFilters.sessionPlans ? "1px solid #FF5757" : "1px solid #444",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={planTypeFilters.sessionPlans}
                  onChange={() => handlePlanTypeFilterChange("sessionPlans")}
                  style={{ display: "none" }}
                />
                <span style={{ color: planTypeFilters.sessionPlans ? "white" : "#ccc", fontSize: "13px" }}>
                  {planTypeFilters.sessionPlans ? "✓ " : ""}Session Plans
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.membershipPlans ? "#FF5757" : "transparent",
                  border: planTypeFilters.membershipPlans ? "1px solid #FF5757" : "1px solid #444",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={planTypeFilters.membershipPlans}
                  onChange={() => handlePlanTypeFilterChange("membershipPlans")}
                  style={{ display: "none" }}
                />
                <span style={{ color: planTypeFilters.membershipPlans ? "white" : "#ccc", fontSize: "13px" }}>
                  {planTypeFilters.membershipPlans ? "✓ " : ""}Membership Plans
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: planTypeFilters.dailyPass ? "#FF5757" : "transparent",
                  border: planTypeFilters.dailyPass ? "1px solid #FF5757" : "1px solid #444",
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={planTypeFilters.dailyPass}
                  onChange={() => handlePlanTypeFilterChange("dailyPass")}
                  style={{ display: "none" }}
                />
                <span style={{ color: planTypeFilters.dailyPass ? "white" : "#ccc", fontSize: "13px" }}>
                  {planTypeFilters.dailyPass ? "✓ " : ""}Daily Pass Pricing
                </span>
              </label>

              {(planTypeFilters.sessionPlans || planTypeFilters.membershipPlans || planTypeFilters.dailyPass) && (
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
                    marginLeft: "auto",
                    padding: "4px 12px",
                    backgroundColor: "transparent",
                    border: "1px solid #666",
                    color: "#999",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#333";
                    e.currentTarget.style.borderColor = "#888";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#666";
                  }}
                >
                  Clear Filters
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
                <th>Location</th>
                <th>Assignment</th>
                <th>BDM</th>
                <th>BDE</th>
                <th>Status</th>
                <th>Assigned Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGyms.length > 0 ? (
                paginatedGyms.map((gym) => (
                  <tr
                    key={gym.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push("/portal/admin/gymdetails")}
                  >
                    <td>
                      <div className="user-name">{gym.gymName}</div>
                    </td>
                    <td>
                      <div style={{ lineHeight: "1.4" }}>
                        <div style={{ fontWeight: "500" }}>
                          <FaMapMarkerAlt
                            style={{ marginRight: "5px", color: "#FF5757" }}
                          />
                          {gym.area}, {gym.city}
                        </div>
                        <div style={{ fontSize: "0.85em", color: "#cccccc" }}>
                          {gym.state} - {gym.pincode}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          gym.isAssigned ? "active" : "inactive"
                        }`}
                      >
                        {gym.isAssigned ? "Assigned" : "Not Assigned"}
                      </span>
                    </td>
                    <td>{gym.isAssigned ? gym.bdmName : "NA"}</td>
                    <td>{gym.isAssigned ? gym.bdeName : "NA"}</td>
                    <td>
                      {gym.isAssigned ? (
                        <span className={`status-badge ${gym.status}`}>
                          {getStatusIcon(gym.status)}
                          {gym.status.charAt(0).toUpperCase() +
                            gym.status.slice(1)}
                        </span>
                      ) : (
                        "NA"
                      )}
                    </td>
                    <td>
                      {gym.isAssigned ? formatDate(gym.createdDate) : "NA"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
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
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredAndSortedGyms.length)}{" "}
            of {filteredAndSortedGyms.length} entries
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
    </div>
  );
}
