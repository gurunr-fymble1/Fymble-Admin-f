"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { FaChartLine } from "react-icons/fa";

const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function UnitEconomicsPage() {
  const [loading, setLoading] = useState(true);
  const [unitEconomicsData, setUnitEconomicsData] = useState(null);
  const [dateFilter, setDateFilter] = useState("overall");
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

  const fetchUnitEconomicsAnalytics = async (currentFilter, customStart, customEnd) => {
    setLoading(true);
    try {
      let url = "/api/admin/unit-economics/data";
      const params = [];

      if (currentFilter !== "overall") {
        let fetchStart = "";
        let fetchEnd = "";
        const today = new Date();

        if (currentFilter === "custom" && customStart && customEnd) {
          fetchStart = customStart;
          fetchEnd = customEnd;
        } else if (currentFilter === "today") {
          fetchStart = formatLocalDate(today);
          fetchEnd = formatLocalDate(today);
        } else if (currentFilter === "last_7") {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          fetchStart = formatLocalDate(sevenDaysAgo);
          fetchEnd = formatLocalDate(today);
        } else if (currentFilter === "last_30") {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          fetchStart = formatLocalDate(thirtyDaysAgo);
          fetchEnd = formatLocalDate(today);
        } else if (currentFilter === "last_month") {
          const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
          const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
          fetchStart = formatLocalDate(firstDayOfLastMonth);
          fetchEnd = formatLocalDate(lastDayOfLastMonth);
        } else if (currentFilter === "current_month") {
          const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          fetchStart = formatLocalDate(firstDayOfCurrentMonth);
          fetchEnd = formatLocalDate(today);
        }

        if (fetchStart && fetchEnd) {
          params.push(`start_date=${fetchStart}&end_date=${fetchEnd}`);
        }
      }

      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const response = await axiosInstance.get(url);

      if (response.data && response.data.success) {
        setUnitEconomicsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching unit economics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateFilter === "overall") {
      fetchUnitEconomicsAnalytics("overall");
    } else if (dateFilter === "custom" && startDate && endDate) {
      fetchUnitEconomicsAnalytics("custom", startDate, endDate);
    } else if (["today", "last_7", "last_30", "last_month", "current_month"].includes(dateFilter)) {
      fetchUnitEconomicsAnalytics(dateFilter);
    }
  }, [dateFilter, startDate, endDate]);

  // Sync custom input changes to startDate and endDate states
  useEffect(() => {
    if (dateFilter === "custom") {
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
    dateFilter,
    customType,
    customStartMonth,
    customStartYear,
    customEndMonth,
    customEndYear,
    customStartYearRange,
    customEndYearRange
  ]);

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value === "custom") {
      setCustomType("date");
      setStartDate("");
      setEndDate("");
    }
  };

  const formatCurrency = (amount, fractionDigits = 0) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <div className="section-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h3 className="section-heading" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Unit</span> Economics
            </h3>
            <Link
              href="/portal/admin/unit-economics/trends"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "20px",
                color: "#60a5fa",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: "600",
                textDecoration: "none",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.05)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                e.currentTarget.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.05)";
              }}
            >
              <FaChartLine /> Trends
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              style={{
                backgroundColor: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "white",
                padding: "8px 12px",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                minWidth: "150px"
              }}
            >
              <option value="today">Today</option>
              <option value="last_7">Last 7 Days</option>
              <option value="last_30">Last 30 Days</option>
              <option value="last_month">Last Month</option>
              <option value="current_month">MTD</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Panel */}
        {dateFilter === "custom" && (
          <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#222", borderRadius: "8px", border: "1px solid #333" }}>
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
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
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
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
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
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
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
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || formatLocalDate(new Date())}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={formatLocalDate(new Date())}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Custom: Month Range Selector */}
            {customType === "month" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
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
                        fontSize: "14px",
                        cursor: "pointer"
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
                        fontSize: "14px",
                        cursor: "pointer"
                      }}
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "25px", color: "#666", fontSize: "18px" }}>
                  →
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
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
                        fontSize: "14px",
                        cursor: "pointer"
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
                        fontSize: "14px",
                        cursor: "pointer"
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
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
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "25px", color: "#666", fontSize: "18px" }}>
                  →
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#aaa" }}>
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
                      fontSize: "14px",
                      cursor: "pointer"
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
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : unitEconomicsData ? (
        <div className="section-container">
          <div className="row g-4">
            {/* Main CAC Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Customer Acquisition Cost</h6>
                </div>
                <div className="card-body-custom">

                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {formatCurrency(unitEconomicsData.cac)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Cost to acquire one customer
                  </div>
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                      <span>Marketing Expenses</span>
                      <span style={{ color: "white", fontWeight: "600" }}>{formatCurrency(unitEconomicsData.marketingExpenses || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                      <span>Total Paying Users</span>
                      <span style={{ color: "white", fontWeight: "600" }}>{unitEconomicsData.totalNewUsers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LTV Card */}
            {unitEconomicsData && unitEconomicsData.ltv !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Lifetime Value (LTV)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                      {unitEconomicsData.ltv !== null && unitEconomicsData.ltv !== undefined ? formatCurrency(unitEconomicsData.ltv, 2) : "No data"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Customer lifetime value
                    </div>
                    {unitEconomicsData.ltv > 0 && (
                      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                          <span>Cohort Retention Rate</span>
                          <span style={{ color: "white", fontWeight: "600" }}>
                            {unitEconomicsData.cohortRetentionRate !== null ? `${(unitEconomicsData.cohortRetentionRate * 100).toFixed(2)}%` : "N/A"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                          <span>Retained Users</span>
                          <span style={{ color: "white", fontWeight: "600" }}>
                            {unitEconomicsData.retainedUsers !== null ? unitEconomicsData.retainedUsers.toLocaleString() : "0"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LTV / CAC Ratio Card */}
            {unitEconomicsData && unitEconomicsData.ltv !== undefined && unitEconomicsData.cac !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">LTV / CAC Ratio</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#3b82f6" }}>
                      {unitEconomicsData.ltvCacRatio !== null && unitEconomicsData.ltvCacRatio !== undefined ? unitEconomicsData.ltvCacRatio.toFixed(4) : "No data"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Lifetime value to acquisition cost ratio
                    </div>
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.5rem" }}>
                        <span>LTV</span>
                        <span style={{ color: "white", fontWeight: "600" }}>
                          {unitEconomicsData.ltv !== null ? formatCurrency(unitEconomicsData.ltv, 2) : "N/A"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                        <span>CAC (Last Month)</span>
                        <span style={{ color: "white", fontWeight: "600" }}>{formatCurrency(unitEconomicsData.lastMonthCac || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Active Users Card */}
            {unitEconomicsData && unitEconomicsData.monthlyActiveUsers !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Monthly Active Users</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#8b5cf6" }}>
                      {unitEconomicsData.monthlyActiveUsers.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Active users in the last completed month
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Active Users Card */}
            {unitEconomicsData && unitEconomicsData.weeklyActiveUsers !== undefined && (         
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Weekly Active Users</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#06b6d4" }}>
                      {unitEconomicsData.weeklyActiveUsers.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Active users in the last completed week
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Active Users Card */}
            {unitEconomicsData && unitEconomicsData.dailyActiveUsers !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Daily Active Users</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                      {unitEconomicsData.dailyActiveUsers.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Active users today
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Churn Rate Card */}
            {unitEconomicsData && unitEconomicsData.cohortRetentionRate !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">User Churn Rate</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#f59e0b" }}>
                      {unitEconomicsData.cohortRetentionRate !== null ? `${((1 - unitEconomicsData.cohortRetentionRate) * 100).toFixed(2)}%` : "No data"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Percentage of users who churned
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GMV Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">GMV</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ color: "#888", fontSize: "14px" }}>Loading...</div>
                  ) : unitEconomicsData?.gmv ? (() => {
                    const gmvData = unitEconomicsData.gmv;
                    const totalRevenue =
                      (gmvData.daily_pass?.total_revenue || 0) +
                      (gmvData.session?.total_revenue || 0) +
                      (gmvData.nutrition_plan?.total_revenue || 0) +
                      (gmvData.gym_membership?.total_revenue || 0) +
                      (gmvData.ai_credits?.total_revenue || 0) +
                      (gmvData.ai_diet_coach?.total_revenue || 0) +
                      (gmvData.kyra_ai?.total_revenue || 0);

                    return (
                      <>
                        <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#FF5757" }}>
                          {formatCurrency(totalRevenue)}
                        </div>
                        <div style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                          Total Gross Merchandise Value
                        </div>
                      </>
                    );
                  })() : (
                    <div style={{ color: "#888", fontSize: "14px" }}>No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* GMV / Bookings Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">GMV / Bookings</h6>
                </div>
                <div className="card-body-custom">
                  {loading ? (
                    <div style={{ color: "#888", fontSize: "14px" }}>Loading...</div>
                  ) : unitEconomicsData?.gmv ? (() => {
                    const gmvData = unitEconomicsData.gmv;
                    const totalRevenue =
                      (gmvData.daily_pass?.total_revenue || 0) +
                      (gmvData.session?.total_revenue || 0) +
                      (gmvData.nutrition_plan?.total_revenue || 0) +
                      (gmvData.gym_membership?.total_revenue || 0) +
                      (gmvData.ai_credits?.total_revenue || 0) +
                      (gmvData.ai_diet_coach?.total_revenue || 0) +
                      (gmvData.kyra_ai?.total_revenue || 0);
                    // Use authoritative totalBookings from backend (same source as Users Stats page)
                    const totalBookings =
                      unitEconomicsData.totalBookings !== undefined
                        ? unitEconomicsData.totalBookings
                        : (gmvData.daily_pass?.count || 0) +
                          (gmvData.session?.count || 0) +
                          (gmvData.nutrition_plan?.count || 0) +
                          (gmvData.gym_membership?.count || 0) +
                          (gmvData.ai_credits?.count || 0) +
                          (gmvData.ai_diet_coach?.count || 0) +
                          (gmvData.kyra_ai?.count || 0);
                    const revenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

                    return (
                      <>
                        <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b" }}>
                          {formatCurrency(revenuePerBooking)}
                        </div>
                        <div style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                          Revenue per booking &nbsp;·&nbsp;
                          <span style={{ color: "#9ca3af" }}>{totalBookings.toLocaleString()} total bookings</span>
                        </div>
                      </>
                    );
                  })() : (
                    <div style={{ color: "#888", fontSize: "14px" }}>No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Cohort Retention Card */}
            {unitEconomicsData && unitEconomicsData.cohortRetentionRate !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Cohort Retention</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                      {unitEconomicsData.cohortRetentionRate !== null ? `${(unitEconomicsData.cohortRetentionRate * 100).toFixed(2)}%` : "No data"}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Retention rate
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EBITA Card */}
            {unitEconomicsData && unitEconomicsData.ebita !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">EBITA</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>
                      {formatCurrency(unitEconomicsData.ebita)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>
                      Gross Profit: {formatCurrency(unitEconomicsData.grossProfit || 0)} - Expenses: {formatCurrency(unitEconomicsData.totalExpenses || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARPU Card */}
            {unitEconomicsData && unitEconomicsData.arpu !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">ARPU (Total Users)</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>
                      {formatCurrency(unitEconomicsData.arpu)}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Average Revenue Per User
                    </div>
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                        <span>Total New Users</span>
                        <span style={{ color: "white", fontWeight: "600" }}>{(unitEconomicsData.totalNewUsersActual || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARPPU Card */}
            {unitEconomicsData && unitEconomicsData.arppu !== undefined && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">ARPPU</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>
                      {formatCurrency(unitEconomicsData.arppu)}
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Average Revenue Per Paying User
                    </div>
                    <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" }}>
                        <span>Paying Users</span>
                        <span style={{ color: "white", fontWeight: "600" }}>{(unitEconomicsData.totalPayingUsers || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gross Margin Percentage Card */}
            {unitEconomicsData?.grossMarginPercentage !== undefined && unitEconomicsData.grossMarginPercentage !== null && (
              <div className="col-xl-4 col-lg-6">
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title">Gross Margin %</h6>
                  </div>
                  <div className="card-body-custom">
                    <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#fff" }}>
                      {unitEconomicsData.grossMarginPercentage}%
                    </div>
                    <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                      Gross Margin / Gross Profit
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>No data available</div>
        </div>
      )}
    </div>
  );
}
