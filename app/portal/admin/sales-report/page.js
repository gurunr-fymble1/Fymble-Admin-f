"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import { useRole } from "../../layout";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import {
  HiOutlineDocumentReport,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineDownload,
  HiOutlineCurrencyRupee,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineX,
  HiOutlineCalendar,
  HiOutlineEye,
  HiOutlineShoppingBag,
  HiOutlineChartBar,
} from "react-icons/hi";

export default function SalesReportPage() {
  const { role } = useRole();
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [exporting, setExporting] = useState(false);

  // Filters & Pagination
  const [dateFilter, setDateFilter] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal & Copy state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeMetaTab, setActiveMetaTab] = useState("order");
  const [copiedKey, setCopiedKey] = useState(null);

  const MIN_DATE = "2026-01-01";

  const formatDate = (d) => {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const clampMinDate = (dateStr) => {
    if (!dateStr) return MIN_DATE;
    return dateStr < MIN_DATE ? MIN_DATE : dateStr;
  };

  // Compute preset dates (Restricted to Jan 1, 2026 minimum)
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();

    if (dateFilter === "this_month") {
      setStartDate(clampMinDate(formatDate(new Date(y, m, 1))));
      setEndDate(formatDate(today));
    } else if (dateFilter === "last_month") {
      setStartDate(clampMinDate(formatDate(new Date(y, m - 1, 1))));
      setEndDate(clampMinDate(formatDate(new Date(y, m, 0))));
    } else if (dateFilter === "this_year") {
      setStartDate(MIN_DATE);
      setEndDate(formatDate(today));
    } else if (dateFilter === "last_year") {
      // Restricted to start from Jan 1, 2026
      setStartDate(MIN_DATE);
      setEndDate(MIN_DATE);
    } else if (dateFilter === "overall") {
      setStartDate(MIN_DATE);
      setEndDate(formatDate(today));
    } else if (dateFilter === "custom" && customStart && customEnd) {
      setStartDate(clampMinDate(customStart));
      setEndDate(clampMinDate(customEnd));
    }
  }, [dateFilter, customStart, customEnd]);

  // Fetch orders from API
  const fetchOrders = useCallback(async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const payload = { start_date: start, end_date: end };
      const candidateUrls = [
        "/api/admin/sales-report/orders"
      ];

      let res = null;
      let lastError = null;

      for (const url of candidateUrls) {
        try {
          res = await axiosInstance.get(url, { params: payload });
          if (res?.data) break;
        } catch (getErr) {
          lastError = getErr;
          if (getErr?.response?.status === 405 || getErr?.response?.status === 422) {
            try {
              res = await axiosInstance.post(url, payload);
              if (res?.data) break;
            } catch (postErr) {
              lastError = postErr;
            }
          }
        }
      }

      if (!res && lastError) {
        throw lastError;
      }

      const data = res?.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.return_data)
        ? data.return_data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setOrders(Array.isArray(list) ? list : []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Sales report error details:", {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
      });
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to load orders.";
      setError(typeof errMsg === "object" ? JSON.stringify(errMsg) : errMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (startDate && endDate) fetchOrders(startDate, endDate);
  }, [startDate, endDate, fetchOrders]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Number(val) || 0);

  const formatDateTime = (str) => {
    if (!str) return "-";
    const d = new Date(str);
    return isNaN(d.getTime()) ? str : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Filtered & Sorted Data
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? [...orders] : [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) =>
        [o.provider_order_id, o.provider_payment_id, o.gym_id, o.item_type, o.payment_status, o.order_status, o.amount_rupees, o.pg_charge, o.pag_charge, o.tax, JSON.stringify(o.order_metadata), JSON.stringify(o.payment_metadata)]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (paymentStatusFilter !== "all") {
      list = list.filter((o) => String(o.payment_status || "").toLowerCase() === paymentStatusFilter.toLowerCase());
    }
    if (orderStatusFilter !== "all") {
      list = list.filter((o) => String(o.order_status || "").toLowerCase() === orderStatusFilter.toLowerCase());
    }
    list.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.order_created_at || 0) - new Date(a.order_created_at || 0);
      if (sortBy === "date_asc") return new Date(a.order_created_at || 0) - new Date(b.order_created_at || 0);
      if (sortBy === "amount_desc") return (Number(b.amount_rupees) || 0) - (Number(a.amount_rupees) || 0);
      if (sortBy === "amount_asc") return (Number(a.amount_rupees) || 0) - (Number(b.amount_rupees) || 0);
      return 0;
    });
    return list;
  }, [orders, search, paymentStatusFilter, orderStatusFilter, sortBy]);

  // Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0, paidRevenue = 0, paidCount = 0, failedCount = 0, pendingCount = 0;
    filteredOrders.forEach((o) => {
      const amt = Number(o.amount_rupees) || 0;
      totalRevenue += amt;
      const s = String(o.payment_status || "").toLowerCase();
      if (["captured", "success", "paid", "completed"].includes(s)) {
        paidCount++;
        paidRevenue += amt;
      } else if (["failed", "failure", "cancelled", "rejected"].includes(s)) {
        failedCount++;
      } else {
        pendingCount++;
      }
    });
    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      paidCount,
      paidRevenue,
      failedCount,
      pendingCount,
      aov: paidCount > 0 ? paidRevenue / paidCount : 0,
    };
  }, [filteredOrders]);

  const uniquePayStatuses = useMemo(() => Array.from(new Set((Array.isArray(orders) ? orders : []).map((o) => o.payment_status).filter(Boolean))), [orders]);
  const uniqueOrdStatuses = useMemo(() => Array.from(new Set((Array.isArray(orders) ? orders : []).map((o) => o.order_status).filter(Boolean))), [orders]);

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const s = (currentPage - 1) * pageSize;
    return filteredOrders.slice(s, s + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Helper to extract description and method for export
  const getOrderDescription = (o) => {
    let info = o.order_info;
    if (typeof info === "string") {
      try { info = JSON.parse(info); } catch (e) {}
    }
    if (info && typeof info === "object") {
      if (info.flow) return String(info.flow);
      if (info.type) return String(info.type);
      if (info.item_type) return String(info.item_type);
    }
    let meta = o.order_metadata;
    if (typeof meta === "string") {
      try { meta = JSON.parse(meta); } catch (e) {}
    }
    if (meta && typeof meta === "object") {
      if (meta.flow) return String(meta.flow);
      if (meta.type) return String(meta.type);
      if (meta.order_info && typeof meta.order_info === "object") {
        if (meta.order_info.flow) return String(meta.order_info.flow);
        if (meta.order_info.type) return String(meta.order_info.type);
      }
    }
    return o.item_type || "";
  };

  const getPaymentMethod = (o) => {
    let pmeta = o.payment_metadata;
    if (typeof pmeta === "string") {
      try { pmeta = JSON.parse(pmeta); } catch (e) {}
    }
    if (pmeta && typeof pmeta === "object") {
      return pmeta.method || pmeta.payment_method || "";
    }
    return "";
  };

  // Export Excel
  const handleExport = () => {
    if (!filteredOrders.length) return alert("No data to export.");
    handleExportTrigger(async () => {
      setExporting(true);
      try {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Fittbot Admin";
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet("Sales Orders", {
          views: [{ showGridLines: true }],
        });

        // Define columns
        worksheet.columns = [
          { header: "Date", key: "date", width: 15 },
          { header: "Payment Id", key: "payment_id", width: 26 },
          { header: "Order ID", key: "order_id", width: 26 },
          { header: "Status", key: "status", width: 16 },
          { header: "Gym Id", key: "gym_id", width: 12 },
          { header: "Description", key: "description", width: 26 },
          { header: "Method", key: "method", width: 16 },
          { header: "Amount", key: "amount", width: 16 },
          { header: "Refunded", key: "refunded", width: 14 },
          { header: "PG Charge", key: "pg_charge", width: 14 },
          { header: "Tax", key: "tax", width: 12 },
          { header: "Contact", key: "contact", width: 16 },
        ];

        // Format header row (Row 1)
        const headerRow = worksheet.getRow(1);
        headerRow.height = 32; // Increased header height

        headerRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1E293B" }, // Professional dark slate background
          };
          cell.font = {
            name: "Segoe UI",
            size: 11,
            bold: true,
            color: { argb: "FFFFFFFF" }, // Pure white text
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "center",
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FF475569" } },
            bottom: { style: "medium", color: { argb: "FF0F172A" } },
            left: { style: "thin", color: { argb: "FF475569" } },
            right: { style: "thin", color: { argb: "FF475569" } },
          };
        });

        // Add Data Rows
        filteredOrders.forEach((o) => {
          const pgChargeVal = o.pg_charge != null ? Number(o.pg_charge) : (o.pag_charge != null ? Number(o.pag_charge) : 0);
          const taxVal = o.tax != null ? Number(o.tax) : 0;

          const row = worksheet.addRow({
            date: o.order_created_at ? (o.order_created_at.includes("T") ? o.order_created_at.split("T")[0] : o.order_created_at.split(" ")[0]) : "",
            payment_id: o.provider_payment_id || "",
            order_id: o.provider_order_id || "",
            status: o.payment_status || "",
            gym_id: o.gym_id ?? "",
            description: getOrderDescription(o),
            method: getPaymentMethod(o),
            amount: Number(Number(o.amount_rupees || 0).toFixed(2)),
            refunded: "",
            pg_charge: Number(Number(pgChargeVal || 0).toFixed(2)),
            tax: Number(Number(taxVal || 0).toFixed(2)),
            contact: "",
          });

          row.height = 22; // Comfortable row height
          row.alignment = { vertical: "middle" };

          // Specific cell alignments
          row.getCell("date").alignment = { vertical: "middle", horizontal: "center" };
          row.getCell("status").alignment = { vertical: "middle", horizontal: "center" };
          row.getCell("gym_id").alignment = { vertical: "middle", horizontal: "center" };
          row.getCell("method").alignment = { vertical: "middle", horizontal: "center" };
          row.getCell("amount").alignment = { vertical: "middle", horizontal: "right" };
          row.getCell("pg_charge").alignment = { vertical: "middle", horizontal: "right" };
          row.getCell("tax").alignment = { vertical: "middle", horizontal: "right" };
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `sales-report-${startDate}-to-${endDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export Excel file.");
      } finally {
        setExporting(false);
      }
    });
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    const isSuccess = ["captured", "success", "paid", "completed", "active"].includes(s);
    const isFailed = ["failed", "cancelled", "rejected"].includes(s);
    const isPending = ["pending", "created", "processing"].includes(s);

    const bg = isSuccess ? "rgba(16,185,129,0.15)" : isFailed ? "rgba(239,68,68,0.15)" : isPending ? "rgba(245,158,11,0.15)" : "rgba(107,114,128,0.2)";
    const color = isSuccess ? "#10b981" : isFailed ? "#ef4444" : isPending ? "#f59e0b" : "#9ca3af";

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: bg, color, textTransform: "capitalize" }}>
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: color }} />
        {status || "N/A"}
      </span>
    );
  };

  return (
    <div style={{ padding: "0 8px 32px 8px", color: "white" }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "20px", background: "#1f2937", padding: "16px 20px", borderRadius: "10px", border: "1px solid #374151" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,87,87,0.15)", color: "#FF5757", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HiOutlineDocumentReport size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#fff" }}>Sales Report — Orders</h1>
            <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0 0" }}>Order transactions, revenue, and metadata logs</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => fetchOrders(startDate, endDate)} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#374151", color: "#fff", border: "1px solid #4b5563", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer" }}>
            <HiOutlineRefresh size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
          </button>
          <button onClick={handleExport} disabled={exporting || loading || !filteredOrders.length} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer", opacity: filteredOrders.length ? 1 : 0.6 }}>
            <HiOutlineDownload size={15} /> {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Date Period Filter Bar */}
      <div style={{ background: "#1f2937", padding: "12px 16px", borderRadius: "10px", border: "1px solid #374151", marginBottom: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px", marginRight: "4px" }}>
            <HiOutlineCalendar size={16} /> Period:
          </span>
          {[
            { key: "this_month", label: "This Month" },
            { key: "last_month", label: "Last Month" },
            { key: "this_year", label: "This Year" },
            { key: "last_year", label: "Last Year" },
            { key: "overall", label: "Overall" },
            { key: "custom", label: "Custom Range" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setDateFilter(item.key);
                if (item.key === "custom" && (!customStart || !customEnd)) {
                  setCustomStart(startDate || MIN_DATE);
                  setCustomEnd(endDate || formatDate(new Date()));
                }
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "5px",
                fontSize: "12px",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                background: dateFilter === item.key ? "#FF5757" : "#374151",
                color: "#fff",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {dateFilter === "custom" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customStart && customEnd) {
                const s = clampMinDate(customStart);
                const endVal = clampMinDate(customEnd);
                if (new Date(s) > new Date(endVal)) return alert("Start date cannot be after end date.");
                setCustomStart(s);
                setCustomEnd(endVal);
                setStartDate(s);
                setEndDate(endVal);
              }
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}
          >
            <input type="date" min={MIN_DATE} value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ background: "#111827", border: "1px solid #4b5563", color: "#fff", padding: "4px 8px", borderRadius: "5px", fontSize: "12px" }} required />
            <span style={{ color: "#9ca3af", fontSize: "12px" }}>to</span>
            <input type="date" min={MIN_DATE} value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ background: "#111827", border: "1px solid #4b5563", color: "#fff", padding: "4px 8px", borderRadius: "5px", fontSize: "12px" }} required />
            <button type="submit" style={{ background: "#FF5757", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "5px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Apply</button>
          </form>
        ) : (
          <div style={{ fontSize: "12px", color: "#9ca3af", background: "#111827", padding: "5px 10px", borderRadius: "5px", border: "1px solid #374151" }}>
            Period: <span style={{ color: "#10b981", fontWeight: "700" }}>{startDate}</span> to <span style={{ color: "#10b981", fontWeight: "700" }}>{endDate}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Total Orders", value: metrics.totalOrders.toLocaleString(), sub: "Total transactions", icon: HiOutlineShoppingBag, color: "#60a5fa", bg: "rgba(59,130,246,0.15)" },
          { label: "Gross Revenue", value: formatCurrency(metrics.totalRevenue), sub: "Sum of orders", icon: HiOutlineCurrencyRupee, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
          // { label: "Paid / Captured", value: `${metrics.paidCount} (${formatCurrency(metrics.paidRevenue)})`, sub: "Successful payments", icon: HiOutlineCheckCircle, color: "#34d399", bg: "rgba(16,185,129,0.15)" },
          // { label: "Average Order Value", value: formatCurrency(metrics.aov), sub: "Per paid order", icon: HiOutlineChartBar, color: "#fbbf24", bg: "rgba(245,158,11,0.15)" },
          // { label: "Pending / Failed", value: `${metrics.pendingCount} / ${metrics.failedCount}`, sub: "Unsettled orders", icon: HiOutlineXCircle, color: "#f87171", bg: "rgba(239,68,68,0.15)" },
        ].map((kpi, idx) => (
          <div key={idx} style={{ background: "#1f2937", padding: "14px 16px", borderRadius: "10px", border: "1px solid #374151" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#9ca3af" }}>{kpi.label}</span>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: kpi.bg, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon size={16} />
              </div>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", marginTop: "6px", color: kpi.color === "#10b981" ? "#10b981" : "#fff" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div style={{ background: "#1f2937", padding: "12px 16px", borderRadius: "10px", border: "1px solid #374151", marginBottom: "16px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ position: "relative", minWidth: "240px", flex: "1 1 260px" }}>
          <HiOutlineSearch size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search by Order ID, Gym ID, Item Type, Status, Metadata..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ width: "100%", padding: "7px 10px 7px 32px", background: "#111827", border: "1px solid #374151", borderRadius: "6px", color: "#fff", fontSize: "12px", outline: "none" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><HiOutlineX size={14} /></button>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* <select value={paymentStatusFilter} onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }} style={{ background: "#111827", border: "1px solid #374151", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}>
            <option value="all">All Payment Status</option>
            {uniquePayStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={orderStatusFilter} onChange={(e) => { setOrderStatusFilter(e.target.value); setCurrentPage(1); }} style={{ background: "#111827", border: "1px solid #374151", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}>
            <option value="all">All Order Status</option>
            {uniqueOrdStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select> */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: "#111827", border: "1px solid #374151", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}>
            <option value="date_desc">Date: Newest</option>
            <option value="date_asc">Date: Oldest</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ background: "#111827", border: "1px solid #374151", color: "#fff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px" }}>
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", padding: "12px 16px", borderRadius: "8px", color: "#f87171", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
          <span>{error}</span>
          <button onClick={() => fetchOrders(startDate, endDate)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "#1f2937", borderRadius: "10px", border: "1px solid #374151", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid #374151", borderTopColor: "#FF5757", animation: "spin 1s linear infinite", margin: "0 auto 12px auto" }} />
            Loading sales report...
          </div>
        ) : !filteredOrders.length ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No orders found for the selected period and filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#111827", borderBottom: "1px solid #374151", color: "#9ca3af", fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 14px", width: "40px" }}>#</th>
                  <th style={{ padding: "10px 14px" }}>Provider Order ID</th>
                  <th style={{ padding: "10px 14px" }}>Gym ID</th>
                  <th style={{ padding: "10px 14px" }}>Item Type</th>
                  <th style={{ padding: "10px 14px" }}>Amount</th>
                  <th style={{ padding: "10px 14px" }}>Payment Status</th>
                  <th style={{ padding: "10px 14px" }}>Order Status</th>
                  <th style={{ padding: "10px 14px" }}>Created At</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const rowKey = `${o.provider_order_id || "order"}_${o.provider_payment_id || ""}_${globalIdx}`;
                  return (
                    <tr key={rowKey} style={{ borderBottom: "1px solid #2d3748" }}>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>{globalIdx}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#f3f4f6", fontWeight: "600" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{o.provider_order_id || "-"}</span>
                          {o.provider_order_id && (
                            <button onClick={() => handleCopy(o.provider_order_id, `ord_${globalIdx}`)} style={{ background: "none", border: "none", color: copiedKey === `ord_${globalIdx}` ? "#10b981" : "#6b7280", cursor: "pointer", padding: "1px" }}>
                              <HiOutlineClipboardCopy size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {o.gym_id != null ? (
                          <span style={{ padding: "2px 6px", background: "#1f2937", borderRadius: "4px", fontFamily: "monospace", fontSize: "11px", color: "#fef08a", border: "1px solid #854d0e" }}>{o.gym_id}</span>
                        ) : <span style={{ color: "#6b7280" }}>-</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {o.item_type ? (
                          <span style={{ padding: "2px 8px", background: "rgba(99,102,241,0.15)", borderRadius: "10px", fontSize: "11px", color: "#a5b4fc", fontWeight: "600", textTransform: "capitalize" }}>{o.item_type}</span>
                        ) : <span style={{ color: "#6b7280" }}>-</span>}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: "700", color: "#10b981" }}>{formatCurrency(o.amount_rupees)}</td>
                      <td style={{ padding: "10px 14px" }}>{getStatusBadge(o.payment_status)}</td>
                      <td style={{ padding: "10px 14px" }}>{getStatusBadge(o.order_status)}</td>
                      <td style={{ padding: "10px 14px", color: "#d1d5db" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <HiOutlineClock size={14} style={{ color: "#9ca3af" }} /> {formatDateTime(o.order_created_at)}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <button onClick={() => { setSelectedOrder(o); setActiveMetaTab("order"); }} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "5px 10px", background: "#374151", color: "#fff", border: "1px solid #4b5563", borderRadius: "5px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>
                          <HiOutlineEye size={13} /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #374151", background: "#111827", fontSize: "12px", color: "#9ca3af" }}>
            <div>Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}</div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ display: "flex", alignItems: "center", gap: "2px", padding: "4px 8px", background: currentPage === 1 ? "#1f2937" : "#374151", color: currentPage === 1 ? "#6b7280" : "#fff", border: "none", borderRadius: "4px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
                <HiOutlineChevronLeft size={14} /> Prev
              </button>
              <span style={{ padding: "4px 8px", color: "#fff" }}>{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ display: "flex", alignItems: "center", gap: "2px", padding: "4px 8px", background: currentPage === totalPages ? "#1f2937" : "#374151", color: currentPage === totalPages ? "#6b7280" : "#fff", border: "none", borderRadius: "4px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>
                Next <HiOutlineChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Modal */}
      {selectedOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }} onClick={() => setSelectedOrder(null)}>
          <div style={{ background: "#1f2937", borderRadius: "12px", border: "1px solid #374151", width: "100%", maxWidth: "650px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #374151", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111827" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>Order #{selectedOrder.provider_order_id || "Details"}</div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}><HiOutlineX size={20} /></button>
            </div>
            <div style={{ padding: "16px", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", padding: "10px", background: "#111827", borderRadius: "8px", border: "1px solid #374151", marginBottom: "14px", fontSize: "11px" }}>
                <div><span style={{ color: "#9ca3af" }}>Amount:</span> <div style={{ color: "#10b981", fontWeight: "700", fontSize: "14px" }}>{formatCurrency(selectedOrder.amount_rupees)}</div></div>
                <div><span style={{ color: "#9ca3af" }}>Payment:</span> <div>{getStatusBadge(selectedOrder.payment_status)}</div></div>
                <div><span style={{ color: "#9ca3af" }}>Order:</span> <div>{getStatusBadge(selectedOrder.order_status)}</div></div>
                <div><span style={{ color: "#9ca3af" }}>Gym ID:</span> <div style={{ color: "#fef08a", fontFamily: "monospace" }}>{selectedOrder.gym_id != null ? selectedOrder.gym_id : "-"}</div></div>
                <div><span style={{ color: "#9ca3af" }}>Item Type:</span> <div style={{ color: "#a5b4fc", fontWeight: "600" }}>{selectedOrder.item_type || "-"}</div></div>
                {selectedOrder.provider_payment_id && (
                  <div><span style={{ color: "#9ca3af" }}>Payment ID:</span> <div style={{ color: "#38bdf8", fontFamily: "monospace" }}>{selectedOrder.provider_payment_id}</div></div>
                )}
                {selectedOrder.order_info && (
                  <div><span style={{ color: "#9ca3af" }}>Order Info:</span> <div style={{ color: "#facc15", fontWeight: "600" }}>{String(selectedOrder.order_info)}</div></div>
                )}
                {(selectedOrder.pg_charge != null || selectedOrder.pag_charge != null) && (
                  <div><span style={{ color: "#9ca3af" }}>PG Charge:</span> <div style={{ color: "#f87171", fontWeight: "700" }}>{formatCurrency(selectedOrder.pg_charge ?? selectedOrder.pag_charge ?? 0)}</div></div>
                )}
                {selectedOrder.tax != null && (
                  <div><span style={{ color: "#9ca3af" }}>Tax:</span> <div style={{ color: "#fbbf24", fontWeight: "700" }}>{formatCurrency(selectedOrder.tax ?? 0)}</div></div>
                )}
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid #374151", marginBottom: "12px", gap: "6px" }}>
                <button onClick={() => setActiveMetaTab("order")} style={{ padding: "6px 12px", background: "none", border: "none", borderBottom: activeMetaTab === "order" ? "2px solid #FF5757" : "none", color: activeMetaTab === "order" ? "#fff" : "#9ca3af", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Order Metadata</button>
                <button onClick={() => setActiveMetaTab("payment")} style={{ padding: "6px 12px", background: "none", border: "none", borderBottom: activeMetaTab === "payment" ? "2px solid #FF5757" : "none", color: activeMetaTab === "payment" ? "#fff" : "#9ca3af", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Payment Metadata</button>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#9ca3af" }}>JSON Payload:</span>
                  <button onClick={() => handleCopy(JSON.stringify(activeMetaTab === "order" ? selectedOrder.order_metadata : selectedOrder.payment_metadata, null, 2), "modal_json")} style={{ background: "none", border: "none", color: copiedKey === "modal_json" ? "#10b981" : "#9ca3af", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                    <HiOutlineClipboardCopy size={13} /> {copiedKey === "modal_json" ? "Copied" : "Copy JSON"}
                  </button>
                </div>
                <pre style={{ background: "#111827", padding: "12px", borderRadius: "6px", border: "1px solid #374151", color: activeMetaTab === "order" ? "#34d399" : "#60a5fa", fontSize: "11px", fontFamily: "monospace", overflowX: "auto", margin: 0, maxHeight: "250px" }}>
                  {JSON.stringify((activeMetaTab === "order" ? selectedOrder.order_metadata : selectedOrder.payment_metadata) || {}, null, 2)}
                </pre>
              </div>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #374151", background: "#111827", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: "6px 14px", background: "#374151", color: "#fff", border: "none", borderRadius: "5px", fontSize: "12px", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <SecureExportModal {...secureExportProps} />
      <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
