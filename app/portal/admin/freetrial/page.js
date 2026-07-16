"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";

export default function FreeTrial() {
  const router = useRouter();

  // State variables
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

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

  const fetchUsers = useCallback(async () => {
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

      const response = await axiosInstance.get("/api/admin/free-trial/list", { params });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalUsers(response.data.data.total);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, sortOrder, currentPage, itemsPerPage]);

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysLeftColor = (daysLeft) => {
    if (daysLeft <= 2) return "#ef4444"; // Red - expiring very soon
    if (daysLeft <= 5) return "#f59e0b"; // Orange - expiring soon
    return "#10b981"; // Green - plenty of time
  };

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

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

  if (loading && users.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>F</span>ree Trial Users
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading free trial users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/portal/admin/home")}
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
          <h2 className="users-title" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>F</span>ree Trial Users
          </h2>
        </div>
        <div className="users-count">Total: {totalUsers} users</div>
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
                placeholder="Search by name, email, mobile..."
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
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Contact</th>
                <th>Gym</th>
                <th>Trial Period</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.customer_id}
                    style={{
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1f1f";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td>
                      <div className="user-name">{user.name}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Joined: {formatDate(user.client_joined_date)}
                      </div>
                    </td>
                    <td>{user.mobile}</td>
                    <td>
                      <div>{user.gym_name}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        {user.gym_location}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px" }}>
                        <div style={{ color: "#888" }}>Start: {formatDate(user.trial_start_date)}</div>
                        <div style={{ color: "#888" }}>End: {formatDate(user.trial_end_date)}</div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "13px",
                          fontWeight: "600",
                          backgroundColor: getDaysLeftColor(user.days_left) + "20",
                          color: getDaysLeftColor(user.days_left),
                        }}
                      >
                        {user.days_left} days
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data">
                    No free trial users found matching your criteria
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
            {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers}
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
    </div>
  );
}
