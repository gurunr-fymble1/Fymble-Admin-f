"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function WebinarRegistrations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/dashboard/webinar-registrations");

      if (response.data.success) {
        setRegistrations(response.data.data || []);
        setFilteredRegistrations(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch webinar registrations");
      }
    } catch (err) {
      console.error("Error fetching webinar registrations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // Filter on search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchTerm.trim()) {
        setFilteredRegistrations(registrations);
      } else {
        const term = searchTerm.toLowerCase();
        const filtered = registrations.filter(
          (r) =>
            (r.name && r.name.toLowerCase().includes(term)) ||
            (r.mobile_number && r.mobile_number.includes(term)) ||
            (r.location && r.location.toLowerCase().includes(term)) ||
            (r.gender && r.gender.toLowerCase().includes(term)) ||
            (r.aim && r.aim.toLowerCase().includes(term))
        );
        setFilteredRegistrations(filtered);
      }
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, registrations]);

  const totalCount = filteredRegistrations.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedData = filteredRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const thStyle = {
    padding: "16px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    color: "#ccc",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  if (loading) {
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
            onMouseEnter={(e) => (e.target.style.color = "#ff4545")}
            onMouseLeave={(e) => (e.target.style.color = "#FF5757")}
          >
            <FaChevronLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
            <h2 className="users-title" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Webinar</span> Registrations
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
              Loading webinar registrations...
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
          onMouseEnter={(e) => (e.target.style.color = "#ff4545")}
          onMouseLeave={(e) => (e.target.style.color = "#FF5757")}
        >
          <FaChevronLeft size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
          <h2 className="users-title" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Webinar</span> Registrations
          </h2>
        </div>
        <div className="users-count">Total: {registrations.length} registrations</div>
      </div>

      {/* Search Bar */}
      <div style={{
        marginBottom: "20px",
        display: "flex",
        gap: "15px",
        alignItems: "center",
        flexWrap: "wrap"
      }}>
        <div style={{
          position: "relative",
          flex: 1,
          minWidth: "300px",
          maxWidth: "500px"
        }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#888"
            }}
          />
          <input
            type="text"
            placeholder="Search by name, mobile, location, aim..."
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
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: "#1e1e1e",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #333"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{
                backgroundColor: "#2a2a2a",
                borderBottom: "1px solid #333"
              }}>
                <th style={{ ...thStyle, width: "50px" }}>#</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Mobile Number</th>
                <th style={thStyle}>Gender</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Aim</th>
                <th style={thStyle}>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{
                    padding: "60px",
                    textAlign: "center",
                    color: "#888"
                  }}>
                    <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                      {searchTerm ? "No registrations found" : "No webinar registrations yet"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666" }}>
                      {searchTerm
                        ? "Try adjusting your search criteria"
                        : "Webinar registrations will appear here"}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((reg, index) => (
                  <tr
                    key={reg.id}
                    style={{
                      borderBottom: index !== paginatedData.length - 1 ? "1px solid #333" : "none",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2a2a2a")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "16px", color: "#666", fontSize: "13px" }}>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td style={{ padding: "16px", color: "#fff", fontWeight: "500" }}>
                      {reg.name}
                    </td>
                    <td style={{ padding: "16px", color: "#ccc" }}>
                      {reg.mobile_number}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span style={{
                        backgroundColor: reg.gender?.toLowerCase() === "male"
                          ? "rgba(59, 130, 246, 0.1)"
                          : reg.gender?.toLowerCase() === "female"
                          ? "rgba(236, 72, 153, 0.1)"
                          : "rgba(156, 163, 175, 0.1)",
                        color: reg.gender?.toLowerCase() === "male"
                          ? "#60a5fa"
                          : reg.gender?.toLowerCase() === "female"
                          ? "#f472b6"
                          : "#9ca3af",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "500",
                      }}>
                        {reg.gender || "N/A"}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "#ccc" }}>
                      {reg.location || "N/A"}
                    </td>
                    <td style={{
                      padding: "16px",
                      color: "#ccc",
                      maxWidth: "250px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={reg.aim}
                    >
                      {reg.aim || "N/A"}
                    </td>
                    <td style={{ padding: "16px", color: "#888", fontSize: "13px" }}>
                      {formatDate(reg.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            borderTop: "1px solid #333",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div style={{ color: "#888", fontSize: "14px" }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} registrations
            </div>

            <div style={{
              display: "flex",
              gap: "8px",
              alignItems: "center"
            }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === 1 ? "#333" : "#2a2a2a",
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
                  if (currentPage !== 1) e.target.style.backgroundColor = "#3a3a3a";
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) e.target.style.backgroundColor = "#2a2a2a";
                }}
              >
                <FaChevronLeft size={12} />
                Previous
              </button>

              <div style={{
                display: "flex",
                gap: "4px",
                backgroundColor: "#2a2a2a",
                padding: "4px",
                borderRadius: "6px",
                border: "1px solid #444"
              }}>
                {(() => {
                  const pages = [];
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, start + 4);
                  if (end - start < 4) start = Math.max(1, end - 4);

                  for (let i = start; i <= end; i++) {
                    const isActive = i === currentPage;
                    pages.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
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
                        {i}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: "8px 12px",
                  backgroundColor: currentPage === totalPages ? "#333" : "#2a2a2a",
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
                  if (currentPage !== totalPages) e.target.style.backgroundColor = "#3a3a3a";
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) e.target.style.backgroundColor = "#2a2a2a";
                }}
              >
                Next
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
