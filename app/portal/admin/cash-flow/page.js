"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useRole } from "../../layout";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";

export default function CashFlowPage() {
  const { role } = useRole();
  const { handleExportTrigger, secureExportProps } = useSecureExport();

  // Check if we're viewing a specific month (from URL query param)
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Table view states
  const [tableLoading, setTableLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);

  // Opening Balance States (for table view)
  const [showOpeningBalanceModal, setShowOpeningBalanceModal] = useState(false);
  const [financialYear, setFinancialYear] = useState("");
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState("");
  const [savingOpeningBalance, setSavingOpeningBalance] = useState(false);
  const [editingOpeningBalance, setEditingOpeningBalance] = useState(null);
  const [openingBalances, setOpeningBalances] = useState([]);
  const [showEditDeleteModal, setShowEditDeleteModal] = useState(false);
  const [selectedBalanceForEdit, setSelectedBalanceForEdit] = useState(null);

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  // Generate financial years
  const currentYear = new Date().getFullYear();
  const financialYears = [];
  for (let i = 5; i >= 0; i--) {
    const startYear = currentYear - i;
    const endYear = startYear + 1;
    financialYears.push(`${startYear}-${endYear}`);
  }

  // Check for month parameter in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const monthParam = params.get('month');
    if (monthParam) {
      setSelectedMonth(monthParam);
    }
  }, []);

  // Fetch monthly table data
  const fetchMonthlyData = async (page = 1) => {
    setTableLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/api/admin/cash-flow/monthly-data?page=${page}&page_size=12`);
      if (response.data && response.data.success) {
        setTableData(response.data.data);
        setPagination(response.data.pagination);
        setOpeningBalances(response.data.opening_balances || []);
        setCurrentPage(page);
      } else {
        throw new Error(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching monthly data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to fetch data");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedMonth) {
      fetchMonthlyData(1);
    }
  }, [selectedMonth]);

  const handleRowClick = (month) => {
    // Update URL without navigating
    const url = new URL(window.location);
    url.searchParams.set('month', month);
    window.history.pushState({}, '', url);
    setSelectedMonth(month);
  };

  const handleBackToTable = () => {
    // Remove month parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete('month');
    window.history.pushState({}, '', url);
    setSelectedMonth(null);
    fetchMonthlyData(currentPage);
  };

  const handleSaveOpeningBalance = async () => {
    if (!financialYear || !openingBalanceAmount) {
      alert("Please fill all fields");
      return;
    }

    setSavingOpeningBalance(true);
    try {
      const response = await axiosInstance.post("/api/admin/cash-flow/opening-balance", {
        financial_year: financialYear,
        amount: parseFloat(openingBalanceAmount)
      });

      if (response.data && response.data.success) {
        alert(response.data.message);
        handleCloseModal();
        fetchMonthlyData(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save opening balance");
    } finally {
      setSavingOpeningBalance(false);
    }
  };

  const handleEditOpeningBalance = (ob) => {
    setEditingOpeningBalance(ob);
    setFinancialYear(ob.financial_year);
    setOpeningBalanceAmount(ob.amount.toString());
    setShowOpeningBalanceModal(true);
  };

  const handleCloseModal = () => {
    setShowOpeningBalanceModal(false);
    setEditingOpeningBalance(null);
    setFinancialYear("");
    setOpeningBalanceAmount("");
  };

  const handleDeleteOpeningBalance = async (fy) => {
    if (!confirm(`Are you sure you want to delete opening balance for ${fy}?`)) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/admin/cash-flow/opening-balance/${fy}`);
      if (response.data && response.data.success) {
        alert(response.data.message);
        fetchMonthlyData(currentPage);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete opening balance");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      alert("Start date cannot be after end date");
      return;
    }

    handleExportTrigger(async () => {
      setExporting(true);
      try {
        // Fetch data for the selected date range
        const response = await axiosInstance.get(
          `/api/admin/cash-flow/export?start_date=${exportStartDate}&end_date=${exportEndDate}`
        );

        if (response.data && response.data.success) {
          const data = response.data.data;

          // Dynamically import xlsx library
          const XLSX = await import('xlsx');

          // Create workbook
          const wb = XLSX.utils.book_new();

          // Prepare data for Excel
          const headers = [
            "Month",
            "Opening Balance",
            "Total Outflow",
            "Gym Payout",
            "GST Payable",
            "TDS Payable",
            "Expenses",
            "Net Cash Flow",
            "Closing Balance",
            "Burn Rate",
            "Runway"
          ];

          const excelData = [headers];

          data.forEach((row) => {
            excelData.push([
              row.month_display,
              row.opening_balance,
              row.outflow,
              row.gym_payout,
              row.gst_payable,
              row.tds_payable,
              row.expenses,
              row.net_cash_flow,
              row.closing_balance,
              row.burn_rate,
              row.runway
            ]);
          });

          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(excelData);

          // Set column widths
          ws['!cols'] = [
            { wch: 20 }, // Month
            { wch: 15 }, // Opening Balance
            { wch: 15 }, // Total Outflow
            { wch: 15 }, // Gym Payout
            { wch: 15 }, // GST Payable
            { wch: 15 }, // TDS Payable
            { wch: 15 }, // Expenses
            { wch: 15 }, // Net Cash Flow
            { wch: 15 }, // Closing Balance
            { wch: 15 }, // Burn Rate
            { wch: 10 }, // Runway
          ];

          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");

          // Generate and download Excel file
          XLSX.writeFile(wb, `cash-flow-${exportStartDate}-to-${exportEndDate}.xlsx`);

          setShowExportModal(false);
          setExportStartDate("");
          setExportEndDate("");
        }
      } catch (err) {
        console.error("Export error:", err);
        alert(err.response?.data?.detail || "Failed to export data");
      } finally {
        setExporting(false);
      }
    });
  };

  // If a month is selected, show the detail view component
  if (selectedMonth) {
    return <CashFlowDetailView month={selectedMonth} onBack={handleBackToTable} />;
  }

  // Table view
  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "white", margin: "0" }}>
            Cash Flow
          </h2>
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: "4px 0 0 0" }}>
            Monthly cash flow overview
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {(role === "admin" || role === "accountant") && (
            <button
              onClick={() => setShowExportModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#16a34a"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#22c55e"}
            >
              Export
            </button>
          )}
          {role === "admin" && (
            <button
              onClick={() => setShowOpeningBalanceModal(true)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#FF5757",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#e04848"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#FF5757"}
            >
              + Opening Balance
            </button>
          )}
        </div>
      </div>

      {/* Opening Balance List */}
      {role === "admin" && openingBalances.length > 0 && (
        <div className="dashboard-card" style={{ marginBottom: "20px" }}>
          <div className="card-header-custom">
            <h6 className="card-title">Opening Balances</h6>
          </div>
          <div className="card-body-custom">
            <select
              value=""
              onChange={(e) => {
                const value = e.target.value;
                if (value === "add_new") {
                  setShowOpeningBalanceModal(true);
                } else if (value) {
                  const ob = openingBalances.find(o => o.financial_year === value);
                  if (ob) {
                    // Show Edit/Delete modal for this opening balance
                    setSelectedBalanceForEdit(ob);
                    setShowEditDeleteModal(true);
                  }
                }
                e.target.value = "";
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "6px",
                color: "white",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              <option value="">Select Opening Balance to Edit/Delete</option>
              {openingBalances.map((ob) => (
                <option key={ob.id} value={ob.financial_year}>
                  {ob.financial_year} - {formatCurrency(ob.amount)}
                </option>
              ))}
              <option value="add_new">+ Add New Opening Balance</option>
            </select>
          </div>
        </div>
      )}

      {/* Monthly Cash Flow Table */}
      <div className="dashboard-card">
        <div className="card-header-custom">
          <h6 className="card-title">Monthly Cash Flow Data</h6>
          {pagination && (
            <div style={{
              fontSize: "12px",
              color: "#9ca3af",
              backgroundColor: "#1f2937",
              padding: "4px 10px",
              borderRadius: "4px"
            }}>
              Page {pagination.page} of {pagination.total_pages} ({pagination.total_records} months)
            </div>
          )}
        </div>
        <div className="card-body-custom">
          {tableLoading ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}>
              <div style={{ color: "#888" }}>Loading...</div>
            </div>
          ) : error ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px",
            }}>
              <div style={{ color: "#ef4444", textAlign: "center" }}>
                <div style={{ fontSize: "18px", marginBottom: "10px" }}>Error</div>
                <div style={{ fontSize: "14px", color: "#888" }}>{error}</div>
                <button
                  onClick={() => fetchMonthlyData(1)}
                  style={{
                    marginTop: "15px",
                    padding: "8px 16px",
                    backgroundColor: "#FF5757",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #374151" }}>
                      <th style={{ padding: "12px", textAlign: "left", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Month</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Opening Balance</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Outflow</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Net Cash Flow</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Closing Balance</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Burn Rate</th>
                      <th style={{ padding: "12px", textAlign: "right", color: "#9ca3af", fontWeight: "600", fontSize: "13px" }}>Runway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr
                        key={row.month}
                        onClick={() => handleRowClick(row.month)}
                        style={{
                          borderBottom: "1px solid #374151",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1f2937"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "14px 12px", color: "#fff", fontWeight: "500" }}>
                          {row.month_display}
                        </td>
                        <td style={{ padding: "14px 12px", textAlign: "right", color: "#fff", fontWeight: "500" }}>
                          {formatCurrency(row.opening_balance)}
                        </td>
                        <td style={{ padding: "14px 12px", textAlign: "right", color: "#fff", fontWeight: "500" }}>
                          {formatCurrency(row.outflow)}
                        </td>
                        <td style={{
                          padding: "14px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#fff"
                        }}>
                          {formatCurrency(row.net_cash_flow)}
                        </td>
                        <td style={{ padding: "14px 12px", textAlign: "right", color: "#fff", fontWeight: "500" }}>
                          {formatCurrency(row.closing_balance)}
                        </td>
                        <td style={{ padding: "14px 12px", textAlign: "right", color: "#fff" }}>
                          {formatCurrency(row.burn_rate)}
                        </td>
                        <td style={{
                          padding: "14px 12px",
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: "500"
                        }}>
                          {row.runway > 0 ? row.runway : "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px"
                }}>
                  <button
                    onClick={() => fetchMonthlyData(currentPage - 1)}
                    disabled={!pagination.has_prev_page}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.has_prev_page ? "#FF5757" : "#374151",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      cursor: pagination.has_prev_page ? "pointer" : "not-allowed"
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                    Page {pagination.page} of {pagination.total_pages}
                  </span>
                  <button
                    onClick={() => fetchMonthlyData(currentPage + 1)}
                    disabled={!pagination.has_next_page}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.has_next_page ? "#FF5757" : "#374151",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      cursor: pagination.has_next_page ? "pointer" : "not-allowed"
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Opening Balance Modal */}
      {showOpeningBalanceModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "400px",
            border: "1px solid #374151"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", margin: 0 }}>
                {editingOpeningBalance ? "Edit Opening Balance" : "Add Opening Balance"}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Financial Year Dropdown */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                  Financial Year *
                </label>
                <select
                  value={financialYear}
                  onChange={(e) => setFinancialYear(e.target.value)}
                  disabled={!!editingOpeningBalance}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: editingOpeningBalance ? "#374151" : "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: editingOpeningBalance ? "#9ca3af" : "white",
                    fontSize: "14px",
                    cursor: editingOpeningBalance ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
                {editingOpeningBalance && (
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                    Financial year cannot be changed when editing
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={openingBalanceAmount}
                  onChange={(e) => setOpeningBalanceAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  onClick={handleCloseModal}
                  disabled={savingOpeningBalance}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#374151",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: savingOpeningBalance ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOpeningBalance}
                  disabled={savingOpeningBalance}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#FF5757",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: savingOpeningBalance ? "not-allowed" : "pointer",
                    opacity: savingOpeningBalance ? 0.6 : 1
                  }}
                >
                  {savingOpeningBalance ? "Saving..." : (editingOpeningBalance ? "Update" : "Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Delete Opening Balance Modal */}
      {showEditDeleteModal && selectedBalanceForEdit && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
          onClick={() => setShowEditDeleteModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
              border: "1px solid #374151",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "white",
                marginBottom: "16px",
              }}
            >
              Opening Balance
            </h3>

            {/* Display financial year and amount */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "#111827",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Financial Year
              </div>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "white",
                  marginBottom: "12px",
                }}
              >
                {selectedBalanceForEdit.financial_year}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  marginBottom: "4px",
                }}
              >
                Amount
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#fff",
                }}
              >
                {formatCurrency(selectedBalanceForEdit.amount)}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setShowEditDeleteModal(false);
                  handleEditOpeningBalance(selectedBalanceForEdit);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowEditDeleteModal(false);
                  handleDeleteOpeningBalance(selectedBalanceForEdit.financial_year);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowEditDeleteModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                color: "#9ca3af",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            borderRadius: "12px",
            padding: "24px",
            width: "100%",
            maxWidth: "450px",
            border: "1px solid #374151"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ fontSize: "18px", fontWeight: "600", color: "white", margin: 0 }}>
                Export Cash Flow Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "0",
                  lineHeight: "1"
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Start Date */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                  max={exportEndDate || new Date().toISOString().split('T')[0]}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                  min={exportStartDate}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Quick Select Options */}
              <div>
                <label style={{ display: "block", fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                  Quick Select
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                      setExportStartDate(lastMonth.toISOString().split('T')[0]);
                      setExportEndDate(lastMonthEnd.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#374151",
                      color: "white",
                      border: "1px solid #4b5563",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Last Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const lastQuarter = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                      const quarterEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                      setExportStartDate(lastQuarter.toISOString().split('T')[0]);
                      setExportEndDate(quarterEnd.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#374151",
                      color: "white",
                      border: "1px solid #4b5563",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    Last Quarter
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const yearStart = new Date(today.getFullYear(), 3, 1); // April 1 (Financial Year start)
                      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                      // If current month is before April, use previous year
                      const startDate = today.getMonth() < 4 ?
                        new Date(today.getFullYear() - 1, 3, 1) :
                        new Date(today.getFullYear(), 3, 1);
                      setExportStartDate(startDate.toISOString().split('T')[0]);
                      setExportEndDate(lastMonthEnd.toISOString().split('T')[0]);
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#374151",
                      color: "white",
                      border: "1px solid #4b5563",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    This Financial Year
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportStartDate("");
                    setExportEndDate("");
                  }}
                  disabled={exporting}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#374151",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: exporting ? "not-allowed" : "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    flex: 1,
                    padding: "10px",
                    backgroundColor: "#22c55e",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: exporting ? "not-allowed" : "pointer",
                    opacity: exporting ? 0.6 : 1
                  }}
                >
                  {exporting ? "Exporting..." : "Export Excel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <SecureExportModal {...secureExportProps} />
    </div>
  );
}

// Detail View Component for a specific month
function CashFlowDetailView({ month, onBack }) {
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [error, setError] = useState(null);

  const fetchCashFlowData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(`/api/admin/cash-flow/overview?month=${month}`);
      if (response.data && response.data.success) {
        setCashFlowData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch cash flow data");
      }
    } catch (err) {
      console.error("Error fetching cash flow data:", err);
      setError(err.response?.data?.detail || err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlowData();
  }, [month]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Get current financial year (April 1 to March 31)
  const getCurrentFinancialYear = () => {
    const today = new Date();
    const year = today.getFullYear();
    const monthIdx = today.getMonth();

    if (monthIdx >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  // Get opening balance for current financial year
  const getCurrentFinancialYearOpeningBalance = () => {
    const currentFY = getCurrentFinancialYear();
    const openingBalance = cashFlowData?.opening_balances?.find(
      (ob) => ob.financial_year === currentFY
    );
    return openingBalance?.amount || 0;
  };

  return (
    <div className="dashboard-container">
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          backgroundColor: "#374151",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        ← Back to Monthly View
      </button>

      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : error ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#ef4444", textAlign: "center" }}>
            <div style={{ fontSize: "18px", marginBottom: "10px" }}>Error</div>
            <div style={{ fontSize: "14px", color: "#888" }}>{error}</div>
            <button
              onClick={fetchCashFlowData}
              style={{
                marginTop: "15px",
                padding: "8px 16px",
                backgroundColor: "#FF5757",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="section-container">
          {/* Page Header */}
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "600", color: "white", margin: "0 0 8px 0" }}>
              Cash Flow Details
            </h2>
            <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0" }}>
              {cashFlowData?.month?.month_name}
            </p>
          </div>

          {/* All the existing cards from the original page */}
          {/* Last Month Outflow Card */}
          <div className="dashboard-card">
            <div className="card-header-custom">
              <h6 className="card-title">Cash Flow Summary</h6>
              {cashFlowData?.month && (
                <div style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  backgroundColor: "#1f2937",
                  padding: "4px 10px",
                  borderRadius: "4px"
                }}>
                  {cashFlowData.month.month_name}
                </div>
              )}
            </div>
            <div className="card-body-custom">
              {/* Total Outflow */}
              <div style={{
                textAlign: "center",
                padding: "30px 20px",
                backgroundColor: "#1f2937",
                borderRadius: "8px",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
                  Total Outflow
                </div>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#fff"
                }}>
                  {formatCurrency(cashFlowData?.outflow?.total_outflow)}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                  {cashFlowData?.month && (
                    <span>{cashFlowData.month.start_date} to {cashFlowData.month.end_date}</span>
                  )}
                </div>
              </div>

              {/* Outflow Breakdown */}
              <div>
                <div style={{
                  fontSize: "14px",
                  color: "#fff",
                  marginBottom: "15px",
                  fontWeight: "600"
                }}>
                  Outflow Breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Gym Payout */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    backgroundColor: "#1e1e1e",
                    borderRadius: "6px",
                    border: "1px solid #374151"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                        Gym Payout
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Payments to gyms (after deductions)
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#fff"
                    }}>
                      {formatCurrency(cashFlowData?.outflow?.gym_payout)}
                    </div>
                  </div>

                  {/* GST Payable */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    backgroundColor: "#1e1e1e",
                    borderRadius: "6px",
                    border: "1px solid #374151"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                        GST Payable
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Goods & Services Tax liability
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#fff"
                    }}>
                      {formatCurrency(cashFlowData?.outflow?.gst_payable)}
                    </div>
                  </div>

                  {/* TDS Payable */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    backgroundColor: "#1e1e1e",
                    borderRadius: "6px",
                    border: "1px solid #374151"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                        TDS Payable
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Tax Deducted at Source liability
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#fff"
                    }}>
                      {formatCurrency(cashFlowData?.outflow?.tds_payable)}
                    </div>
                  </div>

                  {/* Expenses */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    backgroundColor: "#1e1e1e",
                    borderRadius: "6px",
                    border: "1px solid #374151"
                  }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>
                        Expenses
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
                        Operational & Marketing expenses
                      </div>
                    </div>
                    <div style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#fff"
                    }}>
                      {formatCurrency(cashFlowData?.outflow?.expenses)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              {cashFlowData?.breakdown && (
                <div style={{ marginTop: "25px" }}>
                  <div style={{
                    fontSize: "14px",
                    color: "#fff",
                    marginBottom: "15px",
                    fontWeight: "600"
                  }}>
                    Detailed Breakdown by Revenue Source
                  </div>

                  {/* Note explaining outflow calculation */}
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#1f2937",
                    borderRadius: "6px",
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#9ca3af"
                  }}>
                    <strong style={{ color: "#fff" }}>Outflow = </strong> Gym Payout + GST Payable + TDS Payable + Expenses
                    <br />
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>Note: PG charges & commission are deducted before payout (retained by platform)</span>
                  </div>

                  {/* Membership, Daily Pass, Sessions, Fymble Subscription breakdowns */}
                  {/* You can add the detailed breakdowns here similar to the original page */}
                </div>
              )}
            </div>
          </div>

          {/* Net Cash Flow Card */}
          <div className="dashboard-card" style={{ marginTop: "20px" }}>
            <div className="card-header-custom">
              <h6 className="card-title">Net Cash Flow</h6>
              {cashFlowData?.month && (
                <div style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  backgroundColor: "#1f2937",
                  padding: "4px 10px",
                  borderRadius: "4px"
                }}>
                  {cashFlowData.month.month_name}
                </div>
              )}
            </div>
            <div className="card-body-custom">
              <div style={{
                textAlign: "center",
                padding: "30px 20px",
                backgroundColor: "#1f2937",
                borderRadius: "8px"
              }}>
                <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
                  Net Cash Flow
                </div>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: cashFlowData?.net_cash_flow >= 0 ? "#10b981" : "#ef4444"
                }}>
                  {formatCurrency(cashFlowData?.net_cash_flow)}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                  {cashFlowData?.month && (
                    <span>{cashFlowData.month.start_date} to {cashFlowData.month.end_date}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Closing Balance Card */}
          <div className="dashboard-card" style={{ marginTop: "20px" }}>
            <div className="card-header-custom">
              <h6 className="card-title">Closing Balance</h6>
              <div style={{
                fontSize: "12px",
                color: "#9ca3af",
                backgroundColor: "#1f2937",
                padding: "4px 10px",
                borderRadius: "4px"
              }}>
                {getCurrentFinancialYear()}
              </div>
            </div>
            <div className="card-body-custom">
              <div style={{
                textAlign: "center",
                padding: "30px 20px",
                backgroundColor: "#1f2937",
                borderRadius: "8px"
              }}>
                <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
                  Closing Balance
                </div>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#fff"
                }}>
                  {formatCurrency(getCurrentFinancialYearOpeningBalance() + (cashFlowData?.net_cash_flow || 0))}
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                  Opening Balance + Net Cash Flow
                </div>
              </div>
            </div>
          </div>

          {/* Burn Rate Card */}
          <div className="dashboard-card" style={{ marginTop: "20px" }}>
            <div className="card-header-custom">
              <h6 className="card-title">Burn Rate</h6>
              {cashFlowData?.month && (
                <div style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  backgroundColor: "#1f2937",
                  padding: "4px 10px",
                  borderRadius: "4px"
                }}>
                  {cashFlowData.month.month_name}
                </div>
              )}
            </div>
            <div className="card-body-custom">
              <div style={{
                textAlign: "center",
                padding: "30px 20px",
                backgroundColor: "#1f2937",
                borderRadius: "8px"
              }}>
                <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
                  Monthly Burn Rate
                </div>
                <div style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  color: "#fff"
                }}>
                  {formatCurrency(cashFlowData?.net_cash_flow < 0 ? Math.abs(cashFlowData.net_cash_flow) : 0)}
                </div>
              </div>

              <div style={{
                padding: "16px",
                backgroundColor: "#1f2937",
                borderRadius: "6px",
                border: "1px solid #374151"
              }}>
                {cashFlowData?.net_cash_flow >= 0 && (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "500"
                  }}>
                    ✓ Positive cash flow - No burn rate this month
                  </div>
                )}
                {cashFlowData?.net_cash_flow < 0 && (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "500"
                  }}>
                    ⚠ Negative cash flow - Burning {formatCurrency(Math.abs(cashFlowData.net_cash_flow))} per month
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Runway Card */}
          <div className="dashboard-card" style={{ marginTop: "20px" }}>
            <div className="card-header-custom">
              <h6 className="card-title">Runway</h6>
              <div style={{
                fontSize: "12px",
                color: "#9ca3af",
                backgroundColor: "#1f2937",
                padding: "4px 10px",
                borderRadius: "4px"
              }}>
                {getCurrentFinancialYear()}
              </div>
            </div>
            <div className="card-body-custom">
              {(() => {
                const closingBalance = getCurrentFinancialYearOpeningBalance() + (cashFlowData?.net_cash_flow || 0);
                const netCashFlow = cashFlowData?.net_cash_flow || 0;

                let runway = 0;
                let shouldCalculate = false;

                if (closingBalance > 0 && netCashFlow < 0) {
                  runway = closingBalance / Math.abs(netCashFlow);
                  shouldCalculate = true;
                }

                return (
                  <>
                    <div style={{
                      textAlign: "center",
                      padding: "30px 20px",
                      backgroundColor: "#1f2937",
                      borderRadius: "8px",
                      marginBottom: "20px"
                    }}>
                      <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>
                        Runway
                      </div>
                      <div style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: "#fff"
                      }}>
                        {shouldCalculate ? runway.toFixed(1) : "0"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                        {shouldCalculate ? `${runway.toFixed(1)} months remaining` :
                         closingBalance <= 0 ? "Negative closing balance" :
                         "Positive cash flow"}
                      </div>
                    </div>

                    <div style={{
                      padding: "16px",
                      backgroundColor: "#1f2937",
                      borderRadius: "6px",
                      border: "1px solid #374151"
                    }}>
                      <div style={{
                        fontSize: "13px",
                        color: "#fff",
                        fontWeight: "600",
                        marginBottom: "12px"
                      }}>
                        Runway Calculation
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                          <span style={{ color: "#9ca3af" }}>Closing Balance:</span>
                          <span style={{ color: closingBalance >= 0 ? "#8b5cf6" : "#ef4444", fontWeight: "500" }}>
                            {formatCurrency(closingBalance)}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                          <span style={{ color: "#9ca3af" }}>Net Cash Flow:</span>
                          <span style={{ color: netCashFlow >= 0 ? "#10b981" : "#ef4444", fontWeight: "500" }}>
                            {formatCurrency(netCashFlow)}
                          </span>
                        </div>
                        <div style={{
                          display: "flex", justifyContent: "space-between",
                          fontSize: "14px",
                          fontWeight: "600",
                          paddingTop: "8px",
                          borderTop: "1px solid #374151",
                          marginTop: "4px"
                        }}>
                          <span style={{ color: "#fff" }}>Runway:</span>
                          <span style={{ color: shouldCalculate ? (runway >= 6 ? "#10b981" : runway >= 3 ? "#f59e0b" : "#ef4444") : "#10b981" }}>
                            {shouldCalculate ? `${runway.toFixed(1)} months` : "0 months"}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        marginTop: "12px",
                        padding: "10px 12px",
                        backgroundColor: shouldCalculate ?
                          (runway >= 6 ? "rgba(16, 185, 129, 0.1)" : runway >= 3 ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)") :
                          "rgba(16, 185, 129, 0.1)",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: shouldCalculate ?
                          (runway >= 6 ? "#10b981" : runway >= 3 ? "#f59e0b" : "#ef4444") :
                          "#10b981",
                        textAlign: "center"
                      }}>
                        {closingBalance <= 0 ? "⚠ Negative closing balance - Cannot calculate runway" :
                         netCashFlow >= 0 ? "✓ Positive cash flow - No runway calculation needed" :
                         runway >= 12 ? "✓ Healthy - More than 1 year runway" :
                         runway >= 6 ? "✓ Good - 6+ months runway" :
                         runway >= 3 ? "⚠ Warning - Less than 6 months runway" :
                         "🚨 Critical - Less than 3 months runway"}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
