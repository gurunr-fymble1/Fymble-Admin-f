"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FaPhone, FaBuilding, FaChevronLeft, FaChevronRight, FaInfoCircle } from "react-icons/fa";
import { formatGymName } from "@/lib/utils";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "follow_up", label: "Follow Up" },
  { key: "converted", label: "Converted" },
  { key: "rejected", label: "Rejected" },
  { key: "no_response", label: "No Response" },
  { key: "out_of_service", label: "Out of Service" },
];

const TAB_COLORS = {
  pending: "#f59e0b",
  follow_up: "#3b82f6",
  converted: "#10b981",
  rejected: "#ef4444",
  no_response: "#8b5cf6",
  out_of_service: "#6b7280",
};

export default function TelecallerDetails() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.id;
  const telecallerId = params.telecallerId;

  const [loading, setLoading] = useState(true);
  const [telecaller, setTelecaller] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [counts, setCounts] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [todayCallCount, setTodayCallCount] = useState(0);
  const [callCountFilter, setCallCountFilter] = useState('today');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');

  // Modal state for call logs
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState(null);
  const [selectedGymName, setSelectedGymName] = useState(null);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogs, setCallLogs] = useState([]);

  // Refs to track latest values without causing re-renders
  const activeTabRef = useRef(activeTab);
  const pageRef = useRef(page);
  const searchTermRef = useRef(searchTerm);
  const callCountFilterRef = useRef(callCountFilter);
  const customStartTimeRef = useRef(customStartTime);
  const customEndTimeRef = useRef(customEndTime);

  // Sync refs with state
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    callCountFilterRef.current = callCountFilter;
  }, [callCountFilter]);

  useEffect(() => {
    customStartTimeRef.current = customStartTime;
  }, [customStartTime]);

  useEffect(() => {
    customEndTimeRef.current = customEndTime;
  }, [customEndTime]);

  const fetchTelecallerDetails = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        status: activeTabRef.current,
        page: pageRef.current,
        limit: 50
      };

      const currentSearch = searchTermRef.current;
      if (currentSearch && currentSearch.trim()) {
        params.search = currentSearch.trim();
      }

      const response = await axiosInstance.get(
        `/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/details`,
        { params }
      );

      if (response.data.success) {
        setTelecaller(response.data.data.telecaller);
        setGyms(response.data.data.gyms || []);
        setCounts(response.data.data.counts || {});
        setPagination(response.data.data.pagination || {
          total: 0,
          limit: 50,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [managerId, telecallerId]);

  const fetchCallCount = useCallback(async () => {
    try {
      const params = {
        date_filter: callCountFilterRef.current
      };

      if (callCountFilterRef.current === 'custom' && customStartTimeRef.current && customEndTimeRef.current) {
        params.start_time = customStartTimeRef.current;
        params.end_time = customEndTimeRef.current;
      }

      const response = await axiosInstance.get(
        `/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/call-count`,
        { params }
      );

      if (response.data.success) {
        setTodayCallCount(response.data.data.call_count || 0);
      }
    } catch (error) {
      console.error('Fetch call count error:', error);
    }
  }, [managerId, telecallerId]);

  const fetchInitialCallCount = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/call-count`,
        { params: { date_filter: 'today' } }
      );

      if (response.data.success) {
        setTodayCallCount(response.data.data.call_count || 0);
      }
    } catch (error) {
      console.error('Fetch initial call count error:', error);
    }
  }, [managerId, telecallerId]);

  // Debounce search and trigger fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset to page 1 when search changes
      if (pageRef.current !== 1) {
        setPage(1);
        pageRef.current = 1;
      }
      fetchTelecallerDetails();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchTelecallerDetails]);

  // Fetch when activeTab or page changes (details only)
  useEffect(() => {
    fetchTelecallerDetails();
  }, [activeTab, page]);

  // Fetch initial call count on mount
  useEffect(() => {
    fetchInitialCallCount();
  }, []);

  // Fetch call count when filter changes
  const onFilterChange = (newFilter) => {
    setCallCountFilter(newFilter);
    const params = { date_filter: newFilter };
    if (newFilter === 'custom' && customStartTimeRef.current && customEndTimeRef.current) {
      params.start_time = customStartTimeRef.current;
      params.end_time = customEndTimeRef.current;
    }
    axiosInstance.get(`/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/call-count`, { params })
      .then(res => {
        if (res.data.success) setTodayCallCount(res.data.data.call_count || 0);
      })
      .catch(err => console.error('Filter call count error:', err));
  };

  const applyCustomFilter = () => {
    if (customStartTime && customEndTime) {
      const params = {
        date_filter: 'custom',
        start_time: customStartTime,
        end_time: customEndTime
      };
      axiosInstance.get(`/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/call-count`, { params })
        .then(res => {
          if (res.data.success) setTodayCallCount(res.data.data.call_count || 0);
        })
        .catch(err => console.error('Custom filter call count error:', err));
    }
  };

  const clearFilter = () => {
    setCallCountFilter('today');
    setCustomStartTime('');
    setCustomEndTime('');
    axiosInstance.get(`/api/admin/telecaller-managers/${managerId}/telecallers/${telecallerId}/call-count`, { params: { date_filter: 'today' } })
      .then(res => {
        if (res.data.success) setTodayCallCount(res.data.data.call_count || 0);
      })
      .catch(err => console.error('Clear filter call count error:', err));
  };

  const handleTabChange = (tabKey) => {
    if (activeTab === tabKey) return;
    setActiveTab(tabKey);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
  };

  const openCallLogsModal = async (gymId, gymName) => {
    setSelectedGymId(gymId);
    setSelectedGymName(gymName);
    setModalOpen(true);
    setCallLogsLoading(true);
    setCallLogs([]);

    try {
      const response = await axiosInstance.get(`/api/admin/telecaller-managers/gym-call-logs/${gymId}`);
      if (response.data.success) {
        setCallLogs(response.data.data.call_logs || []);
      }
    } catch (error) {
      console.error("Error fetching call logs:", error);
    } finally {
      setCallLogsLoading(false);
    }
  };

  const closeCallLogsModal = () => {
    setModalOpen(false);
    setSelectedGymId(null);
    setSelectedGymName(null);
    setCallLogs([]);
  };

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Telecaller Info Card */}
        {telecaller && (
          <div style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <button
                onClick={() => router.push(`/portal/admin/telecaller-managers/${managerId}`)}
                style={{
                  backgroundColor: "#3a3a3a",
                  border: "1px solid #444",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "14px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#4a4a4a"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#3a3a3a"}
              >
                <FaChevronLeft size={14} />
                Back
              </button>
              <div>
                <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                  Telecaller Name
                </div>
                <div style={{ fontSize: "18px", fontWeight: "600", color: "#fff" }}>
                  {telecaller.name}
                </div>
              </div>
            </div>
            <div>
              <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                Mobile Number
              </div>
              <div style={{
                fontSize: "16px",
                color: "#ccc",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaPhone style={{ color: "#FF5757", fontSize: "14px" }} />
                {telecaller.mobile_number}
              </div>
            </div>
            <div>
              <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                Total Gyms
              </div>
              <div style={{ fontSize: "32px", fontWeight: "600", color: "#FF5757" }}>
                {Object.values(counts).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingLeft: "20px", borderLeft: "2px solid #10b981" }}>
              <div>
                <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                  Call Count
                </div>
                <div style={{ fontSize: "32px", fontWeight: "600", color: "#10b981" }}>
                  {todayCallCount}
                </div>
              </div>
              <select
                value={callCountFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                style={{
                  backgroundColor: "#1e1e1e",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  color: "#fff",
                  padding: "8px 12px",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="current_month">MTD</option>
                <option value="last_month">Last Month</option>
                <option value="overall">Overall</option>
                <option value="custom">Custom</option>
              </select>
              {callCountFilter === 'custom' && (
                <>
                  <input
                    type="datetime-local"
                    value={customStartTime}
                    onChange={(e) => {
                      setCustomStartTime(e.target.value);
                      customStartTimeRef.current = e.target.value;
                    }}
                    style={{
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#fff",
                      padding: "6px 10px",
                      fontSize: "11px",
                      outline: "none"
                    }}
                  />
                  <input
                    type="datetime-local"
                    value={customEndTime}
                    onChange={(e) => {
                      setCustomEndTime(e.target.value);
                      customEndTimeRef.current = e.target.value;
                    }}
                    style={{
                      backgroundColor: "#1e1e1e",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#fff",
                      padding: "6px 10px",
                      fontSize: "11px",
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={applyCustomFilter}
                    style={{
                      backgroundColor: "#10b981",
                      border: "none",
                      borderRadius: "6px",
                      color: "#fff",
                      padding: "6px 12px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    Apply
                  </button>
                </>
              )}
              {callCountFilter !== 'today' && (
                <button
                  onClick={clearFilter}
                  style={{
                    backgroundColor: "#444",
                    border: "none",
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "500"
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          flexWrap: "wrap",
          borderBottom: "1px solid #333",
          paddingBottom: "0"
        }}>
          {TABS.map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            const color = TAB_COLORS[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: "12px 20px",
                  backgroundColor: isActive ? "rgba(255, 87, 87, 0.1)" : "transparent",
                  border: "none",
                  borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                  borderRadius: "8px 8px 0 0",
                  color: isActive ? color : "#888",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: isActive ? "600" : "400",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                  marginBottom: isActive ? "-1px" : "0",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = "#2a2a2a";
                    e.target.style.color = "#ccc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#888";
                  }
                }}
              >
                {tab.label}
                <span style={{
                  backgroundColor: isActive ? `${color}33` : "#333",
                  color: isActive ? color : "#666",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {count}
                </span>
              </button>
            );
          })}
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
            <FaBuilding
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
              placeholder="Search by gym name, contact person, phone, area, city..."
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

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "40px",
          }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  border: "4px solid #3a3a3a",
                  borderTop: `4px solid ${TAB_COLORS[activeTab]}`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 1rem",
                }}
              />
              <p style={{ fontSize: "14px", color: "#ccc" }}>
                Loading gyms...
              </p>
            </div>
          </div>
        ) : (
          /* Table */
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
                      letterSpacing: "0.5px",
                      maxWidth: "250px",
                      width: "250px"
                    }}>
                      Gym Name
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
                      Phone
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
                      Location
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
                      Status
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
                      Last Call
                    </th>
                    {activeTab !== "pending" && (
                      <th style={{
                        padding: "16px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#ccc",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        width: "80px"
                      }}>
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {gyms.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "pending" ? 5 : 6} style={{
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
                          {searchTerm ? "No gyms found" : `No gyms in ${TABS.find(t => t.key === activeTab)?.label}`}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Gyms will appear here once assigned"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    gyms.map((gym, index) => {
                      const gymDetails = gym.gym_details || {};
                      const statusColor = TAB_COLORS[gym.call_status] || "#888";

                      return (
                        <tr
                          key={gym.log_id || gym.gym_id}
                          style={{
                            borderBottom: index !== gyms.length - 1 ? "1px solid #333" : "none",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a2a"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td style={{ padding: "16px", color: "#fff", fontWeight: "500", maxWidth: "250px", wordBreak: "break-word" }}>
                            {formatGymName(gymDetails.gym_name) || "N/A"}
                          </td>
                          <td style={{ padding: "16px", color: "#ccc" }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}>
                              <FaPhone style={{ color: "#FF5757", fontSize: "12px" }} />
                              {gymDetails.contact_phone || "N/A"}
                            </div>
                          </td>
                          <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                            <div>
                              <div>{gymDetails.area || "N/A"}</div>
                              <div style={{ fontSize: "12px", color: "#666" }}>
                                {gymDetails.city || "N/A"}, {gymDetails.state || "N/A"}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span style={{
                              backgroundColor: `${statusColor}22`,
                              color: statusColor,
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                              textTransform: "capitalize"
                            }}>
                              {gym.call_status?.replace(/_/g, " ") || "Pending"}
                            </span>
                          </td>
                          <td style={{ padding: "16px", color: "#888", fontSize: "14px" }}>
                            {gym.created_at
                              ? new Date(gym.created_at).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Never"}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            {/* Don't show Action button for Pending tab */}
                            {activeTab !== "pending" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openCallLogsModal(gym.gym_id, gymDetails.gym_name);
                                }}
                                style={{
                                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                                  border: "1px solid rgba(59, 130, 246, 0.3)",
                                  borderRadius: "6px",
                                  padding: "8px 12px",
                                  color: "#3b82f6",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                                  e.target.style.borderColor = "rgba(59, 130, 246, 0.5)";
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                                  e.target.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                }}
                              >
                                <FaInfoCircle size={12} />
                                <span>Logs</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "#2a2a2a",
            borderRadius: "8px"
          }}>
            <div style={{ color: "#888", fontSize: "14px" }}>
              Showing {((page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} gyms
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrev || loading}
                style={{
                  backgroundColor: pagination.hasPrev && !loading ? "#FF5757" : "#3a3a3a",
                  border: "none",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: pagination.hasPrev && !loading ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: (!pagination.hasPrev || loading) ? 0.5 : 1,
                }}
              >
                <FaChevronLeft size={12} />
                Previous
              </button>
              <span style={{
                color: "#ccc",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                padding: "0 8px"
              }}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNext || loading}
                style={{
                  backgroundColor: pagination.hasNext && !loading ? "#FF5757" : "#3a3a3a",
                  border: "none",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: pagination.hasNext && !loading ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: (!pagination.hasNext || loading) ? 0.5 : 1,
                }}
              >
                Next
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Call Logs Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #333"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#fff",
                  margin: "0"
                }}>
                  Call Logs
                </h2>
                <p style={{
                  fontSize: "14px",
                  color: "#888",
                  margin: "4px 0 0 0"
                }}>
                  {formatGymName(selectedGymName) || "Gym"}
                </p>
              </div>
              <button
                onClick={closeCallLogsModal}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#3a3a3a";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#888";
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div style={{
              padding: "20px",
              overflowY: "auto",
              flex: 1
            }}>
              {callLogsLoading ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px"
                }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      border: "3px solid #3a3a3a",
                      borderTop: "3px solid #3b82f6",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite"
                    }}
                  />
                </div>
              ) : callLogs.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#888"
                }}>
                  <FaInfoCircle style={{ fontSize: "48px", opacity: 0.3, marginBottom: "16px" }} />
                  <div style={{ fontSize: "16px" }}>No call logs found</div>
                  <div style={{ fontSize: "14px", marginTop: "8px" }}>
                    This gym hasn&apos;t been called yet
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {callLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: "#2a2a2a",
                        borderRadius: "8px",
                        padding: "16px",
                        border: "1px solid #333"
                      }}
                    >
                      {/* Card Header */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                        paddingBottom: "12px",
                        borderBottom: "1px solid #3a3a3a"
                      }}>
                        <div style={{
                          fontSize: "13px",
                          color: "#888",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <FaPhone style={{ fontSize: "12px" }} />
                          {log.telecaller_name || "Unknown"}
                        </div>
                        <div style={{
                          fontSize: "12px",
                          color: "#666"
                        }}>
                          {log.created_at
                            ? new Date(log.created_at).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : ""}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {/* Call Status */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#888", minWidth: "80px" }}>
                            Status:
                          </span>
                          <span style={{
                            backgroundColor: `${TAB_COLORS[log.call_status] || "#888"}22`,
                            color: TAB_COLORS[log.call_status] || "#888",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            textTransform: "capitalize"
                          }}>
                            {log.call_status?.replace(/_/g, " ") || "Pending"}
                          </span>
                        </div>

                        {/* Remarks */}
                        <div>
                          <span style={{ fontSize: "12px", color: "#888" }}>Remarks:</span>
                          <p style={{
                            margin: "4px 0 0 0",
                            fontSize: "14px",
                            color: "#ccc",
                            lineHeight: "1.4"
                          }}>
                            {log.remarks || "-"}
                          </p>
                        </div>

                        {/* Additional Info */}
                        {(log.follow_up_date || log.interest_level || log.total_members) && (
                          <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "16px",
                            paddingTop: "8px",
                            borderTop: "1px solid #3a3a3a"
                          }}>
                            {log.follow_up_date && (
                              <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#888" }}>Follow-up:</span>{" "}
                                <span style={{ color: "#ccc" }}>
                                  {new Date(log.follow_up_date).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </span>
                              </div>
                            )}
                            {log.interest_level && (
                              <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#888" }}>Interest:</span>{" "}
                                <span style={{ color: "#ccc" }}>{log.interest_level}</span>
                              </div>
                            )}
                            {log.total_members && (
                              <div style={{ fontSize: "12px" }}>
                                <span style={{ color: "#888" }}>Members:</span>{" "}
                                <span style={{ color: "#ccc" }}>{log.total_members}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid #333",
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={closeCallLogsModal}
                style={{
                  backgroundColor: "#3a3a3a",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#4a4a4a"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#3a3a3a"}
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
