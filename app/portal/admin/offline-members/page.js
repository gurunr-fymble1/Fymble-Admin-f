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
} from "react-icons/fa";

export default function OfflineMembers() {
  const router = useRouter();

  // State variables
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalClients, setTotalClients] = useState(0);

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

  const fetchClients = useCallback(async () => {
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

      const response = await axiosInstance.get("/api/admin/users/offline-members", { params });

      if (response.data.success) {
        setClients(response.data.data.clients);
        setTotalClients(response.data.data.total);
      }
    } catch (error) {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, sortOrder, currentPage, itemsPerPage]);

  // Fetch clients when filters change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  const totalPages = Math.ceil(totalClients / itemsPerPage);

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

  if (loading && clients.length === 0) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>O</span>ffline Members
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading offline members...</p>
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
          Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
          <h2 className="users-title" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>O</span>ffline Members
          </h2>
        </div>
        <div className="users-count">Total: {totalClients} members</div>
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
                placeholder="Search by name, mobile..."
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
                <th>Client Name</th>
                <th>Mobile</th>
                <th>Gender</th>
                <th>Gym Name</th>
                <th>Joined Date</th>
                <th>Last Purchase Date</th>
              </tr>
            </thead>
            <tbody>
              {clients.length > 0 ? (
                clients.map((client) => (
                  <tr
                    key={client.client_id}
                    onClick={() => router.push(`/portal/admin/users/${client.client_id}`)}
                    style={{
                      cursor: "pointer",
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
                      <div className="user-name">{client.name}</div>
                    </td>
                    <td>{client.contact || "-"}</td>
                    <td>{client.gender || "N/A"}</td>
                    <td>{client.gym_name || "-"}</td>
                    <td>{formatDate(client.joined_date)}</td>
                    <td>{formatDate(client.last_purchase_date)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="no-data">
                    No offline members found matching your criteria
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
            {Math.min(currentPage * itemsPerPage, totalClients)} of {totalClients}
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
