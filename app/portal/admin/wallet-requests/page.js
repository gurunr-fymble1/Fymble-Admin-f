"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import {
  FaArrowLeft,
  FaSearch,
  FaSync,
  FaChevronLeft,
  FaChevronRight,
  FaWallet,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaUser,
  FaPhone,
  FaCopy,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaFilter,
} from "react-icons/fa";

export default function WalletWithdrawalRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state: "requests", "paid", "processing", "balance"
  const rawTab = searchParams.get("tab") || "requests";
  const initialTab = rawTab === "completed" ? "paid" : rawTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [clientWallets, setClientWallets] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    total_available_balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    pending_withdrawal: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Client Wallet Search & Pagination
  const [walletSearchTerm, setWalletSearchTerm] = useState("");
  const [walletCurrentPage, setWalletCurrentPage] = useState(1);
  const walletItemsPerPage = 10;

  // Updating state & notifications
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalStatus, setModalStatus] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(null);

  // Sync selected request status into modal state
  useEffect(() => {
    if (selectedRequest) {
      const cur = (selectedRequest.status || "pending").toLowerCase();
      setModalStatus(cur === "completed" ? "paid" : cur);
    }
  }, [selectedRequest]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch data from /api/admin/gym-stats/wallet-withdrawal-request
  const fetchWithdrawalRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/gym-stats/wallet-withdrawal-request");
      if (response.data && response.data.success) {
        const resData = response.data.data;
        if (resData && typeof resData === "object" && !Array.isArray(resData)) {
          setData(resData.withdrawals || []);
          setClientWallets(resData.wallet || []);
          setSummaryMetrics({
            total_available_balance: Number(resData.total_available_balance) || 0,
            total_earned: Number(resData.total_earned) || 0,
            total_withdrawn: Number(resData.total_withdrawn) || 0,
            pending_withdrawal: Number(resData.pending_withdrawal) || 0,
          });
        } else if (Array.isArray(resData)) {
          setData(resData);
          setClientWallets([]);
        } else {
          setData([]);
          setClientWallets([]);
        }
      } else {
        setData([]);
        setClientWallets([]);
      }
    } catch (err) {
      console.error("Error fetching wallet withdrawal requests:", err);
      setData([]);
      setClientWallets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, [fetchWithdrawalRequests]);

  // Update Withdrawal Status in DB via PUT /api/admin/gym-stats/wallet-withdrawal-request
  const handleUpdateStatus = async (requestId, newStatus) => {
    if (!requestId || !newStatus) return;

    const existing = data.find((item) => item.request_id === requestId);
    const existingStatus = (existing?.status || "").toLowerCase();
    if (existing && (existingStatus === "paid" || existingStatus === "completed")) {
      setToastMessage({
        type: "error",
        text: "Paid withdrawal requests cannot be modified.",
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      setUpdatingId(requestId);
      // Backend expects "completed" in DB
      const backendStatus = newStatus.toLowerCase() === "paid" ? "completed" : newStatus;

      const response = await axiosInstance.put("/api/admin/gym-stats/wallet-withdrawal-request", {
        request_id: requestId,
        status: backendStatus,
      });

      if (response.data && response.data.success) {
        // Update local state with backend status
        setData((prev) =>
          prev.map((item) =>
            item.request_id === requestId
              ? { ...item, status: backendStatus, updated_at: new Date().toISOString() }
              : item
          )
        );

        if (selectedRequest && selectedRequest.request_id === requestId) {
          setSelectedRequest((prev) => ({
            ...prev,
            status: backendStatus,
            updated_at: new Date().toISOString(),
          }));
        }

        const displayLabel = backendStatus === "completed" ? "Paid" : backendStatus;
        setToastMessage({
          type: "success",
          text: `Request #${requestId} status updated to ${displayLabel}!`,
        });
        setTimeout(() => setToastMessage(null), 3000);

        // Refresh stats
        fetchWithdrawalRequests();
      } else {
        alert(response.data?.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to update withdrawal status. Please ensure the backend endpoint is configured."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Sync tab change with URL params
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabKey);
    router.replace(`/portal/admin/wallet-requests?${params.toString()}`);
  };

  // Copy UPI handler
  const handleCopyUpi = (upiId, e) => {
    e.stopPropagation();
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(upiId);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  // Calculate Tab counts and item metrics
  const tabCounts = useMemo(() => {
    let requestsCount = 0; // pending, failed, rejected
    let processingCount = 0;
    let paidCount = 0;

    data.forEach((item) => {
      const st = (item.status || "").toLowerCase();
      if (st === "processing" || st === "in_progress") {
        processingCount += 1;
      } else if (st === "paid" || st === "completed" || st === "success" || st === "withdrawn") {
        paidCount += 1;
      } else {
        // Pending, requested, failed, rejected
        requestsCount += 1;
      }
    });

    return {
      requestsCount,
      processingCount,
      paidCount,
      completedCount: paidCount,
    };
  }, [data]);

  // Filtered dataset based on active tab and search
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const st = (item.status || "").toLowerCase();

      // Tab Filtering:
      // - "requests": Pending & Failed/Rejected requests only
      // - "processing": Processing requests only
      // - "paid" / "completed": Paid / Withdrawn requests only
      if (activeTab === "requests") {
        const isRequestTab =
          st === "pending" ||
          st === "requested" ||
          st === "failed" ||
          st === "rejected" ||
          (st !== "processing" && st !== "in_progress" && st !== "paid" && st !== "completed" && st !== "success" && st !== "withdrawn");
        if (!isRequestTab) return false;
      } else if (activeTab === "processing") {
        if (st !== "processing" && st !== "in_progress") return false;
      } else if (activeTab === "paid" || activeTab === "completed") {
        if (st !== "paid" && st !== "completed" && st !== "success" && st !== "withdrawn") return false;
      }

      // Search term
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase().trim();
        const clientName = (item.client_name || "").toLowerCase();
        const contact = (item.contact_number || "").toLowerCase();
        const upi = (item.upi_id || "").toLowerCase();
        const reqId = String(item.request_id || "").toLowerCase();
        const userId = String(item.user_id || "").toLowerCase();

        return (
          clientName.includes(query) ||
          contact.includes(query) ||
          upi.includes(query) ||
          reqId.includes(query) ||
          userId.includes(query)
        );
      }

      return true;
    });
  }, [data, activeTab, debouncedSearch]);

  // Pagination for Requests
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Filtered and Paginated Client Wallets (Balance Tab)
  const filteredClientWallets = useMemo(() => {
    if (!walletSearchTerm.trim()) return clientWallets;
    const q = walletSearchTerm.toLowerCase().trim();
    return clientWallets.filter((w) => {
      const name = (w.client_name || "").toLowerCase();
      const contact = (w.contact_number || "").toLowerCase();
      const id = String(w.client_id || "").toLowerCase();
      return name.includes(q) || contact.includes(q) || id.includes(q);
    });
  }, [clientWallets, walletSearchTerm]);

  const totalWalletPages = Math.ceil(filteredClientWallets.length / walletItemsPerPage) || 1;
  const paginatedClientWallets = useMemo(() => {
    const start = (walletCurrentPage - 1) * walletItemsPerPage;
    return filteredClientWallets.slice(start, start + walletItemsPerPage);
  }, [filteredClientWallets, walletCurrentPage, walletItemsPerPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    const st = (status || "").toLowerCase();
    let bg = "rgba(245, 158, 11, 0.15)";
    let color = "#fbbf24";
    let border = "1px solid rgba(245, 158, 11, 0.3)";
    let label = status || "Pending";

    if (st === "paid" || st === "completed" || st === "success" || st === "withdrawn") {
      bg = "rgba(16, 185, 129, 0.15)";
      color = "#34d399";
      border = "1px solid rgba(16, 185, 129, 0.3)";
      label = "Paid";
    } else if (st === "processing" || st === "in_progress") {
      bg = "rgba(59, 130, 246, 0.15)";
      color = "#60a5fa";
      border = "1px solid rgba(59, 130, 246, 0.3)";
      label = "Processing";
    } else if (st === "failed") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "#f87171";
      border = "1px solid rgba(239, 68, 68, 0.3)";
      label = "Failed";
    } else if (st === "rejected") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "#f87171";
      border = "1px solid rgba(239, 68, 68, 0.3)";
      label = "Rejected";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          backgroundColor: bg,
          color: color,
          border: border,
          padding: "4px 10px",
          borderRadius: "16px",
          fontSize: "12px",
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
        {label}
      </span>
    );
  };

  return (
    <div style={{ color: "#fff", padding: "20px 24px", minHeight: "100vh", backgroundColor: "#0f1117" }}>
      {/* Header with Back Button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            onClick={() => router.push("/portal/admin/home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#1e2433",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2d3748")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e2433")}
          >
            <FaArrowLeft size={14} /> Back
          </button>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
              <FaWallet style={{ color: "#FF5757" }} />
              Wallet Withdrawal Requests
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" }}>
              Manage client referral wallet withdrawal requests and payouts
            </p>
          </div>
        </div>

        <button
          onClick={fetchWithdrawalRequests}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#FF5757",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "9px 18px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "13px",
            fontWeight: "600",
            transition: "all 0.2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = "#e64c4c")}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = "#FF5757")}
        >
          <FaSync className={loading ? "spin-animation" : ""} size={13} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Common Summary Count Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {/* Total Amount (Total Earned) Card */}
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Amount
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaMoneyBillWave style={{ color: "#34d399", fontSize: "16px" }} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#34d399" }}>
            ₹{summaryMetrics.total_earned.toLocaleString("en-IN")}
          </div>
          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
            Total Earnings by Client
          </div>
        </div>

        {/* Balance in client wallet Card */}
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Balance
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(56, 189, 248, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaWallet style={{ color: "#38bdf8", fontSize: "16px" }} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#38bdf8" }}>
            ₹{summaryMetrics.total_available_balance.toLocaleString("en-IN")}
          </div>
          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
            Available amountin clients wallet
          </div>
        </div>



        {/* Processing (Pending Withdrawal) Card */}
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Requested
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaSpinner style={{ color: "#fbbf24", fontSize: "16px" }} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#fbbf24" }}>
            ₹{summaryMetrics.pending_withdrawal.toLocaleString("en-IN")}
          </div>
          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
            Requested & processing withdrawal amount
          </div>
        </div>

        {/* Withdrawal processed to client account Card */}
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Withdrawal Processed
            </span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FaCheckCircle style={{ color: "#a78bfa", fontSize: "16px" }} />
            </div>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#a78bfa" }}>
            ₹{summaryMetrics.total_withdrawn.toLocaleString("en-IN")}
          </div>
          <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
            Total Payouts Paid
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #232d3f",
          marginBottom: "20px",
          paddingBottom: "2px",
          overflowX: "auto",
        }}
      >
        {[
          { key: "requests", label: "Withdraw Request", count: tabCounts.requestsCount },
          { key: "processing", label: "Processing", count: tabCounts.processingCount },
          { key: "paid", label: "Paid", count: tabCounts.paidCount },
          { key: "balance", label: "Balance", count: null },
        ].map((tab) => {
          const isActive =
            activeTab === tab.key || (tab.key === "paid" && activeTab === "completed");
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                backgroundColor: isActive ? "rgba(255, 87, 87, 0.12)" : "transparent",
                color: isActive ? "#FF5757" : "#94a3b8",
                border: "none",
                borderBottom: isActive ? "2px solid #FF5757" : "2px solid transparent",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: isActive ? "700" : "500",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => !isActive && (e.currentTarget.style.color = "#e2e8f0")}
              onMouseLeave={(e) => !isActive && (e.currentTarget.style.color = "#94a3b8")}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  style={{
                    backgroundColor: isActive ? "#FF5757" : "#232d3f",
                    color: isActive ? "#fff" : "#94a3b8",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            backgroundColor: toastMessage.type === "success" ? "#065f46" : "#7f1d1d",
            color: "#fff",
            border: `1px solid ${toastMessage.type === "success" ? "#059669" : "#dc2626"}`,
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            zIndex: 1500,
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <FaCheckCircle /> {toastMessage.text}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === "balance" ? (
        /* Balance Tab Client Wallets Table Card */
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Search Bar */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #232d3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ position: "relative", flex: "1", maxWidth: "480px" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                value={walletSearchTerm}
                onChange={(e) => {
                  setWalletSearchTerm(e.target.value);
                  setWalletCurrentPage(1);
                }}
                placeholder="Search client wallet by name, phone, or client ID..."
                style={{
                  width: "100%",
                  backgroundColor: "#0f1117",
                  border: "1px solid #2d3748",
                  borderRadius: "8px",
                  padding: "9px 16px 9px 38px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              {walletSearchTerm && (
                <button
                  onClick={() => {
                    setWalletSearchTerm("");
                    setWalletCurrentPage(1);
                  }}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "500" }}>
              Total Accounts: <strong style={{ color: "#fff" }}>{clientWallets.length}</strong>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  border: "3px solid #2d3748",
                  borderTop: "3px solid #FF5757",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px auto",
                }}
              />
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading client wallet balances...</p>
            </div>
          ) : filteredClientWallets.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <FaWallet style={{ color: "#475569", fontSize: "40px", marginBottom: "14px" }} />
              <h4 style={{ color: "#e2e8f0", fontSize: "16px", marginBottom: "6px" }}>No client wallet balances found</h4>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                {walletSearchTerm ? "Try adjusting your search query." : "There are currently no client wallet records."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#121620", borderBottom: "1px solid #232d3f", color: "#94a3b8" }}>
                    <th style={{ padding: "14px 18px", fontWeight: "600", width: "90px" }}>Client ID</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Client Info</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Available Balance</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Total Earned</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Total Withdrawn</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Pending Withdrawal</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClientWallets.map((item) => (
                    <tr
                      key={item.client_id}
                      style={{
                        borderBottom: "1px solid #1e2535",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Client ID */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "700",
                            color: "#cbd5e1",
                            backgroundColor: "#1e2433",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          #{item.client_id}
                        </span>
                      </td>

                      {/* Client Info */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "14px", marginBottom: "2px" }}>
                          {item.client_name || "Unknown Client"}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaPhone size={10} style={{ color: "#64748b" }} />
                          {item.contact_number || "N/A"}
                        </div>
                      </td>

                      {/* Available Balance */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#38bdf8" }}>
                          ₹{Number(item.available_balance || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Total Earned */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#34d399" }}>
                          ₹{Number(item.total_earned || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Total Withdrawn */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#a78bfa" }}>
                          ₹{Number(item.total_withdrawn || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Pending Withdrawal */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#fbbf24" }}>
                          ₹{Number(item.pending_withdrawal || 0).toLocaleString("en-IN")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredClientWallets.length > 0 && (
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #232d3f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "13px" }}>
                Showing {(walletCurrentPage - 1) * walletItemsPerPage + 1} to{" "}
                {Math.min(walletCurrentPage * walletItemsPerPage, filteredClientWallets.length)} of {filteredClientWallets.length} entries
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  disabled={walletCurrentPage === 1}
                  onClick={() => setWalletCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    backgroundColor: "#161b26",
                    color: walletCurrentPage === 1 ? "#475569" : "#e2e8f0",
                    border: "1px solid #2d3748",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: walletCurrentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaChevronLeft size={10} /> Prev
                </button>

                <span style={{ color: "#94a3b8", fontSize: "13px", padding: "0 8px" }}>
                  Page {walletCurrentPage} of {totalWalletPages}
                </span>

                <button
                  disabled={walletCurrentPage >= totalWalletPages}
                  onClick={() => setWalletCurrentPage((p) => Math.min(totalWalletPages, p + 1))}
                  style={{
                    backgroundColor: "#161b26",
                    color: walletCurrentPage >= totalWalletPages ? "#475569" : "#e2e8f0",
                    border: "1px solid #2d3748",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: walletCurrentPage >= totalWalletPages ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Requests, Processing, and Paid Tabs */
        <div
          style={{
            backgroundColor: "#161b26",
            border: "1px solid #232d3f",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          {/* Search Bar */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #232d3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ position: "relative", flex: "1", maxWidth: "480px" }}>
              <FaSearch
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by client name, contact, UPI ID, or Req ID..."
                style={{
                  width: "100%",
                  backgroundColor: "#0f1117",
                  border: "1px solid #2d3748",
                  borderRadius: "8px",
                  padding: "9px 16px 9px 38px",
                  color: "#fff",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  border: "3px solid #2d3748",
                  borderTop: "3px solid #FF5757",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 16px auto",
                }}
              />
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Loading withdrawal requests...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <FaWallet style={{ color: "#475569", fontSize: "40px", marginBottom: "14px" }} />
              <h4 style={{ color: "#e2e8f0", fontSize: "16px", marginBottom: "6px" }}>No withdrawal requests found</h4>
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                {debouncedSearch ? "Try adjusting your search query." : "There are currently no records in this tab."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#121620", borderBottom: "1px solid #232d3f", color: "#94a3b8" }}>
                    <th style={{ padding: "14px 18px", fontWeight: "600", width: "90px" }}>REQ ID</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Client Info</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>UPI Details</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Amount</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Status</th>
                    <th style={{ padding: "14px 18px", fontWeight: "600" }}>Requested Date</th>
                    {(activeTab === "paid" || activeTab === "completed") && (
                      <th style={{ padding: "14px 18px", fontWeight: "600" }}>Processed Date</th>
                    )}
                    {activeTab !== "paid" && activeTab !== "completed" && (
                      <th style={{ padding: "14px 18px", fontWeight: "600", textAlign: "right" }}>Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item) => (
                    <tr
                      key={item.request_id}
                      style={{
                        borderBottom: "1px solid #1e2535",
                        transition: "background-color 0.2s",
                        cursor: (activeTab === "paid" || activeTab === "completed") ? "default" : "pointer",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      onClick={() => {
                        if (activeTab !== "paid" && activeTab !== "completed") {
                          setSelectedRequest(item);
                        }
                      }}
                    >
                      {/* Request ID */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "700",
                            color: "#cbd5e1",
                            backgroundColor: "#1e2433",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                          }}
                        >
                          #{item.request_id}
                        </span>
                      </td>

                      {/* Client Info */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: "600", color: "#f8fafc", fontSize: "14px", marginBottom: "2px" }}>
                          {item.client_name || "Unknown User"}
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaPhone size={10} style={{ color: "#64748b" }} />
                          {item.contact_number || "N/A"}
                          {item.user_id && (
                            <span style={{ color: "#64748b", marginLeft: "4px" }}>• User #{item.user_id}</span>
                          )}
                        </div>
                      </td>

                      {/* UPI Details */}
                      <td style={{ padding: "14px 18px" }}>
                        {item.upi_id ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                color: "#38bdf8",
                                fontFamily: "monospace",
                                fontSize: "13px",
                                backgroundColor: "rgba(56, 189, 248, 0.1)",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                border: "1px solid rgba(56, 189, 248, 0.2)",
                              }}
                            >
                              {item.upi_id}
                            </span>
                            <button
                              onClick={(e) => handleCopyUpi(item.upi_id, e)}
                              title="Copy UPI ID"
                              style={{
                                background: "none",
                                border: "none",
                                color: copiedUpi === item.upi_id ? "#34d399" : "#64748b",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {copiedUpi === item.upi_id ? <FaCheck size={12} /> : <FaCopy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#64748b" }}>No UPI Registered</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#34d399" }}>
                          ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: "14px 18px" }}>
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Requested At */}
                      <td style={{ padding: "14px 18px", color: "#94a3b8", fontSize: "12px" }}>
                        {formatDate(item.requested_at)}
                      </td>

                      {/* Processed Date (for paid tab) */}
                      {(activeTab === "paid" || activeTab === "completed") && (
                        <td style={{ padding: "14px 18px", color: "#34d399", fontSize: "12px", fontWeight: "500" }}>
                          {formatDate(item.processed_at)}
                        </td>
                      )}

                      {/* Action */}
                      {activeTab !== "paid" && activeTab !== "completed" && (
                        <td style={{ padding: "14px 18px", textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(item);
                            }}
                            style={{
                              backgroundColor: "rgba(255, 87, 87, 0.12)",
                              color: "#FF5757",
                              border: "1px solid rgba(255, 87, 87, 0.3)",
                              borderRadius: "6px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#FF5757";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(255, 87, 87, 0.12)";
                              e.currentTarget.style.color = "#FF5757";
                            }}
                          >
                            Update Status
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #232d3f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "13px" }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{
                    backgroundColor: "#161b26",
                    color: currentPage === 1 ? "#475569" : "#e2e8f0",
                    border: "1px solid #2d3748",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FaChevronLeft size={10} /> Prev
                </button>

                <span style={{ color: "#94a3b8", fontSize: "13px", padding: "0 8px" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    backgroundColor: "#161b26",
                    color: currentPage >= totalPages ? "#475569" : "#e2e8f0",
                    border: "1px solid #2d3748",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              backgroundColor: "#161b26",
              border: "1px solid #2d3748",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              color: "#fff",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid #232d3f",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaWallet style={{ color: "#FF5757", fontSize: "16px" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
                  Withdrawal #{selectedRequest.request_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "14px",
                  padding: "4px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body (Scrollable if screen is small) */}
            <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
              {/* Amount Highlight */}
              <div
                style={{
                  backgroundColor: "#0f1117",
                  border: "1px solid #232d3f",
                  borderRadius: "10px",
                  padding: "12px",
                  textAlign: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Requested Payout Amount
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#34d399" }}>
                  ₹{Number(selectedRequest.amount || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Status Selection & Update Section */}
              <div
                style={{
                  backgroundColor: "#0f1117",
                  border: "1px solid #232d3f",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Status:
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    Current: <strong style={{ color: "#fff", textTransform: "capitalize" }}>{selectedRequest.status || "Pending"}</strong>
                  </span>
                </div>

                {["paid", "completed"].includes((selectedRequest.status || "").toLowerCase()) ? (
                  /* Paid Lock Banner */
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "6px",
                      padding: "10px 12px",
                      color: "#34d399",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    <FaCheckCircle size={14} />
                    <span>This withdrawal is <strong>Paid</strong> and cannot be edited.</span>
                  </div>
                ) : (
                  <>
                    {/* 4 Status Option Selectable Chips */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "10px" }}>
                      {[
                        { key: "pending", label: "Pending", bg: "rgba(245, 158, 11, 0.15)", border: "#fbbf24", color: "#fbbf24" },
                        { key: "processing", label: "Processing", bg: "rgba(59, 130, 246, 0.15)", border: "#60a5fa", color: "#60a5fa" },
                        { key: "paid", label: "Paid", bg: "rgba(16, 185, 129, 0.15)", border: "#34d399", color: "#34d399" },
                        { key: "failed", label: "Failed", bg: "rgba(239, 68, 68, 0.15)", border: "#f87171", color: "#f87171" },
                      ].map((s) => {
                        const isSelected = modalStatus === s.key;
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => setModalStatus(s.key)}
                            style={{
                              backgroundColor: isSelected ? s.bg : "rgba(255, 255, 255, 0.03)",
                              color: isSelected ? s.color : "#94a3b8",
                              border: isSelected ? `2px solid ${s.border}` : "1px solid #2d3748",
                              borderRadius: "6px",
                              padding: "6px 2px",
                              fontSize: "11px",
                              fontWeight: isSelected ? "700" : "500",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                            }}
                          >
                            {isSelected && <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: s.color }} />}
                            {s.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explicit Update Button */}
                    <button
                      disabled={
                        updatingId === selectedRequest.request_id ||
                        modalStatus === (selectedRequest.status || "").toLowerCase() ||
                        (modalStatus === "paid" && (selectedRequest.status || "").toLowerCase() === "completed")
                      }
                      onClick={() => handleUpdateStatus(selectedRequest.request_id, modalStatus)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        backgroundColor:
                          modalStatus === (selectedRequest.status || "").toLowerCase()
                            ? "#1e2433"
                            : "#FF5757",
                        color:
                          modalStatus === (selectedRequest.status || "").toLowerCase()
                            ? "#64748b"
                            : "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor:
                          modalStatus === (selectedRequest.status || "").toLowerCase() || updatingId === selectedRequest.request_id
                            ? "not-allowed"
                            : "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (modalStatus !== (selectedRequest.status || "").toLowerCase() && updatingId !== selectedRequest.request_id) {
                          e.currentTarget.style.backgroundColor = "#e64c4c";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (modalStatus !== (selectedRequest.status || "").toLowerCase() && updatingId !== selectedRequest.request_id) {
                          e.currentTarget.style.backgroundColor = "#FF5757";
                        }
                      }}
                    >
                      {updatingId === selectedRequest.request_id ? (
                        <>
                          <FaSpinner className="spin-animation" size={12} /> Updating...
                        </>
                      ) : modalStatus === (selectedRequest.status || "").toLowerCase() ? (
                        "Select a different status to update"
                      ) : (
                        `Update Status to ${modalStatus.charAt(0).toUpperCase() + modalStatus.slice(1)}`
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Detail Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Client Name</span>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>{selectedRequest.client_name || "N/A"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Contact Number</span>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>{selectedRequest.contact_number || "N/A"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>User ID</span>
                  <span style={{ fontWeight: "600", color: "#f8fafc" }}>#{selectedRequest.user_id || selectedRequest.client_id || "N/A"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>UPI ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: "600" }}>
                      {selectedRequest.upi_id || "N/A"}
                    </span>
                    {selectedRequest.upi_id && (
                      <button
                        onClick={(e) => handleCopyUpi(selectedRequest.upi_id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          color: copiedUpi === selectedRequest.upi_id ? "#34d399" : "#64748b",
                          cursor: "pointer",
                        }}
                      >
                        {copiedUpi === selectedRequest.upi_id ? <FaCheck size={11} /> : <FaCopy size={11} />}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Requested On</span>
                  <span style={{ color: "#94a3b8" }}>{formatDate(selectedRequest.requested_at || selectedRequest.created_at)}</span>
                </div>

                {selectedRequest.processed_at && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e2535", paddingBottom: "6px" }}>
                    <span style={{ color: "#64748b" }}>Processed Date</span>
                    <span style={{ color: "#34d399", fontWeight: "600" }}>{formatDate(selectedRequest.processed_at)}</span>
                  </div>
                )}

                {selectedRequest.updated_at && !selectedRequest.processed_at && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Last Updated</span>
                    <span style={{ color: "#94a3b8" }}>{formatDate(selectedRequest.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #232d3f",
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  backgroundColor: "#242d3d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 16px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
