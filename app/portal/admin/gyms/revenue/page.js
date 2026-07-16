"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa";

export default function RevenuePerGymPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total_records: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("amount");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch gyms with revenue data
  const fetchRevenueList = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/gyms/revenue-list", {
        params: {
          page,
          per_page: 50,
          search: search || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });

      if (response.data.success) {
        setGyms(response.data.data.gyms);
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching revenue list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueList(1);
  }, [search, sortBy, sortOrder]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchRevenueList(newPage);
    }
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Get sort indicator
  const getSortIndicator = (column) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Header with back button and search */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
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
              onMouseEnter={(e) => e.currentTarget.style.color = "#ff4545"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#FF5757"}
            >
              <FaChevronLeft size={16} />
            </button>
            <h2 style={{ color: "#fff", margin: "0", fontSize: "20px" }}>Revenue per Gym</h2>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Search by gym name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 15px",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "14px",
                minWidth: "250px",
              }}
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="dashboard-card">
          <div className="card-body-custom" style={{ padding: "0" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                Loading...
              </div>
            ) : gyms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                No data available
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #374151" }}>
                      <th
                        onClick={() => handleSort("name")}
                        style={{
                          padding: "15px 20px",
                          textAlign: "left",
                          color: "#9ca3af",
                          fontWeight: "600",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        Gym Name{getSortIndicator("name")}
                      </th>
                      <th
                        onClick={() => handleSort("city")}
                        style={{
                          padding: "15px 20px",
                          textAlign: "left",
                          color: "#9ca3af",
                          fontWeight: "600",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        City{getSortIndicator("city")}
                      </th>
                      <th
                        onClick={() => handleSort("amount")}
                        style={{
                          padding: "15px 20px",
                          textAlign: "right",
                          color: "#9ca3af",
                          fontWeight: "600",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        Amount{getSortIndicator("amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gyms.map((gym, index) => (
                      <tr
                        key={gym.gym_id}
                        style={{
                          borderBottom: index === gyms.length - 1 ? "none" : "1px solid #1f2937",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#1f2937";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td style={{ padding: "15px 20px", color: "#e5e7eb" }}>
                          {gym.gym_name}
                        </td>
                        <td style={{ padding: "15px 20px", color: "#9ca3af" }}>
                          {gym.city}
                        </td>
                        <td style={{ padding: "15px 20px", textAlign: "right", color: "#22c55e", fontWeight: "600" }}>
                          {formatCurrency(gym.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && gyms.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px 20px",
                  borderTop: "1px solid #374151",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ color: "#9ca3af", fontSize: "13px" }}>
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to{" "}
                  {Math.min(pagination.page * pagination.per_page, pagination.total_records)} of{" "}
                  {pagination.total_records.toLocaleString()} gyms
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.has_prev}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.has_prev ? "#374151" : "#1f2937",
                      color: pagination.has_prev ? "#fff" : "#6b7280",
                      border: "none",
                      borderRadius: "4px",
                      cursor: pagination.has_prev ? "pointer" : "not-allowed",
                      fontSize: "13px",
                    }}
                  >
                    Previous
                  </button>
                  <div
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#FF5757",
                      color: "#fff",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  >
                    {pagination.page} / {pagination.total_pages}
                  </div>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.has_next}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.has_next ? "#374151" : "#1f2937",
                      color: pagination.has_next ? "#fff" : "#6b7280",
                      border: "none",
                      borderRadius: "4px",
                      cursor: pagination.has_next ? "pointer" : "not-allowed",
                      fontSize: "13px",
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
