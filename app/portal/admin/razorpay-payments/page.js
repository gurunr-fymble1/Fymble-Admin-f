"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "@/lib/axios";
import { useRole } from "@/app/portal/layout";
import { formatGymName } from "@/lib/utils";
import {
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyRupee,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineDocumentText,
  HiOutlineReceiptTax,
  HiOutlineTag,
  HiOutlineInformationCircle,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineCash,
  HiOutlineCheck,
  HiOutlineXCircle,
  HiOutlineBan,
  HiOutlineX,
} from "react-icons/hi";
import { FaSpinner, FaCheck, FaSyncAlt, FaLayerGroup, FaCheckDouble, FaTimes } from "react-icons/fa";

export default function RazorpayPaymentsPage() {
  const { user } = useRole();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [monthYearFilter, setMonthYearFilter] = useState("all");
  const currentYear = new Date().getFullYear();
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(currentYear);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearView, setIsYearView] = useState(false);

  // Expanded date groups state (default collapsed)
  const [expandedDates, setExpandedDates] = useState(new Set());

  // Expanded batch lines accordion state
  const [expandedBatchIds, setExpandedBatchIds] = useState(new Set());

  // Selection state (selected batch_ids)
  const [selectedBatchIds, setSelectedBatchIds] = useState(new Set());

  // Processing / Approving state
  const [isApproving, setIsApproving] = useState(false);
  const [approvingBatchId, setApprovingBatchId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Reject Batch state
  const [rejectingBatch, setRejectingBatch] = useState(null);
  const [rejectReason, setRejectReason] = useState("Disputed or requires recalculation");
  const [isRejecting, setIsRejecting] = useState(false);

  // Get current admin identifier
  const currentAdminIdentifier = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.username) return user.username;
    if (user?.email) return user.email;
    if (user?.id) return `admin_${user.id}`;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        return stored.name || stored.username || stored.email || "admin";
      } catch (e) {}
    }
    return "admin";
  }, [user]);

  // Fetch batches from GET /pay/dailypass/payouts/batches
  const fetchBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("/pay/dailypass/payouts/batches");

      let batchList = [];
      if (Array.isArray(response.data)) {
        batchList = response.data;
      } else if (response.data && typeof response.data === "object") {
        if (Array.isArray(response.data.data)) {
          batchList = response.data.data;
        } else if (Array.isArray(response.data.batches)) {
          batchList = response.data.batches;
        } else if (Array.isArray(response.data.payouts)) {
          batchList = response.data.payouts;
        } else if (Array.isArray(response.data.items)) {
          batchList = response.data.items;
        } else if (Array.isArray(response.data.results)) {
          batchList = response.data.results;
        } else {
          batchList = Object.values(response.data).filter(
            (item) => typeof item === "object" && item !== null
          );
        }
      }

      setData(batchList);
      setSelectedBatchIds(new Set());
    } catch (err) {
      console.error("Failed to fetch Razorpay payout batches:", err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load Razorpay payout batches.";
      setError(errMsg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Helper getters matching backend schema
  const getBatchId = (row) => String(row.batch_id ?? row.id ?? "");
  const getGymId = (row) => String(row.gym_id ?? "");
  const getBatchDate = (row) => row.batch_date || "Unscheduled";
  const getApprovalStatus = (row) =>
    String(row.approval_status || "pending_approval").toLowerCase();
  const getMovementStatus = (row) =>
    String(row.status || "queued").toLowerCase();
  const getGrossAmount = (row) => Number(row.total_gross_rupees ?? 0);
  const getCommission = (row) => Number(row.total_commission_rupees ?? 0);
  const getPgFee = (row) => Number(row.total_pg_fee_rupees ?? 0);
  const getTds = (row) => Number(row.total_tds_rupees ?? 0);
  const getNetAmount = (row) => Number(row.total_net_rupees ?? 0);
  const getLineCount = (row) => Number(row.line_count ?? row.lines?.length ?? 0);

  // Toggle Accordion Date Group
  const toggleExpandDate = (dateStr) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  // Toggle Accordion Lines for Batch
  const toggleExpandBatch = (batchId) => {
    setExpandedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const monthNames = useMemo(
    () => [
      { num: "01", name: "Jan", full: "January" },
      { num: "02", name: "Feb", full: "February" },
      { num: "03", name: "Mar", full: "March" },
      { num: "04", name: "Apr", full: "April" },
      { num: "05", name: "May", full: "May" },
      { num: "06", name: "Jun", full: "June" },
      { num: "07", name: "Jul", full: "July" },
      { num: "08", name: "Aug", full: "August" },
      { num: "09", name: "Sep", full: "September" },
      { num: "10", name: "Oct", full: "October" },
      { num: "11", name: "Nov", full: "November" },
      { num: "12", name: "Dec", full: "December" },
    ],
    []
  );

  // Extract distinct Years from dataset
  const availableYears = useMemo(() => {
    const years = new Set([
      currentYear,
      currentYear - 1,
      currentYear - 2,
      currentYear - 3,
      currentYear + 1,
    ]);
    data.forEach((row) => {
      const d = row.batch_date;
      if (d && d !== "Unscheduled" && d !== "-") {
        try {
          const y = new Date(d).getFullYear();
          if (!isNaN(y)) years.add(y);
        } catch (e) {}
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data, currentYear]);

  // Selected Month/Year Label
  const monthYearLabel = useMemo(() => {
    if (monthYearFilter === "all") return "All Months";
    if (monthYearFilter.length === 4) return `All ${monthYearFilter}`;
    try {
      const [y, m] = monthYearFilter.split("-");
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
      return monthYearFilter;
    }
  }, [monthYearFilter]);

  // Filtered dataset based on search term & status & month-year
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const gymName = String(row.gym_name || "").toLowerCase();
      const gymCity = String(row.gym_city || "").toLowerCase();
      const gymArea = String(row.gym_area || "").toLowerCase();
      const utr = String(row.utr || "").toLowerCase();
      const batchDate = String(row.batch_date || "");
      const approvalStatus = getApprovalStatus(row);
      const movementStatus = getMovementStatus(row);

      // Month & Year Filter
      if (monthYearFilter !== "all") {
        if (!batchDate.startsWith(monthYearFilter)) {
          return false;
        }
      }

      // Approval Status Filter
      if (approvalStatusFilter !== "all") {
        if (
          approvalStatusFilter === "pending_approval" &&
          approvalStatus !== "pending_approval" &&
          approvalStatus !== "pending"
        ) {
          return false;
        }
        if (approvalStatusFilter === "approved" && approvalStatus !== "approved") {
          return false;
        }
        if (
          approvalStatusFilter === "on_hold" &&
          approvalStatus !== "on_hold" &&
          approvalStatus !== "hold"
        ) {
          return false;
        }
        if (approvalStatusFilter === "rejected" && approvalStatus !== "rejected") {
          return false;
        }
      }

      // Payment Status Filter
      if (paymentStatusFilter !== "all") {
        if (paymentStatusFilter === "queued" && movementStatus !== "queued") {
          return false;
        }
        if (paymentStatusFilter === "processing" && movementStatus !== "processing") {
          return false;
        }
        if (paymentStatusFilter === "paid" && movementStatus !== "paid") {
          return false;
        }
        if (paymentStatusFilter === "failed" && movementStatus !== "failed") {
          return false;
        }
      }

      // Search filter: Strictly based on Gym Name, City, and UTR
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        return (
          gymName.includes(term) ||
          gymCity.includes(term) ||
          gymArea.includes(term) ||
          utr.includes(term)
        );
      }

      return true;
    });
  }, [data, searchTerm, approvalStatusFilter, paymentStatusFilter, monthYearFilter]);

  // Group Filtered Data By Batch Date
  const dateGroups = useMemo(() => {
    const groups = {};
    filteredData.forEach((batch) => {
      const d = getBatchDate(batch);
      if (!groups[d]) {
        groups[d] = {
          batch_date: d,
          batches: [],
          totalNet: 0,
          totalGross: 0,
          totalCommission: 0,
          totalPgFee: 0,
          totalTds: 0,
          totalLines: 0,
          pendingApprovalCount: 0,
          approvedCount: 0,
          onHoldCount: 0,
          rejectedCount: 0,
          paidCount: 0,
          processingCount: 0,
          queuedCount: 0,
          failedCount: 0,
        };
      }
      const g = groups[d];
      g.batches.push(batch);
      g.totalNet += getNetAmount(batch);
      g.totalGross += getGrossAmount(batch);
      g.totalCommission += getCommission(batch);
      g.totalPgFee += getPgFee(batch);
      g.totalTds += getTds(batch);
      g.totalLines += getLineCount(batch);

      const appStatus = getApprovalStatus(batch);
      const movStatus = getMovementStatus(batch);

      if (appStatus === "approved") g.approvedCount++;
      else if (appStatus === "on_hold" || appStatus === "hold") g.onHoldCount++;
      else if (appStatus === "rejected") g.rejectedCount++;
      else g.pendingApprovalCount++;

      if (movStatus === "paid") g.paidCount++;
      else if (movStatus === "processing") g.processingCount++;
      else if (movStatus === "failed") g.failedCount++;
      else g.queuedCount++;
    });

    // Sort descending by date
    return Object.values(groups).sort((a, b) => {
      if (a.batch_date === "Unscheduled") return 1;
      if (b.batch_date === "Unscheduled") return -1;
      return new Date(b.batch_date) - new Date(a.batch_date);
    });
  }, [filteredData]);

  // Global Metrics Summary
  const globalMetrics = useMemo(() => {
    let totalGross = 0;
    let totalCommission = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let onHoldCount = 0;
    let rejectedCount = 0;
    let paidCount = 0;
    let totalLines = 0;

    data.forEach((row) => {
      totalGross += getGrossAmount(row);
      totalCommission += getCommission(row);
      totalDeductions += getPgFee(row) + getTds(row);
      totalNet += getNetAmount(row);
      totalLines += getLineCount(row);

      const appSt = getApprovalStatus(row);
      const movSt = getMovementStatus(row);

      if (appSt === "approved") approvedCount++;
      else if (appSt === "on_hold" || appSt === "hold") onHoldCount++;
      else if (appSt === "rejected") rejectedCount++;
      else pendingCount++;

      if (movSt === "paid") paidCount++;
    });

    return {
      totalBatches: data.length,
      totalLines,
      totalGross,
      totalCommission,
      totalDeductions,
      totalNet,
      pendingCount,
      approvedCount,
      onHoldCount,
      rejectedCount,
      paidCount,
    };
  }, [data]);

  // Checkbox Selection Handlers
  const handleSelectBatch = (batchId) => {
    if (!batchId) return;
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const handleSelectAllInDate = (dateGroup) => {
    const actionableIds = dateGroup.batches
      .filter(
        (b) =>
          getApprovalStatus(b) !== "approved" &&
          getMovementStatus(b) !== "paid"
      )
      .map((b) => getBatchId(b))
      .filter(Boolean);

    const allSelected = actionableIds.length > 0 && actionableIds.every((id) => selectedBatchIds.has(id));

    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        actionableIds.forEach((id) => next.delete(id));
      } else {
        actionableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const isDateAllSelected = (dateGroup) => {
    const actionableIds = dateGroup.batches
      .filter(
        (b) =>
          getApprovalStatus(b) !== "approved" &&
          getMovementStatus(b) !== "paid"
      )
      .map((b) => getBatchId(b))
      .filter(Boolean);
    if (actionableIds.length === 0) return false;
    return actionableIds.every((id) => selectedBatchIds.has(id));
  };

  // Bulk / Global Select All Actionable (Pending & Not Paid)
  const handleSelectAllGlobal = () => {
    const allActionableIds = filteredData
      .filter(
        (b) =>
          getApprovalStatus(b) !== "approved" &&
          getMovementStatus(b) !== "paid"
      )
      .map((b) => getBatchId(b))
      .filter(Boolean);

    const allSelected = allActionableIds.length > 0 && allActionableIds.every((id) => selectedBatchIds.has(id));

    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allActionableIds.forEach((id) => next.delete(id));
      } else {
        allActionableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Selected Batches Calculation
  const selectedNetTotal = useMemo(() => {
    let sum = 0;
    data.forEach((b) => {
      if (selectedBatchIds.has(getBatchId(b))) {
        sum += getNetAmount(b);
      }
    });
    return sum;
  }, [data, selectedBatchIds]);

  // Approve Batches API call: POST /pay/dailypass/payouts/approve
  const approveBatchesRequest = async (batchIdsList) => {
    const payload = {
      batch_ids: batchIdsList.map(String),
      approved_by: currentAdminIdentifier,
    };
    return await axiosInstance.post("/pay/dailypass/payouts/approve", payload);
  };

  // Approve a single batch
  const handleApproveSingle = async (batchId) => {
    if (!batchId) return;
    setApprovingBatchId(batchId);
    try {
      const response = await approveBatchesRequest([batchId]);
      const skipped = response.data?.skipped || [];
      if (skipped.length > 0) {
        setToastMessage({
          type: "warning",
          text: `Batch #${batchId}: ${skipped[0].reason || "Skipped"}`,
        });
      } else {
        setToastMessage({
          type: "success",
          text: `Batch #${batchId} successfully approved!`,
        });
      }
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh data from backend to ensure state sync
      await fetchBatches();

      setSelectedBatchIds((prev) => {
        const next = new Set(prev);
        next.delete(batchId);
        return next;
      });
    } catch (err) {
      console.error(`Failed to approve batch ${batchId}:`, err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        `Failed to approve batch #${batchId}`;
      setToastMessage({
        type: "error",
        text: errMsg,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setApprovingBatchId(null);
    }
  };

  // Bulk Approve Selected Batches
  const handleApproveSelected = async () => {
    if (selectedBatchIds.size === 0) return;

    const idsToApprove = Array.from(selectedBatchIds);
    setIsApproving(true);

    try {
      const response = await approveBatchesRequest(idsToApprove);
      const approvedList = response.data?.approved_batch_ids || [];
      const skippedList = response.data?.skipped || [];

      if (skippedList.length > 0 && approvedList.length === 0) {
        setToastMessage({
          type: "warning",
          text: `Skipped ${skippedList.length} batch(es): ${
            skippedList[0].reason || "Already processed"
          }`,
        });
      } else if (skippedList.length > 0) {
        setToastMessage({
          type: "warning",
          text: `Approved ${approvedList.length} batch(es), skipped ${skippedList.length}.`,
        });
      } else {
        setToastMessage({
          type: "success",
          text: `Successfully approved ${idsToApprove.length} batch${
            idsToApprove.length > 1 ? "es" : ""
          } by ${currentAdminIdentifier}!`,
        });
      }

      await fetchBatches();
      setSelectedBatchIds(new Set());
    } catch (err) {
      console.error("Failed to approve selected batches:", err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to approve selected batches.";
      setToastMessage({
        type: "error",
        text: errMsg,
      });
    } finally {
      setIsApproving(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  // Reject a single batch API call: POST /pay/dailypass/payouts/reject
  const handleRejectBatchSubmit = async () => {
    if (!rejectingBatch) return;
    const batchId = getBatchId(rejectingBatch);
    setIsRejecting(true);
    try {
      const payload = {
        batch_id: String(batchId),
        rejected_by: currentAdminIdentifier,
        reason: rejectReason.trim() || "Rejected by accounts admin",
      };
      await axiosInstance.post("/pay/dailypass/payouts/reject", payload);
      setToastMessage({
        type: "warning",
        text: `Batch #${batchId} rejected and allocations released back to pool.`,
      });
      setTimeout(() => setToastMessage(null), 5000);
      setRejectingBatch(null);
      setRejectReason("Disputed or requires recalculation");

      // Refresh backend data
      await fetchBatches();
    } catch (err) {
      console.error(`Failed to reject batch ${batchId}:`, err);
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        `Failed to reject batch #${batchId}`;
      setToastMessage({
        type: "error",
        text: errMsg,
      });
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsRejecting(false);
    }
  };

  // Format Currency (INR)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format Date Helper
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || dateStr === "Unscheduled" || dateStr === "-") return "Unscheduled Batches";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Render Human Gate Approval Status Badge
  const renderApprovalBadge = (approvalStatus, holdReason) => {
    const st = String(approvalStatus || "pending_approval").toLowerCase();
    let bg = "rgba(245, 158, 11, 0.15)";
    let color = "#fbbf24";
    let border = "1px solid rgba(245, 158, 11, 0.35)";
    let label = "Pending Approval";

    if (st === "approved") {
      bg = "rgba(16, 185, 129, 0.15)";
      color = "#34d399";
      border = "1px solid rgba(16, 185, 129, 0.35)";
      label = "Approved";
    } else if (st === "on_hold" || st === "hold") {
      bg = "rgba(249, 115, 22, 0.15)";
      color = "#fb923c";
      border = "1px solid rgba(249, 115, 22, 0.35)";
      label = "On Hold";
    } else if (st === "rejected") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "#f87171";
      border = "1px solid rgba(239, 68, 68, 0.35)";
      label = "Rejected";
    }

    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            backgroundColor: bg,
            color: color,
            border: border,
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.2px",
            width: "fit-content",
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
        {holdReason && (
          <span
            style={{
              fontSize: "10px",
              color: st === "rejected" ? "#f87171" : "#fb923c",
              marginTop: "1px",
              maxWidth: "180px",
              lineHeight: "1.2",
            }}
          >
            {holdReason}
          </span>
        )}
      </div>
    );
  };

  // Render Payment Status Badge (PayoutBatch.status)
  const renderPaymentStatusBadge = (paymentStatus, utr, failureReason) => {
    const st = String(paymentStatus || "queued").toLowerCase();
    let bg = "rgba(99, 102, 241, 0.15)";
    let color = "#818cf8";
    let border = "1px solid rgba(99, 102, 241, 0.3)";
    let label = "Queued";

    if (st === "processing") {
      bg = "rgba(59, 130, 246, 0.15)";
      color = "#60a5fa";
      border = "1px solid rgba(59, 130, 246, 0.3)";
      label = "Processing";
    } else if (st === "paid") {
      bg = "rgba(16, 185, 129, 0.15)";
      color = "#34d399";
      border = "1px solid rgba(16, 185, 129, 0.3)";
      label = "Paid";
    } else if (st === "failed") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "#f87171";
      border = "1px solid rgba(239, 68, 68, 0.3)";
      label = "Failed";
    }

    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            backgroundColor: bg,
            color: color,
            border: border,
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "600",
            width: "fit-content",
          }}
        >
          {st === "processing" ? (
            <FaSpinner className="spin" size={9} />
          ) : (
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: color,
              }}
            />
          )}
          {label}
        </span>
        {utr && (
          <span style={{ fontSize: "10px", color: "#60a5fa", fontFamily: "monospace" }}>
            UTR: {utr}
          </span>
        )}
        {failureReason && (
          <span style={{ fontSize: "10px", color: "#f87171" }}>
            {failureReason}
          </span>
        )}
      </div>
    );
  };

  // Render PayoutLine Status Badge
  const renderLineStatusBadge = (lineStatus) => {
    const st = String(lineStatus || "batched").toLowerCase();
    let bg = "rgba(148, 163, 184, 0.15)";
    let color = "#cbd5e1";
    let label = "Batched";

    if (st === "paid") {
      bg = "rgba(16, 185, 129, 0.15)";
      color = "#34d399";
      label = "Paid";
    } else if (st === "failed") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "#f87171";
      label = "Failed";
    } else if (st === "refunded") {
      bg = "rgba(168, 85, 247, 0.15)";
      color = "#c084fc";
      label = "Refunded";
    } else if (st === "pending") {
      bg = "rgba(245, 158, 11, 0.15)";
      color = "#fbbf24";
      label = "Pending";
    }

    return (
      <span
        style={{
          display: "inline-block",
          backgroundColor: bg,
          color: color,
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "10px",
          fontWeight: "600",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0f19",
        color: "#f3f4f6",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            backgroundColor:
              toastMessage.type === "success"
                ? "#065f46"
                : toastMessage.type === "warning"
                ? "#78350f"
                : "#7f1d1d",
            color: "#ffffff",
            border: `1px solid ${
              toastMessage.type === "success"
                ? "#059669"
                : toastMessage.type === "warning"
                ? "#d97706"
                : "#dc2626"
            }`,
            padding: "14px 20px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            zIndex: 2000,
            fontSize: "14px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "480px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {toastMessage.type === "success" ? (
            <HiOutlineCheckCircle size={20} color="#34d399" />
          ) : (
            <HiOutlineExclamationCircle size={20} color="#fbbf24" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 87, 87, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255, 87, 87, 0.3)",
              }}
            >
              <HiOutlineCash size={24} color="#FF5757" />
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#ffffff" }}>
                Daily Pass Razorpay Payouts
              </h1>
              <p style={{ fontSize: "13px", color: "#9ca3af", margin: "2px 0 0 0" }}>
                Review and approve Daily Pass payout batches grouped by batch run date.
              </p>
            </div>
          </div>
          <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
            Approver: <strong style={{ color: "#e2e8f0" }}>{currentAdminIdentifier}</strong>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchBatches}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <HiOutlineRefresh
              size={16}
              className={loading ? "spin" : ""}
              style={{ transition: "transform 0.3s" }}
            />
            <span>Refresh</span>
          </button>

          {/* Bulk Approve Button */}
          <button
            onClick={handleApproveSelected}
            disabled={selectedBatchIds.size === 0 || isApproving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor:
                selectedBatchIds.size === 0 || isApproving ? "#374151" : "#FF5757",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: "700",
              cursor:
                selectedBatchIds.size === 0 || isApproving ? "not-allowed" : "pointer",
              boxShadow:
                selectedBatchIds.size > 0
                  ? "0 4px 14px rgba(255, 87, 87, 0.4)"
                  : "none",
              transition: "all 0.15s ease",
            }}
          >
            {isApproving ? (
              <>
                <FaSpinner className="spin" size={14} />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <HiOutlineShieldCheck size={18} />
                <span>
                  Approve Selected ({selectedBatchIds.size})
                  {selectedNetTotal > 0 && ` • ${formatCurrency(selectedNetTotal)}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Summary KPI Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {/* Total Net Payout */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Total Net Payout
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#34d399", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {formatCurrency(globalMetrics.totalNet)}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`Across ${globalMetrics.totalBatches} gym batches (${globalMetrics.totalLines} bookings)`}>
            Across {globalMetrics.totalBatches} gym batches ({globalMetrics.totalLines} bookings)
          </div>
        </div>

        {/* Pending Approval */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#fbbf24", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Pending Approval
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#fbbf24", marginTop: "4px" }}>
            {globalMetrics.pendingCount}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Awaiting accounts review
          </div>
        </div>

        {/* Approved / Queued */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#34d399", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Approved
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#34d399", marginTop: "4px" }}>
            {globalMetrics.approvedCount}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Ready for execution
          </div>
        </div>

        {/* On Hold */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#fb923c", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            On Hold
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#fb923c", marginTop: "4px" }}>
            {globalMetrics.onHoldCount}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Under review / no bank
          </div>
        </div>

        {/* Rejected */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#f87171", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Rejected
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#f87171", marginTop: "4px" }}>
            {globalMetrics.rejectedCount}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Released back to pool
          </div>
        </div>

        {/* Completed / Paid */}
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "14px",
          }}
        >
          <div style={{ fontSize: "11px", color: "#60a5fa", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Paid / Transferred
          </div>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#60a5fa", marginTop: "4px" }}>
            {globalMetrics.paidCount}
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Confirmed by RazorpayX
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: "#131926",
          border: "1px solid #1f2937",
          borderRadius: "12px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
          position: "relative",
          zIndex: 40,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", minWidth: "220px", flex: "1 1 240px" }}>
          <HiOutlineSearch
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#6b7280",
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Gym Name, City, UTR..."
            style={{
              width: "100%",
              backgroundColor: "#0b0f19",
              border: "1px solid #2d3748",
              borderRadius: "8px",
              padding: "8px 12px 8px 36px",
              color: "#ffffff",
              fontSize: "12px",
              outline: "none",
            }}
          />
        </div>

        {/* Month & Year Calendar Filter */}
        <div style={{ position: "relative", zIndex: 50, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setIsMonthPickerOpen((prev) => !prev);
              setIsYearView(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: monthYearFilter !== "all" ? "rgba(59, 130, 246, 0.15)" : "#0b0f19",
              color: monthYearFilter !== "all" ? "#60a5fa" : "#cbd5e1",
              border: monthYearFilter !== "all" ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #2d3748",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <HiOutlineCalendar size={15} color={monthYearFilter !== "all" ? "#60a5fa" : "#9ca3af"} />
            <span>{monthYearLabel}</span>
            <HiOutlineChevronDown size={12} color="#9ca3af" />
          </button>

          {/* Calendar Popover */}
          {isMonthPickerOpen && (
            <>
              <div
                style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }}
                onClick={() => {
                  setIsMonthPickerOpen(false);
                  setIsYearView(false);
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  backgroundColor: "#131926",
                  border: "1px solid #374151",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "0 20px 35px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  zIndex: 9999,
                  width: "260px",
                }}
              >
                {/* Year Header Navigation & Toggle */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                    borderBottom: "1px solid #1f2937",
                    paddingBottom: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarYear((prev) => prev - 1)}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    title="Previous Year"
                  >
                    &lt;
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsYearView((prev) => !prev)}
                    style={{
                      backgroundColor: isYearView ? "#2563eb" : "#0b0f19",
                      color: "#ffffff",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    title="Click to select another year"
                  >
                    <span>{selectedCalendarYear}</span>
                    <HiOutlineChevronDown size={12} color="#9ca3af" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCalendarYear((prev) => prev + 1)}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#cbd5e1",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                    title="Next Year"
                  >
                    &gt;
                  </button>
                </div>

                {isYearView ? (
                  /* Year Selector Grid */
                  <div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "8px", textAlign: "center" }}>
                      Select Year
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "6px",
                        marginBottom: "12px",
                      }}
                    >
                      {availableYears.map((yr) => {
                        const isSelected = selectedCalendarYear === yr;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setSelectedCalendarYear(yr);
                              setIsYearView(false);
                            }}
                            style={{
                              backgroundColor: isSelected ? "#FF5757" : "#1e293b",
                              color: isSelected ? "#ffffff" : "#cbd5e1",
                              border: isSelected ? "1px solid #FF5757" : "1px solid #334155",
                              borderRadius: "6px",
                              padding: "8px 4px",
                              fontSize: "13px",
                              fontWeight: isSelected ? "700" : "500",
                              cursor: "pointer",
                              textAlign: "center",
                            }}
                          >
                            {yr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* 12 Months Grid */
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "6px",
                      marginBottom: "12px",
                    }}
                  >
                    {monthNames.map((m) => {
                      const targetKey = `${selectedCalendarYear}-${m.num}`;
                      const isSelected = monthYearFilter === targetKey;
                      return (
                        <button
                          key={m.num}
                          type="button"
                          onClick={() => {
                            setMonthYearFilter(targetKey);
                            setIsMonthPickerOpen(false);
                            setIsYearView(false);
                          }}
                          style={{
                            backgroundColor: isSelected ? "#FF5757" : "#1e293b",
                            color: isSelected ? "#ffffff" : "#cbd5e1",
                            border: isSelected ? "1px solid #FF5757" : "1px solid #334155",
                            borderRadius: "6px",
                            padding: "8px 4px",
                            fontSize: "12px",
                            fontWeight: isSelected ? "700" : "500",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Quick Clear / All Months Footer */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "6px",
                    borderTop: "1px solid #1f2937",
                    paddingTop: "8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMonthYearFilter(String(selectedCalendarYear));
                      setIsMonthPickerOpen(false);
                      setIsYearView(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#60a5fa",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: "2px",
                      fontWeight: "600",
                    }}
                  >
                    All {selectedCalendarYear}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthYearFilter("all");
                      setIsMonthPickerOpen(false);
                      setIsYearView(false);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: "2px",
                    }}
                  >
                    All Time (Clear)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Approval Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", whiteSpace: "nowrap" }}>
            Approval:
          </span>
          <select
            value={approvalStatusFilter}
            onChange={(e) => setApprovalStatusFilter(e.target.value)}
            style={{
              backgroundColor: "#0b0f19",
              border: "1px solid #2d3748",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#ffffff",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Approvals</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="on_hold">On Hold</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", whiteSpace: "nowrap" }}>
            Payment:
          </span>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            style={{
              backgroundColor: "#0b0f19",
              border: "1px solid #2d3748",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#ffffff",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Payments</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Reset Filters */}
        {(approvalStatusFilter !== "all" ||
          paymentStatusFilter !== "all" ||
          monthYearFilter !== "all" ||
          searchTerm.trim()) && (
          <button
            onClick={() => {
              setApprovalStatusFilter("all");
              setPaymentStatusFilter("all");
              setMonthYearFilter("all");
              setSearchTerm("");
            }}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Reset
          </button>
        )}

        {/* Select all unapproved button */}
        <button
          onClick={handleSelectAllGlobal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "rgba(255, 87, 87, 0.12)",
            color: "#FF5757",
            border: "1px solid rgba(255, 87, 87, 0.3)",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
            marginLeft: "auto",
          }}
        >
          <FaCheckDouble size={11} />
          <span>Select All Pending</span>
        </button>
      </div>

      {/* Main Content Area: Date-Grouped Accordions */}
      {loading && data.length === 0 ? (
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "80px 20px",
            textAlign: "center",
          }}
        >
          <FaSpinner className="spin" size={32} color="#FF5757" style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
            Loading Razorpay payout batches...
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Fetching pending runs and transaction history from backend
          </div>
        </div>
      ) : error ? (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <HiOutlineExclamationCircle size={32} color="#f87171" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#f87171" }}>
            Failed to load payout data
          </div>
          <div style={{ fontSize: "13px", color: "#cbd5e1", marginTop: "4px" }}>{error}</div>
          <button
            onClick={fetchBatches}
            style={{
              marginTop: "14px",
              backgroundColor: "#FF5757",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      ) : dateGroups.length === 0 ? (
        <div
          style={{
            backgroundColor: "#131926",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center",
          }}
        >
          <HiOutlineCalendar size={36} color="#64748b" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
            No payout batches match your filter
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Try clearing your search query or switching status filters.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {dateGroups.map((dateGroup) => {
            const dateStr = dateGroup.batch_date;
            const isDateExpanded = expandedDates.has(dateStr);
            const dateAllSelected = isDateAllSelected(dateGroup);
            const actionableBatches = dateGroup.batches.filter(
              (b) =>
                getApprovalStatus(b) !== "approved" &&
                getMovementStatus(b) !== "paid"
            );

            return (
              <div
                key={dateStr}
                style={{
                  backgroundColor: "#131926",
                  border: "1px solid #1f2937",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Date Accordion Header */}
                <div
                  style={{
                    backgroundColor: "#182234",
                    borderBottom: isDateExpanded ? "1px solid #232d3f" : "none",
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                  onClick={() => toggleExpandDate(dateStr)}
                >
                  {/* Left: Date Title & Checkbox */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Checkbox to select all actionable in date */}
                    {actionableBatches.length > 0 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllInDate(dateGroup);
                        }}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "5px",
                          border: dateAllSelected ? "2px solid #FF5757" : "2px solid #64748b",
                          backgroundColor: dateAllSelected ? "#FF5757" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title="Select/Deselect all pending in this date"
                      >
                        {dateAllSelected && <HiOutlineCheck size={14} color="#ffffff" />}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          backgroundColor: "rgba(59, 130, 246, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#60a5fa",
                        }}
                      >
                        <HiOutlineCalendar size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                          {formatDateDisplay(dateStr)}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                          Run Date: <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>{dateStr}</span> •{" "}
                          <strong>{dateGroup.batches.length}</strong> Gym Payouts ({dateGroup.totalLines} bookings)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Date Financial Total & Status Pills & Expand Chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    {/* Status Breakdown Pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {dateGroup.pendingApprovalCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {dateGroup.pendingApprovalCount} Pending Review
                        </span>
                      )}
                      {dateGroup.approvedCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            color: "#34d399",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {dateGroup.approvedCount} Approved
                        </span>
                      )}
                      {dateGroup.onHoldCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "rgba(249, 115, 22, 0.15)",
                            color: "#fb923c",
                            border: "1px solid rgba(249, 115, 22, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {dateGroup.onHoldCount} On Hold
                        </span>
                      )}
                      {dateGroup.rejectedCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {dateGroup.rejectedCount} Rejected
                        </span>
                      )}
                      {dateGroup.paidCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "rgba(59, 130, 246, 0.15)",
                            color: "#60a5fa",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                            padding: "3px 8px",
                            borderRadius: "10px",
                            fontSize: "11px",
                            fontWeight: "600",
                          }}
                        >
                          {dateGroup.paidCount} Paid
                        </span>
                      )}
                    </div>

                    {/* Net Amount for this Date */}
                    <div
                      style={{
                        backgroundColor: "#0b0f19",
                        border: "1px solid #232d3f",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        textAlign: "right",
                      }}
                    >
                      <div style={{ fontSize: "10px", color: "#9ca3af", textTransform: "uppercase" }}>
                        Total Net Payout
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: "700", color: "#34d399" }}>
                        {formatCurrency(dateGroup.totalNet)}
                      </div>
                    </div>

                    {/* Expand/Collapse Chevron */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        backgroundColor: "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                      }}
                    >
                      {isDateExpanded ? <HiOutlineChevronUp size={16} /> : <HiOutlineChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Date Group Batches Table (Visible when Date is expanded) */}
                {isDateExpanded && (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            backgroundColor: "#111827",
                            color: "#9ca3af",
                            borderBottom: "1px solid #1f2937",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          <th style={{ padding: "12px 14px", width: "40px" }}>Select</th>
                          <th style={{ padding: "12px 14px" }}>Gym Details</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Gross</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Commission</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>PG Fee & GST</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>TDS</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Net Payout</th>
                          <th style={{ padding: "12px 14px" }}>Approval Status</th>
                          <th style={{ padding: "12px 14px" }}>Payment Status</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dateGroup.batches.map((batch, batchIdx) => {
                          const bId = getBatchId(batch);
                          const gymId = getGymId(batch);
                          const approvalStatus = getApprovalStatus(batch);
                          const paymentStatus = getMovementStatus(batch);
                          const isApproved = approvalStatus === "approved";
                          const isPaid = paymentStatus === "paid";
                          const isBatchSelected = selectedBatchIds.has(bId);
                          const isLinesExpanded = expandedBatchIds.has(bId);
                          const isRowApproving = approvingBatchId === bId || isApproving;
                          const lines = batch.lines || [];

                          const gross = getGrossAmount(batch);
                          const comm = getCommission(batch);
                          const pgFee = getPgFee(batch);
                          const tds = getTds(batch);
                          const net = getNetAmount(batch);

                          return (
                            <React.Fragment key={bId || batchIdx}>
                              <tr
                                style={{
                                  borderBottom: isLinesExpanded ? "none" : "1px solid #1e293b",
                                  backgroundColor: isBatchSelected
                                    ? "rgba(255, 87, 87, 0.08)"
                                    : isLinesExpanded
                                    ? "#161e2e"
                                    : batchIdx % 2 === 0
                                    ? "transparent"
                                    : "rgba(255, 255, 255, 0.01)",
                                  transition: "background-color 0.15s",
                                }}
                              >
                                {/* Checkbox */}
                                <td style={{ padding: "12px 14px" }}>
                                  {isPaid ? (
                                    <div
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#475569",
                                        fontSize: "12px",
                                      }}
                                    >
                                      -
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => !isApproved && handleSelectBatch(bId)}
                                      style={{
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "4px",
                                        border: isApproved
                                          ? "1px solid #059669"
                                          : isBatchSelected
                                          ? "2px solid #FF5757"
                                          : "2px solid #4b5563",
                                        backgroundColor: isApproved
                                          ? "rgba(16, 185, 129, 0.2)"
                                          : isBatchSelected
                                          ? "#FF5757"
                                          : "transparent",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: isApproved ? "default" : "pointer",
                                      }}
                                    >
                                      {isApproved ? (
                                        <FaCheck size={10} color="#34d399" />
                                      ) : isBatchSelected ? (
                                        <HiOutlineCheck size={13} color="#ffffff" />
                                      ) : null}
                                    </div>
                                  )}
                                </td>

                                {/* Gym Details with Line Count Expand */}
                                <td style={{ padding: "12px 14px" }}>
                                  <div>
                                    <div style={{ fontWeight: "700", color: "#f3f4f6", fontSize: "13px" }}>
                                      {formatGymName(batch.gym_name) || `Gym #${gymId}`}
                                    </div>
                                    {(batch.gym_area || batch.gym_city) && (
                                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                                        {batch.gym_area ? `${batch.gym_area}, ` : ""}
                                        {batch.gym_city || ""}
                                      </div>
                                    )}
                                    <div style={{ marginTop: "4px" }}>
                                      <button
                                        type="button"
                                        onClick={() => toggleExpandBatch(bId)}
                                        style={{
                                          background: isLinesExpanded
                                            ? "rgba(255, 87, 87, 0.15)"
                                            : "rgba(96, 165, 250, 0.12)",
                                          border: isLinesExpanded
                                            ? "1px solid rgba(255, 87, 87, 0.35)"
                                            : "1px solid rgba(96, 165, 250, 0.3)",
                                          borderRadius: "4px",
                                          color: isLinesExpanded ? "#FF5757" : "#60a5fa",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          padding: "2px 7px",
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          transition: "all 0.15s ease",
                                        }}
                                      >
                                        <span>{lines.length || getLineCount(batch)} lines</span>
                                        {isLinesExpanded ? (
                                          <HiOutlineChevronUp size={10} />
                                        ) : (
                                          <HiOutlineChevronDown size={10} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </td>

                                {/* Gross */}
                                <td style={{ padding: "12px 14px", textAlign: "right", color: "#cbd5e1" }}>
                                  {formatCurrency(gross)}
                                </td>

                                {/* Commission */}
                                <td style={{ padding: "12px 14px", textAlign: "right", color: "#fb923c" }}>
                                  {formatCurrency(comm)}
                                </td>

                                {/* PG Fee & GST */}
                                <td style={{ padding: "12px 14px", textAlign: "right", color: "#9ca3af" }}>
                                  {formatCurrency(pgFee)}
                                </td>

                                {/* TDS */}
                                <td style={{ padding: "12px 14px", textAlign: "right", color: "#9ca3af" }}>
                                  {formatCurrency(tds)}
                                </td>

                                {/* Net Payout */}
                                <td
                                  style={{
                                    padding: "12px 14px",
                                    textAlign: "right",
                                    fontWeight: "700",
                                    color: "#34d399",
                                    fontSize: "13px",
                                  }}
                                >
                                  {formatCurrency(net)}
                                </td>

                                {/* Approval Status */}
                                <td style={{ padding: "12px 14px" }}>
                                  {renderApprovalBadge(
                                    batch.approval_status,
                                    batch.hold_reason ||
                                      batch.rejection_reason ||
                                      batch.reject_reason ||
                                      batch.rejectReason
                                  )}
                                  {batch.approved_by && (
                                    <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                                      By: <span style={{ color: "#cbd5e1" }}>{batch.approved_by}</span>
                                    </div>
                                  )}
                                  {batch.rejected_by && (
                                    <div style={{ fontSize: "10px", color: "#f87171", marginTop: "2px" }}>
                                      Rejected by: <span style={{ color: "#fca5a5" }}>{batch.rejected_by}</span>
                                    </div>
                                  )}
                                </td>

                                {/* Payment Status */}
                                <td style={{ padding: "12px 14px" }}>
                                  {renderPaymentStatusBadge(batch.status, batch.utr, batch.failure_reason)}
                                </td>

                                {/* Actions */}
                                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                  {isPaid ? (
                                    <span style={{ color: "#64748b", fontSize: "13px", paddingRight: "10px" }}>—</span>
                                  ) : (
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                      {/* Approve Button */}
                                      <button
                                        onClick={() => handleApproveSingle(bId)}
                                        disabled={!bId || isRowApproving || isApproved}
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          backgroundColor: isApproved
                                            ? "rgba(16, 185, 129, 0.15)"
                                            : isRowApproving
                                            ? "#374151"
                                            : "#FF5757",
                                          color: isApproved ? "#34d399" : "#ffffff",
                                          border: isApproved ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
                                          borderRadius: "6px",
                                          padding: "5px 10px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          cursor:
                                            !bId || isRowApproving || isApproved ? "not-allowed" : "pointer",
                                          transition: "all 0.15s ease",
                                        }}
                                      >
                                        {approvingBatchId === bId ? (
                                          <>
                                            <FaSpinner className="spin" size={11} />
                                            <span>Approving...</span>
                                          </>
                                        ) : isApproved ? (
                                          <>
                                            <FaCheck size={10} />
                                            <span>Approved</span>
                                          </>
                                        ) : (
                                          <>
                                            <HiOutlineShieldCheck size={13} />
                                            <span>Approve</span>
                                          </>
                                        )}
                                      </button>

                                      {/* Reject Button */}
                                      <button
                                        onClick={() => {
                                          setRejectReason("Disputed or requires recalculation");
                                          setRejectingBatch(batch);
                                        }}
                                        disabled={
                                          !bId ||
                                          isRowApproving ||
                                          approvalStatus === "rejected" ||
                                          (isApproved && batch.status !== "queued")
                                        }
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          backgroundColor:
                                            approvalStatus === "rejected"
                                              ? "rgba(239, 68, 68, 0.15)"
                                              : "rgba(239, 68, 68, 0.12)",
                                          color: approvalStatus === "rejected" ? "#f87171" : "#fca5a5",
                                          border:
                                            approvalStatus === "rejected"
                                              ? "1px solid rgba(239, 68, 68, 0.4)"
                                              : "1px solid rgba(239, 68, 68, 0.25)",
                                          borderRadius: "6px",
                                          padding: "5px 10px",
                                          fontSize: "11px",
                                          fontWeight: "700",
                                          cursor:
                                            !bId ||
                                            isRowApproving ||
                                            approvalStatus === "rejected" ||
                                            (isApproved && batch.status !== "queued")
                                              ? "not-allowed"
                                              : "pointer",
                                          transition: "all 0.15s ease",
                                        }}
                                        title={
                                          approvalStatus === "rejected"
                                            ? "Batch already rejected"
                                            : "Reject batch and release allocations back to pool"
                                        }
                                      >
                                        {approvalStatus === "rejected" ? (
                                          <span>Rejected</span>
                                        ) : (
                                          <>
                                            <HiOutlineXCircle size={13} />
                                            <span>Reject</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Payout Lines for this Gym Batch */}
                              {isLinesExpanded && (
                                <tr style={{ backgroundColor: "#0e1420", borderBottom: "1px solid #1f2937" }}>
                                  <td colSpan={10} style={{ padding: "16px 20px" }}>
                                    <div
                                      style={{
                                        backgroundColor: "#090d16",
                                        border: "1px solid #1e293b",
                                        borderRadius: "8px",
                                        padding: "12px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          marginBottom: "10px",
                                        }}
                                      >
                                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#e2e8f0" }}>
                                          Payout Lines for Batch #{bId} ({lines.length} items)
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                                          Gym ID: <strong style={{ color: "#cbd5e1" }}>{gymId}</strong>
                                        </div>
                                      </div>

                                      {lines.length === 0 ? (
                                        <div style={{ color: "#64748b", fontSize: "12px", padding: "8px" }}>
                                          No individual payout line records attached to this batch.
                                        </div>
                                      ) : (
                                        <table
                                          style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            fontSize: "11px",
                                            textAlign: "left",
                                          }}
                                        >
                                          <thead>
                                            <tr style={{ color: "#64748b", borderBottom: "1px solid #1e293b" }}>
                                              <th style={{ padding: "6px 8px" }}>Entitlement ID</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>Gross</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>Commission</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>PG Fee</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>PG Tax</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>TDS</th>
                                              <th style={{ padding: "6px 8px", textAlign: "right" }}>Net</th>
                                              <th style={{ padding: "6px 8px" }}>Line Status</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {lines.map((l, lIdx) => (
                                              <tr
                                                key={l.entitlement_id || lIdx}
                                                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                                              >
                                                <td
                                                  style={{
                                                    padding: "6px 8px",
                                                    fontFamily: "monospace",
                                                    color: "#cbd5e1",
                                                  }}
                                                >
                                                  {l.entitlement_id || `line_${lIdx + 1}`}
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right", color: "#cbd5e1" }}>
                                                  {formatCurrency(l.gross_rupees)}
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right", color: "#fb923c" }}>
                                                  {formatCurrency(l.commission_rupees)}
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right", color: "#9ca3af" }}>
                                                  {formatCurrency(l.pg_fee_rupees)}
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right", color: "#9ca3af" }}>
                                                  {formatCurrency(l.pg_tax_rupees)}
                                                </td>
                                                <td style={{ padding: "6px 8px", textAlign: "right", color: "#9ca3af" }}>
                                                  {formatCurrency(l.tds_rupees)}
                                                </td>
                                                <td
                                                  style={{
                                                    padding: "6px 8px",
                                                    textAlign: "right",
                                                    fontWeight: "700",
                                                    color: "#34d399",
                                                  }}
                                                >
                                                  {formatCurrency(l.net_rupees)}
                                                </td>
                                                <td style={{ padding: "6px 8px" }}>
                                                  {renderLineStatusBadge(l.status)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Batch Confirmation Modal */}
      {rejectingBatch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            backdropFilter: "blur(4px)",
            padding: "20px",
          }}
          onClick={() => !isRejecting && setRejectingBatch(null)}
        >
          <div
            style={{
              backgroundColor: "#131926",
              border: "1px solid #374151",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f87171",
                  }}
                >
                  <HiOutlineBan size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#ffffff" }}>
                    Reject Payout Batch #{getBatchId(rejectingBatch)}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                    {formatGymName(rejectingBatch.gym_name) || `Gym ID: ${getGymId(rejectingBatch)}`} •{" "}
                    <span style={{ color: "#34d399", fontWeight: "600" }}>
                      {formatCurrency(getNetAmount(rejectingBatch))}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => !isRejecting && setRejectingBatch(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <HiOutlineX size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5", margin: "0 0 16px 0" }}>
              Rejecting this batch calls <code style={{ backgroundColor: "#0b0f19", padding: "2px 6px", borderRadius: "4px", color: "#fca5a5" }}>POST /pay/dailypass/payouts/reject</code>. The batch will be marked as rejected and its allocations released back to the eligible pool for recalculation.
            </p>

            {/* Quick Reason Presets */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "6px", fontWeight: "600" }}>
                Quick Reasons:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {[
                  "Disputed booking or attendance",
                  "Bank account / beneficiary discrepancy",
                  "Commission rate discrepancy",
                  "Manual hold for account review",
                ].map((reasonText) => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setRejectReason(reasonText)}
                    style={{
                      backgroundColor:
                        rejectReason === reasonText
                          ? "rgba(239, 68, 68, 0.25)"
                          : "#1e293b",
                      color: rejectReason === reasonText ? "#fca5a5" : "#94a3b8",
                      border:
                        rejectReason === reasonText
                          ? "1px solid rgba(239, 68, 68, 0.5)"
                          : "1px solid #334155",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    {reasonText}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Input */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", fontWeight: "600" }}>
                Rejection Reason (Audit Trail):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter specific rejection reason..."
                style={{
                  width: "100%",
                  backgroundColor: "#0b0f19",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setRejectingBatch(null)}
                disabled={isRejecting}
                style={{
                  backgroundColor: "#1e293b",
                  color: "#cbd5e1",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: isRejecting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectBatchSubmit}
                disabled={isRejecting || !rejectReason.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: isRejecting ? "#4b5563" : "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isRejecting || !rejectReason.trim() ? "not-allowed" : "pointer",
                }}
              >
                {isRejecting ? (
                  <>
                    <FaSpinner className="spin" size={13} />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineBan size={15} />
                    <span>Confirm Rejection</span>
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
