"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaDownload,
} from "react-icons/fa";

export default function FittbotSubscriptions() {
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
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [exporting, setExporting] = useState(false);

  const isFetchingRef = useRef(false);

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
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sort_order: sortOrder,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get("/api/admin/purchases/nutritionist-plans", { params });

      if (response.data.success) {
        setUsers(response.data.data.users);
        setTotalUsers(response.data.data.unique_users || response.data.data.total);
        setTotalPurchases(response.data.data.total);
      }
    } catch (error) {
      setUsers([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
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
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPages = Math.ceil(totalPurchases / itemsPerPage);

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

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await axiosInstance.get("/api/admin/purchases/export-nutritionist-plans", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "nutritionist_plans.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/"/g, "");
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export nutritionist plans. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (loading && users.length === 0) {
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
            <h2 className="users-title">
              <span style={{ color: "#FF5757" }}>Nutrition</span><span style={{ color: "#fff" }}>ist Plans</span>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading nutritionist plans...</p>
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
            <span style={{ color: "#FF5757" }}>Nutrition</span><span style={{ color: "#fff" }}>ist Plans</span>
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="users-count">Total: {totalUsers} users</div>
          <button
            className="btn"
            onClick={handleExport}
            disabled={exporting || loading}
            style={{
              backgroundColor: exporting || loading ? "#444" : "#28a745",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: exporting || loading ? "not-allowed" : "pointer",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            <FaDownload />
            {exporting ? "Exporting..." : "Export"}
          </button>
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
                placeholder="Search by name or mobile..."
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
              {sortOrder === "asc" ? "↑" : "↓"}
              Sort by Date
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
                <th>Contact</th>
                <th>Gym Name</th>
                <th>Purchased Date</th>
                <th>Booked Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
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
                      <div className="user-name">{user.client_name}</div>
                    </td>
                    <td>
                      <div>{user.mobile}</div>
                    </td>
                    <td>
                      <div>{user.gym_name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>
                        {formatDate(user.purchased_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "13px", color: "#ccc" }}>
                        {formatDate(user.booked_date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "14px", color: "#10b981", fontWeight: "600" }}>
                        ₹{user.amount?.toFixed(2) || "0.00"}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">
                    No nutritionist plans found matching your criteria
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
            {Math.min(currentPage * itemsPerPage, totalPurchases)} of {totalPurchases}
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
