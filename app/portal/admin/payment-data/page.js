"use client";
import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import * as XLSX from "xlsx";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import {
  HiOutlineCalendar,
  HiOutlineDownload,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCurrencyDollar,
  HiOutlineOfficeBuilding,
  HiOutlineReceiptTax,
  HiOutlineCreditCard,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineFilter,
  HiOutlineDocumentReport,
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlinePhone
} from "react-icons/hi";
import { FaSpinner } from "react-icons/fa";

export default function PaymentDataPage() {
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  // Helper to format Date objects as YYYY-MM-DD
  const formatDateToInput = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Initial Date State (Default Empty)
  const getThirtyDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateToInput(d);
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("");

  // Data state
  const [tableData, setTableData] = useState([]);
  const [rawBuffer, setRawBuffer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Table controls state
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortField, setSortField] = useState("Gym Name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedPaymentIds, setExpandedPaymentIds] = useState({});

  // Quick Preset Handlers
  const handlePresetSelect = (presetKey) => {
    setActivePreset(presetKey);
    const today = new Date();
    let sDate = "";
    let eDate = formatDateToInput(today);

    if (presetKey === "last30") {
      sDate = getThirtyDaysAgo();
    } else if (presetKey === "allTime") {
      sDate = "2025-06-01";
    } else if (presetKey === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      sDate = formatDateToInput(firstDay);
    } else if (presetKey === "lastMonth") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      sDate = formatDateToInput(firstDayLastMonth);
      eDate = formatDateToInput(lastDayLastMonth);
    } else if (presetKey === "ytd") {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      sDate = formatDateToInput(startOfYear);
    }

    setStartDate(sDate);
    setEndDate(eDate);
    fetchPaymentDataWithParams(sDate, eDate);
  };

  // Fetch Payment Data from backend with explicit parameters
  const fetchPaymentDataWithParams = async (sDate = startDate, eDate = endDate) => {
    if (!sDate || !eDate) {
      setError("Please select both Start Date and End Date to display data.");
      return;
    }

    if (new Date(sDate) > new Date(eDate)) {
      setError("Start Date cannot be after End Date.");
      return;
    }

    setLoading(true);
    setError(null);
    setTableData([]);
    setRawBuffer(null);

    try {
      // Format start and end date with time components
      const formattedStart = `${sDate}T00:00:00`;
      const formattedEnd = `${eDate}T23:59:59`;

      const response = await axiosInstance.get(
        "/api/admin/payment-data/generate-payment-data",
        {
          params: {
            start_date: formattedStart,
            end_date: formattedEnd
          },
          responseType: "arraybuffer"
        }
      );

      // Check if the response might be a JSON error response instead of binary Excel
      const decoder = new TextDecoder("utf-8");
      const textPreview = decoder.decode(response.data);

      if (textPreview.trim().startsWith("{") && textPreview.includes("message")) {
        try {
          const jsonRes = JSON.parse(textPreview);
          if (jsonRes.status === 400 || jsonRes.message) {
            setError(jsonRes.message || "No payment data found for the selected date range.");
            setTableData([]);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Not valid JSON, proceed with parsing arraybuffer as Excel
        }
      }

      // Save raw buffer for direct download
      setRawBuffer(response.data);

      // Parse XLSX ArrayBuffer
      const workbook = XLSX.read(new Uint8Array(response.data), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      setTableData(rows);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch payment data:", err);
      // Handle arraybuffer error response decode
      if (err.response && err.response.data instanceof ArrayBuffer) {
        try {
          const decoded = new TextDecoder().decode(err.response.data);
          const parsedErr = JSON.parse(decoded);
          setError(parsedErr.message || parsedErr.detail || "Failed to load payment data.");
        } catch (e) {
          setError(err.message || "An error occurred while fetching payment data.");
        }
      } else {
        setError(err.response?.data?.detail || err.message || "Failed to load payment data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentData = () => fetchPaymentDataWithParams(startDate, endDate);

  // Compute metric summaries from tableData
  const metrics = useMemo(() => {
    if (!tableData || tableData.length === 0) {
      return {
        totalGyms: 0,
        totalPaid: 0,
        totalPayout: 0,
        totalCommission: 0,
        totalTDS: 0,
        totalPG: 0,
        finalPayout: 0,
        totalTransactions: 0
      };
    }

    return tableData.reduce(
      (acc, row) => {
        acc.totalGyms += 1;
        acc.totalPaid += Number(row["Total Paid"]) || 0;
        acc.totalPayout += Number(row["Total Payout"]) || 0;
        acc.totalCommission += Number(row["Commission"]) || 0;
        acc.totalTDS += Number(row["TDS (2%)"]) || 0;
        acc.totalPG += Number(row["PG Charges (2%)"]) || 0;
        acc.finalPayout += Number(row["Final Payout"]) || 0;
        acc.totalTransactions += Number(row["Total Transactions"]) || 0;
        return acc;
      },
      {
        totalGyms: 0,
        totalPaid: 0,
        totalPayout: 0,
        totalCommission: 0,
        totalTDS: 0,
        totalPG: 0,
        finalPayout: 0,
        totalTransactions: 0
      }
    );
  }, [tableData]);

  // Debounce search term update (400ms delay)
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === "") {
      setDebouncedSearchTerm("");
      setCurrentPage(1);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(trimmed);
      setCurrentPage(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Search & Filter Logic (Debounced)
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm) return tableData;

    const term = debouncedSearchTerm.toLowerCase();
    return tableData.filter((row) => {
      const gymIdStr = String(row["Gym ID"] || "").toLowerCase();
      const gymNameStr = String(row["Gym Name"] || "").toLowerCase();
      const contactStr = String(row["Contact Number"] || "").toLowerCase();
      const paymentIdsStr = String(row["Payment IDs"] || "").toLowerCase();

      return (
        gymIdStr.includes(term) ||
        gymNameStr.includes(term) ||
        contactStr.includes(term) ||
        paymentIdsStr.includes(term)
      );
    });
  }, [tableData, debouncedSearchTerm]);

  // Sort Logic
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Convert numeric fields if applicable
      if (typeof valA === "number" || !isNaN(Number(valA))) {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Toggle Table Header Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Toggle Payment IDs expand/collapse for long lists
  const toggleExpandPaymentIds = (gymId) => {
    setExpandedPaymentIds((prev) => ({
      ...prev,
      [gymId]: !prev[gymId]
    }));
  };

  // Secure Export Action
  const triggerExcelExport = () => {
    handleExportTrigger(async () => {
      try {
        setExporting(true);

        let exportBuffer = rawBuffer;

        // If rawBuffer is missing, fetch fresh Excel stream
        if (!exportBuffer) {
          const formattedStart = `${startDate}T00:00:00`;
          const formattedEnd = `${endDate}T23:59:59`;

          const response = await axiosInstance.get(
            "/api/admin/payment-data/generate-payment-data",
            {
              params: {
                start_date: formattedStart,
                end_date: formattedEnd
              },
              responseType: "arraybuffer"
            }
          );
          exportBuffer = response.data;
        }

        // Trigger browser file download
        const blob = new Blob([exportBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "");
        link.download = `payment_data_${startDate}_to_${endDate}_${timestamp}.xlsx`;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      } catch (err) {
        console.error("Export download failed:", err);
        alert(err.message || "Failed to download Excel export.");
      } finally {
        setExporting(false);
      }
    });
  };

  // Currency Formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", padding: "24px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "rgba(255, 87, 87, 0.15)",
                color: "#FF5757",
                padding: "10px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <HiOutlineDocumentReport size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#ffffff" }}>
                Payment Data & Payouts
              </h1>
              <p style={{ fontSize: "14px", color: "#9ca3af", margin: "4px 0 0 0" }}>
                Generate gym payout breakdowns, tax calculations (TDS 2%, PG 2%), and export spreadsheets.
              </p>
            </div>
          </div>
        </div>

        {/* Export Action Button */}
        <button
          onClick={triggerExcelExport}
          disabled={tableData.length === 0 || loading || exporting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: tableData.length === 0 || loading || exporting ? "#374151" : "#FF5757",
            color: tableData.length === 0 || loading || exporting ? "#9ca3af" : "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: tableData.length === 0 || loading || exporting ? "not-allowed" : "pointer",
            transition: "all 0.2s ease-in-out",
            boxShadow: tableData.length > 0 ? "0 4px 14px rgba(255, 87, 87, 0.3)" : "none"
          }}
        >
          {exporting ? <FaSpinner className="spin" size={16} /> : <HiOutlineDownload size={18} />}
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Date Filter & Control Card */}
      <div
        style={{
          backgroundColor: "#161e2e",
          borderRadius: "14px",
          border: "1px solid #2d3748",
          padding: "20px",
          marginBottom: "24px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Preset Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "600", marginRight: "8px" }}>
              Quick Ranges:
            </span>
            {[
              { key: "last30", label: "Last 30 Days" },
              { key: "thisMonth", label: "This Month" },
              { key: "lastMonth", label: "Last Month" },
              { key: "ytd", label: "This Year" },
              { key: "allTime", label: "All Time (Jun 2025 - Present)" }
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetSelect(p.key)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "500",
                  border: activePreset === p.key ? "1px solid #FF5757" : "1px solid #374151",
                  backgroundColor: activePreset === p.key ? "rgba(255, 87, 87, 0.15)" : "#1f2937",
                  color: activePreset === p.key ? "#FF5757" : "#d1d5db",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date Input Pickers & Apply Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "#d1d5db", fontWeight: "500" }}>Start Date:</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setActivePreset("");
                  }}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "13px", color: "#d1d5db", fontWeight: "500" }}>End Date:</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setActivePreset("");
                  }}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#ffffff",
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <button
              onClick={fetchPaymentData}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: loading ? "#374151" : "#FF5757",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 18px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer"
              }}
            >
              {loading ? <FaSpinner className="spin" size={14} /> : <HiOutlineRefresh size={16} />}
              <span>Apply & Fetch Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#fca5a5"
          }}
        >
          <HiOutlineExclamationCircle size={22} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: "14px" }}>{error}</span>
        </div>
      )}

      {/* Metric Cards Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        {/* Total Gyms */}
        <div
          style={{
            backgroundColor: "#161e2e",
            border: "1px solid #2d3748",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", fontWeight: "600" }}>
              Gyms Found
            </span>
            <div style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", padding: "6px", borderRadius: "6px" }}>
              <HiOutlineOfficeBuilding size={18} />
            </div>
          </div>
          <p style={{ fontSize: "22px", fontWeight: "700", margin: "8px 0 0 0", color: "#ffffff" }}>
            {metrics.totalGyms}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Unique Gym Partners</span>
        </div>

        {/* Total Gross Paid */}
        <div
          style={{
            backgroundColor: "#161e2e",
            border: "1px solid #2d3748",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", fontWeight: "600" }}>
              Total Paid (Gross)
            </span>
            <div style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#4ade80", padding: "6px", borderRadius: "6px" }}>
              <HiOutlineCurrencyDollar size={18} />
            </div>
          </div>
          <p style={{ fontSize: "22px", fontWeight: "700", margin: "8px 0 0 0", color: "#4ade80" }}>
            {formatCurrency(metrics.totalPaid)}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Gross Collection</span>
        </div>

        {/* Total Payout */}
        <div
          style={{
            backgroundColor: "#161e2e",
            border: "1px solid #2d3748",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", fontWeight: "600" }}>
              Total Payout (Net)
            </span>
            <div style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc", padding: "6px", borderRadius: "6px" }}>
              <HiOutlineCreditCard size={18} />
            </div>
          </div>
          <p style={{ fontSize: "22px", fontWeight: "700", margin: "8px 0 0 0", color: "#ffffff" }}>
            {formatCurrency(metrics.totalPayout)}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>Before TDS & PG Deductions</span>
        </div>

        {/* Commission */}
        <div
          style={{
            backgroundColor: "#161e2e",
            border: "1px solid #2d3748",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", fontWeight: "600" }}>
              Platform Commission
            </span>
            <div style={{ backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", padding: "6px", borderRadius: "6px" }}>
              <HiOutlineReceiptTax size={18} />
            </div>
          </div>
          <p style={{ fontSize: "22px", fontWeight: "700", margin: "8px 0 0 0", color: "#fbbf24" }}>
            {formatCurrency(metrics.totalCommission)}
          </p>
          {/* <span style={{ fontSize: "11px", color: "#9ca3af" }}>Gross - Net Payout</span> */}
        </div>

        {/* Final Payout */}
        <div
          style={{
            backgroundColor: "#161e2e",
            border: "1px solid #FF5757",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 4px 14px rgba(255, 87, 87, 0.15)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#FF5757", textTransform: "uppercase", fontWeight: "700" }}>
              Final Payout
            </span>
            <div style={{ backgroundColor: "rgba(255, 87, 87, 0.2)", color: "#FF5757", padding: "6px", borderRadius: "6px" }}>
              <HiOutlineCurrencyDollar size={18} />
            </div>
          </div>
          <p style={{ fontSize: "22px", fontWeight: "700", margin: "8px 0 0 0", color: "#ffffff" }}>
            {formatCurrency(metrics.finalPayout)}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
            After TDS ({formatCurrency(metrics.totalTDS)}) & PG ({formatCurrency(metrics.totalPG)})
          </span>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: "#161e2e",
          borderRadius: "14px",
          border: "1px solid #2d3748",
          overflow: "hidden"
        }}
      >
        {/* Table Filter & Search Controls Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #2d3748",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: "1", minWidth: "260px" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
              <HiOutlineSearch
                size={18}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
              />
              <input
                type="text"
                placeholder="Search Gym Name, ID, or Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "8px 12px 8px 38px",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none"
                }}
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>
              Rows per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "#ffffff",
                padding: "6px 10px",
                fontSize: "13px",
                outline: "none"
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1f2937", color: "#9ca3af", borderBottom: "1px solid #2d3748" }}>
                {[
                  { field: "Gym ID", label: "Gym ID" },
                  { field: "Gym Name", label: "Gym Name" },
                  { field: "Contact Number", label: "Contact Number" },
                  { field: "Total Paid", label: "Total Paid" },
                  { field: "Total Payout", label: "Total Payout" },
                  { field: "Commission", label: "Commission" },
                  { field: "TDS (2%)", label: "TDS (2%)" },
                  { field: "PG Charges (2%)", label: "PG (2%)" },
                  { field: "Final Payout", label: "Final Payout" },
                  { field: "Total Transactions", label: "Txns" }
                ].map((col) => (
                  <th
                    key={col.field}
                    onClick={() => handleSort(col.field)}
                    style={{
                      padding: "12px 14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      userSelect: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>{col.label}</span>
                      {sortField === col.field && (
                        <span style={{ color: "#FF5757", fontSize: "11px" }}>
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    <FaSpinner className="spin" size={24} style={{ marginBottom: "8px" }} />
                    <p style={{ margin: 0 }}>Loading payment records...</p>
                  </td>
                </tr>
              ) : !startDate || !endDate ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#ffffff" }}>
                      Select Date Range to Display Data
                    </p>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      Please select a Start Date and End Date above (or click a quick range) to display payment data.
                    </span>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    <p style={{ margin: 0, fontSize: "15px" }}>No payment records found.</p>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Try adjusting your search criteria or date range.
                    </span>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const gymId = row["Gym ID"];
                  const isExpanded = expandedPaymentIds[gymId];
                  const paymentIdsStr = String(row["Payment IDs"] || "");
                  const paymentIdsList = paymentIdsStr ? paymentIdsStr.split(",") : [];

                  return (
                    <tr
                      key={gymId || idx}
                      style={{
                        borderBottom: "1px solid #1f2937",
                        transition: "background-color 0.15s",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(31, 41, 55, 0.3)"
                      }}
                    >
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", color: "#60a5fa", fontWeight: "600" }}>
                        #{gymId}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: "600", color: "#ffffff" }}>
                        {row["Gym Name"]}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#d1d5db" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <HiOutlinePhone size={14} style={{ color: "#9ca3af" }} />
                          <span>{row["Contact Number"] || "N/A"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#4ade80", fontWeight: "600" }}>
                        {formatCurrency(row["Total Paid"])}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#ffffff" }}>
                        {formatCurrency(row["Total Payout"])}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#fbbf24" }}>
                        {formatCurrency(row["Commission"])}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#9ca3af" }}>
                        {formatCurrency(row["TDS (2%)"])}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#9ca3af" }}>
                        {formatCurrency(row["PG Charges (2%)"])}
                      </td>
                      <td style={{ padding: "12px 14px", color: "#FF5757", fontWeight: "700" }}>
                        {formatCurrency(row["Final Payout"])}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            backgroundColor: "#1f2937",
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#d1d5db"
                          }}
                        >
                          {row["Total Transactions"]}
                        </span>
                      </td>
                      
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Pagination */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #2d3748",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <span style={{ fontSize: "13px", color: "#9ca3af" }}>
            Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || loading}
              style={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: currentPage === 1 ? "#4b5563" : "#ffffff",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <HiOutlineChevronLeft size={16} /> Previous
            </button>

            <span style={{ fontSize: "13px", color: "#d1d5db", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              style={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: currentPage === totalPages ? "#4b5563" : "#ffffff",
                padding: "6px 12px",
                fontSize: "13px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Next <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Security Verification Modal for Excel Export */}
      <SecureExportModal {...secureExportProps} />
    </div>
  );
}
