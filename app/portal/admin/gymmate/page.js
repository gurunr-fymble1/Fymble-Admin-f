"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

// Memoized SearchBar component to prevent unnecessary re-renders during data fetching
const SearchBar = React.memo(({ onSearch }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
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
          placeholder="Search by Name, Contact, Goal or Vibe..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
  );
});

SearchBar.displayName = "SearchBar";

export default function GymMateProfiles() {
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Add spinner animation style on mount
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

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axiosInstance.get("/api/admin/dashboard/gymmate/profiles", {
        params,
      });

      if (response.data.success) {
        setProfiles(response.data.data.profiles || []);
        setTotalCount(response.data.data.pagination.total);
        setTotalPages(response.data.data.pagination.total_pages);
      } else {
        throw new Error(response.data.message || "Failed to fetch GymMate profiles");
      }
    } catch (err) {
      console.error("Error fetching GymMate profiles:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

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
            <span style={{ color: "#FF5757" }}>GYM Mate</span> Profiles
          </h2>
        </div>
        <div className="users-count">Total: {totalCount} profiles</div>
      </div>


      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} />

        {/* Table */}
        <div style={{
          backgroundColor: "#1e1e1e",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #333",
          position: "relative" // Ensure relative positioning for loading overlay
        }}>
          {/* Loading Overlay for subsequent data fetches */}
          {loading && profiles.length > 0 && (
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(30, 30, 30, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              backdropFilter: "blur(1px)",
            }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid #3a3a3a",
                  borderTop: "3px solid #FF5757",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          )}

          <div style={{
            overflowX: "auto",
            opacity: loading && profiles.length > 0 ? 0.6 : 1,
            transition: "opacity 0.2s ease"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{
                  backgroundColor: "#2a2a2a",
                  borderBottom: "1px solid #333"
                }}>

                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Name
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Contact
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Primary Goal
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Personality Vibe
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Preferred Timing
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Bio
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Onboard Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 && loading ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: "60px",
                      textAlign: "center",
                      color: "#888"
                    }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "3px solid #3a3a3a",
                          borderTop: "3px solid #FF5757",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          margin: "0 auto 1rem",
                        }}
                      />
                      <p style={{ fontSize: "14px", color: "#ccc" }}>
                        Loading profiles...
                      </p>
                    </td>
                  </tr>
                ) : profiles.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{
                      padding: "60px",
                      textAlign: "center",
                      color: "#888"
                    }}>
                      <div style={{ marginBottom: "16px" }}>
                        <svg
                          width="64"
                          height="64"
                          viewBox="0 0 24 24"
                          fill="none"
                          style={{ opacity: 0.3 }}
                        >
                          <path
                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                            fill="#888"
                          />
                        </svg>
                      </div>
                      <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                        {searchTerm ? "No profiles found" : "No onboarded profiles found"}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {searchTerm
                          ? "Try adjusting your search criteria"
                          : "GymMate profiles will appear here"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  profiles.map((profile, index) => (
                    <tr
                      key={profile.id}
                      onClick={() => {
                        if (profile.client_id) {
                          router.push(`/portal/admin/users/${profile.client_id}`);
                        }
                      }}
                      style={{
                        borderBottom: index !== profiles.length - 1 ? "1px solid #333" : "none",
                        transition: "background-color 0.2s",
                        cursor: profile.client_id ? "pointer" : "default",
                      }}
                      onMouseEnter={(e) => {
                        if (profile.client_id) {
                          e.currentTarget.style.backgroundColor = "#2a2a2a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {profile.name}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {profile.contact || "N/A"}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {profile.primary_goal}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {profile.gym_personality}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {profile.preferred_timing}
                      </td>
                      <td style={{ padding: "16px", color: "#888", fontSize: "13px", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={profile.bio || ""}>
                        {profile.bio || "N/A"}
                      </td>
                      <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                        {formatDate(profile.created_at)}
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
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} profiles
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
                  {[...Array(totalPages)].slice(0, 5).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
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
                        {pageNum}
                      </button>
                    );
                  })}
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
