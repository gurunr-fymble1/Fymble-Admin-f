"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../../layout";
import axiosInstance from "@/lib/axios";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaSync,
} from "react-icons/fa";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function KyraUserChat({ clientId, chatData }) {
  const containerRef = React.useRef(null);

  const messages = chatData?.messages || [];
  const loading = chatData?.loading;
  const error = chatData?.error;

  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const formatMessageTime = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const getMessageDateHeader = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return "";
    }
  };

  return (
    <div style={{
      backgroundColor: "#0b141a",
      borderRadius: "12px",
      border: "1px solid #2a2a2a",
      height: "480px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Chat Header */}
      <div style={{
        backgroundColor: "#202c33",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #2f3b43"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80" }}></span>
          <span style={{ color: "#e9edef", fontSize: "13px", fontWeight: "600" }}>Kyra AI Chat History</span>
        </div>
        {loading && <span style={{ color: "#8696a0", fontSize: "11px" }}>Loading...</span>}
      </div>

      {/* Messages List */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {messages.length === 0 && !loading && (
          <div style={{ margin: "auto", textAlign: "center", color: "#8696a0", fontSize: "13px" }}>
            No chat history found for this user.
          </div>
        )}

        {error && (
          <div style={{ color: "#f87171", fontSize: "12px", textAlign: "center", margin: "8px 0" }}>
            {error}
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = messages[idx - 1];
          const showDateHeader = !prevMsg || 
            new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString();
          
          return (
            <React.Fragment key={msg.id}>
              {showDateHeader && (
                <div style={{
                  alignSelf: "center",
                  backgroundColor: "rgba(32, 44, 51, 0.6)",
                  color: "#8696a0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  margin: "8px 0",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  {getMessageDateHeader(msg.created_at)}
                </div>
              )}

              {/* User Request Bubble */}
              {msg.request && (
                <div style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#005c4b",
                  color: "#e9edef",
                  borderRadius: "12px 12px 0 12px",
                  padding: "8px 12px",
                  maxWidth: "75%",
                  boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px"
                }}>
                  {/* Request Type Label */}
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    color: msg.request_type === "audio" ? "#38bdf8" : msg.request_type === "document" ? "#fb923c" : "#34d399",
                    opacity: 0.95,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "3px",
                    marginBottom: "3px"
                  }}>
                    {msg.request_type === "audio" ? "🎙 Audio" : msg.request_type === "document" ? "📄 Document" : "💬 Text"}
                  </span>
                  <span style={{ fontSize: "13px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                    {msg.request}
                  </span>
                  <span style={{ alignSelf: "flex-end", fontSize: "9px", color: "#8696a0" }}>
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
              )}

              {/* Kyra Response Bubble */}
              {msg.response && (
                <div style={{
                  alignSelf: "flex-start",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  maxWidth: "75%"
                }}>
                  <img
                    src="/kyra-logo.png"
                    alt="Kyra Logo"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid #3a3a3a",
                      backgroundColor: "#202c33"
                    }}
                  />
                  <div style={{
                    backgroundColor: "#202c33",
                    color: "#e9edef",
                    borderRadius: "0px 12px 12px 12px",
                    padding: "8px 12px",
                    boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}>
                    <span style={{ fontSize: "13px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                      {msg.response}
                    </span>
                    <span style={{ alignSelf: "flex-end", fontSize: "9px", color: "#8696a0" }}>
                      {formatMessageTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function KyraPageStandalone() {
  const router = useRouter();
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("subscriptions"); // "subscriptions" or "users"
  
  // Users state
  const [usersData, setUsersData] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [expandedGoalsRows, setExpandedGoalsRows] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [expandedRowTabs, setExpandedRowTabs] = useState({});
  const [chatHistories, setChatHistories] = useState({});

  const EXCLUDED_CONTACTS = useMemo(() => [
    "7373675762",
    "9486987082",
    "8667458723",
    "9840633149",
    "8667427956",
    "8667488723",
    "7975847236"
  ], []);

  const filteredUsers = useMemo(() => {
    return usersData.filter(user => {
      return !EXCLUDED_CONTACTS.includes(user.client?.contact);
    });
  }, [usersData, EXCLUDED_CONTACTS]);
  // Parse tab parameter from URL search query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "users") {
        setActiveTab("users");
      } else if (tab === "subscriptions") {
        setActiveTab("subscriptions");
      }
    }
  }, []);

  const chartData = useMemo(() => {
    let active = 0;
    let expired = 0;
    data.forEach((item) => {
      const status = item.subscription?.status;
      if (status === "active" || status === "renewed" || status === "trial") {
        active++;
      } else {
        expired++;
      }
    });
    return [
      { name: "Active Plans", value: active, color: "#4ade80" },
      { name: "Expired/Canceled", value: expired, color: "#ef4444" },
    ];
  }, [data]);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [totalCountPeriod, setTotalCountPeriod] = useState("overall");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load subscriptions data
  const loadKyraData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/api/admin/purchases/kyra-subscription");
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to retrieve subscription data");
      }
    } catch (err) {
      console.error("Error loading Kyra data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load Kyra subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users data
  const loadKyraUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const response = await axiosInstance.get("/api/admin/kyra/kyra-users");
      if (response.data.success) {
        setUsersData(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to retrieve users data");
      }
    } catch (err) {
      console.error("Error loading Kyra users data:", err);
      setUsersError(err.response?.data?.detail || err.message || "Failed to load Kyra users.");
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Load chat history
  const loadChatHistory = useCallback(async (clientId) => {
    const current = chatHistories[clientId] || { messages: [], loading: false, error: null };
    if (current.loading) return;

    setChatHistories(prev => ({
      ...prev,
      [clientId]: { ...current, loading: true, error: null }
    }));

    try {
      const url = `/api/admin/kyra/chat-history/${clientId}`;
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        const msgs = response.data.data || [];

        setChatHistories(prev => ({
          ...prev,
          [clientId]: {
            messages: msgs,
            loading: false,
            error: null
          }
        }));
      } else {
        throw new Error(response.data.message || "Failed to load chat history");
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
      setChatHistories(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          loading: false,
          error: err.response?.data?.detail || err.message || "Failed to load chat history"
        }
      }));
    }
  }, [chatHistories]);

  useEffect(() => {
    if (activeTab === "subscriptions") {
      loadKyraData();
    } else {
      loadKyraUsers();
    }
  }, [activeTab, loadKyraData, loadKyraUsers]);

  // Helper: Format Date
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (includeTime) {
      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper: Get filtered subscription count based on period
  const getFilteredSubscriptionsCount = useCallback((period) => {
    if (period === "overall") {
      return data.length;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter((item) => {
      const createdAtStr = item.subscription?.created_at;
      if (!createdAtStr) return false;
      const createdAt = new Date(createdAtStr);
      if (isNaN(createdAt.getTime())) return false;

      if (period === "today") {
        return createdAt >= startOfToday;
      }
      if (period === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return createdAt >= sevenDaysAgo;
      }
      if (period === "this_month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return createdAt >= startOfMonth;
      }
      if (period === "1month") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return createdAt >= thirtyDaysAgo;
      }
      return true;
    }).length;
  }, [data]);

  // Memoized stats based on raw response data
  const stats = useMemo(() => {
    const total = data.length;
    let active = 0;
    let canceled = 0;
    const distinctClientsSet = new Set();

    data.forEach((item) => {
      const status = item.subscription?.status;
      const customerId = item.subscription?.customer_id;

      if (customerId) {
        distinctClientsSet.add(customerId);
      }

      if (status === "active" || status === "renewed" || status === "trial") {
        active++;
      } else if (["canceled", "expired"].includes(status)) {
        canceled++;
      }
    });

    return { total, active, distinctClients: distinctClientsSet.size, canceled };
  }, [data]);

  // Helper: Expiry/Days Remaining display
  const getExpiryDisplay = (activeUntilStr) => {
    if (!activeUntilStr) return "N/A";
    const activeUntil = new Date(activeUntilStr);
    if (isNaN(activeUntil.getTime())) return activeUntilStr;

    const now = new Date();
    if (now > activeUntil) {
      return <span style={{ color: "#ef4444" }}>0 days left</span>;
    }

    const diffTime = activeUntil - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 5) {
      return <span style={{ color: "#f59e0b" }}>Expires in {diffDays}d</span>;
    }
    return <span style={{ color: "#10b981" }}>{diffDays} days left</span>;
  };

  // Filtered and Sorted list
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search term matching
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const clientName = (item.client?.name || "").toLowerCase();
        const contact = (item.client?.contact || "").toLowerCase();

        return (
          clientName.includes(term) ||
          contact.includes(term)
        );
      });
    }

    // Status filter logic
    if (statusFilter !== "all") {
      result = result.filter((item) => {
        const status = item.subscription?.status;
        if (statusFilter === "active") {
          return status === "active" || status === "renewed";
        }
        if (statusFilter === "expired") {
          return status === "expired" || status === "canceled";
        }
        return status === statusFilter;
      });
    }

    // Sorting logic
    result.sort((a, b) => {
      let valA, valB;
      if (sortField === "created_at") {
        valA = a.subscription?.created_at ? new Date(a.subscription.created_at).getTime() : 0;
        valB = b.subscription?.created_at ? new Date(b.subscription.created_at).getTime() : 0;
      } else if (sortField === "active_until") {
        valA = a.subscription?.active_until ? new Date(a.subscription.active_until).getTime() : 0;
        valB = b.subscription?.active_until ? new Date(b.subscription.active_until).getTime() : 0;
      } else {
        valA = 0;
        valB = 0;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, statusFilter, sortField, sortOrder]);

  // Pagination indexing
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Adjust page boundary if filters shrink the set size
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Users Tab State, Filtering and Pagination
  const [currentUsersPage, setCurrentUsersPage] = useState(1);

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...usersData];

    // Search term matching (by name and contact only)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const clientName = (item.client?.name || "").toLowerCase();
        const contact = (item.client?.contact || "").toLowerCase();
        return clientName.includes(term) || contact.includes(term);
      });
    }

    // Sort by onboarding date (descending)
    result.sort((a, b) => {
      const valA = a.onboarding_at ? new Date(a.onboarding_at).getTime() : 0;
      const valB = b.onboarding_at ? new Date(b.onboarding_at).getTime() : 0;
      return valB - valA;
    });

    return result;
  }, [usersData, searchTerm]);

  const totalUsersItems = filteredAndSortedUsers.length;
  const totalUsersPages = Math.ceil(totalUsersItems / itemsPerPage);

  useEffect(() => {
    if (currentUsersPage > totalUsersPages && totalUsersPages > 0) {
      setCurrentUsersPage(totalUsersPages);
    }
  }, [totalUsersPages, currentUsersPage]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentUsersPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentUsersPage, itemsPerPage]);

  // Close any expanded rows when search term, active tab, status filter, page, or items per page changes
  useEffect(() => {
    setExpandedRows(new Set());
  }, [searchTerm, activeTab, statusFilter, currentPage, currentUsersPage, itemsPerPage]);

  // CSS Styles objects for custom premium layout
  const containerStyle = {
    color: "#fff",
    fontFamily: "'Inter', sans-serif"
  };

  const cardStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "10px",
    padding: "20px",
    textAlign: "left",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease",
  };

  const cardLabelStyle = {
    color: "#888",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const cardValueStyle = {
    fontSize: "30px",
    fontWeight: "700",
    color: "#fff"
  };

  const filterContainerStyle = {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    alignItems: "center"
  };

  const searchWrapperStyle = {
    position: "relative",
    flex: "1 1 300px",
    maxWidth: "450px"
  };

  const searchInputStyle = {
    width: "100%",
    padding: "10px 15px 10px 40px",
    backgroundColor: "#222",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
    outline: "none"
  };

  const selectStyle = {
    backgroundColor: "#222",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    padding: "10px 15px",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none"
  };

  const statusBadgeStyle = (status) => {
    let color = "#888";
    let bgColor = "rgba(136, 136, 136, 0.15)";
    
    if (status === "active" || status === "renewed") {
      color = "#4ade80";
      bgColor = "rgba(74, 222, 128, 0.15)";
    } else if (status === "trial") {
      color = "#f59e0b";
      bgColor = "rgba(245, 158, 11, 0.15)";
    } else if (["canceled", "expired", "revoked", "refunded"].includes(status)) {
      color = "#ef4444";
      bgColor = "rgba(239, 68, 68, 0.15)";
    }

    return {
      color,
      backgroundColor: bgColor,
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase",
      display: "inline-block",
    };
  };

  return (
    <div style={containerStyle} className="dashboard-container">
      <div className="section-container">
        {/* Title Header with Refresh Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <button
              onClick={() => router.push(`/portal/${role}/home`)}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#888",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#222";
                e.currentTarget.style.color = "#888";
              }}
            >
              <FaChevronLeft style={{ fontSize: "12px" }} />
              Back
            </button>
            <h2 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Kyra AI</span> Subscriptions
            </h2>
          </div>
          <button
            onClick={loadKyraData}
            disabled={loading}
            style={{
              backgroundColor: "#222",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: "6px",
              padding: "8px 14px",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#333"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#222"}
          >
            <FaSync className={loading ? "spin-animation" : ""} style={{ animation: loading ? "spin 1.5s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* Stats Cards & Charts Section */}
        {activeTab === "subscriptions" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "25px"
          }}>
          {/* Left Column: Stats Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={cardLabelStyle}>Total Subscriptions</span>
                <select
                  value={totalCountPeriod}
                  onChange={(e) => setTotalCountPeriod(e.target.value)}
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "4px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "2px 6px",
                    cursor: "pointer",
                    outline: "none"
                  }}
                >
                  <option value="overall">Overall</option>
                  <option value="today">Today</option>
                  <option value="7days">7 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="1month">1 Month</option>
                </select>
              </div>
              <div style={cardValueStyle}>{getFilteredSubscriptionsCount(totalCountPeriod)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>Active Subscriptions</div>
                <div style={{ ...cardValueStyle, color: "#4ade80", fontSize: "24px" }}>{stats.active}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>No. of Clients</div>
                <div style={{ ...cardValueStyle, color: "#38bdf8", fontSize: "24px" }}>{stats.distinctClients}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Pie Chart Breakdown */}
          <div style={{
            ...cardStyle,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative"
          }}>
            <div style={cardLabelStyle}>Plan Status Breakdown</div>
            {data.length === 0 ? (
              <div style={{ color: "#888", textAlign: "center", padding: "40px 0" }}>No data to display chart</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, marginTop: "10px" }}>
                {/* Donut Container with centered text */}
                <div style={{ position: "relative", width: "100%", height: "130px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        cornerRadius={4}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #333", borderRadius: "6px", color: "#fff" }}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered label inside Donut */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    pointerEvents: "none"
                  }}>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#fff", lineHeight: "1.1" }}>
                      {data.length}
                    </div>
                    <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "2px" }}>
                      Total
                    </div>
                  </div>
                </div>

                {/* Custom Legend underneath */}
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px", width: "100%" }}>
                  {chartData.map((item, index) => (
                    <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}`
                      }} />
                      <span style={{ fontSize: "12px", color: "#aaa" }}>
                        {item.name}: <strong style={{ color: "#fff" }}>{item.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Toggle Sub-Tabs */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px",
          borderBottom: "1px solid #333",
          paddingBottom: "12px"
        }}>
          <button
            onClick={() => {
              setActiveTab("subscriptions");
              setSearchTerm("");
            }}
            style={{
              padding: "10px 22px",
              backgroundColor: activeTab === "subscriptions" ? "#FF5757" : "transparent",
              border: "1px solid " + (activeTab === "subscriptions" ? "#FF5757" : "#333"),
              color: "#fff",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
              boxShadow: activeTab === "subscriptions" ? "0 4px 15px rgba(255, 87, 87, 0.3)" : "none"
            }}
          >
            Subscription
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setSearchTerm("");
            }}
            style={{
              padding: "10px 22px",
              backgroundColor: activeTab === "users" ? "#FF5757" : "transparent",
              border: "1px solid " + (activeTab === "users" ? "#FF5757" : "#333"),
              color: "#fff",
              borderRadius: "20px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.3s ease",
              boxShadow: activeTab === "users" ? "0 4px 15px rgba(255, 87, 87, 0.3)" : "none"
            }}
          >
            Kyra Users ({filteredUsers.length})
          </button>
        </div>

        {/* Search and Filters */}
        <div style={filterContainerStyle}>
          {/* Search Input */}
          <div style={searchWrapperStyle}>
            <FaSearch style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
            <input
              type="text"
              placeholder="Search by client name or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={() => setExpandedRows(new Set())}
              onFocus={() => setExpandedRows(new Set())}
              style={searchInputStyle}
            />
          </div>

          {/* Status Dropdown (only for subscriptions) */}
          {activeTab === "subscriptions" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* Items Per Page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
              setCurrentUsersPage(1);
            }}
            style={selectStyle}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Loader / Error Handling / Data Grid */}
        {activeTab === "subscriptions" ? (
          loading && data.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  border: "4px solid #333",
                  borderTop: "4px solid #FF5757",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 15px"
                }}
              />
              <p style={{ color: "#aaa", fontSize: "14px" }}>Loading Kyra AI subscriptions...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "50px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a" }}>
              <p style={{ color: "#ef4444", fontSize: "16px", margin: "0 0 15px 0" }}>Error: {error}</p>
              <button
                onClick={loadKyraData}
                style={{
                  backgroundColor: "#FF5757",
                  border: "none",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Retry Loading
              </button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a", color: "#888" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4, marginBottom: "15px" }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#888" />
              </svg>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#ccc", marginBottom: "5px" }}>No Subscriptions Found</div>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Try clearing filters or search term.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#222", borderBottom: "1px solid #333", textAlign: "left" }}>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Client Name</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Contact</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Days Left</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Created At</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Expires At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item) => {
                      const sub = item.subscription || {};
                      return (
                        <tr
                          key={sub.id || Math.random()}
                          style={{
                            borderBottom: "1px solid #333",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#242424"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <td style={{ padding: "16px", fontWeight: "500" }}>{item.client?.name || "N/A"}</td>
                          <td style={{ padding: "16px", color: "#ccc", fontSize: "13px" }}>
                            <span style={{ backgroundColor: "#2b2b2b", padding: "4px 8px", borderRadius: "4px" }}>
                              {item.client?.contact || "N/A"}
                            </span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span style={statusBadgeStyle(sub.status)}>
                              {sub.status || "N/A"}
                            </span>
                          </td>
                          <td style={{ padding: "16px", fontSize: "13px" }}>{getExpiryDisplay(sub.active_until)}</td>
                          <td style={{ padding: "16px", color: "#888", fontSize: "13px" }}>{formatDate(sub.created_at)}</td>
                          <td style={{ padding: "16px", color: "#ccc", fontSize: "13px" }}>{formatDate(sub.active_until)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination bar */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #333",
                  backgroundColor: "#222",
                  flexWrap: "wrap",
                  gap: "15px"
                }}>
                  <div style={{ color: "#888", fontSize: "14px" }}>
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: currentPage === 1 ? "#2c2c2c" : "#333",
                        border: "1px solid #444",
                        color: currentPage === 1 ? "#555" : "#fff",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                        fontSize: "13px"
                      }}
                    >
                      <FaChevronLeft style={{ verticalAlign: "middle" }} /> Previous
                    </button>
                    
                    <span style={{ color: "#ccc", display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px" }}>
                      Page <strong>{currentPage}</strong> of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        backgroundColor: currentPage === totalPages ? "#2c2c2c" : "#333",
                        border: "1px solid #444",
                        color: currentPage === totalPages ? "#555" : "#fff",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Next <FaChevronRight style={{ verticalAlign: "middle" }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Users Tab view */
          usersLoading && usersData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div
                style={{
                  width: "45px",
                  height: "45px",
                  border: "4px solid #333",
                  borderTop: "4px solid #FF5757",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 15px"
                }}
              />
              <p style={{ color: "#aaa", fontSize: "14px" }}>Loading Kyra AI users...</p>
            </div>
          ) : usersError ? (
            <div style={{ textAlign: "center", padding: "50px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a" }}>
              <p style={{ color: "#ef4444", fontSize: "16px", margin: "0 0 15px 0" }}>Error: {usersError}</p>
              <button
                onClick={loadKyraUsers}
                style={{
                  backgroundColor: "#FF5757",
                  border: "none",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "8px 18px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Retry Loading
              </button>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#1a1a1a", color: "#888" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.4, marginBottom: "15px" }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#888" />
              </svg>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#ccc", marginBottom: "5px" }}>No Kyra Users Found</div>
              <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>Try clearing search term.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#222", borderBottom: "1px solid #333", textAlign: "left" }}>
                      <th style={{ padding: "16px", width: "40px" }}></th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>User Name</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Contact</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Language</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Plan Status</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Medical Condition</th>
                      <th style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#ccc", textTransform: "uppercase" }}>Onboarded Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const client = user.client || {};
                      
                      const aimsList = user.aim || [];
                      const conditionsList = user.medical_condition || [];
                      const allergiesList = user.allergies || [];
                      const meds = user.medication || "";
                      const hasHealthInfo = conditionsList.length > 0 || allergiesList.length > 0 || meds;

                      const rowKey = user.client_id;
                      const isRowExpanded = expandedRows.has(rowKey);

                      const toggleRow = () => {
                        setExpandedRows(prev => {
                          const next = new Set();
                          if (!prev.has(rowKey)) {
                            next.add(rowKey);
                            if (!chatHistories[rowKey]) {
                              loadChatHistory(rowKey);
                            }
                          }
                          return next;
                        });
                      };

                      return (
                        <React.Fragment key={rowKey}>
                        <tr
                          style={{
                            borderBottom: isRowExpanded ? "none" : "1px solid #333",
                            transition: "background-color 0.2s ease",
                            height: "68px",
                            verticalAlign: "middle",
                            cursor: "pointer"
                          }}
                          onClick={toggleRow}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#242424"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isRowExpanded ? "#1e1e1e" : "transparent"}
                        >
                          {/* Expand chevron */}
                          <td style={{ padding: "16px", width: "40px", textAlign: "center" }}>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              backgroundColor: isRowExpanded ? "rgba(255,87,87,0.15)" : "#2a2a2a",
                              border: `1px solid ${isRowExpanded ? "rgba(255,87,87,0.4)" : "#444"}`,
                              color: isRowExpanded ? "#FF5757" : "#777",
                              fontSize: "10px",
                              transition: "all 0.2s ease",
                              transform: isRowExpanded ? "rotate(180deg)" : "rotate(0deg)"
                            }}>▼</span>
                          </td>
                          {/* Client Name */}
                          <td style={{ padding: "16px", fontWeight: "500" }}>{client.name || "N/A"}</td>
                          
                          {/* Contact Details */}
                          <td style={{ padding: "16px", fontSize: "13px", color: "#ccc" }}>
                            {client.contact || "N/A"}
                          </td>

                           {/* Preferred Language */}
                          <td style={{ padding: "16px", fontSize: "13px" }}>
                            {(() => {
                              const lang = user.preferred_language;
                              const isHindi = lang === "hi";
                              const isEnglish = !lang || lang === "en";
                              return (
                                <span style={{
                                  backgroundColor: isHindi
                                    ? "rgba(251, 146, 60, 0.15)"
                                    : "rgba(74, 113, 222, 0.15)",
                                  color: isHindi ? "#fb923c" : "#4a92deff",
                                  padding: "4px 12px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                  border: `1px solid ${isHindi ? "rgba(251, 146, 60, 0.3)" : "rgba(74, 123, 222, 0.3)"}`
                                }}>
                                  {isHindi ? "Hindi" : isEnglish ? "English" : lang}
                                </span>
                              );
                            })()}
                          </td>

                          {/* Plan Status */}
                          <td style={{ padding: "16px", fontSize: "13px" }}>
                            {user.kyra_active === true ? (
                              <span style={{
                                backgroundColor: "rgba(74,222,128,0.12)",
                                color: "#4ade80",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid rgba(74,222,128,0.3)"
                              }}>● Active</span>
                            ) : (
                              <span style={{
                                backgroundColor: "rgba(239,68,68,0.12)",
                                color: "#f87171",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid rgba(239,68,68,0.25)"
                              }}>● Inactive</span>
                            )}
                          </td>

                          {/* Health Profile */}
                          <td style={{ padding: "16px", fontSize: "13px", maxWidth: "300px" }}>
                            {!hasHealthInfo ? (
                              <span style={{ color: "#666" }}>None reported</span>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                {conditionsList.length > 0 && (
                                  <div>
                                    <strong style={{ color: "#FF5757", fontSize: "11px" }}>CONDITIONS:</strong>{" "}
                                    <span style={{ color: "#ccc" }}>{conditionsList.join(", ")}</span>
                                  </div>
                                )}
                                {allergiesList.length > 0 && (
                                  <div>
                                    <strong style={{ color: "#f59e0b", fontSize: "11px" }}>ALLERGIES:</strong>{" "}
                                    <span style={{ color: "#ccc" }}>{allergiesList.join(", ")}</span>
                                  </div>
                                )}
                                {meds && (
                                  <div>
                                    <strong style={{ color: "#38bdf8", fontSize: "11px" }}>MEDICINE:</strong>{" "}
                                    <span style={{ color: "#ccc" }}>{meds}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Onboarded Date */}
                          <td style={{ padding: "16px", color: "#ccc", fontSize: "13px" }}>
                            {formatDate(user.onboarding_at, true)}
                          </td>
                        </tr>

                        {/* Expandable Detail Row */}
                        {isRowExpanded && (
                          <tr style={{ borderBottom: "1px solid #333" }}>
                            <td colSpan={7} style={{ padding: 0, backgroundColor: "#161616" }}>
                              <div style={{ padding: "24px 28px" }} onClick={(e) => e.stopPropagation()}>
                                <div style={{
                                  display: "grid",
                                  gridTemplateColumns: "320px 1fr",
                                  gap: "24px",
                                  alignItems: "start"
                                }}>
                                  {/* Left side: User profile grid (Stacked vertically in 1 column) */}
                                  <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px"
                                  }}>
                                    {/* Goals */}
                                    <div style={{ backgroundColor: "#1e1e1e", borderRadius: "10px", border: "1px solid #2a2a2a", padding: "16px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80", flexShrink: 0 }}></span>
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.5px" }}>Goals</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {(user.aim || []).length === 0
                                          ? <span style={{ color: "#444", fontSize: "12px" }}>None</span>
                                          : (user.aim || []).map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                                              <span style={{ color: "#4ade80", marginTop: "2px", fontSize: "10px", flexShrink: 0 }}>✓</span>
                                              <span style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.4" }}>{item}</span>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    </div>

                                    {/* Interests */}
                                    <div style={{ backgroundColor: "#1e1e1e", borderRadius: "10px", border: "1px solid #2a2a2a", padding: "16px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#38bdf8", flexShrink: 0 }}></span>
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Interests</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {(user.interest || []).length === 0
                                          ? <span style={{ color: "#444", fontSize: "12px" }}>None</span>
                                          : (user.interest || []).map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                                              <span style={{ color: "#38bdf8", marginTop: "2px", fontSize: "10px", flexShrink: 0 }}>★</span>
                                              <span style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.4" }}>{item}</span>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    </div>

                                    {/* Problems */}
                                    <div style={{ backgroundColor: "#1e1e1e", borderRadius: "10px", border: "1px solid #2a2a2a", padding: "16px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f87171", flexShrink: 0 }}></span>
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#f87171", textTransform: "uppercase", letterSpacing: "0.5px" }}>Problems</span>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        {(user.problem || []).length === 0
                                          ? <span style={{ color: "#444", fontSize: "12px" }}>None</span>
                                          : (user.problem || []).map((item, idx) => (
                                            <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                                              <span style={{ color: "#f87171", marginTop: "2px", fontSize: "10px", flexShrink: 0 }}>⚠</span>
                                              <span style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.4" }}>{item}</span>
                                            </div>
                                          ))
                                        }
                                      </div>
                                    </div>

                                    {/* Job */}
                                    <div style={{ backgroundColor: "#1e1e1e", borderRadius: "10px", border: "1px solid #2a2a2a", padding: "16px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#fb923c", flexShrink: 0 }}></span>
                                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#fb923c", textTransform: "uppercase", letterSpacing: "0.5px" }}>Job</span>
                                      </div>
                                      <div>
                                        {!user.job
                                          ? <span style={{ color: "#444", fontSize: "12px" }}>None</span>
                                          : (
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                                              <span style={{ color: "#fb923c", marginTop: "2px", fontSize: "13px", flexShrink: 0 }}>💼</span>
                                              <span style={{ color: "#ccc", fontSize: "13px", lineHeight: "1.4" }}>{user.job}</span>
                                            </div>
                                          )
                                        }
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right side: WhatsApp Chat container (Expanded width) */}
                                  <div>
                                    <KyraUserChat
                                      clientId={user.client_id}
                                      chatData={chatHistories[user.client_id]}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Users Table Pagination bar */}
              {totalUsersPages > 1 && (
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderTop: "1px solid #333",
                  backgroundColor: "#222",
                  flexWrap: "wrap",
                  gap: "15px"
                }}>
                  <div style={{ color: "#888", fontSize: "14px" }}>
                    Showing {Math.min((currentUsersPage - 1) * itemsPerPage + 1, totalUsersItems)} to{" "}
                    {Math.min(currentUsersPage * itemsPerPage, totalUsersItems)} of {totalUsersItems} items
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setCurrentUsersPage((p) => Math.max(1, p - 1))}
                      disabled={currentUsersPage === 1}
                      style={{
                        backgroundColor: currentUsersPage === 1 ? "#2c2c2c" : "#333",
                        border: "1px solid #444",
                        color: currentUsersPage === 1 ? "#555" : "#fff",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: currentUsersPage === 1 ? "not-allowed" : "pointer",
                        fontSize: "13px"
                      }}
                    >
                      <FaChevronLeft style={{ verticalAlign: "middle" }} /> Previous
                    </button>
                    
                    <span style={{ color: "#ccc", display: "flex", alignItems: "center", padding: "0 10px", fontSize: "14px" }}>
                      Page <strong>{currentUsersPage}</strong> of {totalUsersPages}
                    </span>

                    <button
                      onClick={() => setCurrentUsersPage((p) => Math.min(totalUsersPages, p + 1))}
                      disabled={currentUsersPage === totalUsersPages}
                      style={{
                        backgroundColor: currentUsersPage === totalUsersPages ? "#2c2c2c" : "#333",
                        border: "1px solid #444",
                        color: currentUsersPage === totalUsersPages ? "#555" : "#fff",
                        borderRadius: "4px",
                        padding: "8px 12px",
                        cursor: currentUsersPage === totalUsersPages ? "not-allowed" : "pointer",
                        fontSize: "13px"
                      }}
                    >
                      Next <FaChevronRight style={{ verticalAlign: "middle" }} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
