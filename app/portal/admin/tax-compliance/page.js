"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useSecureExport, SecureExportModal } from "@/components/auth/SecureExportModal";
import { useRole } from "../../layout";

export default function TaxCompliancePage() {
  const { role } = useRole();
  const { handleExportTrigger, secureExportProps } = useSecureExport();
  const [loading, setLoading] = useState(true);
  const [taxData, setTaxData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMonth, setEditingMonth] = useState(null);
  const [gstPaidInput, setGstPaidInput] = useState("");
  const [tdsPaidInput, setTdsPaidInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchTaxData = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/admin/tax-compliance/monthly-data?page=${page}&page_size=12`);
      if (response.data && response.data.success) {
        setTaxData(response.data.data);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching tax compliance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData(1);
  }, []);

  const handleEdit = (monthData) => {
    setEditingMonth(monthData.month);
    setGstPaidInput(monthData.gst_paid?.toString() || "");
    setTdsPaidInput(monthData.tds_paid?.toString() || "");
  };

  const handleCancel = () => {
    setEditingMonth(null);
    setGstPaidInput("");
    setTdsPaidInput("");
  };

  const handleSave = async () => {
    if (!editingMonth) return;

    // Find the current month data for validation
    const currentMonthData = taxData.find(item => item.month === editingMonth);

    if (currentMonthData) {
      const gstPaidValue = gstPaidInput ? parseFloat(gstPaidInput) : 0;
      const tdsPaidValue = tdsPaidInput ? parseFloat(tdsPaidInput) : 0;

      // Validate GST Paid cannot exceed GST Collected
      if (gstPaidValue > currentMonthData.gst_collected) {
        alert(`GST Paid (₹${gstPaidValue.toFixed(2)}) cannot exceed GST Collected (₹${currentMonthData.gst_collected.toFixed(2)})`);
        return;
      }

      // Validate TDS Paid cannot exceed TDS Collected
      if (tdsPaidValue > currentMonthData.tds_collected) {
        alert(`TDS Paid (₹${tdsPaidValue.toFixed(2)}) cannot exceed TDS Collected (₹${currentMonthData.tds_collected.toFixed(2)})`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        month: editingMonth,
        gst_paid: gstPaidInput ? parseFloat(gstPaidInput) : 0,
        tds_paid: tdsPaidInput ? parseFloat(tdsPaidInput) : 0,
      };

      const response = await axiosInstance.post("/api/admin/tax-compliance/update-paid-amounts", payload);

      if (response.data && response.data.success) {
        // Refresh the data on current page
        await fetchTaxData(currentPage);
        handleCancel();
      }
    } catch (error) {
      console.error("Error updating paid amounts:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setSaving(false);
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
          `/api/admin/tax-compliance/export?start_date=${exportStartDate}&end_date=${exportEndDate}`
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
            "GST Collected",
            "GST Paid",
            "GST Payable",
            "TDS Collected",
            "TDS Paid",
            "TDS Payable"
          ];

          const excelData = [headers];

          data.forEach((row) => {
            excelData.push([
              row.month_display,
              row.gst_collected,
              row.gst_paid,
              row.gst_payable,
              row.tds_collected,
              row.tds_paid,
              row.tds_payable
            ]);
          });

          // Create worksheet
          const ws = XLSX.utils.aoa_to_sheet(excelData);

          // Set column widths
          ws['!cols'] = [
            { wch: 20 }, // Month
            { wch: 15 }, // GST Collected
            { wch: 15 }, // GST Paid
            { wch: 15 }, // GST Payable
            { wch: 15 }, // TDS Collected
            { wch: 15 }, // TDS Paid
            { wch: 15 }, // TDS Payable
          ];

          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(wb, ws, "Tax Compliance");

          // Generate and download Excel file
          XLSX.writeFile(wb, `tax-compliance-${exportStartDate}-to-${exportEndDate}.xlsx`);

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

  return (
    <div className="dashboard-container">
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "300px",
        }}>
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="dashboard-card">
            <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h6 className="card-title">Tax & Compliance - Monthly Overview</h6>
              {(role === "admin" || role === "accountant") && (
                <button
                  onClick={() => setShowExportModal(true)}
                  style={{
                    padding: "8px 16px",
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
            </div>
            <div className="card-body-custom">
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.875rem"
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: "1px solid #374151",
                      backgroundColor: "#1f2937"
                    }}>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>Month</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Collected</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Paid</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>GST Payable</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Collected</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Paid</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "right",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>TDS Payable</th>
                      <th style={{
                        padding: "12px 16px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxData.map((item, index) => (
                      <tr
                        key={item.month}
                        style={{
                          borderBottom: index < taxData.length - 1 ? "1px solid #374151" : "none",
                          backgroundColor: editingMonth === item.month ? "#1f2937" : "transparent"
                        }}
                      >
                        {/* Month */}
                        <td style={{
                          padding: "16px",
                          color: "white",
                          fontWeight: "500"
                        }}>
                          {item.month_display}
                        </td>

                        {/* GST Collected (Read-only) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: "500"
                        }}>
                          {formatCurrency(item.gst_collected)}
                        </td>

                        {/* GST Paid (Editable) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right"
                        }}>
                          {editingMonth === item.month ? (
                            <input
                              type="number"
                              value={gstPaidInput}
                              onChange={(e) => setGstPaidInput(e.target.value)}
                              step="0.01"
                              style={{
                                backgroundColor: "#374151",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "white",
                                padding: "6px 10px",
                                fontSize: "0.875rem",
                                width: "100px",
                                textAlign: "right"
                              }}
                            />
                          ) : (
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                              {formatCurrency(item.gst_paid)}
                            </span>
                          )}
                        </td>

                        {/* GST Payable (Calculated) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: "600"
                        }}>
                          {formatCurrency(item.gst_payable)}
                        </td>

                        {/* TDS Collected (Read-only) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: "500"
                        }}>
                          {formatCurrency(item.tds_collected)}
                        </td>

                        {/* TDS Paid (Editable) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right"
                        }}>
                          {editingMonth === item.month ? (
                            <input
                              type="number"
                              value={tdsPaidInput}
                              onChange={(e) => setTdsPaidInput(e.target.value)}
                              step="0.01"
                              style={{
                                backgroundColor: "#374151",
                                border: "1px solid #4b5563",
                                borderRadius: "4px",
                                color: "white",
                                padding: "6px 10px",
                                fontSize: "0.875rem",
                                width: "100px",
                                textAlign: "right"
                              }}
                            />
                          ) : (
                            <span style={{ color: "#fff", fontWeight: "500" }}>
                              {formatCurrency(item.tds_paid)}
                            </span>
                          )}
                        </td>

                        {/* TDS Payable (Calculated) */}
                        <td style={{
                          padding: "16px",
                          textAlign: "right",
                          color: "#fff",
                          fontWeight: "600"
                        }}>
                          {formatCurrency(item.tds_payable)}
                        </td>

                        {/* Actions */}
                        
                          <td style={{
                            padding: "16px",
                            textAlign: "center"
                          }}>
                            {editingMonth === item.month ? (
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                <button
                                  onClick={handleSave}
                                  disabled={saving}
                                  style={{
                                    backgroundColor: saving ? "#4b5563" : "#22c55e",
                                    color: "white",
                                    border: "none",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: "500"
                                  }}
                                >
                                  {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={handleCancel}
                                  disabled={saving}
                                  style={{
                                    backgroundColor: "#374151",
                                    color: "#9ca3af",
                                    border: "1px solid #4b5563",
                                    padding: "6px 12px",
                                    borderRadius: "4px",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    fontSize: "0.75rem",
                                    fontWeight: "500"
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEdit(item)}
                                style={{
                                  backgroundColor: "#3b82f6",
                                  color: "white",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "0.75rem",
                                  fontWeight: "500"
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>



              {/* Pagination Controls */}
              {pagination && pagination.total_pages > 1 && (
                <div style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem 0",
                  borderTop: "1px solid #374151"
                }}>
                  <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.total_records)} of {pagination.total_records} records
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => fetchTaxData(currentPage - 1)}
                      disabled={!pagination.has_prev_page}
                      style={{
                        backgroundColor: pagination.has_prev_page ? "#374151" : "transparent",
                        color: pagination.has_prev_page ? "white" : "#4b5563",
                        border: "1px solid #4b5563",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: pagination.has_prev_page ? "pointer" : "not-allowed",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                      }}
                    >
                      Previous
                    </button>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      backgroundColor: "#374151",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #4b5563"
                    }}>
                      <span style={{ color: "white", fontSize: "0.875rem" }}>
                        Page {pagination.page} of {pagination.total_pages}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchTaxData(currentPage + 1)}
                      disabled={!pagination.has_next_page}
                      style={{
                        backgroundColor: pagination.has_next_page ? "#374151" : "transparent",
                        color: pagination.has_next_page ? "white" : "#4b5563",
                        border: "1px solid #4b5563",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: pagination.has_next_page ? "pointer" : "not-allowed",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                Export Tax Compliance Data
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
