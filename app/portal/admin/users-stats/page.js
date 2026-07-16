"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function UsersStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalClientsConstant, setTotalClientsConstant] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [payingUsers, setPayingUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [repeatUsers, setRepeatUsers] = useState(0);
  const [usersByCity, setUsersByCity] = useState([]);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [importedClientsCount, setImportedClientsCount] = useState(0);
  const [offlineMembersCount, setOfflineMembersCount] = useState(0);

  // Single common filter state for all three cards
  const [filter, setFilter] = useState("overall");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Custom filter types: "date", "month", "year"
  const [customType, setCustomType] = useState("date");
  const [customStartMonth, setCustomStartMonth] = useState(new Date().getMonth() + 1);
  const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth() + 1);
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [customStartYearRange, setCustomStartYearRange] = useState(new Date().getFullYear());
  const [customEndYearRange, setCustomEndYearRange] = useState(new Date().getFullYear());

  // Pagination states
  const [offset, setOffset] = useState(30);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCities, setTotalCities] = useState(0);
  const scrollContainerRef = useRef(null);

  // Static average metrics — NOT affected by the page filter
  const [monthlyAvgUsers, setMonthlyAvgUsers] = useState(0);
  const [weeklyAvgUsers, setWeeklyAvgUsers] = useState(0);
  const [dailyAvgUsers, setDailyAvgUsers] = useState(0);

  // Fetch users stats data
  const fetchUsersData = async (params = {}) => {
    try {
      if (loading) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }
      const response = await axiosInstance.get("/api/admin/users-stats/data", { params });

      if (response.data.success) {
        setTotalUsers(response.data.data.total_users);
        setTotalClientsConstant(response.data.data.total_clients_constant || response.data.data.total_users);
        setActiveUsers(response.data.data.active_users);
        setPayingUsers(response.data.data.paying_users);
        setTotalBookings(response.data.data.total_bookings || 0);
        setRepeatUsers(response.data.data.repeat_users);
        const cityData = response.data.data.users_by_city || [];
        setUsersByCity(cityData);
        setTotalCities(response.data.data.total_cities || 0);
        setMonthlyAvgUsers(response.data.data.monthly_average_users || 0);
        setWeeklyAvgUsers(response.data.data.weekly_average_users || 0);
        setDailyAvgUsers(response.data.data.daily_average_users || 0);
        setImportedClientsCount(response.data.data.imported_clients || 0);
        setOfflineMembersCount(response.data.data.offline_members || 0);

        // Set initial offset for pagination
        setOffset(cityData.length);
        setHasMore(cityData.length >= 30);
      }
    } catch (err) {
      console.error("Error fetching users data:", err);
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  // Fetch more cities (pagination)
  const fetchMoreCities = async () => {
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const response = await axiosInstance.get("/api/admin/users-stats/cities", {
        params: { offset: offset, limit: 30 }
      });

      if (response.data.success) {
        const newCities = response.data.data || [];
        setUsersByCity((prev) => [...prev, ...newCities]);
        setOffset(response.data.next_offset);
        setHasMore(response.data.has_more);
      }
    } catch (err) {
      console.error("Error fetching more cities:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite scroll
  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    // Load more when scrolled to 90% of the content
    if (scrollPercentage >= 0.9) {
      fetchMoreCities();
    }
  };

  // Handle shared filter changes
  useEffect(() => {
    const fetchFilteredData = async () => {
      const params = {};

      if (filter === "overall") {
        setStartDate("");
        setEndDate("");
      } else if (filter === "custom") {
        if (!startDate || !endDate) return;
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        const today = new Date();
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };
        let start, end;

        if (filter === "today") {
          start = end = formatDate(today);
        } else if (filter === "yesterday") {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          start = end = formatDate(yesterday);
        } else if (filter === "last_7") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          start = formatDate(sevenDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_30") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          start = formatDate(thirtyDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_60") {
          const sixtyDaysAgo = new Date(today);
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          start = formatDate(sixtyDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_90") {
          const ninetyDaysAgo = new Date(today);
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          start = formatDate(ninetyDaysAgo);
          end = formatDate(today);
        } else if (filter === "last_month") {
          const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
          const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
          start = formatDate(firstDayOfLastMonth);
          end = formatDate(lastDayOfLastMonth);
        } else if (filter === "current_month") {
          const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          start = formatDate(firstDayOfCurrentMonth);
          end = formatDate(today);
        }

        setStartDate(start);
        setEndDate(end);
        params.start_date = start;
        params.end_date = end;
      }

      await fetchUsersData(params);
    };

    fetchFilteredData();
  }, [filter, startDate, endDate]);

  // Sync custom input changes to startDate and endDate states
  useEffect(() => {
    if (filter === "custom") {
      if (customType === "date") {
        // Managed directly by html date inputs
      } else if (customType === "month") {
        const start = `${customStartYear}-${String(customStartMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(customEndYear, customEndMonth, 0).getDate();
        const end = `${customEndYear}-${String(customEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        setStartDate(start);
        setEndDate(end);
      } else if (customType === "year") {
        const start = `${customStartYearRange}-01-01`;
        const end = `${customEndYearRange}-12-31`;
        setStartDate(start);
        setEndDate(end);
      }
    }
  }, [
    filter,
    customType,
    customStartMonth,
    customStartYear,
    customEndMonth,
    customEndYear,
    customStartYearRange,
    customEndYearRange
  ]);

  const handleFilterChange = (value) => {
    setFilter(value);
    if (value === "custom") {
      setCustomType("date");
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="section-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <h3 className="section-heading" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Fymble</span> users analytics
          </h3>
          {/* Common Filter Row - right aligned */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333" }}>
            <span style={{ color: "#888", fontSize: "12px", fontWeight: "500" }}>Filter:</span>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "#ccc",
                fontSize: "11px",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7">Last 7 Days</option>
              <option value="last_30">Last 30 Days</option>
              <option value="last_60">Last 60 Days</option>
              <option value="last_90">Last 90 Days</option>
              <option value="last_month">Last Month</option>
              <option value="current_month">MTD</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Panel */}
        {filter === "custom" && (
          <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333" }}>
            {/* Toggle buttons for customType */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <button
                type="button"
                onClick={() => {
                  setCustomType("date");
                  setStartDate("");
                  setEndDate("");
                }}
                style={{
                  background: customType === "date" ? "#FF5757" : "#2a2a2a",
                  border: customType === "date" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
              >
                By Specific Dates
              </button>
              <button
                type="button"
                onClick={() => setCustomType("month")}
                style={{
                  background: customType === "month" ? "#FF5757" : "#2a2a2a",
                  border: customType === "month" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
              >
                By Month Interval
              </button>
              <button
                type="button"
                onClick={() => setCustomType("year")}
                style={{
                  background: customType === "year" ? "#FF5757" : "#2a2a2a",
                  border: customType === "year" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                  color: "#ffffff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
              >
                By Year Interval
              </button>
            </div>

            {/* Custom: Date range input fields */}
            {customType === "date" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Custom: Month Range Selector */}
            {customType === "month" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    Start Month:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <select
                      value={customStartMonth}
                      onChange={(e) => setCustomStartMonth(parseInt(e.target.value))}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select
                      value={customStartYear}
                      onChange={(e) => setCustomStartYear(parseInt(e.target.value))}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ color: "#666", fontSize: "18px", marginTop: "15px" }}>
                  →
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    End Month:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <select
                      value={customEndMonth}
                      onChange={(e) => setCustomEndMonth(parseInt(e.target.value))}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                    <select
                      value={customEndYear}
                      onChange={(e) => setCustomEndYear(parseInt(e.target.value))}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Custom: Year Range Selector */}
            {customType === "year" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    Start Year:
                  </label>
                  <select
                    value={customStartYearRange}
                    onChange={(e) => setCustomStartYearRange(parseInt(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div style={{ color: "#666", fontSize: "18px", marginTop: "15px" }}>
                  →
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", color: "#aaa" }}>
                    End Year:
                  </label>
                  <select
                    value={customEndYearRange}
                    onChange={(e) => setCustomEndYearRange(parseInt(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "12px",
                    }}
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #333",
            borderTop: "3px solid #FF5757",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginRight: "15px"
          }} />
          <div style={{ color: "#888" }}>Loading analytics...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="row g-3" style={{ opacity: filterLoading ? 0.5 : 1, transition: "opacity 0.25s ease" }}>
            {/* Total Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#ff5757" }}>
                    {totalUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Registered {filter !== "overall" && <span style={{ color: "#ff5757", fontSize: "10px" }}>({filter})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Paying Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Paying Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fcad10ff" }}>
                    {payingUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Paying {filter !== "overall" && <span style={{ color: "#fcad10ff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((payingUsers / totalUsers) * 100).toFixed(1)}% of total users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total Bookings Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Bookings</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>
                    {totalBookings.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Bookings {filter !== "overall" && <span style={{ color: "#ff5757", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {totalUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((totalBookings / totalUsers) * 100).toFixed(1)}% of total users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Retention Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Retention Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#a950dcff" }}>
                    {repeatUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Customers with 1+ payments {filter !== "overall" && <span style={{ color: "#a950dcff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {payingUsers > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((repeatUsers / payingUsers) * 100).toFixed(1)}% of total paying users
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Users Card */}
            <div className="col-xl col-lg-4 col-md-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Active Users</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#15cc25ff" }}>
                    {activeUsers.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Active {filter !== "overall" && <span style={{ color: "#15cc25ff", fontSize: "10px" }}>({filter})</span>}
                  </div>
                  {totalClientsConstant > 0 && (
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                      {((activeUsers / totalClientsConstant) * 100).toFixed(1)}% of total users
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Average Users Metrics Row — static, not affected by filter */}
          <div className="row g-3" style={{ marginTop: "1rem" }}>
            {/* Monthly Average Users */}
            <div className="col-xl-4 col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Monthly Active Users</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ width: "28px", height: "28px", border: "3px solid #333", borderTop: "3px solid #FF5757", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#FF5757" }}>
                        {monthlyAvgUsers.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        Last 3 months average
                      </div>
                      {totalClientsConstant > 0 && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                          {((monthlyAvgUsers / totalClientsConstant) * 100).toFixed(1)}% of total users
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Average Users */}
            <div className="col-xl-4 col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Weekly Active Users</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ width: "28px", height: "28px", border: "3px solid #333", borderTop: "3px solid #fcad10ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fcad10ff" }}>
                        {weeklyAvgUsers.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        Last 3 weeks average
                      </div>
                      {totalClientsConstant > 0 && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                          {((weeklyAvgUsers / totalClientsConstant) * 100).toFixed(1)}% of total users
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Average Users */}
            <div className="col-xl-4 col-lg-4 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Daily Active Users</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ width: "28px", height: "28px", border: "3px solid #333", borderTop: "3px solid #15cc25ff", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#15cc25ff" }}>
                        {dailyAvgUsers.toLocaleString()}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        Last 3 days average
                      </div>
                      {totalClientsConstant > 0 && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                          {((dailyAvgUsers / totalClientsConstant) * 100).toFixed(1)}% of total users
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Heading and 2 Cards for Gym Offline Members */}
          <div style={{ marginTop: "2rem", marginBottom: "1rem" }}>
            <h4 className="section-heading" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>G</span>ym offline members
            </h4>
          </div>
          <div className="row g-3">
            {/* Imported Clients Count Card */}
            <div className="col-xl-6 col-lg-6 col-md-6">
              <div className="dashboard-card" style={{ height: "100%" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Imported Clients Count</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#38bdf8" }}>
                    {importedClientsCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Imported Database Count
                  </div>
                </div>
              </div>
            </div>

            {/* Gym Offline Members Card */}
            <div className="col-xl-6 col-lg-6 col-md-6">
              <div className="dashboard-card" style={{ height: "100%", cursor: "pointer" }} onClick={() => router.push("/portal/admin/offline-members")}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Gym Offline Members</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fb923c" }}>
                    {offlineMembersCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                    Gym Offline
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users per City Bar Chart */}
          {usersByCity.length > 0 && (
            <div className="row" style={{ marginTop: "1.5rem" }}>
              <div className="col-12">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Users per City ({totalCities} cities)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      style={{ overflowX: "auto", overflowY: "hidden" }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "1rem", height: "250px", paddingTop: "2rem", minWidth: "max-content" }}>
                        {usersByCity.map((city, index) => {
                          const maxUsers = Math.max(...usersByCity.map(c => c.users_count));
                          const barHeight = maxUsers > 0 ? (city.users_count / maxUsers) * 180 : 0;

                          return (
                            <div
                              key={`${city.city}-${index}`}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0 }}
                            >
                              <div style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#fff",
                                marginBottom: "6px",
                                height: "16px"
                              }}>
                                {city.users_count.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: `${barHeight}px`,
                                  backgroundColor: "#FF5757",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s ease, backgroundColor 0.2s ease",
                                  minHeight: "4px",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#ff6b6b";
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredBar(null);
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#888",
                                  marginTop: "8px",
                                  textAlign: "center",
                                  wordBreak: "break-word",
                                  textTransform: "capitalize",
                                  height: "32px",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredBar(city);
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                {city.city}
                              </div>
                            </div>
                          );
                        })}

                        {/* Loading indicator for pagination */}
                        {loadingMore && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0, justifyContent: "flex-end" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              border: "3px solid #333",
                              borderTop: "3px solid #FF5757",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite"
                            }}></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Tooltip - Outside overflow container */}
          {hoveredBar && (
            <div
              style={{
                position: "fixed",
                left: `${tooltipPos.x + 15}px`,
                top: `${tooltipPos.y - 50}px`,
                backgroundColor: "#1e1e1e",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                zIndex: 10000,
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                border: "1px solid #FF5757",
                pointerEvents: "none"
              }}
            >
              <div style={{ marginBottom: "3px", color: "#FF5757", fontWeight: "700", fontSize: "14px" }}>
                {hoveredBar.city}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>
                {hoveredBar.users_count.toLocaleString()} users
              </div>
            </div>
          )}

          {/* CSS animation for loading spinner */}
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
