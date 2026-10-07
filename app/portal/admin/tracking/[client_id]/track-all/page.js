"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaSpinner,
  FaCalendar,
  FaBuilding,
  FaTag,
} from "react-icons/fa";
import axiosInstance from "@/lib/axios";
import { formatGymName } from "@/lib/utils";

export default function AdminClientTrackingTrackAll() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.client_id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ client_name: "", events: [] });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchAllEvents = async (targetPage = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `telecaller/client-tracking/client-detail/${clientId}/all-events`,
        {
          params: { page: targetPage, limit: 100 },
        }
      );

      if (response.data.status === 200) {
        setData(response.data.data);
        setPagination(response.data.pagination);
        setPage(targetPage);
      }
    } catch (error) {
      console.error("Error fetching all client events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents(1);
  }, [clientId]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchAllEvents(newPage);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType?.toLowerCase()) {
      // Gym Activities
      case "gym_viewed":
        return { backgroundColor: "#1e3a8a4d", borderColor: "#1e40af", color: "#60a5fa" };
      case "dailypass_viewed":
        return { backgroundColor: "#0369a126", borderColor: "#0284c7", color: "#38bdf8" };
      case "session_viewed":
        return { backgroundColor: "#5b21b626", borderColor: "#7c3aed", color: "#a78bfa" };
      case "membership_viewed":
        return { backgroundColor: "#86198f26", borderColor: "#d946ef", color: "#f472b6" };
      
      // Checkout/Purchases
      case "checkout_initiated":
        return { backgroundColor: "#78350f4d", borderColor: "#92400e", color: "#fbbf24" };
      case "checkout_completed":
        return { backgroundColor: "#14532d4d", borderColor: "#166534", color: "#4ade80" };
      case "checkout_failed":
        return { backgroundColor: "#7f1d1d4d", borderColor: "#991b1b", color: "#fca5a5" };

      // Diet/Workout/Water/Weight
      case "diet_viewed":
        return { backgroundColor: "#064e3b4d", borderColor: "#059669", color: "#34d399" };
      case "diet_report_viewed":
        return { backgroundColor: "#022c224d", borderColor: "#10b981", color: "#6ee7b7" };
      case "workout_tracker_viewed":
        return { backgroundColor: "#312e814d", borderColor: "#4f46e5", color: "#818cf8" };
      case "workout_report_viewed":
        return { backgroundColor: "#4c1d954d", borderColor: "#8b5cf6", color: "#c084fc" };
      case "water_tracker_viewed":
        return { backgroundColor: "#164e634d", borderColor: "#0891b2", color: "#22d3ee" };
      case "weight_progress_viewed":
        return { backgroundColor: "#8318434d", borderColor: "#db2777", color: "#f472b6" };

      // Gymmate
      case "gymmate_profile_creation_viewed":
        return { backgroundColor: "#7c2d124d", borderColor: "#ea580c", color: "#fb923c" };
      case "gymmate_viewed":
        return { backgroundColor: "#78350f4d", borderColor: "#d97706", color: "#fcd34d" };
      case "gymmeate_viewed":
        return { backgroundColor: "#991b1b4d", borderColor: "#ef4444", color: "#fca5a5" };

      default:
        return { backgroundColor: "#374151", borderColor: "#4b5563", color: "#d1d5db" };
    }
  };

  const getEventTypeLabel = (eventType, productType) => {
    switch (eventType) {
      case "gym_viewed":
        return "Viewed Gym Details";
      case "dailypass_viewed":
        return "Viewed Daily Pass";
      case "session_viewed":
        return "Viewed Sessions";
      case "membership_viewed":
        return "Viewed Membership Plans";
      case "checkout_initiated":
        return "Checkout Initiated";
      case "checkout_completed":
        return "Checkout Completed";
      case "checkout_failed":
        return "Checkout Failed";
      case "diet_viewed":
        return "Diet Tracker Viewed";
      case "diet_report_viewed":
        return "Diet Report Viewed";
      case "workout_tracker_viewed":
        return "Workout Tracker Viewed";
      case "workout_report_viewed":
        return "Workout Report Viewed";
      case "water_tracker_viewed":
        return "Water Tracker Viewed";
      case "weight_progress_viewed":
        return "Weight Progress Viewed";
      case "gymmate_profile_creation_viewed":
        return "Gymmate Profile Creation Viewed";
      case "gymmate_viewed":
        return "Gymmate Home Viewed";
      case "gymmeate_viewed":
        return "Gymmate Viewed";
      default:
        return (productType || eventType || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  if (loading && data.events.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FaSpinner
          style={{
            fontSize: "3rem",
            color: "#FF5757",
            animation: "spin 1s linear infinite",
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  const startIdx = (page - 1) * pagination.limit;

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", backgroundColor: "#111827", color: "white" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem",
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              color: "white",
              borderRadius: "0.5rem",
              cursor: "pointer",
              transition: "background-color 0.2s",
              width: "2.25rem",
              height: "2.25rem",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#1f2937";
            }}
            title="Back to Client Activity"
          >
            <FaChevronLeft style={{ fontSize: "1rem" }} />
          </button>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              All Activity Logs
            </h2>
            <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
              — Showing all raw tracking events for <span style={{ color: "#ef4444", fontWeight: "600" }}>{data.client_name}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Events Table Container */}
      <div
        style={{
          backgroundColor: "#1f2937",
          borderRadius: "0.5rem",
          border: "1px solid #374151",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#11182780",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10
            }}
          >
            <FaSpinner
              style={{
                fontSize: "2rem",
                color: "#FF5757",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#374151", borderBottom: "1px solid #4b5563" }}>
                <th style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af", width: "80px" }}>#</th>
                <th style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af", width: "240px" }}>Event Type</th>
                <th style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af", width: "200px" }}>Timestamp</th>
                <th style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af" }}>Location/Gym</th>
                <th style={{ padding: "1rem", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af", width: "120px" }}>Product</th>
              </tr>
            </thead>
            <tbody>
              {data.events && data.events.length > 0 ? (
                data.events.map((event, idx) => {
                  const colors = getEventTypeColor(event.event_type);
                  return (
                    <tr
                      key={event.id}
                      style={{
                        borderBottom: idx !== data.events.length - 1 ? "1px solid #374151" : "none",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#37415180";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#9ca3af" }}>
                        {startIdx + idx + 1}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            borderRadius: "0.25rem",
                            border: "1px solid",
                            ...colors,
                          }}
                        >
                          {getEventTypeLabel(event.event_type, event.product_type)}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#d1d5db" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FaCalendar style={{ color: "#9ca3af", fontSize: "0.75rem" }} />
                          {formatDateTime(event.created_at)}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#d1d5db" }}>
                        {event.gym_name ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FaBuilding style={{ color: "#9ca3af", fontSize: "0.75rem", flexShrink: 0 }} />
                            <span>
                              {formatGymName(event.gym_name)} {event.gym_area ? `(${event.gym_area})` : ""}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.875rem", color: "#d1d5db" }}>
                        {event.product_type ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <FaTag style={{ color: "#9ca3af", fontSize: "0.75rem" }} />
                            {event.product_type}
                          </div>
                        ) : (
                          <span style={{ color: "#6b7280" }}>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      padding: "3rem",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "1rem 1.5rem",
              backgroundColor: "#37415180",
              borderTop: "1px solid #4b5563",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
              Showing {startIdx + 1} to{" "}
              {Math.min(page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} events
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrev}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  cursor: pagination.hasPrev ? "pointer" : "not-allowed",
                  opacity: pagination.hasPrev ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (pagination.hasPrev) {
                    e.target.style.color = "white";
                    e.target.style.backgroundColor = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#9ca3af";
                  e.target.style.backgroundColor = "#1f2937";
                }}
              >
                <FaChevronLeft style={{ fontSize: "0.875rem" }} />
              </button>

              {/* Page Number buttons */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (page > 3 && pagination.totalPages > 5) {
                  pageNum = page - 3 + i;
                  if (pageNum + (4 - i) > pagination.totalPages) {
                    pageNum = pagination.totalPages - 4 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      backgroundColor: page === pageNum ? "#ef4444" : "#1f2937",
                      border: "1px solid #374151",
                      color: page === pageNum ? "white" : "#9ca3af",
                      cursor: "pointer",
                      fontWeight: page === pageNum ? "bold" : "normal",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (page !== pageNum) {
                        e.target.style.color = "white";
                        e.target.style.backgroundColor = "#374151";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== pageNum) {
                        e.target.style.color = "#9ca3af";
                        e.target.style.backgroundColor = "#1f2937";
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNext}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  color: "#9ca3af",
                  cursor: pagination.hasNext ? "pointer" : "not-allowed",
                  opacity: pagination.hasNext ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (pagination.hasNext) {
                    e.target.style.color = "white";
                    e.target.style.backgroundColor = "#374151";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = "#9ca3af";
                  e.target.style.backgroundColor = "#1f2937";
                }}
              >
                <FaChevronRight style={{ fontSize: "0.875rem" }} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
