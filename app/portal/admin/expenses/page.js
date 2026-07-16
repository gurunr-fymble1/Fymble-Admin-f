"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlineFilter, HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi";

export default function ExpensesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  // Custom filter types: "date", "month", "year"
  const [customType, setCustomType] = useState("date");
  const [customStartMonth, setCustomStartMonth] = useState(new Date().getMonth() + 1);
  const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth() + 1);
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [customStartYearRange, setCustomStartYearRange] = useState(new Date().getFullYear());
  const [customEndYearRange, setCustomEndYearRange] = useState(new Date().getFullYear());

  // Active tab - operational or marketing
  const [activeTab, setActiveTab] = useState("operational");

  // Expenses data
  const [expenses, setExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState({ operational: [], marketing: [] });
  const [summary, setSummary] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 50,
    total: 0,
    total_pages: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    expense_type: "",
    start_date: "",
    end_date: "",
    search: ""
  });

  // Sync custom input changes to filters.start_date and filters.end_date states
  useEffect(() => {
    if (dateFilter === "custom") {
      if (customType === "date") {
        // Managed directly by html date inputs
      } else if (customType === "month") {
        const start = `${customStartYear}-${String(customStartMonth).padStart(2, "0")}-01`;
        const lastDay = new Date(customEndYear, customEndMonth, 0).getDate();
        const end = `${customEndYear}-${String(customEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
        setPagination(prev => ({ ...prev, page: 1 }));
      } else if (customType === "year") {
        const start = `${customStartYearRange}-01-01`;
        const end = `${customEndYearRange}-12-31`;
        setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
        setPagination(prev => ({ ...prev, page: 1 }));
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

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCustomType, setIsCustomType] = useState(false);
  const [formData, setFormData] = useState({
    category: "operational",
    expense_type: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
    description: ""
  });

  // Pie chart states
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [breakdownOpen, setBreakdownOpen] = useState(true);

  // Fetch overview data (summary + types + default operational list)
  const fetchOverview = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.page_size
      };

      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await axiosInstance.get("/api/admin/expenses/summary/overview", { params });

      if (response.data.success) {
        const data = response.data.data;
        setSummary(data);

        // Set expense types from overview response
        setExpenseTypes(data.expense_types);

        // Set expenses list from overview response (only on initial load for operational tab)
        if (isInitialLoad || activeTab === "operational") {
          setExpenses(data.expenses);
          setPagination(data.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching overview:", err);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [filters.start_date, filters.end_date, pagination.page, pagination.page_size, activeTab]);

  // Fetch expenses list for specific category (when switching tabs or applying filters)
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        category: activeTab,
        page: pagination.page,
        page_size: pagination.page_size
      };

      if (filters.expense_type) params.expense_type = filters.expense_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.search) params.search = filters.search;

      const response = await axiosInstance.get("/api/admin/expenses", { params });

      if (response.data.success) {
        setExpenses(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.page_size, filters]);

  // Initial data fetch - only overview API
  useEffect(() => {
    fetchOverview(true);
  }, [filters.start_date, filters.end_date]);

  // Fetch expenses list when tab changes or filters change (not initial load)
  useEffect(() => {
    fetchExpenses();
  }, [activeTab, filters.expense_type, filters.search, filters.start_date, filters.end_date, pagination.page]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingExpense) {
        await axiosInstance.put(`/api/admin/expenses/${editingExpense.id}`, formData);
      } else {
        await axiosInstance.post("/api/admin/expenses", formData);
      }

      // Reset form and refresh data
      setFormData({
        category: activeTab,
        expense_type: "",
        amount: "",
        expense_date: new Date().toISOString().split('T')[0],
        description: ""
      });
      setIsCustomType(false);
      setShowAddForm(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchOverview();
    } catch (err) {
      console.error("Error saving expense:", err);
      alert(err.response?.data?.detail || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    const predefinedTypes = expenseTypes[expense.category] || [];
    const isCustom = !predefinedTypes.includes(expense.expense_type);
    setIsCustomType(isCustom);
    setFormData({
      category: expense.category,
      expense_type: expense.expense_type,
      amount: expense.amount,
      expense_date: expense.expense_date,
      description: expense.description || ""
    });
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await axiosInstance.delete(`/api/admin/expenses/${id}`);
      fetchExpenses();
      fetchOverview();
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Failed to delete expense");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setDateFilter("");
    setCustomType("date");
    setFilters({
      expense_type: "",
      start_date: "",
      end_date: "",
      search: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDateRange = (filter) => {
    const today = new Date();

    if (filter === "today") {
      const value = formatLocalDate(today);
      return { start: value, end: value };
    }

    if (filter === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const value = formatLocalDate(yesterday);
      return { start: value, end: value };
    }

    if (filter === "last_30") {
      const start = new Date(today);
      start.setDate(start.getDate() - 30);
      return { start: formatLocalDate(start), end: formatLocalDate(today) };
    }

    if (filter === "last_month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: formatLocalDate(start), end: formatLocalDate(end) };
    }

    if (filter === "current_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: formatLocalDate(start), end: formatLocalDate(today) };
    }

    return { start: "", end: "" };
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));

    if (value === "overall") {
      setFilters(prev => ({ ...prev, start_date: "", end_date: "" }));
      return;
    }

    if (value === "custom") {
      setFilters(prev => ({ ...prev, start_date: "", end_date: "" }));
      setCustomType("date");
      return;
    }

    const { start, end } = getDateRange(value);
    setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
  };

  // Get current expense types based on active tab
  const getCurrentExpenseTypes = () => {
    return expenseTypes[activeTab] || [];
  };

  const cardStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem"
  };

  const inputStyle = {
    backgroundColor: "#111827",
    border: "1px solid #374151",
    color: "white",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    width: "100%",
    fontSize: "0.875rem"
  };

  const buttonStyle = {
    backgroundColor: "#FF5757",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem"
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#374151"
  };

  const tableHeaderStyle = {
    backgroundColor: "#1f2937",
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    padding: "0.75rem 1rem"
  };

  const tableCellStyle = {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #374151",
    color: "white",
    fontSize: "0.875rem"
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "white", margin: "0 0 0.25rem 0" }}>
            Expenses Management
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
            Track and manage operational and marketing expenses
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingExpense(null);
              setFormData({
                category: activeTab,
                expense_type: "",
                amount: "",
                expense_date: new Date().toISOString().split('T')[0],
                description: ""
              });
              setIsCustomType(false);
              setShowAddForm(!showAddForm);
            }}
            style={buttonStyle}
          >
            <HiOutlinePlus size={18} />
            {showAddForm ? "Cancel" : "Add Expense"}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              ...buttonStyle,
              backgroundColor: showFilters ? "#FF5757" : "#374151"
            }}
          >
            <HiOutlineFilter size={18} />
            Filters
            {(filters.expense_type || filters.start_date || filters.end_date || filters.search) && (
              <span style={{
                backgroundColor: "#FF5757",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "0.65rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>•</span>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Total Expenses</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.grand_total?.toFixed(2) || "0.00"}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Operational</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.category_totals?.operational?.toFixed(2) || "0.00"}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {summary.category_percentages?.operational != null ? `${summary.category_percentages.operational}% of total` : `${summary.category_counts?.operational || 0} entries`}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>Marketing</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>₹{summary.category_totals?.marketing?.toFixed(2) || "0.00"}</div>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              {summary.category_percentages?.marketing != null ? `${summary.category_percentages.marketing}% of total` : `${summary.category_counts?.marketing || 0} entries`}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem" }}>ROAS</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>
              {summary.roas != null ? `${(summary.roas * 100).toFixed(2)}%` : "0.00%"}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.25rem" }}>
              Ratio: {summary.roas != null ? summary.roas.toFixed(4) : "0.0000"} 
            </div>
          </div>
        </div>
      )}

      {/* Pie Chart Section */}
      {summary && (
        <div style={{ ...cardStyle, padding: "1.5rem 2rem" }}>
          <div 
            onClick={() => setBreakdownOpen(!breakdownOpen)}
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <h3 style={{ color: "white", fontSize: "1.125rem", fontWeight: "600", margin: 0 }}>
              {activeTab === "operational" ? "Operational" : "Marketing"} Expenses Breakdown
            </h3>
            <button 
              style={{
                background: "none",
                border: "none",
                color: "#9ca3af",
                cursor: "pointer",
                padding: "4px",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              {breakdownOpen ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
            </button>
          </div>

          {breakdownOpen && (
            <div style={{ marginTop: "1.5rem" }}>
              {(() => {
                const breakdown = activeTab === "operational"
                  ? summary.operational_breakdown
                  : summary.marketing_breakdown;

                const categoryTotal = activeTab === "operational"
                  ? summary.category_totals?.operational || 0
                  : summary.category_totals?.marketing || 0;

                const entries = Object.entries(breakdown || {}).filter(([_, amount]) => amount > 0);

                if (entries.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
                      No {activeTab === "operational" ? "operational" : "marketing"} expenses found
                    </div>
                  );
                }

                // Colors for pie chart
                const colors = [
                  "#FF5757", "#FF8C42", "#FFC947", "#7FE4A3", "#4CAF50",
                  "#2196F3", "#9C27B0", "#E91E63", "#00BCD4", "#FF5722"
                ];

                // Calculate pie chart data
                const data = entries.map(([type, amount], index) => ({
                  type,
                  amount,
                  percentage: (amount / categoryTotal * 100).toFixed(2),
                  color: colors[index % colors.length]
                })).sort((a, b) => b.amount - a.amount);

                // Create pie chart SVG
                let currentAngle = -Math.PI / 2; // Start from top (12 o'clock position)
                const radius = 120;
                const centerX = 150;
                const centerY = 150;
                const innerRadius = 70; // For donut effect

                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3rem", alignItems: "center", justifyContent: "center" }}>
                    {/* Pie Chart */}
                    <div style={{ position: "relative" }}>
                      <svg width="300" height="300" viewBox="0 0 300 300" style={{ display: "block" }}>
                        {data.map((slice, index) => {
                          const sliceAngle = (slice.amount / categoryTotal) * 2 * Math.PI;
                          const endAngle = currentAngle + sliceAngle;

                          // Calculate outer arc points
                          const x1 = centerX + radius * Math.cos(currentAngle);
                          const y1 = centerY + radius * Math.sin(currentAngle);
                          const x2 = centerX + radius * Math.cos(endAngle);
                          const y2 = centerY + radius * Math.sin(endAngle);

                          // Calculate inner arc points (for donut)
                          const x3 = centerX + innerRadius * Math.cos(endAngle);
                          const y3 = centerY + innerRadius * Math.sin(endAngle);
                          const x4 = centerX + innerRadius * Math.cos(currentAngle);
                          const y4 = centerY + innerRadius * Math.sin(currentAngle);

                          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

                          // Create donut slice path
                          const pathData = [
                            `M ${x1} ${y1}`,                           // Move to outer start
                            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,  // Outer arc
                            `L ${x3} ${y3}`,                           // Line to inner end
                            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,  // Inner arc (reverse)
                            `Z`                                        // Close path
                          ].join(" ");

                          currentAngle = endAngle;

                          return (
                            <g key={slice.type}>
                              <path
                                d={pathData}
                                fill={slice.color}
                                stroke="#1f2937"
                                strokeWidth="2"
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  opacity: hoveredSegment === slice.type ? 0.9 : 1,
                                  transform: hoveredSegment === slice.type ? "scale(1.02)" : "scale(1)",
                                  transformOrigin: `${centerX}px ${centerY}px`
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredSegment(slice.type);
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    data: slice
                                  });
                                }}
                                onMouseLeave={() => {
                                  setHoveredSegment(null);
                                  setTooltip({ visible: false, x: 0, y: 0, data: null });
                                }}
                                onMouseMove={(e) => {
                                  if (tooltip.visible) {
                                    setTooltip({
                                      visible: true,
                                      x: e.clientX,
                                      y: e.clientY,
                                      data: slice
                                    });
                                  }
                                }}
                              />
                            </g>
                          );
                        })}

                        {/* Center text for donut */}
                        <text
                          x={centerX}
                          y={centerY - 8}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fill: "#9ca3af", fontSize: "0.7rem", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}
                        >
                          Total
                        </text>
                        <text
                          x={centerX}
                          y={centerY + 12}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fill: "white", fontSize: "1.1rem", fontWeight: "700" }}
                        >
                          ₹{categoryTotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </text>
                      </svg>
                    </div>

                    {/* Legend */}
                    <div style={{ flex: 1, minWidth: "250px" }}>
                      <div style={{ color: "white", fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>
                        Expense Types
                      </div>
                      <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {data.map((slice) => (
                          <div
                            key={slice.type}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.5rem 0",
                              borderBottom: "1px solid #374151",
                              cursor: "pointer",
                              transition: "background 0.2s",
                              backgroundColor: hoveredSegment === slice.type ? "#374151" : "transparent"
                            }}
                            onMouseEnter={() => setHoveredSegment(slice.type)}
                            onMouseLeave={() => setHoveredSegment(null)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "2px",
                                  backgroundColor: slice.color
                                }}
                              />
                              <span style={{ color: "#e5e7eb", fontSize: "0.875rem" }}>
                                {slice.type}
                              </span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "white", fontWeight: "600", fontSize: "0.875rem" }}>
                                ₹{slice.amount.toFixed(2)}
                              </div>
                              <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                                {slice.percentage}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltip.x + 15, window.innerWidth - 200),
            top: Math.min(tooltip.y + 15, window.innerHeight - 100),
            backgroundColor: "rgba(31, 41, 55, 0.98)",
            border: "1px solid #4b5563",
            borderRadius: "8px",
            padding: "0.6rem 0.8rem",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow: "0 10px 15px rgba(0, 0, 0, 0.5)",
            minWidth: "140px",
            backdropFilter: "blur(8px)"
          }}
        >
          <div style={{ color: tooltip.data.color, fontSize: "0.7rem", fontWeight: "600", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {tooltip.data.type}
          </div>
          <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "700" }}>
            ₹{tooltip.data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {tooltip.data.percentage}% of total
          </div>
        </div>
      )}

      {/* Category Tabs with Filter Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => {
              setActiveTab("operational");
              setPagination(prev => ({ ...prev, page: 1 }));
              setFilters(prev => ({ ...prev, expense_type: "" }));
              setShowAddForm(false);
              setEditingExpense(null);
              setIsCustomType(false);
            }}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "operational" ? "#FF5757" : "#374151",
              borderRadius: "8px"
            }}
          >
            Operational Expenses
          </button>
          <button
            onClick={() => {
              setActiveTab("marketing");
              setPagination(prev => ({ ...prev, page: 1 }));
              setFilters(prev => ({ ...prev, expense_type: "" }));
              setShowAddForm(false);
              setEditingExpense(null);
              setIsCustomType(false);
            }}
            style={{
              ...buttonStyle,
              backgroundColor: activeTab === "marketing" ? "#FF5757" : "#374151",
              borderRadius: "8px"
            }}
          >
            Marketing Expenses
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => {
              setEditingExpense(null);
              setFormData({
                category: activeTab,
                expense_type: "",
                amount: "",
                expense_date: new Date().toISOString().split('T')[0],
                description: ""
              });
              setIsCustomType(false);
              setShowAddForm(!showAddForm);
            }}
            style={{ ...buttonStyle, padding: "0.5rem" }}
            title={showAddForm ? "Cancel" : "Add Expense"}
          >
            <HiOutlinePlus size={18} style={{ transform: showAddForm ? "rotate(45deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              backgroundColor: showFilters ? "#FF5757" : "#374151",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s",
              flexShrink: 0
            }}
          >
            <HiOutlineFilter size={18} />
            Filters
            {(filters.expense_type || filters.start_date || filters.end_date || filters.search) && (
              <span style={{
                backgroundColor: "#FF5757",
                color: "white",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "0.65rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>•</span>
            )}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div style={cardStyle}>
          <h3 style={{ color: "white", fontSize: "1.125rem", fontWeight: "600", margin: "0 0 1rem 0" }}>
            {editingExpense ? "Edit Expense" : "Add New Expense"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    category: newCategory,
                    expense_type: ""
                  }));
                  setIsCustomType(false);
                }}
                style={inputStyle}
                required
              >
                <option value="operational">Operational</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Expense Type</label>
              <select
                value={isCustomType ? "Other" : formData.expense_type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "Other") {
                    setIsCustomType(true);
                    setFormData({ ...formData, expense_type: "" });
                  } else {
                    setIsCustomType(false);
                    setFormData({ ...formData, expense_type: value });
                  }
                }}
                style={inputStyle}
                required
              >
                <option value="">Select type...</option>
                {(expenseTypes[formData.category] || []).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                {/* <option value="Other">Other (Custom)</option> */}
              </select>
            </div>
            {isCustomType && (
              <div>
                <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Custom Type</label>
                <input
                  type="text"
                  value={formData.expense_type}
                  onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
                  placeholder="Enter custom expense type"
                  style={inputStyle}
                  required
                />
              </div>
            )}
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Date</label>
              <input
                type="date"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ color: "#9ca3af", fontSize: "0.875rem", display: "block", marginBottom: "0.25rem" }}>Description (Optional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add a description..."
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ ...buttonStyle, opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "Saving..." : editingExpense ? "Update Expense" : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingExpense(null);
                  setFormData({
                    category: activeTab,
                    expense_type: "",
                    amount: "",
                    expense_date: new Date().toISOString().split('T')[0],
                    description: ""
                  });
                  setIsCustomType(false);
                }}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collapsible Filter Card */}
      {showFilters && (
        <div style={{
          ...cardStyle,
          animation: "slideDown 0.2s ease-out"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Expense Type</label>
              <select
                value={filters.expense_type}
                onChange={(e) => setFilters({ ...filters, expense_type: e.target.value })}
                style={inputStyle}
              >
                <option value="">All Types</option>
                {getCurrentExpenseTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Date Filter</label>
              <select
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={inputStyle}
              >
                <option value="">Date Filter</option>
                <option value="overall">Overall</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_30">Last 30 Days</option>
                <option value="last_month">Last Month</option>
                <option value="current_month">MTD</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label style={{ color: "#9ca3af", fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Search</label>
              <div style={{ position: "relative" }}>
                <HiOutlineSearch size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search in type/description..."
                  style={{ ...inputStyle, paddingLeft: "2.25rem" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                style={buttonStyle}
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                style={secondaryButtonStyle}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Custom Date Range Panel */}
          {dateFilter === "custom" && (
            <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#111827", borderRadius: "8px", border: "1px solid #374151" }}>
              {/* Toggle buttons for customType */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setCustomType("date");
                    setFilters(prev => ({ ...prev, start_date: "", end_date: "" }));
                  }}
                  style={{
                    background: customType === "date" ? "#FF5757" : "#1f2937",
                    border: customType === "date" ? "1px solid #FF5757" : "1px solid #374151",
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
                    background: customType === "month" ? "#FF5757" : "#1f2937",
                    border: customType === "month" ? "1px solid #FF5757" : "1px solid #374151",
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
                    background: customType === "year" ? "#FF5757" : "#1f2937",
                    border: customType === "year" ? "1px solid #FF5757" : "1px solid #374151",
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
                <div style={{ display: "flex", gap: "15px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      Start Date:
                    </label>
                    <input
                      type="date"
                      value={filters.start_date}
                      max={filters.end_date || formatLocalDate(new Date())}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, start_date: e.target.value }));
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      style={{
                        ...inputStyle,
                        width: "auto",
                        backgroundColor: "#1f2937"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      End Date:
                    </label>
                    <input
                      type="date"
                      value={filters.end_date}
                      min={filters.start_date}
                      max={formatLocalDate(new Date())}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, end_date: e.target.value }));
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      style={{
                        ...inputStyle,
                        width: "auto",
                        backgroundColor: "#1f2937"
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Custom: Month Range Selector */}
              {customType === "month" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      Start Month:
                    </label>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <select
                        value={customStartMonth}
                        onChange={(e) => setCustomStartMonth(parseInt(e.target.value))}
                        style={{
                          ...inputStyle,
                          width: "auto",
                          backgroundColor: "#1f2937",
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
                          ...inputStyle,
                          width: "auto",
                          backgroundColor: "#1f2937",
                          cursor: "pointer"
                        }}
                      >
                        {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "25px", color: "#6b7280", fontSize: "18px" }}>
                    →
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      End Month:
                    </label>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <select
                        value={customEndMonth}
                        onChange={(e) => setCustomEndMonth(parseInt(e.target.value))}
                        style={{
                          ...inputStyle,
                          width: "auto",
                          backgroundColor: "#1f2937",
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
                          ...inputStyle,
                          width: "auto",
                          backgroundColor: "#1f2937",
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
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      Start Year:
                    </label>
                    <select
                      value={customStartYearRange}
                      onChange={(e) => setCustomStartYearRange(parseInt(e.target.value))}
                      style={{
                        ...inputStyle,
                        width: "auto",
                        backgroundColor: "#1f2937",
                        cursor: "pointer"
                      }}
                    >
                      {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "25px", color: "#6b7280", fontSize: "18px" }}>
                    →
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "0.75rem", color: "#9ca3af" }}>
                      End Year:
                    </label>
                    <select
                      value={customEndYearRange}
                      onChange={(e) => setCustomEndYearRange(parseInt(e.target.value))}
                      style={{
                        ...inputStyle,
                        width: "auto",
                        backgroundColor: "#1f2937",
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
      )}

      {/* Expenses Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            Loading expenses...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
            No expenses found. Add your first expense to get started.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Date</th>
                    <th style={tableHeaderStyle}>Type</th>
                    <th style={tableHeaderStyle}>Description</th>
                    <th style={{ ...tableHeaderStyle, textAlign: "right" }}>Amount</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} style={{ "&:hover": { backgroundColor: "#1f2937" } }}>
                      <td style={tableCellStyle}>
                        {new Date(expense.expense_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          display: "inline-block",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: expense.category === "operational" ? "#3b82f620" : "#8b5cf620",
                          color: expense.category === "operational" ? "#60a5fa" : "#a78bfa",
                          fontSize: "0.75rem",
                          fontWeight: "500"
                        }}>
                          {expense.expense_type}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        {expense.description || "-"}
                      </td>
                      <td style={{ ...tableCellStyle, textAlign: "right", fontWeight: "600" }}>
                        ₹{parseFloat(expense.amount).toFixed(2)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleEdit(expense)}
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid #374151",
                              color: "#9ca3af",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#374151"; e.target.style.color = "white"; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; e.target.style.color = "#9ca3af"; }}
                          >
                            <HiOutlinePencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            style={{
                              backgroundColor: "transparent",
                              border: "1px solid #374151",
                              color: "#ef4444",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = "#374151"; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = "transparent"; }}
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #374151" }}>
                <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total)} of {pagination.total} expenses
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: pagination.page === 1 ? 0.5 : 1,
                      cursor: pagination.page === 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ display: "flex", alignItems: "center", color: "white", padding: "0 0.5rem" }}>
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.total_pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.total_pages}
                    style={{
                      ...secondaryButtonStyle,
                      opacity: pagination.page === pagination.total_pages ? 0.5 : 1,
                      cursor: pagination.page === pagination.total_pages ? "not-allowed" : "pointer"
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
