"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

export default function BDMs() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bdmsData, setBdmsData] = useState([]);

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
  const [sortField, setSortField] = useState("rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    fetchBDMsList();
  }, [timeFilter]);

  const fetchBDMsList = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/admin/marketing/bdms", {
        params: { time_filter: timeFilter },
      });

      if (response.data.status === 200) {
        setBdmsData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch BDMs list");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || "Failed to load BDMs list"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = bdmsData.filter((item) => {
      const searchMatch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contact?.toLowerCase().includes(searchTerm.toLowerCase());

      return searchMatch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortField === "rank") {
        aValue = a.rank;
        bValue = b.rank;
      } else if (sortField === "name") {
        aValue = a.name;
        bValue = b.name;
      } else if (sortField === "team_size") {
        aValue = a.team_size;
        bValue = b.team_size;
      } else if (sortField === "total_assigned") {
        aValue = a.total_assigned;
        bValue = b.total_assigned;
      } else if (sortField === "total_visited") {
        aValue = a.total_visited;
        bValue = b.total_visited;
      } else if (sortField === "total_converted") {
        aValue = a.total_converted;
        bValue = b.total_converted;
      } else if (sortField === "self_converted") {
        aValue = a.self_converted;
        bValue = b.self_converted;
      } else if (sortField === "conversion_ratio") {
        aValue = a.conversion_ratio;
        bValue = b.conversion_ratio;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bdmsData, searchTerm, sortField, sortOrder]);

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

  const handleTimeFilterChange = (value) => {
    setCurrentPage(1);
    setTimeFilter(value);
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

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>BDMs</span> Performance
          </h2>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          Loading BDMs data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>BDMs</span> Performance
          </h2>
        </div>
        <div style={{ textAlign: "center", padding: "40px", color: "#ff5757" }}>
          Error: {error}
          <br />
          <button
            onClick={fetchBDMsList}
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
              Loading BDMs data...
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
            <span style={{ color: "#FF5757" }}>BDMs</span> Performance
          </h2>
        </div>
        <span className="users-count">
          Total BDMs: {filteredAndSortedData.length}
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
                  placeholder="Search by name, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={timeFilter}
                onChange={(e) => handleTimeFilterChange(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BDMs Table */}
      <div className="section-container">
        <div className="table-container">
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("rank")} className="sortable">
                    Rank
                    {sortField === "rank" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th onClick={() => handleSort("name")} className="sortable">
                    Name
                    {sortField === "name" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("team_size")}
                    className="sortable"
                  >
                    Team Size
                    {sortField === "team_size" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("total_assigned")}
                    className="sortable"
                  >
                    Total Assigned
                    {sortField === "total_assigned" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("total_visited")}
                    className="sortable"
                  >
                    Total Visited
                    {sortField === "total_visited" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("total_converted")}
                    className="sortable"
                  >
                    Total Converted
                    {sortField === "total_converted" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  <th
                    onClick={() => handleSort("self_converted")}
                    className="sortable"
                  >
                    Self Converted
                    {sortField === "self_converted" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th>
                  {/* <th
                    onClick={() => handleSort("conversion_ratio")}
                    className="sortable"
                  >
                    Conversion Ratio (%)
                    {sortField === "conversion_ratio" &&
                      (sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((bdm, index) => (
                    <tr
                      key={bdm.id}
                      onClick={() =>
                        router.push(`/portal/admin/marketing/bdms/${bdm.id}`)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="user-name">{bdm.rank}</div>
                      </td>
                      <td>
                        <div className="user-name">{bdm.name}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>
                          {bdm.email}
                        </div>
                      </td>
                      <td>{bdm.team_size}</td>
                      <td>{bdm.total_assigned}</td>
                      <td>{bdm.total_visited}</td>
                      <td>{bdm.total_converted}</td>
                      <td>
                        <span style={{ fontWeight: "600", color: "#8b5cf6" }}>
                          {bdm.self_converted}
                        </span>
                      </td>
                      {/* <td>
                        <span
                          style={{
                            fontWeight: "600",
                            color:
                              bdm.conversion_ratio > 50
                                ? "#10b981"
                                : bdm.conversion_ratio > 25
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        >
                          {bdm.conversion_ratio}%
                        </span>
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No BDMs found matching your criteria
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
