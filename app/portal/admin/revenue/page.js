"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { formatGymName } from "@/lib/utils";

export default function RevenueAnalytics() {
  const { handleExportTrigger, secureExportProps } = useSecureExport();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [revenueByCity, setRevenueByCity] = useState([]);
  const [inAppRevenueByLocation, setInAppRevenueByLocation] = useState([]);

  // Check if tab parameter exists in URL to set initial active tab
  const getInitialTab = () => {
    const tabParam = searchParams.get("tab");
    return tabParam === "purchases" ? "purchases" : "revenue";
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update activeTab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "purchases" && activeTab !== "purchases") {
      setActiveTab("purchases");
    } else if (!tabParam && activeTab === "purchases") {
      setActiveTab("revenue");
    }
  }, [searchParams]);

  // Get filter from URL or default to last_30
  const getInitialFilter = () => {
    const filterParam = searchParams.get("filter");
    if (filterParam && ["today", "last_7", "last_30", "last_month", "current_month", "overall", "custom"].includes(filterParam)) {
      return filterParam;
    }
    return "last_30";
  };

  // Filter states
  const [dateFilter, setDateFilter] = useState(getInitialFilter());
  const [source, setSource] = useState("all");
  const [gymId, setGymId] = useState("");
  const [gymName, setGymName] = useState("");
  const [allGymsList, setAllGymsList] = useState([]); // Store all gyms separately from filtered data

  // Custom filter interval states
  const [customType, setCustomType] = useState("date");
  const [customStartMonth, setCustomStartMonth] = useState(new Date().getMonth() + 1);
  const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth() + 1);
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [customStartYearRange, setCustomStartYearRange] = useState(new Date().getFullYear());
  const [customEndYearRange, setCustomEndYearRange] = useState(new Date().getFullYear());

  // Initialize dates based on the initial filter
  const getInitialDates = () => {
    const today = new Date();
    const filter = getInitialFilter();

    if (filter === "today") {
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (filter === "last_7") {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return {
        start: sevenDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (filter === "last_30") {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    } else if (filter === "last_month") {
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
      const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
      return {
        start: `${firstDayOfLastMonth.getFullYear()}-${String(firstDayOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfLastMonth.getDate()).padStart(2, '0')}`,
        end: `${lastDayOfLastMonth.getFullYear()}-${String(lastDayOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfLastMonth.getDate()).padStart(2, '0')}`
      };
    } else if (filter === "current_month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstDayOfCurrentMonth = new Date(year, month, 1);
      const yearEnd = firstDayOfCurrentMonth.getFullYear();
      const monthEnd = firstDayOfCurrentMonth.getMonth() + 1;
      const lastDayOfMonth = new Date(yearEnd, monthEnd, 0).getDate();
      const endDate = new Date(yearEnd, monthEnd - 1, Math.min(today.getDate(), lastDayOfMonth));
      const startStr = `${firstDayOfCurrentMonth.getFullYear()}-${String(firstDayOfCurrentMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfCurrentMonth.getDate()).padStart(2, '0')}`;
      const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      return {
        start: startStr,
        end: endStr
      };
    }
    // Default to last_30
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);

  useEffect(() => {
    // Fetch data when filters change or when switching tabs
    if (dateFilter === "overall") {
      // For overall, don't send date params and clear state
      setStartDate("");
      setEndDate("");
      if (activeTab === "revenue") fetchRevenueAnalytics(true);
      if (activeTab === "purchases") fetchPurchaseAnalytics(true);
    } else if (dateFilter === "custom") {
      // For custom, let the other useEffect handle it
      return;
    } else {
      // For predefined filters (today, last_7, last_30, last_month, current_month)
      // Calculate dates inline to avoid race conditions
      const today = new Date();
      let start, end;

      if (dateFilter === "today") {
        start = end = today.toISOString().split('T')[0];
      } else if (dateFilter === "last_7") {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        start = sevenDaysAgo.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
      } else if (dateFilter === "last_30") {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        start = thirtyDaysAgo.toISOString().split('T')[0];
        end = today.toISOString().split('T')[0];
      } else if (dateFilter === "last_month") {
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const firstDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1);
        const lastDayOfLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0);
        start = `${firstDayOfLastMonth.getFullYear()}-${String(firstDayOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfLastMonth.getDate()).padStart(2, '0')}`;
        end = `${lastDayOfLastMonth.getFullYear()}-${String(lastDayOfLastMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayOfLastMonth.getDate()).padStart(2, '0')}`;
      } else if (dateFilter === "current_month") {
        const year = today.getFullYear();
        const month = today.getMonth();
        const firstDayOfCurrentMonth = new Date(year, month, 1);
        const yearEnd = firstDayOfCurrentMonth.getFullYear();
        const monthEnd = firstDayOfCurrentMonth.getMonth() + 1;
        const lastDayOfMonth = new Date(yearEnd, monthEnd, 0).getDate();
        const endDate = new Date(yearEnd, monthEnd - 1, Math.min(today.getDate(), lastDayOfMonth));
        start = `${firstDayOfCurrentMonth.getFullYear()}-${String(firstDayOfCurrentMonth.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfCurrentMonth.getDate()).padStart(2, '0')}`;
        end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      }

      // Update state for display purposes and fetch with calculated dates
      setStartDate(start);
      setEndDate(end);

      // Fetch with the calculated dates (not from state to avoid race condition)
      const fetchWithDates = async () => {
        if (activeTab === "revenue") {
          try {
            setLoading(true);
            const params = { start_date: start, end_date: end };
            if (source !== "all") params.source = source;
            if (gymId) params.gym_id = gymId;
            const response = await axiosInstance.get("/api/admin/dashboard/revenue-analytics", { params });
            if (response.data.success) setAnalyticsData(response.data.data);
          } catch (err) {
            console.error("Error fetching revenue analytics:", err);
          } finally {
            setLoading(false);
          }
        }
        if (activeTab === "purchases") {
          try {
            setLoading(true);
            const params = { start_date: start, end_date: end };
            if (source !== "all") params.source = source;
            if (gymId) params.gym_id = gymId;
            const response = await axiosInstance.get("/api/admin/dashboard/purchase-analytics", { params });
            if (response.data.success) {
              setPurchaseData(response.data.data);
              if (response.data.data.revenueByCity) {
                setRevenueByCity(response.data.data.revenueByCity);
              }
              if (response.data.data.inAppRevenueByLocation) {
                setInAppRevenueByLocation(response.data.data.inAppRevenueByLocation);
              }
            }
          } catch (err) {
            console.error("Error fetching purchase analytics:", err);
          } finally {
            setLoading(false);
          }
        }
      };
      fetchWithDates();
    }
  }, [dateFilter, source, gymId, activeTab]);

  // Separate useEffect for custom date changes
  useEffect(() => {
    // Only fetch when in custom mode and both dates are set
    if (dateFilter === "custom" && startDate && endDate) {
      if (activeTab === "revenue") fetchRevenueAnalytics(false);
      if (activeTab === "purchases") fetchPurchaseAnalytics(false);
    }
  }, [startDate, endDate]);

  // Sync month/year interval selections to startDate/endDate
  useEffect(() => {
    if (dateFilter === "custom") {
      if (customType === "month") {
        const start = `${customStartYear}-${String(customStartMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(customEndYear, customEndMonth, 0).getDate();
        const end = `${customEndYear}-${String(customEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        setStartDate(start);
        setEndDate(end);
      } else if (customType === "year") {
        setStartDate(`${customStartYearRange}-01-01`);
        setEndDate(`${customEndYearRange}-12-31`);
      }
    }
  }, [
    dateFilter, customType,
    customStartMonth, customStartYear,
    customEndMonth, customEndYear,
    customStartYearRange, customEndYearRange
  ]);

  const fetchRevenueAnalytics = async (isOverall = false) => {
    try {
      setLoading(true);
      const params = {};

      // Only send dates if not overall
      if (!isOverall && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      if (source !== "all") {
        params.source = source;
      }
      if (gymId) {
        params.gym_id = gymId;
      }

      const response = await axiosInstance.get("/api/admin/dashboard/revenue-analytics", {
        params,
      });

      if (response.data.success) {
        setAnalyticsData(response.data.data);
        // Update all gyms list from response (only when not filtered by gym)
        if (response.data.data?.gymBreakdown) {
          setAllGymsList(prev => {
            const newGyms = response.data.data.gymBreakdown;
            const gymMap = new Map();
            // Keep existing gyms
            prev.forEach(g => gymMap.set(g.gym_id.toString(), g));
            // Add/update new gyms
            newGyms.forEach(g => gymMap.set(g.gym_id.toString(), g));
            return Array.from(gymMap.values()).sort((a, b) => b.revenue - a.revenue);
          });
        }
        // Set gym name if gym filter is active and gymName is not set
        if (gymId && !gymName && response.data.data?.gymBreakdown) {
          const gym = response.data.data.gymBreakdown.find(g => g.gym_id.toString() === gymId);
          if (gym) setGymName(gym.gym_name);
        }
        // Also update gymName from current response if gymId matches
        if (gymId && response.data.data?.gymBreakdown) {
          const gym = response.data.data.gymBreakdown.find(g => g.gym_id.toString() === gymId);
          if (gym && gym.gym_name) setGymName(gym.gym_name);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch revenue analytics");
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseAnalytics = async (isOverall = false) => {
    try {
      setLoading(true);
      const params = {};

      // Only send dates if not overall
      if (!isOverall && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      if (source !== "all") {
        params.source = source;
      }
      if (gymId) {
        params.gym_id = gymId;
      }

      const response = await axiosInstance.get("/api/admin/dashboard/purchase-analytics", {
        params,
      });

      if (response.data.success) {
        setPurchaseData(response.data.data);
        // Set revenue by city
        if (response.data.data.revenueByCity) {
          setRevenueByCity(response.data.data.revenueByCity);
        }
        if (response.data.data.inAppRevenueByLocation) {
          setInAppRevenueByLocation(response.data.data.inAppRevenueByLocation);
        }
        // Update all gyms list from response (only when not filtered by gym)
        if (response.data.data?.gymBreakdown) {
          setAllGymsList(prev => {
            const newGyms = response.data.data.gymBreakdown;
            const gymMap = new Map();
            // Keep existing gyms
            prev.forEach(g => gymMap.set(g.gym_id.toString(), g));
            // Add/update new gyms
            newGyms.forEach(g => gymMap.set(g.gym_id.toString(), g));
            return Array.from(gymMap.values()).sort((a, b) => b.revenue - a.revenue);
          });
        }
        // Set gym name if gym filter is active and gymName is not set
        if (gymId && !gymName && response.data.data?.gymBreakdown) {
          const gym = response.data.data.gymBreakdown.find(g => g.gym_id.toString() === gymId);
          if (gym) setGymName(gym.gym_name);
        }
        // Also update gymName from current response if gymId matches
        if (gymId && response.data.data?.gymBreakdown) {
          const gym = response.data.data.gymBreakdown.find(g => g.gym_id.toString() === gymId);
          if (gym && gym.gym_name) setGymName(gym.gym_name);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch purchase analytics");
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleBack = () => {
    router.push("/portal/admin/home");
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (value === "custom") {
      // Reset to specific dates mode and clear dates
      setCustomType("date");
      setStartDate("");
      setEndDate("");
    }
    // For other filters, dates will be set by the useEffect
  };

  const handleExport = () => {
    handleExportTrigger(async () => {
      if (activeTab === "revenue") {
        if (!analyticsData) return;
        exportRevenueExcel();
      } else {
        if (!purchaseData) return;
        exportPurchaseExcel();
      }
    });
  };

  const exportRevenueExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["REVENUE ANALYTICS REPORT"],
      [""],
      ["Report Details"],
      ["Generated On", new Date().toLocaleString('en-IN')],
      [""],
      ["Filters Applied"],
      ["Start Date", formatDate(analyticsData.filters.startDate)],
      ["End Date", formatDate(analyticsData.filters.endDate)],
      ["Source", analyticsData.filters.source === "all" ? "All Sources" : (sourceLabels[analyticsData.filters.source] || analyticsData.filters.source)],
      ["Gym", analyticsData.filters.gymId === "all" ? "All Gyms" : analyticsData.filters.gymId],
      [""],
      ["Total Revenue"],
      ["Amount (INR)", analyticsData.totalRevenue],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Revenue by Source Sheet
    const sourceData = [
      ["Source", "Amount (INR)", "Percentage"],
      ...Object.entries(analyticsData.sourceSplitRupees).map(([key, value]) => [
        sourceLabels[key] || key,
        value,
        ((value / analyticsData.totalRevenue) * 100).toFixed(2) + "%"
      ])
    ];
    const sourceWs = XLSX.utils.aoa_to_sheet(sourceData);
    XLSX.utils.book_append_sheet(wb, sourceWs, "By Source");

    // Revenue Over Time Sheet
    if (analyticsData.revenueOverTime && analyticsData.revenueOverTime.length > 0) {
      const timeData = [
        ["Date", "Revenue (INR)"],
        ...analyticsData.revenueOverTime.map(item => [
          formatDate(item.date),
          item.revenue
        ])
      ];
      const timeWs = XLSX.utils.aoa_to_sheet(timeData);
      XLSX.utils.book_append_sheet(wb, timeWs, "Over Time");
    }

    // Revenue by Gym Sheet
    if (analyticsData.gymBreakdown && analyticsData.gymBreakdown.length > 0) {
      const gymData = [
        ["Gym ID", "Gym Name", "Revenue (INR)"],
        ...analyticsData.gymBreakdown.map(gym => [
          gym.gym_id,
          gym.gym_name,
          gym.revenue
        ])
      ];
      const gymWs = XLSX.utils.aoa_to_sheet(gymData);
      XLSX.utils.book_append_sheet(wb, gymWs, "By Gym");
    }

    // Generate and download Excel file
    const fileName = `revenue_analytics_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportPurchaseExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["PURCHASE ANALYTICS REPORT"],
      [""],
      ["Report Details"],
      ["Generated On", new Date().toLocaleString('en-IN')],
      [""],
      ["Filters Applied"],
      ["Start Date", formatDate(purchaseData.filters.startDate)],
      ["End Date", formatDate(purchaseData.filters.endDate)],
      ["Source", purchaseData.filters.source === "all" ? "All Sources" : (sourceLabels[purchaseData.filters.source] || purchaseData.filters.source)],
      ["Gym", purchaseData.filters.gymId === "all" ? "All Gyms" : purchaseData.filters.gymId],
      [""],
      ["Total Purchases"],
      ["Count", purchaseData.totalPurchases],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Purchases by Category Sheet
    const categoryData = [
      ["Category", "Purchases", "Unique Users"],
      ...getChartEntries(purchaseData).map(([key, value]) => [
        sourceLabels[key] || key,
        value.purchases,
        value.unique_users
      ])
    ];
    const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, categoryWs, "By Category");

    // Purchases Over Time Sheet
    if (purchaseData.purchasesOverTime && purchaseData.purchasesOverTime.length > 0) {
      const timeData = [
        ["Date", "Purchases"],
        ...purchaseData.purchasesOverTime.map(item => [
          formatDate(item.date),
          item.purchases
        ])
      ];
      const timeWs = XLSX.utils.aoa_to_sheet(timeData);
      XLSX.utils.book_append_sheet(wb, timeWs, "Over Time");
    }

    // Category-wise Over Time Sheets
    getChartEntries(purchaseData).forEach(([categoryKey, categoryValue]) => {
      if (categoryValue.purchases_over_time && categoryValue.purchases_over_time.length > 0) {
        const categoryTimeData = [
          ["Date", "Purchases"],
          ...categoryValue.purchases_over_time.map(item => [
            formatDate(item.date),
            item.purchases
          ])
        ];
        const categoryTimeWs = XLSX.utils.aoa_to_sheet(categoryTimeData);
        XLSX.utils.book_append_sheet(wb, categoryTimeWs, (sourceLabels[categoryKey] || categoryKey).slice(0, 31));
      }
    });

    // Generate and download Excel file
    const fileName = `purchase_analytics_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const sourceLabels = {
    daily_pass: "Daily Pass",
    weekly_pass: "Weekly Pass",
    sessions: "Fitness Classes",
    gym_membership: "Gym Membership",
    other: "Other Categories",
    ai_credits: "AI Credits",
    ai_diet_coach: "AI Diet Coach",
    kyra_ai: "Kyra AI"
  };

  const sourceColors = {
    daily_pass: "#3b82f6",
    weekly_pass: "#10b981",
    sessions: "#4CAF50",
    gym_membership: "#9C27B0", // Purple
    other: "#FFC107", // Yellow/Orange
    ai_credits: "#FF9800", // Orange
    ai_diet_coach: "#E91E63", // Pink
    kyra_ai: "#a855f7" // Purple
  };

  const getChartEntries = (data) => {
    if (!data || !data.categoryBreakdown) return [];
    
    // If the selected source filter is 'other', show only the subcategories of other
    if (source === "other" && data.otherBreakdown) {
      return Object.entries(data.otherBreakdown);
    }
    
    // Otherwise (source is all/pre-filtered), return categoryBreakdown as is (with lumped 'other')
    return Object.entries(data.categoryBreakdown);
  };

  const getRevenueChartEntries = (data) => {
    if (!data || !data.sourceSplitRupees) return [];
    
    // If the selected source filter is 'other', show only the subcategories of other
    if (source === "other" && data.otherBreakdownRupees) {
      return Object.entries(data.otherBreakdownRupees);
    }
    
    // Otherwise (source is all/pre-filtered), return sourceSplitRupees as is (with lumped 'other')
    return Object.entries(data.sourceSplitRupees);
  };

  // Combined gym list from both analytics data for dropdown
  const getAllGyms = () => {
    // Use the persisted allGymsList if available, otherwise fall back to current data
    if (allGymsList.length > 0) {
      return allGymsList;
    }

    const gymMap = new Map();

    // Add gyms from revenue analytics
    analyticsData?.gymBreakdown?.forEach(gym => {
      gymMap.set(gym.gym_id.toString(), gym);
    });

    // Add gyms from purchase analytics
    purchaseData?.gymBreakdown?.forEach(gym => {
      if (!gymMap.has(gym.gym_id.toString())) {
        gymMap.set(gym.gym_id.toString(), gym);
      }
    });

    return Array.from(gymMap.values()).sort((a, b) => b.revenue - a.revenue);
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#0f0f0f", minHeight: "100vh", color: "#ffffff" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "1px solid #FF5757",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "20px",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255, 87, 87, 0.1)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "600", margin: 0 }}>Analytics</h1>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={() => setActiveTab("revenue")}
                style={{
                  background: activeTab === "revenue" ? "#FF5757" : "transparent",
                  border: activeTab === "revenue" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "revenue") e.target.style.borderColor = "#FF5757";
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "revenue") e.target.style.borderColor = "#3a3a3a";
                }}
              >
                Total Revenue Analytics
              </button>
              <button
                onClick={() => setActiveTab("purchases")}
                style={{
                  background: activeTab === "purchases" ? "#FF5757" : "transparent",
                  border: activeTab === "purchases" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== "purchases") e.target.style.borderColor = "#FF5757";
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== "purchases") e.target.style.borderColor = "#3a3a3a";
                }}
              >
                Purchase Analytics
              </button>
            </div>
          </div>
        </div>
        {!loading && ((activeTab === "revenue" && analyticsData) || (activeTab === "purchases" && purchaseData)) && (
          <button
            onClick={handleExport}
            style={{
              background: "#FF5757",
              border: "none",
              color: "#ffffff",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#e64c4c"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#FF5757"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Excel
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: "#1a1a1a",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "24px",
        border: "1px solid #2a2a2a"
      }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#aaa" }}>
              Date Filter
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              <option value="today">Today</option>
              <option value="last_7">Last 7 Days</option>
              <option value="last_30">Last 30 Days</option>
              <option value="last_month">Last Month</option>
              <option value="current_month">MTD</option>
              <option value="overall">Overall</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {dateFilter === "custom" && (
            <div style={{ width: "100%", marginTop: "16px", padding: "16px", backgroundColor: "#222", borderRadius: "8px", border: "1px solid #333" }}>
              {/* Toggle buttons */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <button
                  type="button"
                  onClick={() => { setCustomType("date"); setStartDate(""); setEndDate(""); }}
                  style={{
                    background: customType === "date" ? "#FF5757" : "#2a2a2a",
                    border: customType === "date" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                    color: "#ffffff", padding: "8px 16px", borderRadius: "6px",
                    cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s ease"
                  }}
                >By Specific Dates</button>
                <button
                  type="button"
                  onClick={() => setCustomType("month")}
                  style={{
                    background: customType === "month" ? "#FF5757" : "#2a2a2a",
                    border: customType === "month" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                    color: "#ffffff", padding: "8px 16px", borderRadius: "6px",
                    cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s ease"
                  }}
                >By Month Interval</button>
                <button
                  type="button"
                  onClick={() => setCustomType("year")}
                  style={{
                    background: customType === "year" ? "#FF5757" : "#2a2a2a",
                    border: customType === "year" ? "1px solid #FF5757" : "1px solid #3a3a3a",
                    color: "#ffffff", padding: "8px 16px", borderRadius: "6px",
                    cursor: "pointer", fontSize: "13px", fontWeight: "500", transition: "all 0.2s ease"
                  }}
                >By Year Interval</button>
              </div>

              {/* Specific Dates */}
              {customType === "date" && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}
                    />
                  </div>
                </div>
              )}

              {/* Month Interval */}
              {customType === "month" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>Start Month</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <select value={customStartMonth} onChange={(e) => setCustomStartMonth(parseInt(e.target.value))}
                        style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                          <option key={i+1} value={i+1}>{m}</option>
                        ))}
                      </select>
                      <select value={customStartYear} onChange={(e) => setCustomStartYear(parseInt(e.target.value))}
                        style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ color: "#666", fontSize: "18px", marginTop: "18px" }}>→</div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>End Month</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <select value={customEndMonth} onChange={(e) => setCustomEndMonth(parseInt(e.target.value))}
                        style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                          <option key={i+1} value={i+1}>{m}</option>
                        ))}
                      </select>
                      <select value={customEndYear} onChange={(e) => setCustomEndYear(parseInt(e.target.value))}
                        style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(yr => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Year Interval */}
              {customType === "year" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>Start Year</label>
                    <select value={customStartYearRange} onChange={(e) => setCustomStartYearRange(parseInt(e.target.value))}
                      style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ color: "#666", fontSize: "18px", marginTop: "18px" }}>→</div>
                  <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "#aaa" }}>End Year</label>
                    <select value={customEndYearRange} onChange={(e) => setCustomEndYearRange(parseInt(e.target.value))}
                      style={{ padding: "10px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "6px", color: "white", fontSize: "14px" }}>
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#aaa" }}>
              Source
            </label>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                // Clear gym filter when source is changed
                setGymId("");
                setGymName("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #3a3a3a",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "14px",
              }}
            >
              <option value="all">All Sources</option>
              <option value="daily_pass">Daily Pass</option>
              <option value="weekly_pass">Weekly Pass</option>
              <option value="sessions">Fitness Classes</option>
              {/* <option value="fittbot_subscription">Nutrition Plan</option> */}
              <option value="gym_membership">Gym Membership</option>
              <option value="kyra_ai">Kyra AI</option>
              <option value="other">Other Categories</option>
            </select>
          </div>
          {activeTab === "revenue" && (
            <div style={{ flex: 1, minWidth: "200px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#aaa" }}>
                Gym
              </label>
              <select
                value={gymId}
                onChange={(e) => {
                  const selectedGymId = e.target.value;
                  setGymId(selectedGymId);
                  // Clear source filter when gym is changed (except "All Gyms")
                  if (selectedGymId !== "") {
                    setSource("all");
                  }
                  // Find and set gym name from combined gym list, or clear if "All Gyms" is selected
                  if (selectedGymId === "") {
                    setGymName("");
                  } else {
                    const allGyms = getAllGyms();
                    const selectedGym = allGyms.find(g => g.gym_id.toString() === selectedGymId);
                    setGymName(selectedGym?.gym_name || "");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "14px",
                }}
              >
                <option value="">All Gyms</option>
                {getAllGyms().map((gym) => (
                  <option key={gym.gym_id} value={gym.gym_id.toString()}>
                    {formatGymName(gym.gym_name)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #3a3a3a",
            borderTop: "3px solid #FF5757",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
        </div>
      ) : activeTab === "revenue" && analyticsData ? (
        /* REVENUE ANALYTICS TAB */
        <div>
          {/* Total Revenue Card */}
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #2a2a2a",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "10px", margin: 0 }}>
              Total Revenue
            </p>
            <h2 style={{
              fontSize: "48px",
              fontWeight: "700",
              margin: "10px 0",
              color: "#ffffffff"
            }}>
              {formatCurrency(analyticsData.totalRevenue)}
            </h2>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "10px", margin: 0 }}>
              {dateFilter === "overall"
                ? "Overall"
                : `${formatDate(analyticsData.filters.startDate)} - ${formatDate(analyticsData.filters.endDate)}`
              }
              {analyticsData.filters.source !== "all" && ` • ${sourceLabels[analyticsData.filters.source] || analyticsData.filters.source}`}
              {analyticsData.filters.gymId !== "all" && ` • ${formatGymName(gymName) || analyticsData.filters.gymId}`}
            </p>
          </div>

          {/* Source-wise Breakdown */}
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #2a2a2a"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
              Revenue by Source
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              {(() => {
                const entries = getRevenueChartEntries(analyticsData);
                const total = entries.reduce((sum, [_, val]) => sum + (val || 0), 0);
                return entries.map(([key, value]) => (
                  <div key={key} style={{
                    backgroundColor: "#2a2a2a",
                    padding: "12px 14px",
                    borderRadius: "6px",
                    border: `1px solid ${sourceColors[key] || "#888"}`
                  }}>
                    <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "6px" }}>
                      {sourceLabels[key] || key}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: sourceColors[key] || "#888" }}>
                      {formatCurrency(value)}
                    </div>
                    <div style={{ fontSize: "10px", color: "#888", marginTop: "3px" }}>
                      {total > 0 ? ((value / total) * 100).toFixed(1) : 0}% of total
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "24px", marginBottom: "24px" }}>
            {/* Revenue Over Time Chart */}
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Revenue Over Time
              </h3>
              {analyticsData.revenueOverTime && analyticsData.revenueOverTime.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {analyticsData.revenueOverTime.map((item, index) => {
                      const maxRevenue = Math.max(...analyticsData.revenueOverTime.map(d => d.revenue));
                      const barWidth = (item.revenue / maxRevenue) * 100;

                      return (
                        <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ minWidth: "100px", fontSize: "12px", color: "#888" }}>
                            {formatDate(item.date)}
                          </div>
                          <div style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: "4px", height: "24px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${barWidth}%`,
                                height: "100%",
                                backgroundColor: "#FFB32E",
                                transition: "width 0.3s ease"
                              }}
                            />
                          </div>
                          <div style={{ minWidth: "80px", textAlign: "right", fontSize: "13px", fontWeight: "500" }}>
                            {formatCurrency(item.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No data available</p>
              )}
            </div>

            {/* Source-wise Split Chart - Pie Chart */}
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "28px",
              borderRadius: "12px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "28px" }}>
                Source Distribution
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                {/* Pie Chart */}
                <div style={{ position: "relative", width: "280px", height: "280px", flexShrink: 0 }}>
                  <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
                    {(() => {
                      const entries = getRevenueChartEntries(analyticsData);
                      let currentAngle = 0;
                      const total = entries.reduce((sum, [_, val]) => sum + (val || 0), 0);

                      return entries.map(([key, value]) => {
                        const percentage = total > 0 ? (value / total) * 100 : 0;
                        const angle = total > 0 ? (value / total) * 360 : 0;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;

                        const x1 = 140 + 115 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 140 + 115 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 140 + 115 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 140 + 115 * Math.sin((endAngle * Math.PI) / 180);

                        const largeArcFlag = angle > 180 ? 1 : 0;

                        const pathData = angle === 360
                          ? `M 140 140 m -115 0 a 115 115 0 1 0 230 0 a 115 115 0 1 0 -230 0`
                          : `M 140 140 L ${x1} ${y1} A 115 115 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        currentAngle += angle;

                        return (
                          <path
                            key={key}
                            d={pathData}
                            fill={sourceColors[key] || "#888"}
                            stroke="#1a1a1a"
                            strokeWidth="3"
                            style={{
                              transition: "transform 0.2s, opacity 0.2s",
                              cursor: "pointer",
                              transformOrigin: "140px 140px"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.opacity = "0.85";
                              e.target.style.transform = "scale(1.03)";
                              setHoveredSlice({ key, value, percentage });
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.opacity = "1";
                              e.target.style.transform = "scale(1)";
                              setHoveredSlice(null);
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center donut hole */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    backgroundColor: "#1a1a1a",
                    pointerEvents: "none",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px"
                  }}>
                    {hoveredSlice ? (
                      <>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px", fontWeight: "500", textAlign: "center" }}>
                          {sourceLabels[hoveredSlice.key] || hoveredSlice.key}
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: sourceColors[hoveredSlice.key] || "#888", lineHeight: "1.2" }}>
                          {hoveredSlice.percentage.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                          {formatCurrency(hoveredSlice.value)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", lineHeight: "1", letterSpacing: "1px" }}>
                          FYMBLE
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Legend with Total */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: "180px" }}>
                  {/* Total Display */}
                  <div style={{
                    padding: "16px 20px",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "8px",
                    border: "1px solid #3a3a3a",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Total Revenue
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", lineHeight: "1" }}>
                      {formatCurrency(analyticsData.totalRevenue)}
                    </div>
                  </div>

                  {/* Legend Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(() => {
                      const entries = getRevenueChartEntries(analyticsData);
                      const total = entries.reduce((sum, [_, val]) => sum + (val || 0), 0);
                      return entries.map(([key, value]) => {
                        const percentage = total > 0 ? (value / total) * 100 : 0;

                        return (
                          <div key={key} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            backgroundColor: "#2a2a2a",
                            borderRadius: "6px",
                            border: "1px solid #3a3a3a",
                            transition: "border-color 0.2s"
                          }}>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "3px",
                                backgroundColor: sourceColors[key] || "#888",
                                flexShrink: 0,
                                boxShadow: `0 2px 4px ${sourceColors[key]}40`
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", color: "#fff", fontWeight: "500", marginBottom: "1px" }}>
                                {sourceLabels[key] || key}
                              </div>
                              <div style={{ fontSize: "10px", color: "#888" }}>
                                {formatCurrency(value)}
                              </div>
                            </div>
                            <div style={{
                              fontSize: "15px",
                              fontWeight: "700",
                              color: sourceColors[key] || "#888",
                              flexShrink: 0,
                              minWidth: "50px",
                              textAlign: "right"
                            }}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trend Line Chart */}
          {analyticsData.revenueOverTime && analyticsData.revenueOverTime.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Revenue Trend
              </h3>
              <div style={{
                position: "relative",
                height: "350px",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden"
              }}>
                <svg
                  width="100%"
                  height="100%"
                  style={{
                    overflow: "visible",
                    minWidth: `${Math.max(800, analyticsData.revenueOverTime.length * 80)}px`
                  }}
                >
                  {(() => {
                    const data = analyticsData.revenueOverTime;
                    const pointSpacing = 80;
                    const padding = { top: 20, right: 30, bottom: 60, left: 100 };
                    const chartWidth = Math.max(800, data.length * pointSpacing) - padding.left - padding.right;
                    const chartHeight = 350 - padding.top - padding.bottom;
                    const maxRevenue = Math.max(...data.map(d => d.revenue));

                    // Create scales
                    const xScale = (index) => padding.left + index * pointSpacing;
                    const yScale = (revenue) => padding.top + chartHeight - ((revenue - 0) / (maxRevenue - 0 || 1)) * chartHeight;

                    // Create points for line
                    const linePoints = data.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(" ");

                    // Create area fill points
                    const areaPoints = `${xScale(0)},${padding.top + chartHeight} ${linePoints} ${xScale(data.length - 1)},${padding.top + chartHeight}`;

                    return (
                      <>
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((percent) => {
                          const y = padding.top + chartHeight - (percent / 100) * chartHeight;
                          const revenueValue = (maxRevenue * percent) / 100;
                          return (
                            <g key={percent}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + Math.max(chartWidth, data.length * pointSpacing)}
                                y2={y}
                                stroke="#2a2a2a"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                              />
                              <text
                                x={padding.left - 10}
                                y={y + 4}
                                fill="#888"
                                fontSize="12"
                                textAnchor="end"
                                fontWeight="500"
                              >
                                {formatCurrency(revenueValue)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area fill under line */}
                        <polygon
                          points={areaPoints}
                          fill="url(#gradient)"
                          opacity="0.3"
                        />

                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF5757" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#FF5757" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Line */}
                        <polyline
                          points={linePoints}
                          fill="none"
                          stroke="#FF5757"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: "drop-shadow(0 4px 8px rgba(255, 87, 87, 0.3))" }}
                        />

                        {/* Data points and labels */}
                        {data.map((d, i) => {
                          const x = xScale(i);
                          const y = yScale(d.revenue);

                          return (
                            <g key={i}>
                              {/* Vertical line on hover effect area */}
                              <line
                                x1={x}
                                y1={padding.top}
                                x2={x}
                                y2={padding.top + chartHeight}
                                stroke="#FF5757"
                                strokeWidth="1"
                                opacity="0.1"
                              />

                              {/* Data point circle */}
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#FF5757"
                                stroke="#1a1a1a"
                                strokeWidth="2"
                                style={{
                                  cursor: "pointer",
                                  transition: "r 0.2s"
                                }}
                                onMouseEnter={(e) => e.target.setAttribute("r", "9")}
                                onMouseLeave={(e) => e.target.setAttribute("r", "6")}
                              />

                              {/* Date labels on x-axis */}
                              <text
                                x={x}
                                y={padding.top + chartHeight + 20}
                                fill="#aaa"
                                fontSize="11"
                                fontWeight="500"
                                textAnchor="middle"
                              >
                                {formatDate(d.date)}
                              </text>

                              {/* Revenue value above point */}
                              <text
                                x={x}
                                y={y - 12}
                                fill="#ffffff"
                                fontSize="12"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {formatCurrency(d.revenue)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Y-axis line */}
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + chartHeight}
                          stroke="#3a3a3a"
                          strokeWidth="2"
                        />

                        {/* X-axis line */}
                        <line
                          x1={padding.left}
                          y1={padding.top + chartHeight}
                          x2={padding.left + Math.max(chartWidth, data.length * pointSpacing)}
                          y2={padding.top + chartHeight}
                          stroke="#3a3a3a"
                          strokeWidth="2"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Gym-wise Breakdown */}
          {analyticsData.gymBreakdown && analyticsData.gymBreakdown.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Revenue by Gym
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {analyticsData.gymBreakdown.slice(0, 20).map((gym) => (
                  <div key={gym.gym_id} style={{
                    backgroundColor: "#2a2a2a",
                    padding: "16px",
                    borderRadius: "8px",
                  }}>
                    <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                      {formatGymName(gym.gym_name)}
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>
                      {formatCurrency(gym.revenue)}
                    </div>
                  </div>
                ))}
              </div>
              {analyticsData.gymBreakdown.length > 20 && (
                <p style={{ fontSize: "13px", color: "#888", marginTop: "16px", textAlign: "center" }}>
                  Showing top 20 gyms out of {analyticsData.gymBreakdown.length}
                </p>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "purchases" && purchaseData ? (
        /* PURCHASE ANALYTICS TAB */
        <div>
          {/* Total Purchases Card */}
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #2a2a2a",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "10px", margin: 0 }}>
              Total Purchases
            </p>
            <h2 style={{
              fontSize: "48px",
              fontWeight: "700",
              margin: "10px 0",
              color: "#ffffffff"
            }}>
              {purchaseData.totalPurchases.toLocaleString('en-IN')}
            </h2>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "10px", margin: 0 }}>
              {dateFilter === "overall"
                ? "Overall"
                : `${formatDate(purchaseData.filters.startDate)} - ${formatDate(purchaseData.filters.endDate)}`
              }
              {purchaseData.filters.source !== "all" && ` • ${sourceLabels[purchaseData.filters.source] || purchaseData.filters.source}`}
              {purchaseData.filters.gymId !== "all" && ` • ${formatGymName(gymName) || purchaseData.filters.gymId}`}
            </p>
          </div>

          {/* Category-wise Breakdown */}
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "24px",
            borderRadius: "12px",
            marginBottom: "24px",
            border: "1px solid #2a2a2a"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
              Purchases by Category
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              {getChartEntries(purchaseData).map(([key, value]) => (
                <div key={key} style={{
                  backgroundColor: "#2a2a2a",
                  padding: "16px 18px",
                  borderRadius: "8px",
                  border: `1px solid ${sourceColors[key] || "#888"}`
                }}>
                  <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "8px", fontWeight: "500" }}>
                    {sourceLabels[key] || key}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#888" }}>Purchases</div>
                      <div style={{ fontSize: "22px", fontWeight: "700", color: sourceColors[key] || "#888" }}>
                        {value.purchases.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#888" }}>Unique Users</div>
                      <div style={{ fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
                        {value.unique_users.toLocaleString('en-IN')}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "24px", marginBottom: "24px" }}>
            {/* Purchases Over Time Chart */}
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Total Purchases Over Time
              </h3>
              {purchaseData.purchasesOverTime && purchaseData.purchasesOverTime.length > 0 ? (
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {purchaseData.purchasesOverTime.map((item, index) => {
                      const maxPurchases = Math.max(...purchaseData.purchasesOverTime.map(d => d.purchases));
                      const barWidth = maxPurchases > 0 ? (item.purchases / maxPurchases) * 100 : 0;

                      return (
                        <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ minWidth: "100px", fontSize: "12px", color: "#888" }}>
                            {formatDate(item.date)}
                          </div>
                          <div style={{ flex: 1, backgroundColor: "#2a2a2a", borderRadius: "4px", height: "24px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${barWidth}%`,
                                height: "100%",
                                backgroundColor: "#4CAF50",
                                transition: "width 0.3s ease"
                              }}
                            />
                          </div>
                          <div style={{ minWidth: "80px", textAlign: "left", fontSize: "13px", fontWeight: "500" }}>
                            {item.purchases.toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No data available</p>
              )}
            </div>

            {/* Category Distribution - Pie Chart */}
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "28px",
              borderRadius: "12px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "28px" }}>
                Category Distribution
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                {/* Pie Chart */}
                <div style={{ position: "relative", width: "280px", height: "280px", flexShrink: 0 }}>
                  <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: "rotate(-90deg)", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>
                    {(() => {
                      const entries = getChartEntries(purchaseData);
                      let currentAngle = 0;
                      const total = entries.reduce((sum, [_, val]) => sum + (val.purchases || 0), 0);

                      return entries.map(([key, value]) => {
                        const percentage = total > 0 ? (value.purchases / total) * 100 : 0;
                        const angle = total > 0 ? (value.purchases / total) * 360 : 0;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;

                        const x1 = 140 + 115 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 140 + 115 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 140 + 115 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 140 + 115 * Math.sin((endAngle * Math.PI) / 180);

                        const largeArcFlag = angle > 180 ? 1 : 0;

                        const pathData = angle === 360
                          ? `M 140 140 m -115 0 a 115 115 0 1 0 230 0 a 115 115 0 1 0 -230 0`
                          : `M 140 140 L ${x1} ${y1} A 115 115 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        currentAngle += angle;

                        return (
                          <path
                            key={key}
                            d={pathData}
                            fill={sourceColors[key] || "#888"}
                            stroke="#1a1a1a"
                            strokeWidth="3"
                            style={{
                              transition: "transform 0.2s, opacity 0.2s",
                              cursor: "pointer",
                              transformOrigin: "140px 140px"
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.opacity = "0.85";
                              e.target.style.transform = "scale(1.03)";
                              setHoveredSlice({ key, value: value.purchases, percentage });
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.opacity = "1";
                              e.target.style.transform = "scale(1)";
                              setHoveredSlice(null);
                            }}
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Center donut hole */}
                  <div style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    backgroundColor: "#1a1a1a",
                    pointerEvents: "none",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px"
                  }}>
                    {hoveredSlice ? (
                      <>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "4px", fontWeight: "500", textAlign: "center" }}>
                          {sourceLabels[hoveredSlice.key] || hoveredSlice.key}
                        </div>
                        <div style={{ fontSize: "22px", fontWeight: "800", color: sourceColors[hoveredSlice.key] || "#888", lineHeight: "1.2" }}>
                          {hoveredSlice.percentage.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                          {hoveredSlice.value.toLocaleString('en-IN')}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: "22px", fontWeight: "900", color: "#fff", lineHeight: "1", letterSpacing: "1px" }}>
                          FYMBLE
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Legend with Total */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: "180px" }}>
                  {/* Total Display */}
                  <div style={{
                    padding: "16px 20px",
                    backgroundColor: "#2a2a2a",
                    borderRadius: "8px",
                    border: "1px solid #3a3a3a",
                    marginBottom: "16px"
                  }}>
                    <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Total Purchases
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#fff", lineHeight: "1" }}>
                      {purchaseData.totalPurchases.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {/* Legend Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(() => {
                      const entries = getChartEntries(purchaseData);
                      const total = entries.reduce((sum, [_, val]) => sum + (val.purchases || 0), 0);
                      return entries.map(([key, value]) => {
                        const percentage = total > 0 ? (value.purchases / total) * 100 : 0;

                        return (
                          <div key={key} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "8px 12px",
                            backgroundColor: "#2a2a2a",
                            borderRadius: "6px",
                            border: "1px solid #3a3a3a",
                            transition: "border-color 0.2s"
                          }}>
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "3px",
                                backgroundColor: sourceColors[key] || "#888",
                                flexShrink: 0,
                                boxShadow: `0 2px 4px ${sourceColors[key]}40`
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", color: "#fff", fontWeight: "500", marginBottom: "1px" }}>
                                {sourceLabels[key] || key}
                              </div>
                              <div style={{ fontSize: "10px", color: "#888" }}>
                                {value.purchases.toLocaleString('en-IN')} purchases
                              </div>
                            </div>
                            <div style={{
                              fontSize: "15px",
                              fontWeight: "700",
                              color: sourceColors[key] || "#888",
                              flexShrink: 0,
                              minWidth: "50px",
                              textAlign: "right"
                            }}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category-wise Over Time Trend */}
          {purchaseData.purchasesOverTime && purchaseData.purchasesOverTime.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Purchases Trend
              </h3>
              <div style={{
                position: "relative",
                height: "350px",
                width: "100%",
                overflowX: "auto",
                overflowY: "hidden"
              }}>
                <svg
                  width="100%"
                  height="100%"
                  style={{
                    overflow: "visible",
                    minWidth: `${Math.max(800, purchaseData.purchasesOverTime.length * 80)}px`
                  }}
                >
                  {(() => {
                    const data = purchaseData.purchasesOverTime;
                    const pointSpacing = 80;
                    const padding = { top: 20, right: 30, bottom: 60, left: 100 };
                    const chartWidth = Math.max(800, data.length * pointSpacing) - padding.left - padding.right;
                    const chartHeight = 350 - padding.top - padding.bottom;
                    const maxPurchases = Math.max(...data.map(d => d.purchases), 1);

                    // Create scales
                    const xScale = (index) => padding.left + index * pointSpacing;
                    const yScale = (purchases) => padding.top + chartHeight - ((purchases - 0) / (maxPurchases - 0 || 1)) * chartHeight;

                    // Create points for line
                    const linePoints = data.map((d, i) => `${xScale(i)},${yScale(d.purchases)}`).join(" ");

                    // Create area fill points
                    const areaPoints = `${xScale(0)},${padding.top + chartHeight} ${linePoints} ${xScale(data.length - 1)},${padding.top + chartHeight}`;

                    return (
                      <>
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((percent) => {
                          const y = padding.top + chartHeight - (percent / 100) * chartHeight;
                          const purchasesValue = (maxPurchases * percent) / 100;
                          return (
                            <g key={percent}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + Math.max(chartWidth, data.length * pointSpacing)}
                                y2={y}
                                stroke="#2a2a2a"
                                strokeWidth="1"
                                strokeDasharray="4,4"
                              />
                              <text
                                x={padding.left - 10}
                                y={y + 4}
                                fill="#888"
                                fontSize="12"
                                textAnchor="end"
                                fontWeight="500"
                              >
                                {Math.round(purchasesValue)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area fill under line */}
                        <polygon
                          points={areaPoints}
                          fill="url(#gradientPurchase)"
                          opacity="0.3"
                        />

                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="gradientPurchase" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Line */}
                        <polyline
                          points={linePoints}
                          fill="none"
                          stroke="#4CAF50"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ filter: "drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))" }}
                        />

                        {/* Data points and labels */}
                        {data.map((d, i) => {
                          const x = xScale(i);
                          const y = yScale(d.purchases);

                          return (
                            <g key={i}>
                              {/* Vertical line */}
                              <line
                                x1={x}
                                y1={padding.top}
                                x2={x}
                                y2={padding.top + chartHeight}
                                stroke="#4CAF50"
                                strokeWidth="1"
                                opacity="0.1"
                              />

                              {/* Data point circle */}
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#4CAF50"
                                stroke="#1a1a1a"
                                strokeWidth="2"
                                style={{
                                  cursor: "pointer",
                                  transition: "r 0.2s"
                                }}
                                onMouseEnter={(e) => e.target.setAttribute("r", "9")}
                                onMouseLeave={(e) => e.target.setAttribute("r", "6")}
                              />

                              {/* Date labels on x-axis */}
                              <text
                                x={x}
                                y={padding.top + chartHeight + 20}
                                fill="#aaa"
                                fontSize="11"
                                fontWeight="500"
                                textAnchor="middle"
                              >
                                {formatDate(d.date)}
                              </text>

                              {/* Purchases value above point */}
                              <text
                                x={x}
                                y={y - 12}
                                fill="#ffffff"
                                fontSize="12"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {d.purchases}
                              </text>
                            </g>
                          );
                        })}

                        {/* Y-axis line */}
                        <line
                          x1={padding.left}
                          y1={padding.top}
                          x2={padding.left}
                          y2={padding.top + chartHeight}
                          stroke="#3a3a3a"
                          strokeWidth="2"
                        />

                        {/* X-axis line */}
                        <line
                          x1={padding.left}
                          y1={padding.top + chartHeight}
                          x2={padding.left + Math.max(chartWidth, data.length * pointSpacing)}
                          y2={padding.top + chartHeight}
                          stroke="#3a3a3a"
                          strokeWidth="2"
                        />
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Location-wise Purchase Bar Chart */}
          {purchaseData.locationBreakdown && purchaseData.locationBreakdown.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Purchases by Location
              </h3>
              <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
                <div style={{ display: "flex", gap: "16px", minWidth: "max-content" }}>
                  {purchaseData.locationBreakdown.map((item, index) => {
                    const maxPurchases = Math.max(...purchaseData.locationBreakdown.map(d => d.purchases));
                    const barHeight = maxPurchases > 0 ? (item.purchases / maxPurchases) * 100 : 0;

                    return (
                      <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "80px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#ffffff" }}>
                          {item.purchases.toLocaleString('en-IN')}
                        </div>
                        <div style={{ width: "50px", height: "200px", backgroundColor: "#2a2a2a", borderRadius: "6px", overflow: "hidden", position: "relative", display: "flex", alignItems: "flex-end" }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}%`,
                              backgroundColor: "#FF5757",
                              transition: "height 0.3s ease",
                              background: "linear-gradient(180deg, #FF5757 0%, #ff7b7b 100%)",
                              minHeight: barHeight > 0 ? "4px" : "0",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "12px", color: "#ccc", fontWeight: "500", textAlign: "center", maxWidth: "100px", wordWrap: "break-word" }}>
                          {item.location || "Unknown"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Revenue per City Bar Chart */}
          {revenueByCity && revenueByCity.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                Revenue per City by Gyms
              </h3>
              <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
                <div style={{ display: "flex", gap: "16px", minWidth: "max-content" }}>
                  {revenueByCity.map((item, index) => {
                    const maxRevenue = Math.max(...revenueByCity.map(d => d.amount));
                    const barHeight = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;

                    return (
                      <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "100px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#22c55e" }}>
                          {formatCurrency(item.amount)}
                        </div>
                        <div style={{ width: "60px", height: "200px", backgroundColor: "#2a2a2a", borderRadius: "6px", overflow: "hidden", position: "relative", display: "flex", alignItems: "flex-end" }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}%`,
                              backgroundColor: "#22c55e",
                              transition: "height 0.3s ease",
                              background: "linear-gradient(180deg, #22c55e 0%, #4ade80 100%)",
                              minHeight: barHeight > 0 ? "4px" : "0",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "12px", color: "#ccc", fontWeight: "500", textAlign: "center", maxWidth: "100px", wordWrap: "break-word" }}>
                          {item.city || "Unknown"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* In-App Revenue by Client Location Bar Chart */}
          {inAppRevenueByLocation && inAppRevenueByLocation.length > 0 && (
            <div style={{
              backgroundColor: "#1a1a1a",
              padding: "24px",
              borderRadius: "12px",
              marginBottom: "24px",
              border: "1px solid #2a2a2a"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                In-App Revenue by Client Location
              </h3>
              <div style={{ overflowX: "auto", paddingBottom: "16px" }}>
                <div style={{ display: "flex", gap: "16px", minWidth: "max-content" }}>
                  {inAppRevenueByLocation.map((item, index) => {
                    const maxRevenue = Math.max(...inAppRevenueByLocation.map(d => d.amount));
                    const barHeight = maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0;

                    return (
                      <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", minWidth: "100px" }}>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#c084fc" }}>
                          {formatCurrency(item.amount)}
                        </div>
                        <div style={{ width: "60px", height: "200px", backgroundColor: "#2a2a2a", borderRadius: "6px", overflow: "hidden", position: "relative", display: "flex", alignItems: "flex-end" }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${barHeight}%`,
                              backgroundColor: "#c084fc",
                              transition: "height 0.3s ease",
                              background: "linear-gradient(180deg, #a950dc 0%, #c084fc 100%)",
                              minHeight: barHeight > 0 ? "4px" : "0",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: "12px", color: "#ccc", fontWeight: "500", textAlign: "center", maxWidth: "100px", wordWrap: "break-word" }}>
                          {item.location || "Unknown"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Category Breakdown Table */}
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #2a2a2a"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
              Category-wise Details
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #3a3a3a" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", color: "#888", fontWeight: "600" }}>Category</th>
                    <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#888", fontWeight: "600" }}>Purchases</th>
                    <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#888", fontWeight: "600" }}>Unique Users</th>
                    <th style={{ padding: "12px", textAlign: "right", fontSize: "13px", color: "#888", fontWeight: "600" }}>Avg Purchases/User</th>
                  </tr>
                </thead>
                <tbody>
                  {getChartEntries(purchaseData).map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: "1px solid #2a2a2a" }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "3px",
                              backgroundColor: sourceColors[key] || "#888",
                            }}
                          />
                          <span style={{ fontSize: "14px", color: "#fff" }}>
                            {sourceLabels[key] || key}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#fff", fontWeight: "600" }}>
                        {value.purchases.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#fff" }}>
                        {value.unique_users.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#aaa" }}>
                        {value.unique_users > 0 ? (value.purchases / value.unique_users).toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #3a3a3a", fontWeight: "600" }}>
                    <td style={{ padding: "12px", fontSize: "14px", color: "#fff" }}>Total</td>
                    <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#fff" }}>
                      {purchaseData.totalPurchases.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#fff" }}>
                      {getChartEntries(purchaseData).reduce((sum, cat) => sum + cat[1].unique_users, 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", color: "#aaa" }}>
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>No data available</p>
      )}

      <SecureExportModal {...secureExportProps} />

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
