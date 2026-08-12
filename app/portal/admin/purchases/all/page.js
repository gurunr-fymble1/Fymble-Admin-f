"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "@/lib/axios";
import { FaDownload } from "react-icons/fa";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { useRole } from "../../../layout";

export default function AllPurchases() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState(null);
  const [distinctClients, setDistinctClients] = useState(new Set());
  const [distinctGyms, setDistinctGyms] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [distinctClientsFilter, setDistinctClientsFilter] = useState(false);
  const [distinctGymsFilter, setDistinctGymsFilter] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [exporting, setExporting] = useState(false);

  // Security Verification Flow Hook
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  //Weekly Passes filter states
  const [allWeeklyPurchases, setAllWeeklyPurchases] = useState([]);
  const [weeklyType, setWeeklyType] = useState("");
  // Booking count state
  const [bookingCount, setBookingCount] = useState(0);
  const [bookingCountFilter, setBookingCountFilter] = useState("today");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [loadingBookingCount, setLoadingBookingCount] = useState(false);

  // Refs for filter values
  const bookingFilterRef = useRef("today");
  const customStartRef = useRef("");
  const customEndRef = useRef("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input to avoid API spam on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const fetchPurchases = useCallback(async (pageNum, searchQuery, type, start, end, distinctClients, distinctGyms, weeklyTypeFilter, activeFlag = { current: true }) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pageNum,
        limit: 20,
      };

      if (searchQuery) params.search = searchQuery;
      if (type && type !== "all") params.type = type;
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      if (distinctClients) params.distinct_clients = true;
      if (distinctGyms) params.distinct_gyms = true;
      if (type === "Weekly Passes" && weeklyTypeFilter) params.weekly_type = weeklyTypeFilter;

      const response = await axiosInstance.get("/api/admin/purchases/all-purchases", {
        params,
      });

      if (activeFlag.current) {
        if (response.data.success) {
          setPurchases(response.data.data.purchases);
          setPagination(response.data.data.pagination);
          // Store distinct clients and gyms from backend response
          if (response.data.data.distinctClients) {
            setDistinctClients(new Set(response.data.data.distinctClients));
          }
          if (response.data.data.distinctGyms) {
            setDistinctGyms(new Set(response.data.data.distinctGyms));
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch purchases");
        }
      }
    } catch (err) {
      if (activeFlag.current) {
        const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch purchases";
        setError(errorMsg);
        setPurchases([]);
      }
    } finally {
      if (activeFlag.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const activeFlag = { current: true };
    fetchPurchases(page, debouncedSearch, typeFilter, startDate, endDate, distinctClientsFilter, distinctGymsFilter, weeklyType, activeFlag);
    return () => {
      activeFlag.current = false;
    };
  }, [page, debouncedSearch, typeFilter, startDate, endDate, distinctClientsFilter, distinctGymsFilter, weeklyType, fetchPurchases]);

  // Fetch booking count based on filter
  const fetchBookingCount = useCallback(async () => {
    try {
      setLoadingBookingCount(true);
      const params = { date_filter: bookingFilterRef.current };
      if (bookingFilterRef.current === "custom") {
        params.start_time = customStartRef.current;
        params.end_time = customEndRef.current;
      }
      const response = await axiosInstance.get("/api/admin/purchases/booking-count", { params });
      if (response.data.success) {
        setBookingCount(response.data.data.booking_count);
      }
    } catch (error) {
      console.error("Error fetching booking count:", error);
    } finally {
      setLoadingBookingCount(false);
    }
  }, []);

  // Initial fetch for today's booking count
  useEffect(() => {
    fetchBookingCount();
  }, [fetchBookingCount]);

  // Handle booking filter change
  const onBookingFilterChange = (filterValue) => {
    bookingFilterRef.current = filterValue;
    setBookingCountFilter(filterValue);
    if (filterValue === "custom") {
      customStartRef.current = customStartTime;
      customEndRef.current = customEndTime;
    } else {
      customStartRef.current = "";
      customEndRef.current = "";
      fetchBookingCount();
    }
  };

  // Apply custom booking filter
  const applyCustomBookingFilter = () => {
    if (customStartRef.current && customEndRef.current) {
      fetchBookingCount();
    }
  };

  // Clear custom booking filter
  const clearBookingFilter = () => {
    customStartRef.current = "";
    customEndRef.current = "";
    setCustomStartTime("");
    setCustomEndTime("");
    bookingFilterRef.current = "today";
    setBookingCountFilter("today");
    fetchBookingCount();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };


  const triggerExportDownload = async () => {
    try {
      setExporting(true);

      const params = {};
      if (search) params.search = search;
      if (typeFilter && typeFilter !== "all") params.type = typeFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (distinctClientsFilter) params.distinct_clients = true;
      if (distinctGymsFilter) params.distinct_gyms = true;
      if (typeFilter === "Weekly Passes" && weeklyType) params.weekly_type = weeklyType;

      const response = await axiosInstance.get("/api/admin/purchases/export-purchases", {
        params,
        responseType: "blob",
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }));
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header or generate default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "purchases_export.xlsx";
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
      alert("Failed to export purchases. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    handleExportTrigger(async () => {
      await triggerExportDownload();
    });
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);

    const hasTime =
    typeof dateString === "string" &&
    (dateString.includes("T") || dateString.includes(" "));

   // Date + Time
  if (hasTime) {
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  // Date only
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  };

  const isDifferentDay = (dateStr1, dateStr2) => {
    if (!dateStr1 || !dateStr2) return false;
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    return d1.toDateString() !== d2.toDateString();
  };

  const getLatestScannedDate = (purchase) => {
    const days = purchase.scheduled_days_detailed || [];
    if (!days || days.length === 0) return null;

    const checkinTimes = days
      .map((d) => d.checkin_at)
      .filter((t) => t);

    if (checkinTimes.length === 0) return null;

    // Convert to Date objects to perform accurate chronological comparison
    const dateObjects = checkinTimes.map((t) => new Date(t));

    // Find the latest Date object
    const latestDate = new Date(Math.max(...dateObjects));

    return latestDate.toISOString();
  };

  const getPageNumbers = () => {
    const total = pagination.totalPages || 1;
    const current = page;
    const pages = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) {
      end = 4;
    } else if (current >= total - 2) {
      start = total - 3;
    }

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push("...");
    }

    pages.push(total);
    return pages;
  };

  const formatScheduleDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount?.toFixed(2) || "0.00"}`;
  };

  // Check if client has exactly 1 booking (using backend data)
  const getClientDistinctStatus = (clientName) => {
    return distinctClients.has(clientName);
  };

  // Check if gym has exactly 1 booking (using backend data)
  const getGymDistinctStatus = (gymName) => {
    return distinctGyms.has(gymName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
      case "booked":
        return "#FFA500";
      case "attended":
        return "#4ade80";
      case "missed":
      case "no_show":
        return "#ef4444";
      case "rescheduled":
        return "#3b82f6";
      case "canceled":
        return "#888";
      default:
        return "#ccc";
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case "scheduled":
      case "booked":
      case "available":
        return "Not Scanned";
      case "attended":
        return "Scanned";
      case "missed":
      case "no_show":
        return "Missed";
      case "rescheduled":
        return "Rescheduled";
      case "canceled":
        return "Canceled";
      default:
        return status || "N/A";
    }
  };

  const getDisplayValue = (purchase) => {
    if (purchase.type === "Daily Pass") {
      return purchase.days_total || "N/A";
    } else {
      return purchase.session_display || "N/A";
    }
  };

  return (
    <div>
      {/* Filters Card */}
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
            cursor: pointer;
          }
        `}</style>

        {/* First Row: Search, Type, Export */}
        <div className="d-flex gap-3 align-items-center" style={{ marginBottom: "15px" }}>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-grow-1" style={{ maxWidth: "320px" }}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, contact, or gym..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  backgroundColor: "#222",
                  border: "1px solid #333",
                  color: "#fff",
                }}
              />
              <button
                className="btn"
                type="submit"
                style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Type Filter */}
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setWeeklyType("");
              setPage(1);
            }}
            style={{
              backgroundColor: "#222",
              border: "1px solid #333",
              color: "#fff",
              minWidth: "135px",
              width: "135px",
            }}
          >
            <option value="all">All Types</option>
            <option value="Session">Fitness Classes</option>
            <option value="Daily Pass">Daily Pass</option>
            <option value="Weekly Passes">Weekly Passes</option>
          </select>

          
          {typeFilter === 'Weekly Passes' && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="d-flex gap-4">
            {/* Weekly dailypass pack */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="weeklyDailyPassPack"
                checked={weeklyType === "Daily Pass"}
                onChange={(e) => {
                  setWeeklyType(prev => prev === "Daily Pass" ? "" : "Daily Pass");
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#28a745",
                }}
              />
              <label
                htmlFor="weeklyDailyPassPack"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                Daily Pass
              </label>
            </div>

            {/* Weekly sessions pack */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="weeklySessionsPack"
                checked={weeklyType === "Session"}
                onChange={(e) => {
                  setWeeklyType(prev => prev === "Session" ? "" : "Session");
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#ffc107",
                }}
              />
              <label
                htmlFor="weeklySessionsPack"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                Sessions
              </label>
            </div>
          </div>
          </div>}

          {/* Spacer */}
          <div style={{ flex: 1 }}></div>

          {/* Booking Count */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #0f766e 0%, #10b981 60%, #34d399 100%)",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                boxShadow: "0 3px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <select
                value={bookingCountFilter}
                onChange={(e) => onBookingFilterChange(e.target.value)}
                style={{
                  background: "rgba(0, 0, 0, 0.66)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  fontSize: "12px",
                  color: "#fff",
                  cursor: "pointer",
                  outline: "none",
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
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>Bookings</span>
                <span style={{ fontSize: "22px", fontWeight: "700", color: "#fff" }}>
                  {loadingBookingCount ? "..." : bookingCount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            {bookingCountFilter === "custom" && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="date"
                  value={customStartTime}
                  onChange={(e) => {
                    setCustomStartTime(e.target.value);
                    customStartRef.current = e.target.value;
                  }}
                  style={{
                    background: "#222",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "#ccc",
                    width: "130px",
                  }}
                />
                <span style={{ color: "#666", fontSize: "11px" }}>to</span>
                <input
                  type="date"
                  value={customEndTime}
                  onChange={(e) => {
                    setCustomEndTime(e.target.value);
                    customEndRef.current = e.target.value;
                  }}
                  style={{
                    background: "#222",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "#ccc",
                    width: "130px",
                  }}
                />
                <button
                  onClick={applyCustomBookingFilter}
                  style={{
                    background: "#10b981",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 14px",
                    fontSize: "11px",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Go
                </button>
              </div>
            )}
          </div>

          {/* Export Button */}
          {(role === "admin" || role === "support") && (
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
              }}
            >
              <FaDownload />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
          )}
        </div>

        {/* Second Row: Date Filters, Distinct Filters */}
        <div className="d-flex gap-3 align-items-center flex-wrap">
          {/* Date Filters */}
          <div className="d-flex gap-2 align-items-center">
            <span style={{ color: "#888", fontSize: "14px" }}>From:</span>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
            <span style={{ color: "#888", fontSize: "14px", marginLeft: "8px" }}>To:</span>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                color: "#fff",
                width: "140px",
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: "1px", height: "30px", backgroundColor: "#333", margin: "0 10px" }}></div>

          {/* Distinct Filters */}
          <div className="d-flex gap-4">
            {/* Distinct Clients */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctClients"
                checked={distinctClientsFilter}
                onChange={(e) => {
                  setDistinctClientsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#28a745",
                }}
              />
              <label
                htmlFor="distinctClients"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Clients
              </label>
            </div>

            {/* Distinct Gyms */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="distinctGyms"
                checked={distinctGymsFilter}
                onChange={(e) => {
                  setDistinctGymsFilter(e.target.checked);
                  setPage(1);
                }}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#ffc107",
                }}
              />
              <label
                htmlFor="distinctGyms"
                style={{
                  color: "#ccc",
                  fontSize: "14px",
                  cursor: "pointer",
                  userSelect: "none",
                  margin: 0,
                }}
              >
                New Gyms
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      {loading ? (
        <div className="text-center py-5">
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
          <p style={{ fontSize: "14px", color: "#ccc" }}>Loading purchases...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#ef4444" }}>Error: {error}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => fetchPurchases(page, search)}
            style={{ backgroundColor: "#FF5757", border: "none", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-5">
          <p style={{ fontSize: "16px", color: "#888" }}>No purchases found</p>
        </div>
      ) : (
        <div className="table-responsive" style={{ overflowX: "auto" }}>
          <table className="table purchases-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th>Client Name</th>
                <th>Contact</th>
                <th>Gym Name</th>
                <th>City</th>
                <th>area</th>
                <th>Type</th>
                <th>Days / Classes</th>
                <th>Amount</th>
                <th>Purchased At</th>
                <th>Scanned Date</th>
                <th style={{ width: "140px" }}>Status</th>
                <th style={{ width: "180px" }}>Pricing Slab</th>
                <th>Platform</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => {
                const isSession = purchase.type === "Session";
                const hasSchedule = isSession
                  ? (purchase.session_schedule?.length > 0 || purchase.scheduled_days_detailed?.length > 0 || purchase.scheduled_date?.length > 0)
                  : purchase.scheduled_date?.length > 0;
                const hasContacts = !!(purchase.gym_contact || purchase.owner_contact || purchase.client_contact || purchase.gym_area || purchase.owner_name);
                const isExpandable = hasSchedule || hasContacts;
                const isExpanded = expandedRows.has(purchase.id);
                const isWeeklyPass = purchase.pack_size && (
                  (purchase.type === "Session" && Number(purchase.session_id) === 2)
                    ? (purchase.pack_size === 5 || purchase.pack_size === 10)
                    : (purchase.pack_size === 7 || purchase.pack_size === 14)
                );

                const nextPurchase = purchases[index + 1];
                const isDayChanged = nextPurchase && isDifferentDay(purchase.purchased_at, nextPurchase.purchased_at);

                const typeLabel = purchase.type === "Session" 
                  ? (Number(purchase.session_id) === 2
                    ? (purchase.pack_size === 5 ? "5 Day PT" : purchase.pack_size === 10 ? "10 Day PT" : (purchase.session_name ? `FC (${purchase.session_name})` : "FC"))
                    : (purchase.pack_size === 7 ? `7 Session (${purchase.session_name})` : purchase.pack_size === 14 ? `14 Session (${purchase.session_name})` : (purchase.session_name ? `FC (${purchase.session_name})` : "FC")))
                  : (purchase.type === "Daily Pass" 
                    ? (purchase.pack_size === 7 ? "7 Day Pack" : purchase.pack_size === 14 ? "14 Day Pack" : (purchase.head_count > 1 
                       ? `Group Pass (${purchase.head_count})` 
                       : (parseInt(purchase.days_total) > 1 
                         ? "Multi DayPass" 
                         : "Daily Pass")))
                    : purchase.type);

                return (
                  <React.Fragment key={purchase.id}>
                    <tr>
                      <td style={{ padding: "8px !important" }}>
                        {isExpandable && (
                          <button
                            onClick={() => toggleRow(purchase.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#FF5757",
                              cursor: "pointer",
                              padding: "4px 8px",
                              fontSize: "16px",
                              transition: "transform 0.2s",
                              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >
                            ▶
                          </button>
                        )}
                      </td>
                      <td className="client-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getClientDistinctStatus(purchase.client_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {purchase.client_name || "N/A"}
                        </span>
                      </td>
                      <td className="client-contact">{purchase.client_contact || "N/A"}</td>
                      <td className="gym-name">
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {getGymDistinctStatus(purchase.gym_name) && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#28a745",
                                display: "inline-block",
                                flexShrink: 0,
                              }}
                              title="Distinct: Single booking type"
                            />
                          )}
                          {purchase.gym_name || "N/A"}
                        </span>
                      </td>
                      <td className="city">{purchase.gym_city || "N/A"}</td>
                      <td className="area">{purchase.gym_area || "N/A"}</td>
                      <td className="type">
                        {isWeeklyPass ? (
                          purchase.type === 'Daily Pass' ? (
                          <span className={`inactive-pack-btn pack-btn-Daily`}>
                            {typeLabel}
                          </span>) : (
                            <span className={`inactive-pack-btn pack-btn-Session`}>
                              {typeLabel}
                            </span>
                          )
                        ) : (
                          <span>{typeLabel}</span>
                        )}
                      </td>
                      <td className="days-total">{purchase.pack_size > 1 ? (`${purchase.days_used || 0} / ${purchase.pack_size} `): (getDisplayValue(purchase))}</td>
                      <td className="amount">{formatAmount(purchase.amount)}</td>
                      <td className="purchased-at">{formatDate(purchase.purchased_at)}</td>
                      <td className="scanned-date">
                        {getLatestScannedDate(purchase) ? (
                          formatDate(getLatestScannedDate(purchase))
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="status">
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          {purchase.status ? (
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                color: getStatusColor(purchase.status),
                                display: "inline-block",
                                minWidth: "120px",
                                padding: "4px 12px",
                                textAlign: "center",
                              }}
                            >
                              {getStatusDisplayText(purchase.status)}
                            </span>
                          ) : (
                            <span style={{ color: "#666", fontSize: "12px" }}>N/A</span>
                          )}
                          {purchase.scheduled_days_detailed && purchase.scheduled_days_detailed.length > 0 && (
                            <span style={{ fontSize: "11px", color: "#888", fontWeight: "600", marginTop: "2px" }}>
                              {purchase.scheduled_days_detailed.filter(d => d.checkin_at).length} / {purchase.scheduled_days_detailed.length}
                            </span>
                          )}
                        </div>
                      </td> 
                      <td className="pricing-slab">
                        {typeof purchase.pricing_slab === "object" && purchase.pricing_slab !== null && ((purchase.owner_amount || purchase.discount_price)/(purchase.head_count * purchase.days_total) <= purchase.pricing_slab.owner_gets) ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", textAlign: "left" }}>
                            {purchase.pricing_slab.actual_price !== undefined && purchase.pricing_slab.actual_price !== null && (
                              <div>
                                <span style={{ color: "#888" }}>Actual: </span>
                                <span style={{ color: "#fff" }}>₹{purchase.pricing_slab.actual_price}</span>
                              </div>
                            )}
                            {purchase.pricing_slab.owner_gets !== undefined && purchase.pricing_slab.owner_gets !== null && (
                              <div>
                                <span style={{ color: "#888" }}>Owner: </span>
                                <span style={{ color: "#fff" }}>₹{purchase.pricing_slab.owner_gets}</span>
                              </div>
                            )}
                            {purchase.pricing_slab.owner_monthly_equity !== undefined && purchase.pricing_slab.owner_monthly_equity !== null && (
                              <div>
                                <span style={{ color: "#888" }}>Equity: </span>
                                <span style={{ color: "#fff" }}>
                                  ₹{purchase.pricing_slab.owner_monthly_equity}
                                  {purchase.pricing_slab.percent !== undefined && purchase.pricing_slab.percent !== null && (
                                    <span
                                      style={{
                                        marginLeft: "2px",
                                        color: purchase.pricing_slab.percent > 0 
                                          ? "#4ade80" 
                                          : purchase.pricing_slab.percent < 0 
                                            ? "#ef4444" 
                                            : "#888",
                                      }}
                                    >
                                      
                                      <span style={{ fontWeight: "600", fontSize: "10px" }}>
                                        {purchase.pricing_slab.percent > 0 ? "↑" : purchase.pricing_slab.percent < 0 ? "↓" : ""}
                                      </span>
                                      <span style={{ fontSize: "10px", fontWeight: "600", marginLeft: "1px" }}>
                                        {Math.abs(purchase.pricing_slab.percent)}%
                                      </span>
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          typeof purchase.pricing_slab === "object" ? "-" : (purchase.pricing_slab || "-")
                        )}
                      </td>
                      <td className="platform">
                        <span
                          style={{
                            color: purchase.platform === "android" ? "#a8d5a2" : purchase.platform === "ios" ? "#a2c4d5" : "#888",
                            backgroundColor: purchase.platform === "android" ? "rgba(100, 200, 80, 0.1)" : purchase.platform === "ios" ? "rgba(80, 150, 200, 0.1)" : "rgba(128,128,128,0.1)",
                            border: `1px solid ${purchase.platform === "android" ? "#4caf50" : purchase.platform === "ios" ? "#5097c8" : "#555"}`,
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: 500,
                            textTransform: "capitalize",
                            display: "inline-block"
                          }}
                        >
                          {purchase.platform || "N/A"}
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="schedule-row">
                        <td colSpan="13" style={{ padding: "0 !important" }}>
                          <div
                            style={{
                              backgroundColor: "#151515",
                              padding: "16px",

                              borderBottom: "1px solid #333",
                            }}
                          >
                            {hasSchedule && (
                              <>
                                <p
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#FF5757",
                                    marginBottom: "12px",
                                  }}
                                >
                                  {isSession ? "Class Schedule" : "Scheduled Dates"}
                                </p>
                                {isSession && purchase.session_name && (
                                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
                                    Fitness Classes: <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.session_name}</span>
                                  </div>
                                )}
                                {!isSession && purchase.head_count && (
                                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>
                                    Headcount: <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.head_count}</span>
                                  </div>
                                )}
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                  {purchase.scheduled_days_detailed && purchase.scheduled_days_detailed.length > 0
                                    ? purchase.scheduled_days_detailed.map((day, idx) => (
                                      <div
                                        key={`${purchase.id}-day-detail-${idx}`}
                                        style={{
                                          backgroundColor: "#222",
                                          border: "1px solid #333",
                                          borderRadius: "8px",
                                          padding: "12px 16px",
                                          fontSize: "13px",
                                          minWidth: "220px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "6px",
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                        }}
                                      >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                                          <span style={{ color: "#fff", fontWeight: "600" }}>
                                            Day {idx + 1}: {formatScheduleDate(day.date)}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: "11px",
                                              fontWeight: "600",
                                              padding: "2px 8px",
                                              borderRadius: "4px",
                                              backgroundColor: "rgba(255,255,255,0.06)",
                                              color: getStatusColor(day.status)
                                            }}
                                          >
                                            {getStatusDisplayText(day.status)}
                                          </span>
                                        </div>
                                        {day.status === "attended" && day.checkin_at && (
                                          <div style={{ fontSize: "11px", color: "#888", borderTop: "1px solid #333", paddingTop: "6px", marginTop: "4px" }}>
                                            <span style={{ color: "#4ade80", fontWeight: "600" }}>Scanned At: </span>
                                            <span style={{ color: "#ccc" }}>{formatDate(day.checkin_at)}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                    : (isSession
                                      ? purchase.session_schedule.map((schedule, idx) => (
                                        <div
                                          key={`${purchase.id}-schedule-${idx}`}
                                          style={{
                                            backgroundColor: "#1a1a1a",
                                            border: "1px solid #333",
                                            borderRadius: "6px",
                                            padding: "10px 14px",
                                            fontSize: "13px",
                                          }}
                                        >
                                          <div style={{ color: "#fff", fontWeight: "500" }}>
                                            {formatScheduleDate(schedule.date)}
                                          </div>
                                          <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>
                                            {schedule.start_time}
                                          </div>
                                        </div>
                                      ))
                                      : purchase.scheduled_date.map((date, idx) => (
                                        <div
                                          key={`${purchase.id}-date-${idx}`}
                                          style={{
                                            backgroundColor: "#1a1a1a",
                                            border: "1px solid #333",
                                            borderRadius: "6px",
                                            padding: "10px 14px",
                                            fontSize: "13px",
                                            color: "#fff",
                                            fontWeight: "500",
                                          }}
                                        >
                                          {formatScheduleDate(date)}
                                        </div>
                                      ))
                                    )
                                  }
                                </div>
                              </>
                            )}
                            {(purchase.gym_contact || purchase.owner_contact || purchase.client_contact || purchase.gym_area || purchase.owner_name) && (
                              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                                {purchase.pack_size > 1 && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Valid Until: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{formatDate(purchase.valid_until)}</span>
                                  </div>
                                )}
                                {purchase.owner_name && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Owner Name: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.owner_name}</span>
                                  </div>
                                )}
                                {purchase.gym_contact && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Gym Contact: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.gym_contact}</span>
                                  </div>
                                )}
                                {purchase.owner_contact && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Owner Contact: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.owner_contact}</span>
                                  </div>
                                )}
                                {purchase.gym_area && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Gym Area: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.gym_area}</span>
                                  </div>
                                )}
                                {purchase.gym_city && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>City: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>{purchase.gym_city}</span>
                                  </div>
                                )}
                                {purchase.discount_price !== undefined && purchase.discount_price !== null && (
                                  <div style={{ fontSize: "13px" }}>
                                    <span style={{ color: "#888" }}>Gym Price: </span>
                                    <span style={{ color: "#fff", fontWeight: "500" }}>₹{purchase.owner_amount ? purchase.owner_amount : purchase.discount_price}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    {isDayChanged && (
                      <tr>
                        <td colSpan="14" style={{ padding: "0" }}>
                          <div
                            style={{
                              borderTop: "2px dashed #FF5757",
                              margin: "1px 1px",
                              opacity: 0.5,
                            }}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && purchases.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div style={{ color: "#888", fontSize: "14px" }}>
            Showing {((page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} purchases
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm"
              disabled={!pagination.hasPrev || loading}
              onClick={() => setPage(page - 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasPrev && !loading ? "#fff" : "#555",
                cursor: pagination.hasPrev && !loading ? "pointer" : "not-allowed",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
            >
              Previous
            </button>
            
            {getPageNumbers().map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} style={{ color: "#555", padding: "0 8px", fontSize: "14px", fontWeight: "600" }}>
                    ...
                  </span>
                );
              }
              const isActive = p === page;
              return (
                <button
                  key={`page-btn-${p}`}
                  className={`btn btn-sm ${isActive ? 'active' : ''}`}
                  disabled={loading}
                  onClick={() => setPage(p)}
                  style={{
                    backgroundColor: isActive ? "#FF5757" : "#1a1a1a",
                    border: isActive ? "1px solid #FF5757" : "1px solid #333",
                    color: "#fff",
                    cursor: "pointer",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    minWidth: "36px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              className="btn btn-sm"
              disabled={!pagination.hasNext || loading}
              onClick={() => setPage(page + 1)}
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                color: pagination.hasNext && !loading ? "#fff" : "#555",
                cursor: pagination.hasNext && !loading ? "pointer" : "not-allowed",
                padding: "6px 12px",
                borderRadius: "6px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Security Verification Modal */}
      <SecureExportModal {...secureExportProps} />

      <style jsx global>{`
        .table-responsive {
          overflow-x: auto !important;
          position: relative !important;
        }

        table.purchases-table {
          width: 100% !important;
          min-width: 1200px !important;
          border-collapse: separate !important;
          border-spacing: 0 !important;
          background-color: #1a1a1a !important;
          color: #fff !important;
          border-radius: 8px !important;
          overflow: visible !important;
        }

        /* Sticky columns */
        table.purchases-table > thead > tr > th:nth-child(1),
        table.purchases-table > tbody > tr > td:nth-child(1) {
          position: sticky !important;
          left: 0 !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(2),
        table.purchases-table > tbody > tr > td:nth-child(2) {
          position: sticky !important;
          left: 40px !important;
          width: 140px !important;
          min-width: 140px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(3),
        table.purchases-table > tbody > tr > td:nth-child(3) {
          position: sticky !important;
          left: 180px !important;
          width: 140px !important;
          min-width: 140px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 1px solid #333 !important;
        }

        table.purchases-table > thead > tr > th:nth-child(4),
        table.purchases-table > tbody > tr > td:nth-child(4) {
          position: sticky !important;
          left: 320px !important;
          width: 160px !important;
          min-width: 160px !important;
          z-index: 11 !important;
          background-color: #222 !important;
          border-right: 2px solid #333 !important;
          box-shadow: 4px 0 8px rgba(0,0,0,0.3) !important;
        }

        /* Header cells need higher z-index */
        table.purchases-table > thead > tr > th:nth-child(1),
        table.purchases-table > thead > tr > th:nth-child(2),
        table.purchases-table > thead > tr > th:nth-child(3),
        table.purchases-table > thead > tr > th:nth-child(4) {
          z-index: 12 !important;
        }

        /* Body sticky cells need body background */
        table.purchases-table > tbody > tr > td:nth-child(1),
        table.purchases-table > tbody > tr > td:nth-child(2),
        table.purchases-table > tbody > tr > td:nth-child(3),
        table.purchases-table > tbody > tr > td:nth-child(4) {
          background-color: #1a1a1a !important;
        }

        table.purchases-table > tbody > tr:hover > td:nth-child(1),
        table.purchases-table > tbody > tr:hover > td:nth-child(2),
        table.purchases-table > tbody > tr:hover > td:nth-child(3),
        table.purchases-table > tbody > tr:hover > td:nth-child(4) {
          background-color: #222 !important;
        }

        table.purchases-table > thead {
          background-color: #222 !important;
          border-bottom: 2px solid #FF5757 !important;
        }

        table.purchases-table > thead > tr > th {
          padding: 12px !important;
          font-weight: 600 !important;
          text-align: left !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr {
          border-bottom: 1px solid #333 !important;
          transition: background-color 0.2s ease !important;
          background-color: transparent !important;
        }

        table.purchases-table > tbody > tr:hover {
          background-color: #222 !important;
        }

        table.purchases-table > tbody > tr:last-child {
          border-bottom: none !important;
        }

        table.purchases-table > tbody > tr > td {
          padding: 12px !important;
          color: #fff !important;
          border: none !important;
          background-color: transparent !important;
        }
        table.purchases-table .client-name {
          font-weight: 500 !important;
        }

        table.purchases-table .gym-name {
          color: #ccc !important;
        }

        table.purchases-table .type {
          font-weight: 500 !important;
          min-width: 140px !important;
        }

        table.purchases-table .inactive-pack-btn {
          display: inline-block !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          border-radius: 20px !important;
          text-align: center !important;
          white-space: nowrap !important;
          cursor: default !important;
          user-select: none !important;
        }

        table.purchases-table .pack-btn-Daily {
          background-color: rgba(37, 99, 235, 0.15) !important;
          color: #3b82f6 !important;
          border: 1px solid rgba(59, 130, 246, 0.4) !important;
        }

        table.purchases-table .pack-btn-Session {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #ef4444 !important;
          border: 1px solid rgba(239, 68, 68, 0.4) !important;
        }

        table.purchases-table .amount {
          font-weight: 600 !important;
          color: #4ade80 !important;
        }

        table.purchases-table .pricing-slab {
          font-size: 13px !important;
          color: #ccc !important;
          text-transform: capitalize;
          min-width: 160px !important;
          width: 180px !important;
        }

        table.purchases-table .purchased-at,
        table.purchases-table .scanned-date {
          font-size: 12px !important;
          color: #888 !important;
        }

        table.purchases-table .status {
          text-align: center !important;
        }

        table.purchases-table .schedule-row {
          background-color: #151515 !important;
        }

        table.purchases-table .schedule-row:hover {
          background-color: #151515 !important;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
