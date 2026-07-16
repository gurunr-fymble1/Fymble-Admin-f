"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function RecurringSubscribers() {
  const router = useRouter();
  // State variables
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
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

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axiosInstance.get("/api/admin/dashboard/recurring-subscribers/details", {
        params,
      });

      if (response.data.success) {
        setSubscribers(response.data.data.subscribers || []);
        setTotalCount(response.data.data.pagination.total);
        setTotalPages(response.data.data.pagination.total_pages);
      } else {
        throw new Error(response.data.message || "Failed to fetch recurring subscribers");
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${(amount / 100).toLocaleString("en-IN")}`;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
            onMouseEnter={(e) => e.target.style.color = "#ff4545"}
            onMouseLeave={(e) => e.target.style.color = "#FF5757"}
          >
            <FaChevronLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
            <h2 className="users-title" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Recurring Nutrition</span> Subscribers
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
              Loading recurring subscribers...
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
          onMouseEnter={(e) => e.target.style.color = "#ff4545"}
          onMouseLeave={(e) => e.target.style.color = "#FF5757"}
        >
          <FaChevronLeft size={16} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginLeft: "1rem" }}>
          <h2 className="users-title" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Recurring</span> Subscribers
          </h2>
        </div>
        <div className="users-count">Total: {totalCount} subscribers</div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        <div style={{
          backgroundColor: "#2a2a2a",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "200px",
          flex: 1,
        }}>
          <div style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            Total Recurring Subscribers
          </div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {totalCount}
          </div>
        </div>
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
              placeholder="Search by Customer ID..."
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
                  <th style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Customer ID
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
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Subscription Count
                  </th>
                  <th style={{
                    padding: "16px",
                    textAlign: "right",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#ccc",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Total Amount
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
                    First Subscription
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
                    Last Subscription
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
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
                        {searchTerm ? "No subscribers found" : "No recurring subscribers found"}
                      </div>
                      <div style={{ fontSize: "14px", color: "#666" }}>
                        {searchTerm
                          ? "Try adjusting your search criteria"
                          : "Recurring subscribers will appear here"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscribers.map((subscriber, index) => (
                    <tr
                      key={subscriber.customer_id}
                      style={{
                        borderBottom: index !== subscribers.length - 1 ? "1px solid #333" : "none",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a2a"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "16px", color: "#fff" }}>
                        #{subscriber.customer_id}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {subscriber.name}
                      </td>
                      <td style={{ padding: "16px", color: "#ccc" }}>
                        {subscriber.contact || "N/A"}
                      </td>
                      <td style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#4ade80",
                        fontWeight: "500"
                      }}>
                        <span style={{
                          backgroundColor: "rgba(74, 222, 128, 0.1)",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "14px"
                        }}>
                          {subscriber.subscription_count}
                        </span>
                      </td>
                      <td style={{
                        padding: "16px",
                        textAlign: "right",
                        color: "#4ade80",
                        fontWeight: "600"
                      }}>
                        {formatAmount(subscriber.total_amount)}
                      </td>
                      <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                        {formatDate(subscriber.first_subscription)}
                      </td>
                      <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                        {formatDate(subscriber.last_subscription)}
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
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} subscribers
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
