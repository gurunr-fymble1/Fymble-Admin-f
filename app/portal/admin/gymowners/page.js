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
  FaBuilding,
} from "react-icons/fa";

export default function GymOwners() {
  const router = useRouter();

  // State variables
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOwners, setTotalOwners] = useState(0);
  const [expandedOwners, setExpandedOwners] = useState(new Set());

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

  const fetchOwners = useCallback(async () => {
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

      const response = await axiosInstance.get("/api/admin/gym-owners/list", { params });

      if (response.data.success) {
        setOwners(response.data.data.owners);
        setTotalOwners(response.data.data.total);
      }
    } catch (error) {
      setOwners([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, sortOrder, currentPage, itemsPerPage]);

  // Fetch owners when filters change
  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

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

  const toggleExpand = (ownerId) => {
    setExpandedOwners((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ownerId)) {
        newSet.delete(ownerId);
      } else {
        newSet.add(ownerId);
      }
      return newSet;
    });
  };

  const totalPages = Math.ceil(totalOwners / itemsPerPage);

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

  if (loading && owners.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>G</span>ym Owners
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading gym owners...</p>
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
            <span style={{ color: "#FF5757" }}>G</span>ym Owners
          </h2>
        </div>
        <div className="users-count">Total: {totalOwners} owners</div>
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
                <th>Owner Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Total Gyms</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {owners.length > 0 ? (
                owners.map((owner) => (
                  <React.Fragment key={owner.owner_id}>
                    <tr
                      onClick={() => owner.total_gyms > 0 && toggleExpand(owner.owner_id)}
                      style={{
                        cursor: owner.total_gyms > 0 ? "pointer" : "default",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (owner.total_gyms > 0) {
                          e.currentTarget.style.backgroundColor = "#1a1f1f";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td>
                        <div className="user-name">{owner.name || "-"}</div>
                      </td>
                      <td>{owner.email || "-"}</td>
                      <td>{owner.contact_number || "-"}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FaBuilding style={{ color: "#FF5757" }} />
                          <span>{owner.total_gyms}</span>
                          {owner.total_gyms > 0 && (
                            <span style={{ fontSize: "12px", color: "#888" }}>
                              {expandedOwners.has(owner.owner_id) ? "▼" : "▶"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(owner.created_at)}</td>
                    </tr>
                    {expandedOwners.has(owner.owner_id) && owner.total_gyms > 0 && (
                      <tr key={`gyms-${owner.owner_id}`}>
                        <td
                          colSpan={5}
                          style={{
                            padding: "0",
                            backgroundColor: "#151515",
                          }}
                        >
                          <div
                            style={{
                              padding: "16px",
                              backgroundColor: "#1a1f1f",
                              margin: "8px 16px",
                              borderRadius: "8px",
                              border: "1px solid #333",
                            }}
                          >
                            <h6
                              style={{
                                color: "#FF5757",
                                marginBottom: "12px",
                                fontSize: "14px",
                              }}
                            >
                              Associated Gyms ({owner.total_gyms})
                            </h6>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "12px",
                              }}
                            >
                              {owner.gyms.map((gym) => (
                                <div
                                  key={gym.gym_id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/portal/admin/gymdetails?id=${gym.gym_id}`);
                                  }}
                                  style={{
                                    padding: "12px",
                                    backgroundColor: "#252525",
                                    borderRadius: "6px",
                                    border: "1px solid #444",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.borderColor = "#FF5757";
                                    e.target.style.backgroundColor = "#2a2a2a";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.borderColor = "#444";
                                    e.target.style.backgroundColor = "#252525";
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: "600",
                                      color: "#fff",
                                      marginBottom: "4px",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {gym.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#888",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    {gym.location}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                  >
                                    <span
                                      className="plan-badge"
                                      style={{
                                        backgroundColor: gym.fittbot_verified
                                          ? "#16a34a"
                                          : "#ef4444",
                                        color: "white",
                                        fontSize: "11px",
                                        padding: "2px 8px",
                                      }}
                                    >
                                      {gym.fittbot_verified ? "Verified" : "Not Verified"}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        color: "#666",
                                      }}
                                    >
                                      Joined: {formatDate(gym.created_at)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data">
                    No gym owners found matching your criteria
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
            {Math.min(currentPage * itemsPerPage, totalOwners)} of {totalOwners}
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
