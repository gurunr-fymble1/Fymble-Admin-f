"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowLeft,
  FaTimes,
  FaCommentAlt,
  FaCalendarAlt,
  FaPhone,
  FaMapMarkerAlt,
  FaDumbbell,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
} from "react-icons/fa";
import { formatGymName } from "@/lib/utils";

export default function GymReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [loading, setLoading] = useState(true);
  const [gyms, setGyms] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal / Drill-down state
  const [selectedGym, setSelectedGym] = useState(null);
  const [gymReviews, setGymReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedGymDetails, setSelectedGymDetails] = useState(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch all gyms summary
  const fetchGymReviewsSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      const response = await axiosInstance.get("/api/admin/gym-stats/reviews", { params });
      if (response.data && response.data.success) {
        setGyms(response.data.data || []);
      } else {
        setGyms([]);
      }
    } catch (error) {
      console.error("Error fetching gym reviews:", error);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchGymReviewsSummary();
  }, [fetchGymReviewsSummary]);

  // Fetch individual gym review drilldown
  const handleGymClick = async (gym) => {
    setSelectedGym(gym);
    setSelectedGymDetails(gym);
    setReviewsLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/gym-stats/reviews", {
        params: { gym_id: gym.gym_id },
      });
      if (response.data && response.data.success) {
        setGymReviews(response.data.reviews || []);
        if (response.data.gym_info) {
          setSelectedGymDetails({
            ...gym,
            ...response.data.gym_info,
            average_rating: response.data.average_rating,
            total_reviews: response.data.total_reviews,
          });
        }
      } else {
        setGymReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews for gym:", error);
      setGymReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedGym(null);
    setGymReviews([]);
    setSelectedGymDetails(null);
  };

  // Helper to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const numRating = parseFloat(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      if (numRating >= i) {
        stars.push(<FaStar key={i} style={{ color: "#f59e0b", fontSize: "14px", marginRight: "2px" }} />);
      } else if (numRating >= i - 0.5) {
        stars.push(<FaStarHalfAlt key={i} style={{ color: "#f59e0b", fontSize: "14px", marginRight: "2px" }} />);
      } else {
        stars.push(<FaRegStar key={i} style={{ color: "#4b5563", fontSize: "14px", marginRight: "2px" }} />);
      }
    }
    return <span style={{ display: "inline-flex", alignItems: "center" }}>{stars}</span>;
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(gyms.length / itemsPerPage) || 1;
  const paginatedGyms = gyms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ padding: "24px", color: "#e5e7eb", minHeight: "100vh", backgroundColor: "#0f172a" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#1e293b",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
          >
            <FaArrowLeft /> Back
          </button>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0, color: "#f8fafc", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaStar style={{ color: "#f59e0b" }} /> DailyPass Gym Reviews
            </h1>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: "4px 0 0 0" }}>
              Showing only gyms with submitted reviews • Click any gym row to view client ratings and feedback
            </p>
          </div>
        </div>

        {/* Stats summary badge & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              color: "#38bdf8",
              fontWeight: "600",
            }}
          >
            Total Reviewed Gyms: {gyms.length}
          </div>
          <button
            onClick={fetchGymReviewsSummary}
            title="Refresh list"
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              borderRadius: "8px",
              padding: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaSyncAlt />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div style={{ position: "relative", flex: 1, maxWidth: "450px" }}>
          <FaSearch
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            placeholder="Search by gym name, area, or city..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f8fafc",
              fontSize: "14px",
              outline: "none",
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ display: "inline-block", width: "36px", height: "36px", border: "3px solid #334155", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: "16px", fontSize: "14px" }}>Loading reviewed gyms...</p>
          </div>
        ) : paginatedGyms.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#94a3b8" }}>
            <FaCommentAlt style={{ fontSize: "40px", color: "#475569", marginBottom: "12px" }} />
            <h3 style={{ fontSize: "16px", color: "#f8fafc", margin: "0 0 4px 0" }}>No Gym Reviews Found</h3>
            <p style={{ fontSize: "13px", color: "#64748b" }}>
              {searchTerm ? "No gyms match your search criteria." : "No submitted DailyPass reviews found in the database."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ padding: "14px 16px", fontWeight: "600" }}>Gym Details</th>
                  <th style={{ padding: "14px 16px", fontWeight: "600" }}>Location</th>
                  <th style={{ padding: "14px 16px", fontWeight: "600", textAlign: "center" }}>Average Rating</th>
                  <th style={{ padding: "14px 16px", fontWeight: "600", textAlign: "center" }}>Total Reviews</th>
                  <th style={{ padding: "14px 16px", fontWeight: "600" }}>Latest Feedback</th>
                  <th style={{ padding: "14px 16px", fontWeight: "600", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGyms.map((gym) => (
                  <tr
                    key={gym.gym_id}
                    onClick={() => handleGymClick(gym)}
                    style={{
                      borderBottom: "1px solid #1e293b",
                      cursor: "pointer",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#243248")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Gym Details */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#0f172a",
                            border: "1px solid #334155",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FF5757",
                            flexShrink: 0,
                          }}
                        >
                          <FaDumbbell size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "14px" }}>
                            {formatGymName(gym.gym_name)}
                          </div>
                          <div style={{ color: "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            {/* <span>ID: #{gym.gym_id}</span> */}
                            {/* {gym.contact_number && (
                              <span>• {gym.contact_number}</span>
                            )} */}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td style={{ padding: "14px 16px", color: "#cbd5e1" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <FaMapMarkerAlt style={{ color: "#64748b", flexShrink: 0 }} />
                        <span>
                          {gym.area || gym.city ? [gym.area, gym.city].filter(Boolean).join(", ") : (gym.location || "-")}
                        </span>
                      </div>
                    </td>

                    {/* Average Rating (1 decimal point) */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          backgroundColor: "#0f172a",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          border: "1px solid #334155",
                        }}
                      >
                        <span style={{ color: "#f59e0b", fontWeight: "700", fontSize: "14px" }}>
                          ⭐ {Number(gym.average_rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Total Reviews */}
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#0284c720",
                          color: "#38bdf8",
                          fontWeight: "700",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          border: "1px solid #0284c740",
                        }}
                      >
                        {gym.total_reviews} {gym.total_reviews === 1 ? "review" : "reviews"}
                      </span>
                    </td>

                    {/* Latest Feedback */}
                    <td style={{ padding: "14px 16px", maxWidth: "300px" }}>
                      {gym.last_feedback ? (
                        <div>
                          <p
                            style={{
                              margin: 0,
                              color: "#e2e8f0",
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={gym.last_feedback}
                          >
                            &quot;{gym.last_feedback}&quot;
                          </p>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                            By {gym.last_client_name || "Client"} • {formatDate(gym.last_review_date)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: "#64748b", fontStyle: "italic", fontSize: "12px" }}>
                          {gym.last_rating ? `Rated ${gym.last_rating}★ (No written feedback)` : "No written feedback"}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGymClick(gym);
                        }}
                        style={{
                          backgroundColor: "#38bdf815",
                          border: "1px solid #38bdf840",
                          color: "#38bdf8",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#38bdf830")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#38bdf815")}
                      >
                        View All
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {gyms.length > itemsPerPage && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 20px",
              borderTop: "1px solid #334155",
              backgroundColor: "#0f172a",
              fontSize: "13px",
              color: "#94a3b8",
            }}
          >
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, gyms.length)} of {gyms.length} gyms
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  backgroundColor: currentPage === 1 ? "#1e293b" : "#334155",
                  color: currentPage === 1 ? "#475569" : "#f8fafc",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <FaChevronLeft size={10} /> Prev
              </button>
              <span style={{ padding: "6px 12px", fontWeight: "600", color: "#f8fafc" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #334155",
                  backgroundColor: currentPage === totalPages ? "#1e293b" : "#334155",
                  color: currentPage === totalPages ? "#475569" : "#f8fafc",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                Next <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Detailed Reviews Drilldown for Selected Gym */}
      {selectedGym && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "750px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #334155",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                backgroundColor: "#0f172a",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <FaDumbbell style={{ color: "#FF5757", fontSize: "20px" }} />
                  <h2 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "#f8fafc" }}>
                    {formatGymName(selectedGymDetails?.gym_name || selectedGym.gym_name)}
                  </h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px", fontSize: "12px", color: "#94a3b8" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <FaMapMarkerAlt /> {[selectedGymDetails?.area, selectedGymDetails?.city].filter(Boolean).join(", ") || selectedGymDetails?.location || "Area N/A"}
                  </span>
                  {selectedGymDetails?.contact_number && (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <FaPhone /> {selectedGymDetails.contact_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Rating stats & Close button */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#f59e0b" }}>
                    ⭐ {Number(selectedGymDetails?.average_rating || selectedGym.average_rating || 0).toFixed(1)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    {gymReviews.length} {gymReviews.length === 1 ? "Review" : "Reviews"}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    backgroundColor: "#334155",
                    border: "none",
                    color: "#94a3b8",
                    borderRadius: "8px",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#f8fafc";
                    e.currentTarget.style.backgroundColor = "#475569";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                    e.currentTarget.style.backgroundColor = "#334155";
                  }}
                >
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body - Reviews List */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {reviewsLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <div style={{ display: "inline-block", width: "30px", height: "30px", border: "3px solid #334155", borderTopColor: "#38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <p style={{ marginTop: "12px", fontSize: "13px" }}>Loading client feedback...</p>
                </div>
              ) : gymReviews.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <p style={{ fontSize: "14px" }}>No reviews found for this gym.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {gymReviews.map((rev) => (
                    <div
                      key={rev.review_id}
                      style={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "12px",
                        padding: "16px",
                      }}
                    >
                      {/* Client Header in Card */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              backgroundColor: "#38bdf820",
                              color: "#38bdf8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "13px",
                              fontWeight: "700",
                            }}
                          >
                            <FaUser />
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "13px" }}>
                              {rev.client_name || "Anonymous Client"}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {rev.client_contact ? `Contact: ${rev.client_contact}` : `Client ID: #${rev.client_id}`}
                            </div>
                          </div>
                        </div>

                        {/* Rating Stars & Timestamp */}
                        <div style={{ textAlign: "right" }}>
                          <div>{renderStars(rev.rating)}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <FaCalendarAlt size={10} /> {formatDate(rev.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Feedback Text */}
                      {rev.feedback ? (
                        <div
                          style={{
                            backgroundColor: "#1e293b",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            padding: "10px 14px",
                            fontSize: "13px",
                            color: "#e2e8f0",
                            lineHeight: "1.5",
                            marginTop: "8px",
                          }}
                        >
                          &quot;{rev.feedback}&quot;
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic", marginTop: "4px" }}>
                          Rated {rev.rating} / 5 stars with no text comment.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #334155",
                backgroundColor: "#0f172a",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeModal}
                style={{
                  backgroundColor: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
