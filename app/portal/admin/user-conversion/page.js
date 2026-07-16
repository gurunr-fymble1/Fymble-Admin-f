"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function UserConversion() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [telecallers, setTelecallers] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [hoveredRevenueSegment, setHoveredRevenueSegment] = useState(null);
  const [revenueTooltip, setRevenueTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [activeChart, setActiveChart] = useState("conversion"); // "conversion" or "revenue"

  useEffect(() => {
    fetchTelecallers();
  }, []);

  const fetchTelecallers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/user-conversion/telecallers");

      if (response.data.success) {
        setTelecallers(response.data.data.telecallers);
      }
    } catch (error) {
      console.error("Error fetching telecallers:", error);
      setTelecallers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTelecallerClick = (telecallerId) => {
    router.push(`/portal/admin/user-conversion/${telecallerId}`);
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="users-header">
          <h2 className="users-title">
            <span style={{ color: "#FF5757" }}>User</span> Conversion
          </h2>
        </div>
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>User</span> Conversion
        </h2>
        <div className="users-count">Total: {telecallers.filter(t => t.id !== 1).length} telecallers</div>
      </div>

      {/* Pie Chart Section - One card with toggle button */}
      {(telecallers.some(t => t.total_converted > 0) || telecallers.some(t => t.total_revenue > 0)) && (
        <div style={{
          backgroundColor: "#1a1a1a",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #2a2a2a",
          marginBottom: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "white", fontSize: "18px", fontWeight: "600", margin: 0 }}>
              {activeChart === "conversion" ? "Conversion Distribution" : "Business by Telecallers"}
            </h3>
            <button
              onClick={() => setActiveChart(activeChart === "conversion" ? "revenue" : "conversion")}
              style={{
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {activeChart === "conversion" ? "Show Revenue" : "Show Conversions"}
            </button>
          </div>

          {/* Conversion Chart */}
          {activeChart === "conversion" && telecallers.some(t => t.total_converted > 0) && (() => {
            const telecallersWithData = telecallers.filter(t => t.total_converted > 0);
            const totalConversions = telecallersWithData.reduce((sum, t) => sum + t.total_converted, 0);
            if (totalConversions === 0) return <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>No data available</div>;

            const colors = ["#FF5757", "#FF8C42", "#FFC947", "#7FE4A3", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63", "#00BCD4", "#FF5722"];
            const data = telecallersWithData.map((telecaller) => ({
              name: telecaller.name || "Unknown",
              value: telecaller.total_converted,
              percentage: (telecaller.total_converted / totalConversions * 100).toFixed(2),
              color: colors[telecallersWithData.indexOf(telecaller) % colors.length]
            })).sort((a, b) => b.value - a.value);

            let currentAngle = -Math.PI / 2;
            const radius = 120;
            const centerX = 150;
            const centerY = 150;
            const innerRadius = 70;

            return (
              <div style={{ display: "flex", gap: "3rem", alignItems: "center", justifyContent: "center" }}>
                <svg width="300" height="300" viewBox="0 0 300 300" style={{ display: "block" }}>
                  {data.map((slice) => {
                    const sliceAngle = (slice.value / totalConversions) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;
                    const x1 = centerX + radius * Math.cos(currentAngle);
                    const y1 = centerY + radius * Math.sin(currentAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);
                    const x3 = centerX + innerRadius * Math.cos(endAngle);
                    const y3 = centerY + innerRadius * Math.sin(endAngle);
                    const x4 = centerX + innerRadius * Math.cos(currentAngle);
                    const y4 = centerY + innerRadius * Math.sin(currentAngle);
                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                    const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, `L ${x3} ${y3}`, `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, `Z`].join(" ");
                    currentAngle = endAngle;
                    return (
                      <g key={slice.name}>
                        <path
                          d={pathData}
                          fill={slice.color}
                          stroke="#1f2937"
                          strokeWidth="2"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: hoveredSegment === slice.name ? 0.9 : 1,
                            transform: hoveredSegment === slice.name ? "scale(1.02)" : "scale(1)",
                            transformOrigin: `${centerX}px ${centerY}px`
                          }}
                          onMouseEnter={(e) => {
                            setHoveredSegment(slice.name);
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
                  <text x={centerX} y={centerY - 8} textAnchor="middle" style={{ fill: "#9ca3af", fontSize: "0.7rem" }}>Total</text>
                  <text x={centerX} y={centerY + 12} textAnchor="middle" style={{ fill: "white", fontSize: "1.1rem", fontWeight: "700" }}>{totalConversions}</text>
                </svg>
                <div style={{ flex: 1, maxHeight: "250px", overflowY: "auto" }}>
                  {data.map((slice) => (
                    <div
                      key={slice.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #374151",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        backgroundColor: hoveredSegment === slice.name ? "#374151" : "transparent"
                      }}
                      onMouseEnter={() => setHoveredSegment(slice.name)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: slice.color }} />
                        <span style={{ color: "#fff", fontSize: "14px" }}>{slice.name}</span>
                      </div>
                      <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>{slice.value} ({slice.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Revenue Chart */}
          {activeChart === "revenue" && telecallers.some(t => t.total_revenue > 0) && (() => {
            const telecallersWithRevenue = telecallers.filter(t => t.total_revenue > 0 && t.id !== 1);
            const totalRevenue = telecallersWithRevenue.reduce((sum, t) => sum + (t.total_revenue || 0), 0);
            if (totalRevenue === 0) return <div style={{ color: "#888", textAlign: "center", padding: "20px" }}>No data available</div>;

            const colors = ["#FF5757", "#FF8C42", "#FFC947", "#7FE4A3", "#4CAF50", "#2196F3", "#9C27B0", "#E91E63", "#00BCD4", "#FF5722"];
            const revenueData = telecallersWithRevenue.map((telecaller) => ({
              name: telecaller.name || "Unknown",
              value: telecaller.total_revenue || 0,
              percentage: ((telecaller.total_revenue || 0) / totalRevenue * 100).toFixed(2),
              color: colors[telecallersWithRevenue.indexOf(telecaller) % colors.length]
            })).sort((a, b) => b.value - a.value);

            let currentAngle = -Math.PI / 2;
            const radius = 120;
            const centerX = 150;
            const centerY = 150;
            const innerRadius = 70;

            return (
              <div style={{ display: "flex", gap: "3rem", alignItems: "center", justifyContent: "center" }}>
                <svg width="300" height="300" viewBox="0 0 300 300" style={{ display: "block" }}>
                  {revenueData.map((slice) => {
                    const sliceAngle = (slice.value / totalRevenue) * 2 * Math.PI;
                    const endAngle = currentAngle + sliceAngle;
                    const x1 = centerX + radius * Math.cos(currentAngle);
                    const y1 = centerY + radius * Math.sin(currentAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);
                    const x3 = centerX + innerRadius * Math.cos(endAngle);
                    const y3 = centerY + innerRadius * Math.sin(endAngle);
                    const x4 = centerX + innerRadius * Math.cos(currentAngle);
                    const y4 = centerY + innerRadius * Math.sin(currentAngle);
                    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
                    const pathData = [`M ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, `L ${x3} ${y3}`, `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`, `Z`].join(" ");
                    currentAngle = endAngle;
                    return (
                      <g key={slice.name}>
                        <path
                          d={pathData}
                          fill={slice.color}
                          stroke="#1f2937"
                          strokeWidth="2"
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: hoveredRevenueSegment === slice.name ? 0.9 : 1,
                            transform: hoveredRevenueSegment === slice.name ? "scale(1.02)" : "scale(1)",
                            transformOrigin: `${centerX}px ${centerY}px`
                          }}
                          onMouseEnter={(e) => {
                            setHoveredRevenueSegment(slice.name);
                            setRevenueTooltip({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              data: slice
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredRevenueSegment(null);
                            setRevenueTooltip({ visible: false, x: 0, y: 0, data: null });
                          }}
                          onMouseMove={(e) => {
                            if (revenueTooltip.visible) {
                              setRevenueTooltip({
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
                  <text x={centerX} y={centerY - 8} textAnchor="middle" style={{ fill: "#9ca3af", fontSize: "0.7rem" }}>Total</text>
                  <text x={centerX} y={centerY + 12} textAnchor="middle" style={{ fill: "white", fontSize: "1.1rem", fontWeight: "700" }}>₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</text>
                </svg>
                <div style={{ flex: 1, maxHeight: "250px", overflowY: "auto" }}>
                  {revenueData.map((slice) => (
                    <div
                      key={slice.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid #374151",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        backgroundColor: hoveredRevenueSegment === slice.name ? "#374151" : "transparent"
                      }}
                      onMouseEnter={() => setHoveredRevenueSegment(slice.name)}
                      onMouseLeave={() => setHoveredRevenueSegment(null)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "2px", backgroundColor: slice.color }} />
                        <span style={{ color: "#fff", fontSize: "14px" }}>{slice.name}</span>
                      </div>
                      <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>₹{slice.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({slice.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Table Section */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile Number</th>
                <th>Total Converted</th>
                <th>Bookings count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {telecallers.length > 0 ? (
                telecallers
                  .filter((telecaller) => telecaller.id !== 1)
                  .map((telecaller) => (
                  <tr
                    key={telecaller.id}
                    onClick={() => handleTelecallerClick(telecaller.id)}
                    style={{
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1f1f";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td>{telecaller.name || "-"}</td>
                    <td>{telecaller.mobile_number || "-"}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                          color: telecaller.total_converted > 0 ? "#fff" : "#888",
                        }}
                      >
                        {telecaller.total_converted}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                          color: telecaller.bookings_count > 0 ? "#fff" : "#888",
                        }}
                      >
                        {telecaller.bookings_count}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: "600",
                          color: telecaller.total_revenue > 0 ? "#10b981" : "#888",
                        }}
                      >
                        ₹{telecaller.total_revenue?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || 0}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">
                    No telecallers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
            {tooltip.data.name}
          </div>
          <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "700" }}>
            {tooltip.data.value} conversions
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {tooltip.data.percentage}% of total
          </div>
        </div>
      )}

      {/* Revenue Tooltip */}
      {revenueTooltip.visible && revenueTooltip.data && (
        <div
          style={{
            position: "fixed",
            left: Math.min(revenueTooltip.x + 15, window.innerWidth - 200),
            top: Math.min(revenueTooltip.y + 15, window.innerHeight - 100),
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
          <div style={{ color: revenueTooltip.data.color, fontSize: "0.7rem", fontWeight: "600", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {revenueTooltip.data.name}
          </div>
          <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "700" }}>
            ₹{revenueTooltip.data.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {revenueTooltip.data.percentage}% of total
          </div>
        </div>
      )}

      {/* Conversion Tooltip */}
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
            {tooltip.data.name}
          </div>
          <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "700" }}>
            {tooltip.data.value} conversions
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {tooltip.data.percentage}% of total
          </div>
        </div>
      )}

      {/* Revenue Tooltip */}
      {revenueTooltip.visible && revenueTooltip.data && (
        <div
          style={{
            position: "fixed",
            left: Math.min(revenueTooltip.x + 15, window.innerWidth - 200),
            top: Math.min(revenueTooltip.y + 15, window.innerHeight - 100),
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
          <div style={{ color: revenueTooltip.data.color, fontSize: "0.7rem", fontWeight: "600", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {revenueTooltip.data.name}
          </div>
          <div style={{ color: "white", fontSize: "0.95rem", fontWeight: "700" }}>
            ₹{revenueTooltip.data.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {revenueTooltip.data.percentage}% of total
          </div>
        </div>
      )}

      {/* Add spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
