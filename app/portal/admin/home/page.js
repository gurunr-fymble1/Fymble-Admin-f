"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../../layout";
import axiosInstance from "@/lib/axios";
import { FaTag, FaCalendarCheck } from "react-icons/fa";

export default function Home() {
  const baseRouter = useRouter();
  const { role } = useRole();

  const router = {
    ...baseRouter,
    push: (path) => {
      if (role === "accountant") {
        const allowedPaths = [
          "/portal/admin/home",
          "/portal/admin/purchases",
          "/portal/admin/financials",
          "/portal/admin/users-stats",
          "/portal/admin/gyms",
          "/portal/admin/unit-economics",
          "/portal/admin/expenses",
          "/portal/admin/cash-flow",
          "/portal/admin/tax-compliance",
          "/portal/admin/mrr"
        ];
        const isAllowed = allowedPaths.some(allowedPath => path.startsWith(allowedPath));
        if (!isAllowed) {
          alert("You don't have access or permission");
          return;
        }
      }
      baseRouter.push(path);
    }
  };

  const [fittbotTotalUsersFilter, setFittbotTotalUsersFilter] =
    useState("overall");
  const [fittbotRevenueFilter, setFittbotRevenueFilter] = useState("overall");
  const [fittbotActiveUsersFilter, setFittbotActiveUsersFilter] =
    useState("month");
  const [businessGymOwnersFilter, setBusinessGymOwnersFilter] =
    useState("month");
  const [businessGymsFilter, setBusinessGymsFilter] = useState("month");

  // Custom filter types: "date", "month", "year" for home page date filters
  const [customType, setCustomType] = useState("date");
  const [customStartMonth, setCustomStartMonth] = useState(new Date().getMonth() + 1);
  const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth() + 1);
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [customStartYearRange, setCustomStartYearRange] = useState(new Date().getFullYear());
  const [customEndYearRange, setCustomEndYearRange] = useState(new Date().getFullYear());

  // Sync custom input changes to customDateRange.startDate and customDateRange.endDate states
  useEffect(() => {
    if (customType === "month") {
      const start = `${customStartYear}-${String(customStartMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(customEndYear, customEndMonth, 0).getDate();
      const end = `${customEndYear}-${String(customEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      setCustomDateRange(prev => ({ ...prev, startDate: start, endDate: end }));
    } else if (customType === "year") {
      const start = `${customStartYearRange}-01-01`;
      const end = `${customEndYearRange}-12-31`;
      setCustomDateRange(prev => ({ ...prev, startDate: start, endDate: end }));
    }
  }, [
    customType,
    customStartMonth,
    customStartYear,
    customEndMonth,
    customEndYear,
    customStartYearRange,
    customEndYearRange
  ]);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Custom date range states - separate for each metric
  const [customDateRange, setCustomDateRange] = useState({
    show: false,
    startDate: "",
    endDate: "",
    activeMetric: null, // 'totalUsers' | 'revenue' | 'gymOwners' | 'gyms' | 'monthlyActiveUsers'
  });
  const [customRangeData, setCustomRangeData] = useState({
    totalUsers: { value: 0, applied: false, startDate: "", endDate: "" },
    revenue: { value: "₹0", applied: false, startDate: "", endDate: "" },
    gymOwners: { value: 0, applied: false, startDate: "", endDate: "" },
    gyms: { value: 0, applied: false, startDate: "", endDate: "" },
    monthlyActiveUsers: { value: 0, applied: false, startDate: "", endDate: "" },
  });

  const [loading, setLoading] = useState(true);
  const [lastMonthRevenue, setLastMonthRevenue] = useState("₹0");
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState("₹0");
  const [dashboardData, setDashboardData] = useState({
    fittbot: {
      totalUsers: { today: 0, week: 0, month: 0, overall: 0 },
      revenue: { today: "₹0", week: "₹0", month: "₹0", overall: "₹0" },
      subscribedUsers: { today: 0, week: 0, month: 0, overall: 0 },
      monthlyActiveUsers: { today: 0, week: 0, month: 0, overall: 0 },
      totalPayingUsers: 0,
      monthlyRevenueTrends: [],
    },
    business: {
      gymOwners: { today: 0, week: 0, month: 0, overall: 0 },
      gyms: { today: 0, week: 0, month: 0, overall: 0 },
      dailyPassGyms: 0,
      verifiedGyms: { verified: 0, total: 0 },
      unverifiedGyms: 0,
      unverifiedSplitup: { red: 0, hold: 0 },
    },
    plans: {
      freeTrial: 0,
      complimentary: 0,
      fittbotSubscriptions: { total: 0, gold: 0, platinum: 0, diamond: 0 },
    },
    rewards: {
      total: 0,
      interested: 0,
    },
    support: {
      totalTickets: { gym: 0, client: 0 },
      unresolvedTickets: { gym: 0, client: 0 },
      resolvedToday: 0,
    },
    gymPlans: {
      sessionPlans: 0,
      membershipPlans: 0,
      dailyPass: 0,
    },
    gymPhotos: {
      studio: 0,
      onboard: 0,
      noUploads: 0,
    },
    recurringSubscribers: {
      total: 0,
    },
    rewardProgram: {
      totalParticipants: 0,
    },
    gymMate: {
      total: 0,
      monthly_active_users: 0,
      weekly_active_users: 0,
      daily_active_users: 0,
    },
    kyraAI: {
      active_subscribers: 0,
      kyra_users: 0,
    },
  });

  const [priceNotifications, setPriceNotifications] = useState([]);
  const [showPriceNotificationModal, setShowPriceNotificationModal] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [showBookingNotificationModal, setShowBookingNotificationModal] = useState(false);

  const getBadgeStyles = (type) => {
    switch (type) {
      case "Kyra AI":
        return {
          backgroundColor: "rgba(168, 85, 247, 0.15)", // purple
          color: "#c084fc",
        };
      case "Nutrition Plan":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)", // green
          color: "#34d399",
        };
      case "Gym Membership":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)", // amber
          color: "#fbbf24",
        };
      case "Daily Pass":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)", // blue
          color: "#60a5fa",
        };
      case "Fitness Class":
        return {
          backgroundColor: "rgba(6, 182, 212, 0.15)", // cyan
          color: "#22d3ee",
        };
      default:
        return {
          backgroundColor: "rgba(255, 87, 87, 0.15)",
          color: "#FF5757",
        };
    }
  };

  useEffect(() => {
    if (role === "admin" || role === "support") {
      fetchPriceChangeNotifications();
      fetchBookingNotifications();
    }
  }, [role]);

  const fetchPriceChangeNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard/price-change-notifications/pending");
      if (response.data.success && response.data.count > 0) {
        setPriceNotifications(response.data.notifications);
        setShowPriceNotificationModal(true);
      }
    } catch (err) {
      console.error("Error fetching price change notifications:", err);
    }
  };

  const handleAcknowledgePriceNotifications = async () => {
    try {
      await axiosInstance.post("/api/admin/dashboard/price-change-notifications/mark-viewed");
      setShowPriceNotificationModal(false);
      setPriceNotifications([]);
    } catch (err) {
      console.error("Error marking price notifications as viewed:", err);
      setShowPriceNotificationModal(false);
    }
  };

  const fetchBookingNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard/bookings-notifications/pending");
      if (response.data.success && response.data.count > 0) {
        setBookingNotifications(response.data.notifications);
        setShowBookingNotificationModal(true);
      }
    } catch (err) {
      console.error("Error fetching booking notifications:", err);
    }
  };

  const handleAcknowledgeBookingNotifications = async () => {
    try {
      await axiosInstance.post("/api/admin/dashboard/bookings-notifications/mark-viewed");
      setShowBookingNotificationModal(false);
      setBookingNotifications([]);
    } catch (err) {
      console.error("Error marking booking notifications as viewed:", err);
      setShowBookingNotificationModal(false);
    }
  };

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

  useEffect(() => {
    fetchDashboardData();
  }, [businessGymOwnersFilter, businessGymsFilter, customRangeData.gymOwners.applied, customRangeData.gyms.applied]);

  const fetchDashboardData = async () => {
    try {
      const isFirstLoad = !dashboardData || !dashboardData.business || dashboardData.business.gyms.overall === 0;
      if (isFirstLoad) {
        setLoading(true);
      }

      const now = new Date();

      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [mainResponse, lastMonthResponse, currentMonthResponse, recurringResponse, webinarResponse] = await Promise.all([
        axiosInstance.get("/api/admin/dashboard/overview", {
          params: {
            fittbot_filter: "month",
            business_filter: businessGymOwnersFilter,
          },
        }),
        axiosInstance.get("/api/admin/dashboard/overview", {
          params: {
            fittbot_filter: "custom",
            business_filter: "month",
            custom_start_date: formatLocalDate(firstDayOfLastMonth),
            custom_end_date: formatLocalDate(lastDayOfLastMonth),
          },
        }),
        axiosInstance.get("/api/admin/dashboard/overview", {
          params: {
            fittbot_filter: "custom",
            business_filter: "month",
            custom_start_date: formatLocalDate(firstDayOfCurrentMonth),
            custom_end_date: formatLocalDate(now),
          },
        }),
        axiosInstance.get("").catch(() => null), //            --          /api/admin/dashboard/recurring-subscribers
        axiosInstance.get("").catch(() => null), //            --          /api/admin/dashboard/webinar-registrations-count
      ]);

      if (mainResponse.data.success) {
        setDashboardData({
          ...mainResponse.data.data,
          ...(recurringResponse?.data?.success && recurringResponse.data.data
            ? { recurringSubscribers: { total: recurringResponse.data.data.total || 0 } }
            : {}),
          ...(webinarResponse?.data?.success && webinarResponse.data.data
            ? { webinarRegistrations: { total: webinarResponse.data.data.total || 0 } }
            : {}),
        });
      } else {
        throw new Error(mainResponse.data.message || "Failed to fetch dashboard data");
      }

      if (lastMonthResponse.data.success && lastMonthResponse.data.data.fittbot.revenue.custom) {
        setLastMonthRevenue(lastMonthResponse.data.data.fittbot.revenue.custom);
      }

      if (currentMonthResponse.data.success && currentMonthResponse.data.data.fittbot.revenue.custom) {
        setCurrentMonthRevenue(currentMonthResponse.data.data.fittbot.revenue.custom);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // Fetch custom data for a specific metric
  const fetchCustomMetricData = async (metric, startDate, endDate) => {
    try {
      const params = {
        fittbot_filter: "custom",
        business_filter: "month",
        custom_start_date: startDate,
        custom_end_date: endDate,
      };

      const response = await axiosInstance.get("/api/admin/dashboard/overview", {
        params,
      });

      if (response.data.success) {
        const customValue = response.data.data.fittbot[metric].custom;
        setCustomRangeData(prev => ({
          ...prev,
          [metric]: {
            value: customValue,
            applied: true,
            startDate,
            endDate,
          }
        }));
      }
    } catch (err) {
    }
  };

  const handleCustomDateApply = async () => {
    if (customDateRange.startDate && customDateRange.endDate && customDateRange.activeMetric) {
      const metric = customDateRange.activeMetric;

      // Map metric to the correct filter setter, response key, and data section
      const metricConfig = {
        totalUsers: {
          filterKey: "totalUsers",
          responseKey: "totalUsers",
          dataSection: "fittbot",
          filterSetter: setFittbotTotalUsersFilter,
          apiFilter: "fittbot_filter",
        },
        revenue: {
          filterKey: "revenue",
          responseKey: "revenue",
          dataSection: "fittbot",
          filterSetter: setFittbotRevenueFilter,
          apiFilter: "fittbot_filter",
        },
        monthlyActiveUsers: {
          filterKey: "monthlyActiveUsers",
          responseKey: "monthlyActiveUsers",
          dataSection: "fittbot",
          filterSetter: setFittbotActiveUsersFilter,
          apiFilter: "fittbot_filter",
        },
        gymOwners: {
          filterKey: "gymOwners",
          responseKey: "gymOwners",
          dataSection: "business",
          filterSetter: setBusinessGymOwnersFilter,
          apiFilter: "business_filter",
        },
        gyms: {
          filterKey: "gyms",
          responseKey: "gyms",
          dataSection: "business",
          filterSetter: setBusinessGymsFilter,
          apiFilter: "business_filter",
        },
      };

      const config = metricConfig[metric];

      try {
        // Build params based on which section the metric belongs to
        const params = {
          fittbot_filter: "month",
          business_filter: "month",
          custom_start_date: customDateRange.startDate,
          custom_end_date: customDateRange.endDate,
        };
        params[config.apiFilter] = "custom";

        const response = await axiosInstance.get("/api/admin/dashboard/overview", {
          params,
        });

        if (response.data.success) {
          // Set only this metric's filter to custom
          config.filterSetter("custom");
          // Hide the modal
          setCustomDateRange({ ...customDateRange, show: false, activeMetric: null });
          setCustomType("date");

          // Update custom range data for this metric only
          setCustomRangeData(prev => ({
            ...prev,
            [metric]: {
              value: response.data.data[config.dataSection][config.responseKey].custom || (metric === "revenue" ? "₹0" : 0),
              applied: true,
              startDate: customDateRange.startDate,
              endDate: customDateRange.endDate,
            }
          }));
        } else {
          throw new Error(
            response.data.message || "Failed to fetch dashboard data"
          );
        }
      } catch (err) {
      }
    }
  };

  const handleCustomDateClose = () => {
    setCustomDateRange({ show: false, startDate: "", endDate: "", activeMetric: null });
    setCustomType("date");
  };

  const openCustomDateModal = (metric) => {
    setCustomDateRange({
      show: true,
      startDate: customRangeData[metric].startDate || "",
      endDate: customRangeData[metric].endDate || "",
      activeMetric: metric,
    });
  };

  // Use monthly revenue trends from API
  const monthlyRevenueData = dashboardData.fittbot.monthlyRevenueTrends;

  // Helper function to format gym plan metrics as fraction with percentage
  const formatGymPlanMetric = (value, total) => {
    if (!total || total === 0) {
      return (
        <div>
          <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
            {value} / 0
          </div>
          <div style={{ fontSize: "16px", color: "#888", marginTop: "4px" }}>
            N/A
          </div>
        </div>
      );
    }
    const percentage = Math.round((value / total) * 100);
    return (
      <div>
        <div style={{ fontSize: "32px", fontWeight: "600", color: "#fff" }}>
          {value} / {total}
        </div>
        <div style={{ fontSize: "16px", color: "#4ade80", marginTop: "4px" }}>
          {percentage}%
        </div>
      </div>
    );
  };

  // Track select element state for custom range re-click detection
  const selectValueOnFocusRef = useRef(null);
  const selectBlurTimeoutRef = useRef(null);

  const handleSelectFocus = (e) => {
    // Store the value when dropdown opens
    selectValueOnFocusRef.current = e.target.value;
  };

  const handleSelectBlur = (e, metric) => {
    const valueOnBlur = e.target.value;

    if (selectBlurTimeoutRef.current) {
      clearTimeout(selectBlurTimeoutRef.current);
    }

    selectBlurTimeoutRef.current = setTimeout(() => {

      if (
        selectValueOnFocusRef.current === "custom" &&
        valueOnBlur === "custom" &&
        customRangeData[metric].applied
      ) {
        openCustomDateModal(metric);
      }
      selectValueOnFocusRef.current = null;
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (selectBlurTimeoutRef.current) {
        clearTimeout(selectBlurTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
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
                Loading dashboard data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Custom Date Range Modal */}
      {customDateRange.show && (
        <div
          style={{
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
          }}
          onClick={handleCustomDateClose}
        >
          <div
            style={{
              backgroundColor: "#1e1e1e",
              padding: "30px",
              borderRadius: "12px",
              minWidth: "450px",
              maxWidth: "600px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "20px",
                fontSize: "20px",
              }}
            >
              Custom Date Range
            </h3>

            {/* Toggle buttons for customType */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setCustomType("date");
                  setCustomDateRange(prev => ({ ...prev, startDate: "", endDate: "" }));
                }}
                style={{
                  background: customType === "date" ? "#FF5757" : "#2a2a2a",
                  border: customType === "date" ? "1px solid #FF5757" : "1px solid #444",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  flex: 1
                }}
              >
                Specific Dates
              </button>
              <button
                type="button"
                onClick={() => setCustomType("month")}
                style={{
                  background: customType === "month" ? "#FF5757" : "#2a2a2a",
                  border: customType === "month" ? "1px solid #FF5757" : "1px solid #444",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  flex: 1
                }}
              >
                Month Interval
              </button>
              <button
                type="button"
                onClick={() => setCustomType("year")}
                style={{
                  background: customType === "year" ? "#FF5757" : "#2a2a2a",
                  border: customType === "year" ? "1px solid #FF5757" : "1px solid #444",
                  color: "#ffffff",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  flex: 1
                }}
              >
                Year Interval
              </button>
            </div>

            {/* Custom: Date range input fields */}
            {customType === "date" && (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#ccc",
                      fontSize: "14px",
                    }}
                  >
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setCustomDateRange({ ...customDateRange, startDate: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#ccc",
                      fontSize: "14px",
                    }}
                  >
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setCustomDateRange({ ...customDateRange, endDate: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </>
            )}

            {/* Custom: Month Range Selector */}
            {customType === "month" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#ccc" }}>
                    Start Month:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <select
                      value={customStartMonth}
                      onChange={(e) => setCustomStartMonth(parseInt(e.target.value))}
                      style={{
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
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
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#ccc" }}>
                    End Month:
                  </label>
                  <div style={{ display: "flex", gap: "5px" }}>
                    <select
                      value={customEndMonth}
                      onChange={(e) => setCustomEndMonth(parseInt(e.target.value))}
                      style={{
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
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
                        padding: "10px",
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#ccc" }}>
                    Start Year:
                  </label>
                  <select
                    value={customStartYearRange}
                    onChange={(e) => setCustomStartYearRange(parseInt(e.target.value))}
                    style={{
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
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
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "14px", color: "#ccc" }}>
                    End Year:
                  </label>
                  <select
                    value={customEndYearRange}
                    onChange={(e) => setCustomEndYearRange(parseInt(e.target.value))}
                    style={{
                      padding: "10px",
                      backgroundColor: "#2a2a2a",
                      border: "1px solid #444",
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
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCustomDateClose}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#555")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#444")}
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDateApply}
                disabled={!customDateRange.startDate || !customDateRange.endDate}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#FF5757",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: customDateRange.startDate && customDateRange.endDate ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  opacity: customDateRange.startDate && customDateRange.endDate ? 1 : 0.5,
                }}
                onMouseEnter={(e) =>
                  customDateRange.startDate && customDateRange.endDate
                    ? (e.target.style.backgroundColor = "#e64c4c")
                    : null
                }
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Change Notifications Modal */}
      {showPriceNotificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={handleAcknowledgePriceNotifications}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              padding: "30px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "550px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "15px",
                fontSize: "22px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaTag style={{ color: "#FF5757" }} />
              Gym Price Updates
            </h3>

            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
              The following gyms have recently updated their prices:
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "25px",
                paddingRight: "5px",
              }}
            >
              {priceNotifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "600", color: "#f9fafb", fontSize: "15px" }}>
                      {notif.gym_name}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        textTransform: "capitalize",
                        fontWeight: "500",
                        alignSelf: "center",
                      }}
                    >
                      {notif.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "15px", fontSize: "13px", color: "#d1d5db" }}>
                    <div>
                      Old Price: <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>₹{notif.last_price}</span>
                    </div>
                    <div>
                      New Price: <span style={{ color: "#10b981", fontWeight: "600" }}>₹{notif.latest_price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAcknowledgePriceNotifications}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#FF5757",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Notifications Modal */}
      {showBookingNotificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={handleAcknowledgeBookingNotifications}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              padding: "30px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "15px",
                fontSize: "22px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaCalendarCheck style={{ color: "#FF5757" }} />
              New Bookings Today
            </h3>

            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
              The following new bookings have been received today:
            </p>

            <div
              style={{
                maxHeight: "350px",
                overflowY: "auto",
                marginBottom: "25px",
                paddingRight: "5px",
              }}
            >
              {bookingNotifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600", color: "#f9fafb", fontSize: "15px" }}>
                      {notif.client_name}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        alignSelf: "center",
                        ...getBadgeStyles(notif.type)
                      }}
                    >
                      {notif.type}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                    {notif.details}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ color: "#10b981", fontWeight: "600", fontSize: "14px" }}>
                      ₹{notif.amount}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: "12px" }}>
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAcknowledgeBookingNotifications}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#FF5757",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
              >
                Acknowledge Bookings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Growth Metrics Section */}
      <div className="section-container">
        <h3 className="section-heading" style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ color: "#FF5757" }}>Gr</span><span style={{ color: "#fff" }}>owth Metrics</span>
        </h3>
      </div>

      {/* Fittbot Section */}
      <div className="section-container">
        <h5 className="section-heading">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble Users</span>
        </h5>
        <div className="row g-4">
          {/* Total Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/users")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">Total Fymble Users</h6>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <select
                    className="filter-dropdown"
                    value={fittbotTotalUsersFilter}
                    onChange={(e) => {
                      // Clear any pending blur timeout
                      if (selectBlurTimeoutRef.current) {
                        clearTimeout(selectBlurTimeoutRef.current);
                        selectBlurTimeoutRef.current = null;
                      }

                      const value = e.target.value;
                      if (value === "custom") {
                        setFittbotTotalUsersFilter("custom");
                        openCustomDateModal("totalUsers");
                      } else if (value === "lastMonth") {
                        const now = new Date();
                        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
                        const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);

                        const startDate = formatLocalDate(firstDayOfLastMonth);
                        const endDate = formatLocalDate(lastDayOfLastMonth);

                        fetchCustomMetricData("totalUsers", startDate, endDate);
                        setFittbotTotalUsersFilter("lastMonth");
                      } else if (value === "currentMonth") {
                        const now = new Date();
                        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                        const startDate = formatLocalDate(firstDayOfCurrentMonth);
                        const endDate = formatLocalDate(now);

                        fetchCustomMetricData("totalUsers", startDate, endDate);
                        setFittbotTotalUsersFilter("currentMonth");
                      } else {
                        setFittbotTotalUsersFilter(value);
                        setCustomRangeData(prev => ({
                          ...prev,
                          totalUsers: { value: 0, applied: false, startDate: "", endDate: "" }
                        }));
                      }
                    }}
                    onFocus={handleSelectFocus}
                    onBlur={(e) => handleSelectBlur(e, "totalUsers")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="currentMonth">MTD</option>
                    <option value="overall">Overall</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {fittbotTotalUsersFilter === "custom" && customRangeData.totalUsers.applied && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomDateModal("totalUsers");
                      }}
                      style={{
                        background: "#FF5757",
                        border: "none",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        cursor: "pointer",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      title="Edit Custom Range"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {(fittbotTotalUsersFilter === "lastMonth" || fittbotTotalUsersFilter === "currentMonth") && customRangeData.totalUsers.applied
                    ? customRangeData.totalUsers.value
                    : fittbotTotalUsersFilter === "custom" && customRangeData.totalUsers.applied
                      ? customRangeData.totalUsers.value
                      : dashboardData.fittbot.totalUsers[fittbotTotalUsersFilter]}
                </div>
              </div>
            </div>
          </div>

          {/* Active Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/users-stats")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">Active Users</h6>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <select
                    className="filter-dropdown"
                    value={fittbotActiveUsersFilter}
                    onChange={(e) => {
                      // Clear any pending blur timeout
                      if (selectBlurTimeoutRef.current) {
                        clearTimeout(selectBlurTimeoutRef.current);
                        selectBlurTimeoutRef.current = null;
                      }

                      const value = e.target.value;
                      if (value === "custom") {
                        setFittbotActiveUsersFilter("custom");
                        openCustomDateModal("monthlyActiveUsers");
                      } else if (value === "lastMonth") {
                        const now = new Date();
                        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
                        const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);

                        const startDate = formatLocalDate(firstDayOfLastMonth);
                        const endDate = formatLocalDate(lastDayOfLastMonth);

                        fetchCustomMetricData("monthlyActiveUsers", startDate, endDate);
                        setFittbotActiveUsersFilter("lastMonth");
                      } else if (value === "currentMonth") {
                        const now = new Date();
                        const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                        const startDate = formatLocalDate(firstDayOfCurrentMonth);
                        const endDate = formatLocalDate(now);

                        fetchCustomMetricData("monthlyActiveUsers", startDate, endDate);
                        setFittbotActiveUsersFilter("currentMonth");
                      } else {
                        setFittbotActiveUsersFilter(value);
                        setCustomRangeData(prev => ({
                          ...prev,
                          monthlyActiveUsers: { value: 0, applied: false, startDate: "", endDate: "" }
                        }));
                      }
                    }}
                    onFocus={handleSelectFocus}
                    onBlur={(e) => handleSelectBlur(e, "monthlyActiveUsers")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="currentMonth">MTD</option>
                    <option value="overall">Overall</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {fittbotActiveUsersFilter === "custom" && customRangeData.monthlyActiveUsers.applied && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomDateModal("monthlyActiveUsers");
                      }}
                      style={{
                        background: "#FF5757",
                        border: "none",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        cursor: "pointer",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      title="Edit Custom Range"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body-custom">
                <div className="metric-number" style={{ color: "#fff" }}>
                  {(fittbotActiveUsersFilter === "lastMonth" || fittbotActiveUsersFilter === "currentMonth") && customRangeData.monthlyActiveUsers.applied
                    ? customRangeData.monthlyActiveUsers.value.toLocaleString()
                    : fittbotActiveUsersFilter === "custom" && customRangeData.monthlyActiveUsers.applied
                      ? customRangeData.monthlyActiveUsers.value.toLocaleString()
                      : (dashboardData.fittbot.monthlyActiveUsers[fittbotActiveUsersFilter] || 0).toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                  Active {fittbotActiveUsersFilter !== "overall" && <span style={{ color: "#888", fontSize: "10px" }}>({fittbotActiveUsersFilter === "week" ? "last 7 days" : fittbotActiveUsersFilter === "month" ? "last 30 days" : fittbotActiveUsersFilter})</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Total Paying Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Paying Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.fittbot.totalPayingUsers || 0}
                </div>
                {dashboardData.fittbot.totalUsers?.overall > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                    {(((dashboardData.fittbot.totalPayingUsers || 0) / dashboardData.fittbot.totalUsers.overall) * 100).toFixed(1)}% of Total users
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Fymble Business Section */}
      <div className="section-container">
        <h3 className="section-heading">
          {" "}
          <span style={{ color: "#FF5757" }}>G</span><span style={{ color: "#fff" }}>yms</span>
        </h3>
        <div className="row g-4">
          {/* Gym Owners Card - Commented out */}
          {/*
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymowners")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">Actual Gyms</h6>
                <select
                  className="filter-dropdown"
                  value={businessGymOwnersFilter}
                  onChange={(e) => {
                    if (selectBlurTimeoutRef.current) {
                      clearTimeout(selectBlurTimeoutRef.current);
                      selectBlurTimeoutRef.current = null;
                    }

                    const value = e.target.value;
                    if (value === "custom") {
                      setBusinessGymOwnersFilter("custom");
                      openCustomDateModal("gymOwners");
                    } else {
                      setBusinessGymOwnersFilter(value);
                      setCustomRangeData(prev => ({
                        ...prev,
                        gymOwners: { value: 0, applied: false, startDate: "", endDate: "" }
                      }));
                    }
                  }}
                  onFocus={handleSelectFocus}
                  onBlur={(e) => handleSelectBlur(e, "gymOwners")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="overall">Overall</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {businessGymOwnersFilter === "custom" && customRangeData.gymOwners.applied
                    ? customRangeData.gymOwners.value
                    : dashboardData.business.gymOwners[businessGymOwnersFilter]}
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Gyms Card - Commented out */}
          {/*
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/stats")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">Onboarded Gyms</h6>
                <select
                  className="filter-dropdown"
                  value={businessGymsFilter}
                  onChange={(e) => {
                    if (selectBlurTimeoutRef.current) {
                      clearTimeout(selectBlurTimeoutRef.current);
                      selectBlurTimeoutRef.current = null;
                    }

                    const value = e.target.value;
                    if (value === "custom") {
                      setBusinessGymsFilter("custom");
                      openCustomDateModal("gyms");
                    } else {
                      setBusinessGymsFilter(value);
                      setCustomRangeData(prev => ({
                        ...prev,
                        gyms: { value: 0, applied: false, startDate: "", endDate: "" }
                      }));
                    }
                  }}
                  onFocus={handleSelectFocus}
                  onBlur={(e) => handleSelectBlur(e, "gyms")}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="overall">Overall</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {businessGymsFilter === "custom" && customRangeData.gyms.applied
                    ? customRangeData.gyms.value
                    : dashboardData.business.gyms[businessGymsFilter]}
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Live Gyms Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/verified-gyms")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Live Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.business.verifiedGyms?.verified || 0} / {dashboardData.business.verifiedGyms?.total || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Unverified Gyms Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/unverified-gyms")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Unverified Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.business.unverifiedGyms || 0} / {dashboardData.business.verifiedGyms?.total || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Unverified Splitup Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/unverified-splitup")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Unverified Splitup</h6>
              </div>
              <div className="card-body-custom">
                <div style={{ display: "flex", gap: "20px" }}>
                  {/* Red Section */}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
                      <FaTag size={24} style={{ color: "#FF5757" }} />
                    </div>
                    <div className="metric-number" style={{ fontSize: "24px" }}>
                      {dashboardData.business.unverifiedSplitup?.red || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      Red
                    </div>
                  </div>

                  {/* Hold Section */}
                  <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #333" }}>
                    <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
                      <FaTag size={24} style={{ color: "#fbbf24" }} />
                    </div>
                    <div className="metric-number" style={{ fontSize: "24px" }}>
                      {dashboardData.business.unverifiedSplitup?.hold || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      Hold
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Metrics Section */}
      <div className="section-container">
        <h3 className="section-heading" style={{ textAlign: "center", marginBottom: "30px" }}>
          <span style={{ color: "#FF5757" }}>Revenue</span> Metrics
        </h3>
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          {(() => {
            // Parse revenue strings to numbers (remove ₹ and commas)
            const parseRevenue = (revenueStr) => {
              if (typeof revenueStr === 'number') return revenueStr;
              if (!revenueStr || revenueStr === "₹0") return 0;
              return parseFloat(revenueStr.replace(/[₹,]/g, '')) || 0;
            };

            const lastMonth = parseRevenue(lastMonthRevenue);
            const currentMonth = parseRevenue(currentMonthRevenue);

            // Calculate MoM percentage
            let momText = "No data";
            let momColor = "#888";

            if (lastMonth > 0) {
              const momPercentage = ((currentMonth - lastMonth) / lastMonth) * 100;
              const sign = momPercentage >= 0 ? "+" : "";
              momText = `${sign}${momPercentage.toFixed(1)}%`;
              momColor = momPercentage >= 0 ? "#4ade80" : "#ef4444";
            } else if (lastMonth === 0 && currentMonth > 0) {
              momText = "+∞%";
              momColor = "#4ade80";
            } else if (lastMonth === 0 && currentMonth === 0) {
              momText = "0%";
              momColor = "#888";
            }

            return (
              <span style={{ fontSize: "16px", color: "#888" }}>
                MoM Growth: <span style={{ color: momColor, fontWeight: "600", marginLeft: "8px" }}>{momText}</span> compare to last month
              </span>
            );
          })()}
        </div>
        <div className="row g-4">
          {/* Total Revenue Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/revenue?filter=overall")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">GMV</h6>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <select
                    className="filter-dropdown"
                    value={fittbotRevenueFilter}
                    onChange={(e) => {
                      // Clear any pending blur timeout
                      if (selectBlurTimeoutRef.current) {
                        clearTimeout(selectBlurTimeoutRef.current);
                        selectBlurTimeoutRef.current = null;
                      }

                      const value = e.target.value;
                      if (value === "custom") {
                        setFittbotRevenueFilter("custom");
                        openCustomDateModal("revenue");
                      } else if (value === "lastMonth") {
                        // Calculate previous calendar month date range
                        const now = new Date();
                        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
                        const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);

                        // Format dates as YYYY-MM-DD
                        const startDate = formatLocalDate(firstDayOfLastMonth);
                        const endDate = formatLocalDate(lastDayOfLastMonth);

                        // Fetch data for last month
                        fetchCustomMetricData("revenue", startDate, endDate);
                        setFittbotRevenueFilter("lastMonth");
                      } else {
                        setFittbotRevenueFilter(value);
                        setCustomRangeData(prev => ({
                          ...prev,
                          revenue: { value: "₹0", applied: false, startDate: "", endDate: "" }
                        }));
                      }
                    }}
                    onFocus={handleSelectFocus}
                    onBlur={(e) => handleSelectBlur(e, "revenue")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="overall">Overall</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {fittbotRevenueFilter === "custom" && customRangeData.revenue.applied && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCustomDateModal("revenue");
                      }}
                      style={{
                        background: "#FF5757",
                        border: "none",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: "500",
                        cursor: "pointer",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      title="Edit Custom Range"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {fittbotRevenueFilter === "lastMonth" && customRangeData.revenue.applied
                    ? customRangeData.revenue.value
                    : fittbotRevenueFilter === "custom" && customRangeData.revenue.applied
                      ? customRangeData.revenue.value
                      : dashboardData.fittbot.revenue[fittbotRevenueFilter]}
                </div>
              </div>
            </div>
          </div>

          {/* Last Month Revenue Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/revenue?filter=last_month")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Last Month Revenue</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {lastMonthRevenue}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  {(() => {
                    const now = new Date();
                    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
                    return `${monthNames[lastMonthDate.getMonth()]} ${lastMonthDate.getFullYear()}`;
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Current Month Revenue Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/revenue?filter=current_month")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Current Month Revenue</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {currentMonthRevenue}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  {(() => {
                    const now = new Date();
                    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
                    const dayNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th",
                      "11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th",
                      "21st", "22nd", "23rd", "24th", "25th", "26th", "27th", "28th", "29th", "30th", "31st"];
                    const day = now.getDate();
                    return `${monthNames[now.getMonth()]} 1 - ${dayNames[day - 1] || day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}`;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      {/* <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Nutrition</span><span style={{ color: "#fff" }}> Plans</span>
        </h3>
        <div className="row g-4">
          {/* Nutrition Plans Card */}
      {/* <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/fittbot-subscriptions")}
            >
              <div className="card-header-custom">
                <h6 className="card-title">Nutrition Plans</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.plans.fittbotSubscriptions.total}
                </div>
                <div className="metric-change positive">
                  Unique Users
                </div>
              </div>
            </div>
          </div> */}

      {/* Complementary given Card */}
      {/* <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/complimentary")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Complementary given</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.plans.complimentary || 0}
                </div>
                <div className="metric-description">
                  Complementary plans
                </div>
              </div>
            </div>
          </div> */}

      {/* Webinar Registrations Card */}
      {/*
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/webinar-registrations")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Webinar Registrations</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.webinarRegistrations?.total ?? 0}
                </div>
                <div className="metric-description">
                  Total registrations
                </div>
              </div>
            </div>
          </div>
          */}
      {/* </div>
      </div> */}

      {/* GYM Mate Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>GYM</span> Mate
        </h3>
        <div className="row g-4">
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymmate")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">GYM Mate</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymMate?.total ?? 0}
                </div>
                <div className="metric-description">
                  Completed onboarding
                </div>
                {dashboardData.fittbot.totalUsers?.overall > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.total || 0) / dashboardData.fittbot.totalUsers.overall) * 100).toFixed(1)}% of total users
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly Active Users Card */}
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Monthly Active Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number" style={{ color: "#FF5757" }}>
                  {dashboardData.gymMate?.monthly_active_users?.toLocaleString() ?? 0}
                </div>
                <div className="metric-description">
                  Last 3 months average
                </div>
                {dashboardData.fittbot.totalUsers?.overall > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.monthly_active_users || 0) / dashboardData.fittbot.totalUsers.overall) * 100).toFixed(1)}% of total users
                  </div>
                )}
                {dashboardData.gymMate?.total > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.monthly_active_users || 0) / dashboardData.gymMate.total) * 100).toFixed(1)}% of GYM Mate users
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Active Users Card */}
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Weekly Active Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number" style={{ color: "#fcad10ff" }}>
                  {dashboardData.gymMate?.weekly_active_users?.toLocaleString() ?? 0}
                </div>
                <div className="metric-description">
                  Last 3 weeks average
                </div>
                {dashboardData.fittbot.totalUsers?.overall > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.weekly_active_users || 0) / dashboardData.fittbot.totalUsers.overall) * 100).toFixed(1)}% of total users
                  </div>
                )}
                {dashboardData.gymMate?.total > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.weekly_active_users || 0) / dashboardData.gymMate.total) * 100).toFixed(1)}% of GYM Mate users
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Daily Active Users Card */}
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Daily Active Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number" style={{ color: "#15cc25ff" }}>
                  {dashboardData.gymMate?.daily_active_users?.toLocaleString() ?? 0}
                </div>
                <div className="metric-description">
                  Last 3 days average
                </div>
                {dashboardData.fittbot.totalUsers?.overall > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.daily_active_users || 0) / dashboardData.fittbot.totalUsers.overall) * 100).toFixed(1)}% of total users
                  </div>
                )}
                {dashboardData.gymMate?.total > 0 && (
                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px", fontWeight: "600" }}>
                    {(((dashboardData.gymMate?.daily_active_users || 0) / dashboardData.gymMate.total) * 100).toFixed(1)}% of GYM Mate users
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Plans Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Gym</span> Plans
        </h3>
        <div className="row g-4">
          {/* Session Plans Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=session")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Fitness Classes</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {formatGymPlanMetric(dashboardData.gymPlans.sessionPlans, dashboardData.gymPlans.totalGyms)}
                </div>
              </div>
            </div>
          </div>

          {/* Membership Plans Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=membership")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Membership Plans</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {formatGymPlanMetric(dashboardData.gymPlans.membershipPlans, dashboardData.gymPlans.totalGyms)}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Pass Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=dailyPass")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Daily Pass</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {formatGymPlanMetric(dashboardData.gymPlans.dailyPass, dashboardData.gymPlans.totalGyms)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kyra AI Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Kyra</span> AI
        </h3>
        <div className="row g-4">
          {/* Active Subscriptions Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/kyra?tab=subscriptions")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Active subscriptions</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.kyraAI["active_subscribers"]}
                </div>
              </div>
            </div>
          </div>

          {/* Kyra Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/kyra?tab=users")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Kyra Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.kyraAI["kyra_users"]}
                </div>
              </div>
            </div>
          </div>
        </div>        
      </div>

      {/* Gym Photos Details Section - Commented out */}
      {/*
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Gym</span> Photos Details
        </h3>
        <div className="row g-4">
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=studio")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Verified Studio</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.studio || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=onboard")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Pending Photo verification</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.onboard || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=noUploads")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Photos Not Uploaded</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.noUploads || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      */}

      {/* Recurring Subscribers Section */}
      {/* <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Recurring Nutrition</span> Subscribers
        </h3>
        <div className="row g-4">
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/recurring-subscribers")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Recurring Nutrition Subscribers</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.recurringSubscribers?.total ?? 0}
                </div>
                <div className="metric-description">
                  Clients subscribed multiple times
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Reward Program Participants Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Reward Program</span> Participants
        </h3>
        <div className="row g-4">
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/reward-participants")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Participants</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.rewardProgram?.totalParticipants ?? 0}
                </div>
                <div className="metric-description">
                  Reward program opt-ins
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Tickets Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Support</span> Tickets
        </h3>
        <div className="row g-4">
          {/* Gym Support Tickets Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/tickets?type=gym")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Gym</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.support.totalTickets.gym}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  Total support tickets
                </div>
              </div>
            </div>
          </div>

          {/* Client Support Tickets Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/tickets?type=client")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Client</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.support.totalTickets.client}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  Total support tickets
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
