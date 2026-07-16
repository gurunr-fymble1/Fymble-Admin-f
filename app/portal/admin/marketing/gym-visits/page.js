"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

export default function GymVisitsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterType = searchParams.get("type") || "all"; // all, assigned, visited, converted
  const timeFilter = searchParams.get("time") || "today";
  const managerId = searchParams.get("manager") || "all";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gymVisitsData, setGymVisitsData] = useState([]);

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

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("assigned_on");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchGymVisitsList();
  }, [filterType, timeFilter, managerId]);

  const getPageTitle = () => {
    switch (filterType) {
      case "assigned":
        return "Assigned Gym Visits";
      case "visited":
        return "Visited Gyms";
      case "converted":
        return "Converted Gyms";
      default:
        return "All Gym Visits";
    }
  };

  const fetchGymVisitsList = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get(
        "/api/admin/marketing/gym-visits/list",
        {
          params: {
            filter_type: filterType,
            time_filter: timeFilter,
            manager_id: managerId === "all" ? undefined : managerId,
          },
        }
      );

      if (response.data.status === 200) {
        setGymVisitsData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch gym visits list"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load gym visits list"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = gymVisitsData.filter((item) => {
      const searchMatch =
        item.gym_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.gym_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bde_name?.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortField === "gym_name") {
        aValue = a.gym_name || "";
        bValue = b.gym_name || "";
      } else if (sortField === "bde_name") {
        aValue = a.bde_name || "";
        bValue = b.bde_name || "";
      } else if (sortField === "assigned_on") {
        aValue = new Date(a.assigned_on);
        bValue = new Date(b.assigned_on);
      } else if (sortField === "final_status") {
        aValue = a.final_status || "";
        bValue = b.final_status || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [gymVisitsData, searchTerm, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle filter changes
  const handleSearchChange = (value) => {
    setCurrentPage(1);
    setSearchTerm(value);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Get pagination numbers
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>{getPageTitle()}</span>
          </h2>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
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
            Loading gym visits...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>{getPageTitle()}</span>
          </h2>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#ff5757" }}>
          Error: {error}
          <br />
          <button
            onClick={fetchGymVisitsList}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              background: "#FF5757",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
              Loading gym visits...
            </p>
          </div>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="users-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/portal/admin/marketing")}
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
            <span style={{ color: "#FF5757" }}>{getPageTitle()}</span>
          </h2>
        </div>
        <span className="users-count">
          Total: {filteredAndSortedData.length}
        </span>
      </div>

      {/* Filters Section */}
      <div className="section-container">
        <div className="filters-section">
          <div className="row pb-0">
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by gym name, address, or BDE..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ color: "#ccc" }}>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "#2a2a2a",
                    color: "#fff",
                    border: "1px solid #3a3a3a",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span style={{ color: "#ccc" }}>per page</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Visits Table */}
      <div className="section-container">
        <div className="table-container">
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("gym_name")}
                    className="sortable"
                  >
                    Gym Name
                    {sortField === "gym_name" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("bde_name")}
                    className="sortable"
                  >
                    Assigned To (BDE)
                    {sortField === "bde_name" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("assigned_on")}
                    className="sortable"
                  >
                    Assigned On
                    {sortField === "assigned_on" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("final_status")}
                    className="sortable"
                  >
                    Status
                    {sortField === "final_status" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((visit, index) => (
                    <tr key={visit.id}>
                      <td>
                        <div
                          className="user-name"
                          onClick={() =>
                            router.push(
                              `/portal/admin/marketing/gym-visits/${visit.id}`
                            )
                          }
                          style={{ cursor: "pointer" }}
                        >
                          {visit.gym_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {visit.gym_address}
                        </div>
                      </td>
                      <td>
                        <div className="user-name">{visit.bde_name}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {visit.bdm_name && `Manager: ${visit.bdm_name}`}
                        </div>
                      </td>
                      <td>{formatDate(visit.assigned_on)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: "600",
                            color: getStatusColor(visit.final_status),
                          }}
                        >
                          {getStatusLabel(visit.final_status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No gym visits found matching your criteria
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
              {Math.min(
                startIndex + itemsPerPage,
                filteredAndSortedData.length
              )}{" "}
              of {filteredAndSortedData.length} entries
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
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
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
    </div>
  );
}
