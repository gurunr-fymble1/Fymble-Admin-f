"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaSync,
  FaFileExport,
  FaUserTimes,
  FaCheckCircle,
  FaClock,
  FaCommentDots,
  FaEye,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaInfoCircle,
  FaTrashAlt,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaTicketAlt,
  FaDumbbell,
  FaBuilding,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import {
  fetchDeleteRequests,
  deleteClientAccount,
  fetchClientBookings,
} from "@/lib/deleteRequestApi";

export default function DeleteRequestsView({ backUrl = "/portal/admin/home", titlePrefix = "Admin" }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  // Filters & Search - Default Newest First
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'deleted' | 'pending'
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' | 'asc' (newest first)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals & Bookings State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [clientBookings, setClientBookings] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchDeleteRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching delete requests:", err);
      setError("Unable to load delete requests. Please try refreshing.");
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatDateOnly = (dateVal) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return String(dateVal);
    }
  };

  // Handler for clicking View: opens modal and fetches client bookings from backend
  const handleViewDetails = async (item) => {
    setSelectedRequest(item);
    setClientBookings(null);
    setLoadingBookings(true);

    try {
      const bookingsData = await fetchClientBookings(item.client_id);
      setClientBookings(bookingsData);
    } catch (err) {
      console.error("Failed to load client bookings:", err);
      setClientBookings({
        summary: null,
        sessions: [],
        dailyPasses: [],
        memberships: [],
        totalBookingsCount: 0,
      });
    } finally {
      setLoadingBookings(false);
    }
  };

  // Combines all client bookings into a single unified list sorted newest first
  const allCombinedBookings = useMemo(() => {
    if (!clientBookings) return [];
    const list = [];

    // Sessions
    (clientBookings.sessions || []).forEach((sess) => {
      list.push({
        id: `sess_${sess.id}`,
        type: "Session",
        typeBadgeColor: "#60a5fa",
        typeBadgeBg: "rgba(59, 130, 246, 0.15)",
        title: sess.session_name || "Fitness Session",
        gymName: sess.gym_name || (sess.gym_id ? `Gym #${sess.gym_id}` : "N/A"),
        date: sess.booking_date || sess.created_at,
        displayDate: sess.booking_date
          ? `${sess.booking_date}${sess.start_time ? ` at ${sess.start_time}` : ""}`
          : formatDate(sess.created_at),
        amount:
          sess.price_paid !== null && sess.price_paid !== undefined
            ? `₹${sess.price_paid}`
            : "Included",
        status: sess.status || "Booked",
        rawDate: new Date(sess.booking_date || sess.created_at || 0).getTime(),
      });
    });

    // Daily Passes
    (clientBookings.dailyPasses || []).forEach((dp) => {
      const amt = dp.amount_paid
        ? dp.amount_paid > 500
          ? `₹${(dp.amount_paid / 100).toFixed(0)}`
          : `₹${dp.amount_paid}`
        : "₹0";
      list.push({
        id: `dp_${dp.id}`,
        type: "Daily Pass",
        typeBadgeColor: "#fbbf24",
        typeBadgeBg: "rgba(245, 158, 11, 0.15)",
        title: `${dp.days_total || 1} Day Pass`,
        gymName: dp.gym_name || (dp.gym_id ? `Gym #${dp.gym_id}` : "N/A"),
        date: dp.valid_from || dp.created_at,
        displayDate: dp.valid_from
          ? `${dp.valid_from}${dp.valid_until && dp.valid_until !== dp.valid_from ? ` to ${dp.valid_until}` : ""}`
          : formatDate(dp.created_at),
        amount: amt,
        status: dp.status || "Active",
        rawDate: new Date(dp.valid_from || dp.created_at || 0).getTime(),
      });
    });

    // Gym Memberships
    (clientBookings.memberships || []).forEach((mem) => {
      const amt = mem.amount
        ? mem.amount > 1000
          ? `₹${(mem.amount / 100).toFixed(0)}`
          : `₹${mem.amount}`
        : "₹0";
      list.push({
        id: `mem_${mem.id || mem.order_id}`,
        type: "Membership",
        typeBadgeColor: "#c084fc",
        typeBadgeBg: "rgba(192, 132, 252, 0.15)",
        title: "Gym Membership",
        gymName: mem.gym_name || "Gym Membership",
        date: mem.created_at || mem.captured_at,
        displayDate: formatDate(mem.created_at || mem.captured_at),
        amount: amt,
        status: mem.order_status || mem.status || "Paid",
        rawDate: new Date(mem.created_at || mem.captured_at || 0).getTime(),
      });
    });

    return list.sort((a, b) => b.rawDate - a.rawDate);
  }, [clientBookings]);

  // Filtered & Sorted Data (Newest First by default)
  const filteredData = useMemo(() => {
    return requests
      .filter((item) => {
        const client = item.client || {};
        const deleted = item.deleted;

        // Status filter
        if (statusFilter === "deleted" && !deleted) return false;
        if (statusFilter === "pending" && !!deleted) return false;

        // Search term
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();

        const name = (client.name || (deleted && deleted.name) || "").toLowerCase();
        const contact = (client.contact || client.phone || (deleted && deleted.contact) || "").toLowerCase();
        const email = (client.email || "").toLowerCase();
        const clientId = String(item.client_id || "");
        const requestId = String(item.request_id || item.id || "");
        const feedback = (item.feedback || "").toLowerCase();

        return (
          name.includes(q) ||
          contact.includes(q) ||
          email.includes(q) ||
          clientId.includes(q) ||
          requestId.includes(q) ||
          feedback.includes(q)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [requests, searchTerm, statusFilter, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = requests.length;
    const deletedCount = requests.filter((r) => !!r.deleted).length;
    const pendingCount = total - deletedCount;
    const withFeedback = requests.filter((r) => r.feedback && r.feedback.trim() !== "").length;

    return { total, deletedCount, pendingCount, withFeedback };
  }, [requests]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      alert("No data available to export");
      return;
    }

    const exportRows = filteredData.map((item) => {
      const client = item.client || {};
      const deleted = item.deleted || {};
      const isDeleted = !!item.deleted;

      return {
        "Request ID": item.request_id || item.id,
        "Client ID": item.client_id,
        "Client Name": client.name || deleted.name || "N/A",
        "Phone / Contact": client.contact || client.phone || deleted.contact || "N/A",
        "Email": client.email || "N/A",
        "Gender": client.gender || "N/A",
        "Request Date": formatDate(item.created_at),
        "Deletion Status": isDeleted ? "Deleted" : "Pending",
        "Deleted Date": isDeleted ? formatDate(deleted.deleted_date) : "N/A",
        "Feedback / Reason": item.feedback || "No feedback provided",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Delete Requests");
    XLSX.writeFile(workbook, `Fymble_Delete_Requests_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteModal) return;
    const clientId = confirmDeleteModal.client_id;
    const clientName = confirmDeleteModal.client?.name || `Client #${clientId}`;
    const clientContact = confirmDeleteModal.client?.contact || null;
    const requestDate = confirmDeleteModal.created_at;

    setDeleting(true);
    try {
      await deleteClientAccount(clientId);

      // Optimistically update local state to reflect deletion
      setRequests((prev) =>
        prev.map((r) =>
          r.client_id === clientId
            ? {
                ...r,
                deleted: {
                  client_id: clientId,
                  name: clientName,
                  contact: clientContact,
                  request_date: requestDate,
                  deleted_date: new Date().toISOString(),
                },
                client: {
                  ...(r.client || {}),
                  name: clientName,
                  contact: clientContact,
                  status: "deleted",
                },
              }
            : r
        )
      );

      if (selectedRequest && selectedRequest.client_id === clientId) {
        setSelectedRequest((prev) => ({
          ...prev,
          deleted: {
            client_id: clientId,
            name: clientName,
            contact: clientContact,
            request_date: requestDate,
            deleted_date: new Date().toISOString(),
          },
        }));
      }

      setToast({
        type: "success",
        text: `Account for ${clientName} (ID: ${clientId}) was successfully deleted and logged to deleted_users.`,
      });
      setConfirmDeleteModal(null);
    } catch (err) {
      console.error("Failed to delete client account:", err);
      setToast({
        type: "error",
        text:
          err.response?.data?.detail ||
          err.message ||
          "Failed to delete client account. Please check backend logs.",
      });
    } finally {
      setDeleting(false);
      setTimeout(() => setToast(null), 6000);
    }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: "100vh", padding: "1.5rem" }}>
      {/* Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 10000,
            backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "480px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          {toast.type === "success" ? <FaCheckCircle size={16} /> : <FaExclamationTriangle size={16} />}
          <span style={{ flex: 1 }}>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Header section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => router.push(backUrl)}
              style={{
                background: "#2a2a2a",
                border: "1px solid #444",
                color: "#ccc",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#333";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#2a2a2a";
                e.currentTarget.style.color = "#ccc";
              }}
            >
              <FaChevronLeft size={12} />
              <span>Back</span>
            </button>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#fff", margin: 0 }}>
              <span style={{ color: "#FF5757" }}>Fy</span>mble User Delete Requests
            </h2>
          </div>
          <p style={{ color: "#888", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
            Review customer deletion requests, inspect booking history, and manage account removals
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              background: "#2a2a2a",
              border: "1px solid #444",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: refreshing ? "not-allowed" : "pointer",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
            title="Refresh Requests"
          >
            <FaSync
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            disabled={loading || filteredData.length === 0}
            style={{
              background: "#FF5757",
              border: "none",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: loading || filteredData.length === 0 ? "not-allowed" : "pointer",
              fontSize: "13px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s",
            }}
          >
            <FaFileExport />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        {/* Total Requests */}
        <div className="col-xl-4 col-lg-8 col-md-8">
          <div
            className="dashboard-card"
            style={{
              background: "linear-gradient(145deg, #1f272b, #293338)",
              border: "1px solid #3a4553",
            }}
          >
            <div className="card-header-custom">
              <h6 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaUserTimes style={{ color: "#FF5757" }} />
                Total Delete Requests
              </h6>
            </div>
            <div className="card-body-custom">
              <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>
                {loading ? "-" : stats.total.toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                All deletion requests on record
              </div>
            </div>
          </div>
        </div>

        {/* Successfully Deleted */}
        <div className="col-xl-4 col-lg-8 col-md-8">
          <div
            className="dashboard-card"
            style={{
              background: "linear-gradient(145deg, #1f272b, #293338)",
              border: "1px solid #3a4553",
            }}
          >
            <div className="card-header-custom">
              <h6 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCheckCircle style={{ color: "#10b981" }} />
                Processed & Deleted
              </h6>
            </div>
            <div className="card-body-custom">
              <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>
                {loading ? "-" : stats.deletedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                Recorded in deleted_users table
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="col-xl-4 col-lg-8 col-md-8">
          <div
            className="dashboard-card"
            style={{
              background: "linear-gradient(145deg, #1f272b, #293338)",
              border: "1px solid #3a4553",
            }}
          >
            <div className="card-header-custom">
              <h6 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaClock style={{ color: "#fbbf24" }} />
                Pending Review
              </h6>
            </div>
            <div className="card-body-custom">
              <div className="metric-number" style={{ fontSize: "28px", fontWeight: "700", color: "#fbbf24" }}>
                {loading ? "-" : stats.pendingCount.toLocaleString()}
              </div>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                Clients awaiting account removal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          backgroundColor: "#222a2e",
          border: "1px solid #333d45",
          borderRadius: "10px",
          padding: "1rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", flex: "1 1 400px" }}>
          {/* Search Input */}
          <div
            style={{
              position: "relative",
              flex: "1 1 250px",
              minWidth: "200px",
            }}
          >
            <FaSearch
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#777",
                fontSize: "14px",
              }}
            />
            <input
              type="text"
              placeholder="Search by client name, contact, ID, feedback..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: "100%",
                backgroundColor: "#182024",
                border: "1px solid #3a4553",
                borderRadius: "6px",
                padding: "8px 12px 8px 36px",
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
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              backgroundColor: "#182024",
              border: "1px solid #3a4553",
              borderRadius: "6px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Requests</option>
            <option value="deleted">Deleted Accounts</option>
          </select>

          {/* Sort Order - Default Newest First */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              backgroundColor: "#182024",
              border: "1px solid #3a4553",
              borderRadius: "6px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>

        <div style={{ color: "#aaa", fontSize: "13px" }}>
          Showing <strong>{filteredData.length}</strong> {filteredData.length === 1 ? "record" : "records"}
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: "#20282c",
          border: "1px solid #2d373f",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                border: "3px solid #3a4553",
                borderTop: "3px solid #FF5757",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ fontSize: "14px", margin: 0 }}>Fetching delete requests from server...</p>
          </div>
        ) : error && requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaInfoCircle size={36} style={{ color: "#FF5757", marginBottom: "12px" }} />
            <h5 style={{ color: "#fff", marginBottom: "8px" }}>Delete Requests Service</h5>
            <p style={{ color: "#888", maxWidth: "500px", margin: "0 auto 16px", fontSize: "13px" }}>
              {error}
            </p>
            <button
              onClick={() => loadData(true)}
              style={{
                background: "#FF5757",
                border: "none",
                color: "#fff",
                padding: "8px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
              }}
            >
              Try Again
            </button>
          </div>
        ) : paginatedData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <FaUserTimes size={40} style={{ color: "#555", marginBottom: "12px" }} />
            <h5 style={{ color: "#fff", marginBottom: "6px" }}>No Delete Requests Found</h5>
            <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "No client account deletion requests currently on record."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "13px",
                color: "#ddd",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#192024",
                    borderBottom: "1px solid #333d45",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.5px",
                  }}
                >
                  <th style={{ padding: "14px 16px" }}>Req ID</th>
                  <th style={{ padding: "14px 16px" }}>Client Details</th>
                  <th style={{ padding: "14px 16px" }}>Contact</th>
                  <th style={{ padding: "14px 16px" }}>Request Date</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px" }}>Feedback / Reason</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, idx) => {
                  const client = item.client || {};
                  const deleted = item.deleted;
                  const isDeleted = !!deleted;
                  const displayName = client.name || (deleted && deleted.name) || "Anonymous";
                  const displayContact = client.contact || client.phone || (deleted && deleted.contact) || "N/A";
                  const feedbackText = item.feedback || "";

                  return (
                    <tr
                      key={item.request_id || item.id || idx}
                      style={{
                        borderBottom: "1px solid #2a343b",
                        backgroundColor: idx % 2 === 0 ? "#20282c" : "#1d2428",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#273238")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#20282c" : "#1d2428")
                      }
                    >
                      {/* Request ID */}
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#FF5757" }}>
                        #{item.request_id || item.id || "N/A"}
                      </td>

                      {/* Client Details */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: "600", color: "#fff", fontSize: "14px" }}>
                          {displayName}
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              backgroundColor: "rgba(255,255,255,0.08)",
                              color: "#bbb",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            ID: {item.client_id}
                          </span>
                          {client.gender && (
                            <span
                              style={{
                                fontSize: "11px",
                                backgroundColor: "rgba(59, 130, 246, 0.15)",
                                color: "#60a5fa",
                                padding: "1px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {client.gender}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact / Phone */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaPhone size={11} style={{ color: "#888" }} />
                          <span>{displayContact}</span>
                        </div>
                        {client.email && (
                          <div
                            style={{
                              color: "#888",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginTop: "3px",
                            }}
                          >
                            <FaEnvelope size={11} style={{ color: "#666" }} />
                            <span
                              style={{
                                maxWidth: "160px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {client.email}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Request Date */}
                      <td style={{ padding: "14px 16px", color: "#ccc" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaCalendarAlt size={11} style={{ color: "#888" }} />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </td>

                      {/* Deletion Status */}
                      <td style={{ padding: "14px 16px" }}>
                        {isDeleted ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "#34d399",
                              padding: "4px 9px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            <FaCheckCircle size={10} />
                            Deleted
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              color: "#fbbf24",
                              padding: "4px 9px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            <FaClock size={10} />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Feedback */}
                      <td style={{ padding: "14px 16px", maxWidth: "260px" }}>
                        {feedbackText ? (
                          <div
                            style={{
                              backgroundColor: "rgba(0,0,0,0.2)",
                              border: "1px solid #333d45",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              color: "#e5e7eb",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                            title={feedbackText}
                          >
                            {feedbackText}
                          </div>
                        ) : (
                          <span style={{ color: "#666", fontStyle: "italic", fontSize: "12px" }}>
                            No feedback provided
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          <button
                            onClick={() => handleViewDetails(item)}
                            style={{
                              backgroundColor: "#2a343b",
                              border: "1px solid #3d4a54",
                              color: "#60a5fa",
                              padding: "6px 11px",
                              borderRadius: "5px",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                              transition: "all 0.15s ease",
                            }}
                            title="View Details & Bookings"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#38454f")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2a343b")}
                          >
                            <FaEye size={12} />
                            <span>View</span>
                          </button>

                          {isDeleted ? (
                            <span
                              style={{
                                backgroundColor: "rgba(16, 185, 129, 0.08)",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                color: "#34d399",
                                padding: "5px 10px",
                                borderRadius: "5px",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FaCheckCircle size={11} />
                              <span>Account Deleted</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteModal(item)}
                              style={{
                                backgroundColor: "#dc2626",
                                border: "none",
                                color: "#fff",
                                padding: "6px 12px",
                                borderRadius: "5px",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                transition: "all 0.15s ease",
                                boxShadow: "0 2px 6px rgba(220, 38, 38, 0.35)",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
                              title="Permanently Delete Client Account"
                            >
                              <FaTrashAlt size={11} />
                              <span>Delete Account</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredData.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #2d373f",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              backgroundColor: "#1c2327",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#888" }}>
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: "#182024",
                  border: "1px solid #3a4553",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>per page</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#aaa", marginRight: "6px" }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  backgroundColor: "#2a343b",
                  border: "1px solid #3d4a54",
                  color: currentPage === 1 ? "#555" : "#fff",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                <FaChevronLeft size={10} />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  backgroundColor: "#2a343b",
                  border: "1px solid #3d4a54",
                  color: currentPage === totalPages ? "#555" : "#fff",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                <FaChevronRight size={10} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details & Bookings Modal */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              backgroundColor: "#1e272c",
              border: "1px solid #3a4553",
              borderRadius: "12px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "840px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #333d45",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "600", color: "#FF5757" }}>
                  Client Details & Bookings
                </h4>
                <span
                  style={{
                    backgroundColor: "rgba(255, 87, 87, 0.15)",
                    color: "#FF5757",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Req #{selectedRequest.request_id || selectedRequest.id}
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    color: "#bbb",
                    fontSize: "12px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  Client ID: {selectedRequest.client_id}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Client Profile Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
                marginBottom: "16px",
                backgroundColor: "#161d21",
                border: "1px solid #2a343b",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>CLIENT NAME</span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                  {selectedRequest.client?.name || selectedRequest.deleted?.name || "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>PHONE / CONTACT</span>
                <span style={{ fontSize: "14px", color: "#fff" }}>
                  {selectedRequest.client?.contact ||
                    selectedRequest.client?.phone ||
                    selectedRequest.deleted?.contact ||
                    "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>EMAIL ADDRESS</span>
                <span style={{ fontSize: "14px", color: "#fff" }}>
                  {selectedRequest.client?.email || "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>REQUEST CREATED AT</span>
                <span style={{ fontSize: "14px", color: "#fff" }}>
                  {formatDate(selectedRequest.created_at)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#888", display: "block" }}>DELETION STATUS</span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: selectedRequest.deleted ? "#10b981" : "#fbbf24",
                  }}
                >
                  {selectedRequest.deleted ? "Processed & Deleted" : "Pending Review"}
                </span>
              </div>
              {selectedRequest.client?.gender && (
                <div>
                  <span style={{ fontSize: "11px", color: "#888", display: "block" }}>GENDER</span>
                  <span style={{ fontSize: "14px", color: "#ddd" }}>
                    {selectedRequest.client.gender}
                  </span>
                </div>
              )}
            </div>

            {/* If already deleted alert */}
            {selectedRequest.deleted && (
              <div
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#34d399", fontWeight: "600" }}>Account Deleted from Database</span>
                <span style={{ color: "#aaa" }}>
                  Deleted Date: {formatDate(selectedRequest.deleted.deleted_date)}
                </span>
              </div>
            )}

            {/* Feedback display */}
            {selectedRequest.feedback && (
              <div style={{ marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>
                  USER FEEDBACK / REASON
                </span>
                <div
                  style={{
                    backgroundColor: "#161d21",
                    border: "1px solid #2a343b",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    color: "#e2e8f0",
                    lineHeight: "1.5",
                  }}
                >
                  {selectedRequest.feedback}
                </div>
              </div>
            )}

            {/* Client Bookings & Purchases Section - All in 1 Tab with Counts */}
            <div
              style={{
                backgroundColor: "#182024",
                border: "1px solid #2f3b43",
                borderRadius: "10px",
                padding: "1.25rem",
                marginBottom: "1.25rem",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaCalendarCheck style={{ color: "#60a5fa" }} size={16} />
                  <h5 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#fff" }}>
                    Client Bookings & Purchases
                  </h5>
                </div>
                {clientBookings && !loadingBookings && (
                  <span
                    style={{
                      backgroundColor: "rgba(96, 165, 250, 0.15)",
                      border: "1px solid rgba(96, 165, 250, 0.3)",
                      color: "#60a5fa",
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "3px 10px",
                      borderRadius: "12px",
                    }}
                  >
                    {allCombinedBookings.length} Total Bookings
                  </span>
                )}
              </div>

              {/* Booking Content: Unified List */}
              {loadingBookings ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#888" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      border: "2px solid #3a4553",
                      borderTop: "2px solid #60a5fa",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto 10px",
                    }}
                  />
                  <p style={{ margin: 0, fontSize: "12px" }}>
                    Fetching booking history from backend API...
                  </p>
                </div>
              ) : allCombinedBookings.length === 0 ? (
                <div
                  style={{
                    backgroundColor: "#141a1d",
                    border: "1px dashed #303b42",
                    borderRadius: "8px",
                    padding: "24px",
                    textAlign: "center",
                    color: "#777",
                  }}
                >
                  <FaTicketAlt size={24} style={{ color: "#555", marginBottom: "8px" }} />
                  <p style={{ margin: 0, fontSize: "13px", color: "#999" }}>
                    No bookings or purchases found for this client.
                  </p>
                </div>
              ) : (
                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "12px",
                      backgroundColor: "#141a1d",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: "1px solid #2a343b",
                          backgroundColor: "#111619",
                          color: "#888",
                          textAlign: "left",
                          textTransform: "uppercase",
                          fontSize: "10px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <th style={{ padding: "10px 12px" }}>Type</th>
                        <th style={{ padding: "10px 12px" }}>Details / Gym</th>
                        <th style={{ padding: "10px 12px" }}>Booking Date & Time</th>
                        <th style={{ padding: "10px 12px" }}>Amount Paid</th>
                        <th style={{ padding: "10px 12px", textAlign: "right" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCombinedBookings.map((b, idx) => (
                        <tr
                          key={b.id || idx}
                          style={{
                            borderBottom: "1px solid #1f272b",
                            backgroundColor: idx % 2 === 0 ? "#141a1d" : "#171e22",
                            transition: "background-color 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d252a")}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#141a1d" : "#171e22")
                          }
                        >
                          {/* Type Badge */}
                          <td style={{ padding: "10px 12px" }}>
                            <span
                              style={{
                                backgroundColor: b.typeBadgeBg,
                                color: b.typeBadgeColor,
                                padding: "3px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: "600",
                                display: "inline-block",
                              }}
                            >
                              {b.type}
                            </span>
                          </td>

                          {/* Title & Gym Name */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ fontWeight: "600", color: "#fff", textTransform: "capitalize" }}>
                              {b.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                              {b.gymName}
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td style={{ padding: "10px 12px", color: "#cbd5e1" }}>
                            {b.displayDate}
                          </td>

                          {/* Amount */}
                          <td style={{ padding: "10px 12px", color: "#34d399", fontWeight: "600" }}>
                            {b.amount}
                          </td>

                          {/* Status */}
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <span
                              style={{
                                backgroundColor:
                                  b.status.toLowerCase() === "active" ||
                                  b.status.toLowerCase() === "booked" ||
                                  b.status.toLowerCase() === "paid"
                                    ? "rgba(16, 185, 129, 0.15)"
                                    : "rgba(100, 116, 139, 0.2)",
                                color:
                                  b.status.toLowerCase() === "active" ||
                                  b.status.toLowerCase() === "booked" ||
                                  b.status.toLowerCase() === "paid"
                                    ? "#34d399"
                                    : "#94a3b8",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "600",
                                textTransform: "capitalize",
                              }}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {!selectedRequest.deleted && (
                <button
                  onClick={() => {
                    const req = selectedRequest;
                    setSelectedRequest(null);
                    setConfirmDeleteModal(req);
                  }}
                  style={{
                    background: "#dc2626",
                    border: "none",
                    color: "#fff",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaTrashAlt size={12} />
                  <span>Delete Account</span>
                </button>
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: "#2a343b",
                  border: "1px solid #444",
                  color: "#fff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Delete Account */}
      {confirmDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
            padding: "1rem",
          }}
          onClick={() => (!deleting ? setConfirmDeleteModal(null) : null)}
        >
          <div
            style={{
              backgroundColor: "#1f262b",
              border: "1px solid #451a1a",
              borderRadius: "12px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
              color: "#fff",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(220, 38, 38, 0.15)",
                border: "2px solid #dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#dc2626",
                fontSize: "24px",
              }}
            >
              <FaTrashAlt />
            </div>

            <h4 style={{ margin: "0 0 10px 0", fontSize: "1.25rem", fontWeight: "700", color: "#fff" }}>
              Delete Client Account?
            </h4>

            <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              Are you sure you want to permanently delete the account for{" "}
              <strong style={{ color: "#FF5757" }}>
                {confirmDeleteModal.client?.name || `Client #${confirmDeleteModal.client_id}`}
              </strong>{" "}
              (ID: <strong>#{confirmDeleteModal.client_id}</strong>)?
            </p>

            {/* <div
              style={{
                backgroundColor: "#14191c",
                border: "1px solid #323b42",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "left",
                fontSize: "12px",
                color: "#94a3b8",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ color: "#ef4444", fontWeight: "600", marginBottom: "6px" }}>
                This action will perform:
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                <li>Write client info to the <strong>deleted_users</strong> archive table</li>
                <li>Permanently remove the client row from <strong>fittbot.clients</strong></li>
              </ul>
            </div> */}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                onClick={() => setConfirmDeleteModal(null)}
                disabled={deleting}
                style={{
                  background: "#2a343b",
                  border: "1px solid #444",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  background: "#dc2626",
                  border: "none",
                  color: "#fff",
                  padding: "10px 24px",
                  borderRadius: "6px",
                  cursor: deleting ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.4)",
                }}
              >
                {deleting ? (
                  <>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        border: "2px solid #fff",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FaTrashAlt size={12} />
                    <span>Yes, Delete Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
