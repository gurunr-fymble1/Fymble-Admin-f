"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function FinancialsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [financialsData, setFinancialsData] = useState(null);

  // Filter states
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

  // Pie chart interaction states
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [showOtherBreakdown, setShowOtherBreakdown] = useState(false);

  // Reset hovered segment and tooltips when toggle view changes
  useEffect(() => {
    setHoveredSegment(null);
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  }, [showOtherBreakdown]);

  // Fetch financials data based on current filter state
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = {};

        // For "overall" and "custom", we handle dates specially
        if (dateFilter === "overall") {
          // Don't send any date params - backend will use default
          setStartDate("");
          setEndDate("");
        } else if (dateFilter === "custom") {
          // Let the other useEffect handle custom dates
          setLoading(false);
          return;
        } else {
          // For predefined filters, calculate dates inline to avoid race condition
          const today = new Date();
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          };
          let start, end;

          if (dateFilter === "today") {
            start = end = formatDate(today);
          } else if (dateFilter === "yesterday") {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            start = end = formatDate(yesterday);
          } else if (dateFilter === "last_7") {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            start = formatDate(sevenDaysAgo);
            end = formatDate(today);
          } else if (dateFilter === "last_30") {
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            start = formatDate(thirtyDaysAgo);
            end = formatDate(today);
          } else if (dateFilter === "last_60") {
            const sixtyDaysAgo = new Date(today);
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            start = formatDate(sixtyDaysAgo);
            end = formatDate(today);
          } else if (dateFilter === "last_90") {
            const ninetyDaysAgo = new Date(today);
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            start = formatDate(ninetyDaysAgo);
            end = formatDate(today);
          } else if (dateFilter === "last_month") {
            const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
            const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
            start = formatDate(firstDayOfLastMonth);
            end = formatDate(lastDayOfLastMonth);
          } else if (dateFilter === "current_month") {
            const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            start = formatDate(firstDayOfCurrentMonth);
            end = formatDate(today);
          }

          // Update state for display purposes
          setStartDate(start);
          setEndDate(end);
          params.start_date = start;
          params.end_date = end;
        }

        const response = await axiosInstance.get("/api/admin/financials/overview", { params });

        if (response.data.success) {
          setFinancialsData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching financials data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter]);

  // Separate useEffect for custom date changes
  useEffect(() => {
    // Only fetch when in custom mode and both dates are set
    if (dateFilter === "custom" && startDate && endDate) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const params = {
            start_date: startDate,
            end_date: endDate
          };
          const response = await axiosInstance.get("/api/admin/financials/overview", { params });
          if (response.data.success) {
            setFinancialsData(response.data.data);
          }
        } catch (err) {
          console.error("Error fetching financials data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [startDate, endDate]);

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
    // For other filters, the useEffect will handle the fetch
  };

  const formatCurrency = (amount) => {
    if (typeof amount === 'number') {
      // Show max 2 decimal places, remove trailing zeros for whole numbers
      const formatted = amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      return `₹${formatted}`;
    }
    return amount;
  };

  return (
    <div className="dashboard-container">
      {/* Header with Filters */}
      <div className="section-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <h3 className="section-heading" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Financials</span> Dashboard
            </h3>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              style={{
                padding: "10px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "14px",
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

        {/* Custom Date Range */}
        {/* Custom Date Range */}
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
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "10px",
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
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "10px",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "14px",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "14px",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "14px",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #3a3a3a",
                        borderRadius: "6px",
                        color: "white",
                        fontSize: "14px",
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
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
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
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #3a3a3a",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
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
        <div className="section-container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "300px",
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
                Loading financials data...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Total Revenue Section */}
      {financialsData && (
        <div className="section-container">
          <div className="row g-4">
            <div className="col-xl-12">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title" style={{ textAlign: "center" }}>Total Revenue</h6>
                </div>
                <div className="card-body-custom">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "60px" }}>
                    {/* Left Side - Total Revenue */}
                    <div style={{ flex: "1", textAlign: "center" }}>
                      <div className="metric-number" style={{ fontSize: "42px", fontWeight: "700" }}>
                        {formatCurrency(financialsData.totalRevenue)}
                      </div>
                      <div style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
                        Gross revenue from all sources
                      </div>
                    </div>

                    {/* Right Side - Breakdown */}
                    {financialsData.revenueSourceBreakdown && (
                      <div style={{ flex: "1" }}>
                        <div style={{ fontSize: "13px", color: "#fff", marginBottom: "15px", fontWeight: "600", textAlign: "center" }}>
                          Breakdown
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Daily Pass</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.revenueSourceBreakdown.daily_pass)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Fitness classes</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.revenueSourceBreakdown.sessions)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Gym Membership</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.revenueSourceBreakdown.gym_membership)}
                            </span>
                          </div>
                          <div 
                            onClick={() => setShowOtherBreakdown(!showOtherBreakdown)}
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center", 
                              padding: "10px 15px", 
                              backgroundColor: "#1e1e1e", 
                              borderRadius: "6px",
                              cursor: "pointer",
                              border: "1px dashed #FFC107"
                            }}
                          >
                            <span style={{ fontSize: "13px", color: "#FFC107", display: "flex", alignItems: "center", gap: "6px" }}>
                              Other Categories {showOtherBreakdown ? "▼" : "►"}
                            </span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#FFC107" }}>
                              {formatCurrency(
                                (financialsData.revenueSourceBreakdown.fittbot_subscription || 0) +
                                (financialsData.revenueSourceBreakdown.ai_credits || 0) +
                                (financialsData.revenueSourceBreakdown.ai_diet_coach || 0)
                              )}
                            </span>
                          </div>
                          
                          {showOtherBreakdown && (
                            <div style={{ paddingLeft: "15px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>Nutrition Plan</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.revenueSourceBreakdown.fittbot_subscription)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Credits</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.revenueSourceBreakdown.ai_credits || 0)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Diet Coach</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.revenueSourceBreakdown.ai_diet_coach || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Deductions Section */}
      {financialsData && financialsData.totalDeductions && (
        <div className="section-container">
          <div className="row g-4">
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Fees</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.totalDeductions.commission)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
                    Platform Fees
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">PG Deduction</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.totalDeductions.pg_deduction)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
                    Payment gateway charges
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">TDS Deduction</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.totalDeductions.tds_deduction)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
                    Tax deducted at source
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">GST Detection</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(
                      (financialsData.netRevenueBreakdown.fittbot_subscription?.gst || 0) +
                      (financialsData.netRevenueBreakdown.ai_credits?.gst || 0) +
                      (financialsData.netRevenueBreakdown.ai_diet_coach?.gst || 0) +
                      (financialsData.netRevenueBreakdown.gym_membership?.gst_on_comm || 0) +
                      (financialsData.netRevenueBreakdown.daily_pass?.gst_on_comm || 0) +
                      (financialsData.netRevenueBreakdown.sessions?.gst_on_comm || 0)
                    )}
                  </div>
                  <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #333", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                       <span style={{ color: "#aaa" }}>Commission GST:</span>
                       <span style={{ color: "#fff", fontWeight: "600" }}>{formatCurrency(
                        (financialsData.netRevenueBreakdown.gym_membership?.gst_on_comm || 0) +
                        (financialsData.netRevenueBreakdown.daily_pass?.gst_on_comm || 0) +
                        (financialsData.netRevenueBreakdown.sessions?.gst_on_comm || 0)
                       )}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                       <span style={{ color: "#aaa" }}>Nutritionist/AI GST:</span>
                       <span style={{ color: "#fff", fontWeight: "600" }}>{formatCurrency(
                        (financialsData.netRevenueBreakdown.fittbot_subscription?.gst || 0) +
                        (financialsData.netRevenueBreakdown.ai_credits?.gst || 0) +
                        (financialsData.netRevenueBreakdown.ai_diet_coach?.gst || 0)
                       )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Net Revenue Section */}
      {financialsData && financialsData.netRevenue && (
        <div className="section-container">
          <h2 className="section-heading" style={{ marginBottom: "20px", textAlign: "center", fontSize: "28px", fontWeight: "700" }}>
            <span style={{ color: "#FF5757" }}>Net</span> Merchandise Value
          </h2>
          <div className="row g-4">
            {/* Total Net Revenue Card */}
            <div className="col-xl-12">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title" style={{ textAlign: "center" }}>Net Merchandise Value</h6>
                </div>
                <div className="card-body-custom">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "60px" }}>
                    {/* Left Side - Total Revenue */}
                    <div style={{ flex: "1", textAlign: "center" }}>
                      <div className="metric-number" style={{ fontSize: "42px", fontWeight: "700" }}>
                        {formatCurrency(financialsData.netRevenue)}
                      </div>
                      <div style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
                        Revenue after GST deductions
                      </div>
                    </div>

                    {/* Right Side - Breakdown - List Style */}
                    {financialsData.netRevenueBreakdown && (
                      <div style={{ flex: "1" }}>
                        <div style={{ fontSize: "13px", color: "#fff", marginBottom: "15px", fontWeight: "600", textAlign: "center" }}>
                          Breakdown
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Daily Pass</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.netRevenueBreakdown.daily_pass.net_revenue)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Fitness classes</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.netRevenueBreakdown.sessions.net_revenue)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Gym Membership</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.netRevenueBreakdown.gym_membership.net_revenue)}
                            </span>
                          </div>
                          <div 
                            onClick={() => setShowOtherBreakdown(!showOtherBreakdown)}
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center", 
                              padding: "10px 15px", 
                              backgroundColor: "#1e1e1e", 
                              borderRadius: "6px",
                              cursor: "pointer",
                              border: "1px dashed #FFC107"
                            }}
                          >
                            <span style={{ fontSize: "13px", color: "#FFC107", display: "flex", alignItems: "center", gap: "6px" }}>
                              Other Categories {showOtherBreakdown ? "▼" : "►"}
                            </span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#FFC107" }}>
                              {formatCurrency(
                                (financialsData.netRevenueBreakdown.fittbot_subscription?.net_revenue || 0) +
                                (financialsData.netRevenueBreakdown.ai_credits?.net_revenue || 0) +
                                (financialsData.netRevenueBreakdown.ai_diet_coach?.net_revenue || 0)
                              )}
                            </span>
                          </div>
                          
                          {showOtherBreakdown && (
                            <div style={{ paddingLeft: "15px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>Nutrition Plan</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.netRevenueBreakdown.fittbot_subscription?.net_revenue || 0)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Credits</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.netRevenueBreakdown.ai_credits?.net_revenue || 0)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Diet Coach</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.netRevenueBreakdown.ai_diet_coach?.net_revenue || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Revenue Pie Chart - Interactive & Animated */}
          {financialsData.netRevenueBreakdown && (() => {
            const breakdown = financialsData.netRevenueBreakdown;
            const fymbleNet = breakdown.fittbot_subscription?.net_revenue || 0;
            const aiCreditsNet = breakdown.ai_credits?.net_revenue || 0;
            const aiDietCoachNet = breakdown.ai_diet_coach?.net_revenue || 0;
            const gymNet = breakdown.gym_membership.net_revenue;
            const dailyPassNet = breakdown.daily_pass.net_revenue;
            const sessionsNet = breakdown.sessions.net_revenue;
            const totalNet = fymbleNet + aiCreditsNet + aiDietCoachNet + gymNet + dailyPassNet + sessionsNet;

            // Calculate percentages
            const fymblePercent = totalNet > 0 ? (fymbleNet / totalNet) * 100 : 0;
            const aiCreditsPercent = totalNet > 0 ? (aiCreditsNet / totalNet) * 100 : 0;
            const aiDietCoachPercent = totalNet > 0 ? (aiDietCoachNet / totalNet) * 100 : 0;
            const gymPercent = totalNet > 0 ? (gymNet / totalNet) * 100 : 0;
            const dailyPassPercent = totalNet > 0 ? (dailyPassNet / totalNet) * 100 : 0;
            const sessionsPercent = totalNet > 0 ? (sessionsNet / totalNet) * 100 : 0;

            const otherNet = fymbleNet + aiCreditsNet + aiDietCoachNet;
            const otherPercent = fymblePercent + aiCreditsPercent + aiDietCoachPercent;

            let segments = [];
            if (showOtherBreakdown) {
              segments = [
                {
                  id: 'fymble',
                  name: 'Nutrition Plan',
                  shortName: 'Nutrition Plan',
                  value: fymbleNet,
                  percent: fymblePercent,
                  color: '#FFC107',
                  gradient: 'linear-gradient(135deg, #FFC107 0%, #FFB300 100%)',
                },
                {
                  id: 'aiCredits',
                  name: 'AI Credits',
                  shortName: 'AI Credits',
                  value: aiCreditsNet,
                  percent: aiCreditsPercent,
                  color: '#FF9800',
                  gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                },
                {
                  id: 'aiDietCoach',
                  name: 'AI Diet Coach',
                  shortName: 'AI Diet Coach',
                  value: aiDietCoachNet,
                  percent: aiDietCoachPercent,
                  color: '#ec4899',
                  gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                },
                {
                  id: 'gym',
                  name: 'Gym Membership',
                  shortName: 'Gym Membership',
                  value: gymNet,
                  percent: gymPercent,
                  color: '#4ade80',
                  gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                },
                {
                  id: 'dailyPass',
                  name: 'Daily Pass',
                  shortName: 'Daily Pass',
                  value: dailyPassNet,
                  percent: dailyPassPercent,
                  color: '#3b82f6',
                  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                },
                {
                  id: 'sessions',
                  name: 'Fitness classes',
                  shortName: 'Fitness classes',
                  value: sessionsNet,
                  percent: sessionsPercent,
                  color: '#f59e0b',
                  gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }
              ];
            } else {
              segments = [
                {
                  id: 'dailyPass',
                  name: 'Daily Pass',
                  shortName: 'Daily Pass',
                  value: dailyPassNet,
                  percent: dailyPassPercent,
                  color: '#3b82f6',
                  gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                },
                {
                  id: 'sessions',
                  name: 'Fitness classes',
                  shortName: 'Fitness classes',
                  value: sessionsNet,
                  percent: sessionsPercent,
                  color: '#f59e0b',
                  gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                },
                {
                  id: 'gym',
                  name: 'Gym Membership',
                  shortName: 'Gym Membership',
                  value: gymNet,
                  percent: gymPercent,
                  color: '#4ade80',
                  gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                },
                {
                  id: 'other',
                  name: 'Other Categories',
                  shortName: 'Other Categories',
                  value: otherNet,
                  percent: otherPercent,
                  color: '#FFC107',
                  gradient: 'linear-gradient(135deg, #FFC107 0%, #FFB300 100%)',
                }
              ];
            }

            // Recompute angles dynamically based on the active segments
            let accumulatedPercent = 0;
            segments.forEach((seg, idx) => {
              seg.startAngle = accumulatedPercent * 3.6;
              accumulatedPercent += seg.percent;
              seg.endAngle = idx === segments.length - 1 ? 360 : accumulatedPercent * 3.6;
            });

            // Convert polar to cartesian coordinates
            const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
              const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
              return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
              };
            };

            // Create SVG arc path
            const createArcPath = (startAngle, endAngle, innerRadius, outerRadius, isHovered) => {
              const radius = isHovered ? outerRadius + 8 : outerRadius;
              const start = polarToCartesian(100, 100, radius, endAngle);
              const end = polarToCartesian(100, 100, radius, startAngle);
              const startInner = polarToCartesian(100, 100, innerRadius, endAngle);
              const endInner = polarToCartesian(100, 100, innerRadius, startAngle);

              const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

              return [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                "L", endInner.x, endInner.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
                "Z"
              ].join(" ");
            };

            const handleMouseEnter = (segment, event) => {
              setHoveredSegment(segment.id);
              const rect = event.currentTarget.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: rect.left + rect.width / 2,
                y: rect.top,
                data: segment
              });
            };

            const handleMouseLeave = () => {
              setHoveredSegment(null);
              setTooltip({ visible: false, x: 0, y: 0, data: null });
            };

            return (
              <div style={{ marginTop: "30px" }}>
                <div className="dashboard-card">
                  <div className="card-header-custom extra-space">
                    <h6 className="card-title" style={{ textAlign: "center" }}>Net Merchandise Value Distribution</h6>
                  </div>
                  <div className="card-body-custom">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "50px", flexWrap: "wrap", padding: "20px 0" }}>
                      {/* Animated SVG Pie Chart */}
                      <div style={{ position: "relative", width: "260px", height: "260px" }}>
                        <svg
                          width="260"
                          height="260"
                          viewBox="0 0 200 200"
                          style={{
                            filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))",
                            transform: "rotate(-90deg)"
                          }}
                        >
                          {segments.map((segment, index) => {
                            const isHovered = hoveredSegment === segment.id;
                            const shouldDim = hoveredSegment && hoveredSegment !== segment.id;

                            return (
                              <g key={segment.id}>
                                {/* Main arc with gradient effect */}
                                <defs>
                                  <linearGradient id={`gradient-${segment.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: segment.color, stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: segment.color, stopOpacity: 0.8 }} />
                                  </linearGradient>
                                  <filter id={`glow-${segment.id}`}>
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                  </filter>
                                </defs>

                                <path
                                  d={createArcPath(segment.startAngle, segment.endAngle, 60, 95, isHovered)}
                                  fill={`url(#gradient-${segment.id})`}
                                  stroke={shouldDim ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
                                  strokeWidth="2"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity: shouldDim ? 0.4 : 1,
                                    filter: isHovered ? `url(#glow-${segment.id})` : "none"
                                  }}
                                  onMouseEnter={(e) => handleMouseEnter(segment, e)}
                                  onMouseLeave={handleMouseLeave}
                                  onMouseMove={(e) => handleMouseEnter(segment, e)}
                                  onClick={() => {
                                    if (segment.id === 'other' || segment.id === 'fymble' || segment.id === 'aiCredits' || segment.id === 'aiDietCoach') {
                                      setShowOtherBreakdown(!showOtherBreakdown);
                                    }
                                  }}
                                />

                                {/* Animated entry effect */}
                                <animate
                                  attributeName="opacity"
                                  from="0"
                                  to={shouldDim ? "0.4" : "1"}
                                  dur="0.5s"
                                  begin={`${index * 0.1}s`}
                                  fill="freeze"
                                />
                              </g>
                            );
                          })}

                          {/* Center circle with gradient */}
                          <circle
                            cx="100"
                            cy="100"
                            r="55"
                            fill="url(#centerGradient)"
                            style={{
                              filter: "drop-shadow(0 0 20px rgba(0, 0, 0, 0.5)) inset"
                            }}
                          />

                          {/* Center gradient definition */}
                          <defs>
                            <radialGradient id="centerGradient">
                              <stop offset="0%" style={{ stopColor: "#2a2a2a" }} />
                              <stop offset="100%" style={{ stopColor: "#1a1a1a" }} />
                            </radialGradient>
                          </defs>
                        </svg>

                        {/* Center content */}
                        <div style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                          pointerEvents: "none"
                        }}>
                          <div style={{
                            fontSize: "10px",
                            color: "#888",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: "4px"
                          }}>
                            Total
                          </div>
                          <div style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#fff",
                            textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)"
                          }}>
                            {formatCurrency(totalNet)}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Legend with animations */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: "280px" }}>
                        {segments.map((segment) => {
                          const isHovered = hoveredSegment === segment.id;
                          const shouldDim = hoveredSegment && hoveredSegment !== segment.id;

                          return (
                            <div
                              key={segment.id}
                              onMouseEnter={() => setHoveredSegment(segment.id)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              onClick={() => {
                                if (segment.id === 'other' || segment.id === 'fymble' || segment.id === 'aiCredits' || segment.id === 'aiDietCoach') {
                                  setShowOtherBreakdown(!showOtherBreakdown);
                                }
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                backgroundColor: isHovered ? "rgba(255, 255, 255, 0.08)" : "transparent",
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                transform: isHovered ? "translateX(8px)" : "translateX(0)",
                                opacity: shouldDim ? 0.4 : 1,
                                borderLeft: isHovered ? `3px solid ${segment.color}` : "3px solid transparent"
                              }}
                            >
                              {/* Animated color indicator */}
                              <div style={{
                                position: "relative",
                                width: "20px",
                                height: "20px",
                                borderRadius: "6px",
                                background: segment.gradient,
                                boxShadow: `0 0 ${isHovered ? "15px" : "0px"} ${segment.color}40`,
                                transition: "all 0.3s ease"
                              }}>
                                {isHovered && (
                                  <div style={{
                                    position: "absolute",
                                    inset: "-4px",
                                    borderRadius: "8px",
                                    border: `2px solid ${segment.color}`,
                                    animation: "pulse 1.5s ease-in-out infinite"
                                  }} />
                                )}
                              </div>

                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: "13px",
                                  color: "#fff",
                                  fontWeight: isHovered ? "600" : "400",
                                  transition: "all 0.2s ease"
                                }}>
                                  {segment.name}
                                </div>
                              </div>

                              <div style={{
                                fontSize: "15px",
                                fontWeight: "700",
                                color: segment.color,
                                minWidth: "70px",
                                textAlign: "right",
                                textShadow: isHovered ? `0 0 10px ${segment.color}60` : "none"
                              }}>
                                {segment.percent.toFixed(1)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Tooltip */}
                {tooltip.visible && tooltip.data && (
                  <div style={{
                    position: "fixed",
                    left: tooltip.x - 100,
                    top: tooltip.y - 100,
                    backgroundColor: "rgba(26, 26, 26, 0.98)",
                    border: `1px solid ${tooltip.data.color}`,
                    borderRadius: "12px",
                    padding: "14px 18px",
                    boxShadow: `0 10px 40px ${tooltip.data.color}40, 0 0 60px rgba(0, 0, 0, 0.5)`,
                    zIndex: 1000,
                    minWidth: "200px",
                    animation: "tooltipFadeIn 0.2s ease-out",
                    backdropFilter: "blur(10px)"
                  }}>
                    <div style={{
                      fontSize: "13px",
                      color: "#888",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "1px"
                    }}>
                      {tooltip.data.name}
                    </div>
                    <div style={{
                      fontSize: "22px",
                      fontWeight: "700",
                      color: tooltip.data.color,
                      marginBottom: "8px",
                      textShadow: `0 0 20px ${tooltip.data.color}60`
                    }}>
                      {formatCurrency(tooltip.data.value)}
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      color: "#fff"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: tooltip.data.color,
                        animation: "pulse 1.5s ease-in-out infinite"
                      }} />
                      {tooltip.data.percent.toFixed(1)}% of total Net revenue
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Net Revenue Breakdown by Category */}
      {false && (
        <div className="section-container">
          <h3 className="section-heading" style={{ marginBottom: "20px", fontSize: "24px" }}>
            <span style={{ color: "#FF5757" }}>Net</span> Revenue Breakdown
          </h3>
          <div className="row g-4">
            {/* Nutrition Plan Net Revenue */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Nutrition Plan</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.netRevenueBreakdown.fittbot_subscription.net_revenue)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Total Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.netRevenueBreakdown.fittbot_subscription.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.netRevenueBreakdown.fittbot_subscription.gst)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gym Membership Net Revenue */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Gym Membership</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.netRevenueBreakdown.gym_membership.net_revenue)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Total Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.netRevenueBreakdown.gym_membership.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.netRevenueBreakdown.gym_membership.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Pass Net Revenue */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Daily Pass</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.netRevenueBreakdown.daily_pass.net_revenue)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Total Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.netRevenueBreakdown.daily_pass.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.netRevenueBreakdown.daily_pass.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness classes Net Revenue */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Fitness classes</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.netRevenueBreakdown.sessions.net_revenue)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Total Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.netRevenueBreakdown.sessions.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.netRevenueBreakdown.sessions.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gross Profit Section */}
      {financialsData && financialsData.grossProfit && (
        <div className="section-container">
          <h2 className="section-heading" style={{ marginBottom: "20px", textAlign: "center", fontSize: "28px", fontWeight: "700" }}>
            <span style={{ color: "#FF5757" }}>Gross</span> Profit
          </h2>
          <div className="row g-4">
            {/* Total Gross Profit Card */}
            <div className="col-xl-12">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title" style={{ textAlign: "center" }}>Total Gross Profit</h6>
                </div>
                <div className="card-body-custom">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "60px" }}>
                    {/* Left Side - Total Gross Profit */}
                    <div style={{ flex: "1", textAlign: "center" }}>
                      <div className="metric-number" style={{ fontSize: "42px", fontWeight: "700" }}>
                        {formatCurrency(financialsData.grossProfit)}
                      </div>
                      <div style={{ fontSize: "14px", color: "#888", marginTop: "8px" }}>
                        Profit after GST deductions on commissions
                      </div>
                    </div>

                    {/* Right Side - Breakdown - List Style */}
                    {financialsData.grossProfitBreakdown && (
                      <div style={{ flex: "1" }}>
                        <div style={{ fontSize: "13px", color: "#fff", marginBottom: "15px", fontWeight: "600", textAlign: "center" }}>
                          Breakdown
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Daily Pass</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.grossProfitBreakdown.daily_pass.gross_profit)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Fitness classes</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.grossProfitBreakdown.sessions.gross_profit)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                            <span style={{ fontSize: "13px", color: "#aaa" }}>Gym Membership</span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                              {formatCurrency(financialsData.grossProfitBreakdown.gym_membership.gross_profit)}
                            </span>
                          </div>
                          <div 
                            onClick={() => setShowOtherBreakdown(!showOtherBreakdown)}
                            style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center", 
                              padding: "10px 15px", 
                              backgroundColor: "#1e1e1e", 
                              borderRadius: "6px",
                              cursor: "pointer",
                              border: "1px dashed #FFC107"
                            }}
                          >
                            <span style={{ fontSize: "13px", color: "#FFC107", display: "flex", alignItems: "center", gap: "6px" }}>
                              Other Categories {showOtherBreakdown ? "▼" : "►"}
                            </span>
                            <span style={{ fontSize: "16px", fontWeight: "700", color: "#FFC107" }}>
                              {formatCurrency(
                                (financialsData.grossProfitBreakdown.fittbot_subscription?.gross_profit || 0) +
                                (financialsData.grossProfitBreakdown.ai_credits?.gross_profit || 0) +
                                (financialsData.grossProfitBreakdown.ai_diet_coach?.gross_profit || 0)
                              )}
                            </span>
                          </div>
                          
                          {showOtherBreakdown && (
                            <div style={{ paddingLeft: "15px", display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>Nutrition Plan</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.grossProfitBreakdown.fittbot_subscription?.gross_profit || 0)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Credits</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.grossProfitBreakdown.ai_credits?.gross_profit || 0)}
                                </span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#252525", borderRadius: "4px" }}>
                                <span style={{ fontSize: "12px", color: "#aaa" }}>AI Diet Coach</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                  {formatCurrency(financialsData.grossProfitBreakdown.ai_diet_coach?.gross_profit || 0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gross Margin Card */}
      {financialsData && financialsData.grossMargin && (
        <div className="section-container">
          <div className="row g-4">
            <div className="col-xl-12">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title" style={{ textAlign: "center" }}>Gross Margin Percentage</h6>
                </div>
                <div className="card-body-custom">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "60px" }}>
                    {/* Left - Gross Margin % */}
                    <div style={{ flex: "1", textAlign: "center" }}>
                      <div
                        className="metric-number"
                        style={{
                          fontSize: "52px",
                          fontWeight: "700",
                          color: "#fff"
                        }}
                      >
                        {financialsData.grossMargin.gross_margin_percentage}%
                      </div>
                      <div style={{ fontSize: "14px", color: "#888", marginTop: "6px" }}>
                        Gross Profit minus AWS &amp; Nutritionist Salary costs
                      </div>
                    </div>

                    {/* Right - Breakdown */}
                    <div style={{ flex: "1" }}>
                      <div style={{ fontSize: "13px", color: "#fff", marginBottom: "15px", fontWeight: "600", textAlign: "center" }}>
                        Breakdown
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                          <span style={{ fontSize: "13px", color: "#aaa" }}>Total Gross Profit</span>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                            {formatCurrency(financialsData.grossMargin.gross_profit)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", backgroundColor: "#1e1e1e", borderRadius: "6px" }}>
                          <span style={{ fontSize: "13px", color: "#aaa" }}>AWS Cost + Nutritionist Salary</span>
                          <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                            - {formatCurrency(financialsData.grossMargin.aws_cost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gross Profit Breakdown by Category */}
      {false && (
        <div className="section-container">
          <h3 className="section-heading" style={{ marginBottom: "20px", fontSize: "24px" }}>
            <span style={{ color: "#FF5757" }}>Gross</span> Profit Breakdown
          </h3>
          <div className="row g-4">
            {/* Nutrition Plan Gross Profit */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Nutrition Plan</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.grossProfitBreakdown.fittbot_subscription.gross_profit)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Total Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.grossProfitBreakdown.fittbot_subscription.revenue)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.grossProfitBreakdown.fittbot_subscription.gst)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gym Membership Gross Profit */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Gym Membership</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.grossProfitBreakdown.gym_membership.gross_profit)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Platform Commission:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.grossProfitBreakdown.gym_membership.commission)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.grossProfitBreakdown.gym_membership.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Pass Gross Profit */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Daily Pass</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.grossProfitBreakdown.daily_pass.gross_profit)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Platform Commission:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.grossProfitBreakdown.daily_pass.commission)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.grossProfitBreakdown.daily_pass.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fitness classes Gross Profit */}
            <div className="col-xl-6 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Fitness classes</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.grossProfitBreakdown.sessions.gross_profit)}
                  </div>
                  <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "5px" }}>
                      <span style={{ color: "#888" }}>Platform Commission:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.grossProfitBreakdown.sessions.commission)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "#ef4444" }}>GST on Commission (18%):</span>
                      <span style={{ color: "#ef4444" }}>-{formatCurrency(financialsData.grossProfitBreakdown.sessions.gst_on_comm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Metrics Section - EBITA, ARPU, ARPPU */}
      <div className="section-container">
        <h5 className="section-heading" style={{ marginBottom: "20px", fontSize: "24px" }}>
          <span style={{ color: "#FF5757" }}>Other</span> Metrics
        </h5>
        <div className="row g-4">
          {/* EBITA Card */}
          <div className="col-xl-4 col-lg-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">EBITA</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number" style={{ fontSize: "24px" }}>
                  {formatCurrency(financialsData?.ebita?.ebita || 0)}
                </div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>
                  Gross Profit: {formatCurrency(financialsData?.ebita?.gross_profit || 0)} - Expenses: {formatCurrency(financialsData?.ebita?.total_expenses || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* ARPU Card */}
          {financialsData?.arpu && (
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">ARPU (Total Users)</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.arpu.arpu || 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "8px" }}>
                    Per total user
                  </div>
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#888" }}>Net Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.arpu.net_revenue || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#888" }}>Total Users:</span>
                      <span style={{ color: "#FF5757" }}>{financialsData.arpu.total_users || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARPPU Card */}
          {financialsData?.arppu && (
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">ARPPU</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "24px" }}>
                    {formatCurrency(financialsData.arppu.arppu || 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "8px" }}>
                    Per paying user
                  </div>
                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#888" }}>Net Revenue:</span>
                      <span style={{ color: "#fff" }}>{formatCurrency(financialsData.arppu.net_revenue || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#888" }}>Paying Users:</span>
                      <span style={{ color: "#4ade80" }}>{financialsData.arppu.paying_users || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes tooltipFadeIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

