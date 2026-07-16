"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { FaArrowLeft, FaChartLine, FaCalculator, FaInfoCircle, FaCalendarAlt, FaPercent } from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function LtvTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLtvTrend = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/api/admin/unit-economics/ltv-trend");
        if (response.data?.success) {
          setTrendData(response.data.data);
        } else {
          setError(response.data?.message || "Failed to fetch trend data");
        }
      } catch (err) {
        console.error("Error fetching LTV trend:", err);
        setError("Error connecting to backend API");
      } finally {
        setLoading(false);
      }
    };

    fetchLtvTrend();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Custom Tooltip component for LTV Curve chart
  const LtvTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(20, 20, 20, 0.95)",
          border: "1px solid #3b82f6",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)",
          backdropFilter: "blur(10px)",
          minWidth: "220px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "6px" }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Lifetime Value (LTV):</span>
              <span style={{ color: "#22c55e", fontWeight: "700" }}>{formatCurrency(data.ltv)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>ARPPU (M-1):</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{formatCurrency(data.arppu)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Churn Rate:</span>
              <span style={{ color: "#f87171", fontWeight: "600" }}>{data.churnRate}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Retention Rate:</span>
              <span style={{ color: "#60a5fa", fontWeight: "600" }}>{data.retentionRate}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Gross Margin:</span>
              <span style={{ color: "#fbbf24", fontWeight: "600" }}>{data.grossMarginPercentage}%</span>
            </div>
            {/* <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Months Count:</span>
              <span style={{ color: "#c084fc", fontWeight: "600" }}>{data.monthsCount} m</span>
            </div> */}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip component for Cohort Retention chart
  const RetentionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(20, 20, 20, 0.95)",
          border: "1px solid #10b981",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)",
          backdropFilter: "blur(10px)",
          minWidth: "220px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "6px" }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Retention Rate:</span>
              <span style={{ color: "#10b981", fontWeight: "600" }}>{data.retentionRate}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Churn Rate:</span>
              <span style={{ color: "#f87171", fontWeight: "600" }}>{data.churnRate}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip component for ARPPU Trend chart
  const ArppuTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(20, 20, 20, 0.95)",
          border: "1px solid #fbbf24",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(251, 191, 36, 0.15)",
          backdropFilter: "blur(10px)",
          minWidth: "220px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "6px" }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>ARPPU (M-1):</span>
              <span style={{ color: "#fbbf24", fontWeight: "700" }}>{formatCurrency(data.arppu)}</span>
            </div>
            {/* <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Months Since Start:</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{data.monthsCount} m</span>
            </div> */}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip component for Gross Margin Trend chart
  const MarginTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: "rgba(20, 20, 20, 0.95)",
          border: "1px solid #f43f5e",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(244, 63, 94, 0.15)",
          backdropFilter: "blur(10px)",
          minWidth: "220px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "6px" }}>
            {label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
              <span style={{ color: "#aaa" }}>Overall Gross Margin %:</span>
              <span style={{ color: "#f43f5e", fontWeight: "700" }}>{data.grossMarginPercentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getStats = () => {
    if (!trendData.length) return { latestLtv: 0, peakLtv: 0, avgArppu: 0 };
    const ltvs = trendData.map(d => d.ltv);
    const arppus = trendData.map(d => d.arppu);
    
    return {
      latestLtv: trendData[trendData.length - 1].ltv,
      peakLtv: Math.max(...ltvs),
      lowestLtv: Math.min(...ltvs),
      avgArppu: arppus.reduce((a, b) => a + b, 0) / arppus.length
    };
  };

  const stats = getStats();

  return (
    <div className="dashboard-container" style={{ paddingBottom: "40px" }}>
      {/* Header Area */}
      <div className="section-container" style={{ marginBottom: "25px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <Link
            href="/portal/admin/unit-economics"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#1e1e1e",
              border: "1px solid #333",
              color: "#aaa",
              transition: "all 0.2s ease",
              textDecoration: "none"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "white";
              e.currentTarget.style.borderColor = "#444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#aaa";
              e.currentTarget.style.borderColor = "#333";
            }}
          >
            <FaArrowLeft />
          </Link>
          <div>
            <h3 className="section-heading" style={{ margin: 0, fontSize: "28px", fontWeight: "700" }}>
              <span style={{ color: "#FF5757" }}>Trends</span>
            </h3>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "#888" }}>
          Loading LTV, Cohort Retention & ARPPU trend analysis...
        </div>
      ) : error ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "#f87171" }}>
          {error}
        </div>
      ) : trendData.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px", color: "#888" }}>
          No historical trend data points found.
        </div>
      ) : (
        <>

          {/* Lifetime Value Graph Section */}
          <div className="section-container" style={{ marginBottom: "35px" }}>
            <div className="dashboard-card" style={{ padding: "25px" }}>
              <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", padding: 0 }}>
                <h5 className="card-title" style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Lifetime Value Trend (LTV Curve)
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#888" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(59, 130, 246, 0.8)", boxShadow: "0 0 10px rgba(59, 130, 246, 0.4)" }} />
                  Expected Monetary LTV
                </div>
              </div>

              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: Math.max(700, trendData.length * 80) + "px", height: "350px", marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="ltvGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="month"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip content={<LtvTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="ltv"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#ltvGlow)"
                        baseValue="dataMin"
                        activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Cohort Retention Graph Section */}
          <div className="section-container" style={{ marginBottom: "35px" }}>
            <div className="dashboard-card" style={{ padding: "25px" }}>
              <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", padding: 0 }}>
                <h5 className="card-title" style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Cohort Retention Rate Trend (M-2 to M-1)
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#888" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.8)", boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)" }} />
                  Retention Rate (%)
                </div>
              </div>

              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: Math.max(700, trendData.length * 80) + "px", height: "350px", marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="retentionGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="month"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip content={<RetentionTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="retentionRate"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#retentionGlow)"
                        activeDot={{ r: 8, stroke: "#10b981", strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Average Revenue Per Paying User Graph Section */}
          <div className="section-container" style={{ marginBottom: "35px" }}>
            <div className="dashboard-card" style={{ padding: "25px" }}>
              <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", padding: 0 }}>
                <h5 className="card-title" style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Average Revenue Per Paying User Trend (ARPPU)
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#888" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(251, 191, 36, 0.8)", boxShadow: "0 0 10px rgba(251, 191, 36, 0.4)" }} />
                  Dynamic Monthly ARPPU (M-1)
                </div>
              </div>

              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: Math.max(700, trendData.length * 80) + "px", height: "350px", marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="arppuGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="month"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `₹${val}`}
                      />
                      <Tooltip content={<ArppuTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="arppu"
                        stroke="#fbbf24"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#arppuGlow)"
                        activeDot={{ r: 8, stroke: "#fbbf24", strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Gross Margin Graph Section */}
          <div className="section-container" style={{ marginBottom: "35px" }}>
            <div className="dashboard-card" style={{ padding: "25px" }}>
              <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", padding: 0 }}>
                <h5 className="card-title" style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Overall Gross Margin Trend (GM %)
                </h5>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#888" }}>
                  <span style={{ display: "inline-block", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "rgba(244, 63, 94, 0.8)", boxShadow: "0 0 10px rgba(244, 63, 94, 0.4)" }} />
                  Overall Gross Margin %
                </div>
              </div>

              <div style={{ width: "100%", overflowX: "auto" }}>
                <div style={{ minWidth: Math.max(700, trendData.length * 80) + "px", height: "350px", marginTop: "10px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="marginGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="month"
                        stroke="#888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                      />
                      <YAxis
                        stroke="#888"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[-30, 0]}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip content={<MarginTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="grossMarginPercentage"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#marginGlow)"
                        baseValue={-30}
                        activeDot={{ r: 8, stroke: "#f43f5e", strokeWidth: 2, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Data Auditing Table
          <div className="section-container" style={{ marginBottom: "35px" }}>
            <div className="dashboard-card" style={{ padding: "25px" }}>
              <div className="card-header-custom" style={{ marginBottom: "20px", padding: 0 }}>
                <h5 className="card-title" style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
                  Monthly Time Series Data Audit
                </h5>
              </div>

              <div className="table-responsive">
                <table className="table" style={{ color: "#fff", margin: 0, borderCollapse: "separate", borderSpacing: "0 8px" }}>
                  <thead>
                    <tr style={{ color: "#888", fontSize: "13px", borderBottom: "1px solid #333" }}>
                      <th style={{ padding: "12px", border: "none" }}>Month</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right" }}>ARPPU (M-1)</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right" }}>Months Count</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right" }}>ARPPU / Month</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right" }}>Churn Rate</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right" }}>Overall GM %</th>
                      <th style={{ padding: "12px", border: "none", textAlign: "right", color: "#60a5fa" }}>Lifetime Value (LTV)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((data, index) => {
                      const arppuPerMonth = data.monthsCount > 0 ? data.arppu / data.monthsCount : 0;
                      return (
                        <tr key={index} style={{ backgroundColor: "#141414", transition: "all 0.2s ease" }} className="table-row-hover">
                          <td style={{ padding: "14px 12px", border: "none", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px", fontWeight: "600" }}>
                            {data.month}
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right" }}>
                            {formatCurrency(data.arppu)}
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right" }}>
                            {data.monthsCount} months
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right", color: "#aaa" }}>
                            {formatCurrency(arppuPerMonth)}
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right", color: "#f87171" }}>
                            {data.churnRate}%
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right", color: "#fbbf24" }}>
                            {data.grossMarginPercentage}%
                          </td>
                          <td style={{ padding: "14px 12px", border: "none", textAlign: "right", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", color: data.ltv < 0 ? "#f87171" : "#22c55e", fontWeight: "700" }}>
                            {formatCurrency(data.ltv)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          */}

          {/* Mathematical Concept & Auditing Guide
          <div className="section-container">
            <div className="dashboard-card" style={{ padding: "25px", backgroundColor: "rgba(30, 30, 30, 0.4)", border: "1px solid #222" }}>
              <h6 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: "600", color: "#fff", marginBottom: "12px" }}>
                <FaInfoCircle style={{ color: "#3b82f6" }} /> LTV Calculation & Modeling Methodology
              </h6>
              <p style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.6", margin: 0 }}>
                This trend line plots the historical expected <strong>Lifetime Value (LTV)</strong> of paying cohorts calculated monthly. 
                For any month <em>M</em>, the metrics represent long-term projections computed using that period's completed baseline parameters.
              </p>
              
              <div style={{ 
                margin: "20px 0", 
                padding: "16px", 
                backgroundColor: "rgba(0, 0, 0, 0.4)", 
                borderRadius: "8px", 
                border: "1px solid #333",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px"
              }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#60a5fa", fontFamily: "monospace" }}>
                  LTV = ( ( ARPPU / Months ) × Gross Margin % ) / Churn Rate
                </div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  Note: Gross Margin % and Churn Rate % are divided by 100 to convert to fractions for calculations
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#aaa", marginTop: "15px" }}>
                <div><strong>• ARPPU (M-1):</strong> The Average Revenue Per Paying User in the previous completed month.</div>
                <div><strong>• Months Since First Payment:</strong> Total calendar months from the earliest dynamic baseline payment capture (October 2025) to the previous completed month M-1 inclusive.</div>
                <div><strong>• Overall Gross Margin %:</strong> Static overall operations margin fraction (statically computed as -19.12%).</div>
                <div><strong>• Churn Rate:</strong> Churn rate computed statically by comparing active paying users in Month M-2 vs Month M-1.</div>
              </div>
            </div>
          </div>
          */}
        </>
      )}

      {/* Row Hover Animations Styling */}
      <style jsx>{`
        .table-row-hover:hover {
          background-color: #1e1e1e !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
