"use client";
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";

const DATE_FILTERS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "last_7" },
  { label: "Last 30 Days", value: "last_30" },
  { label: "Last Month", value: "last_month" },
  { label: "Current Month", value: "current_month" },
  { label: "Overall", value: "overall" },
  { label: "Custom", value: "custom" },
];

function getDateRange(filter) {
  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  switch (filter) {
    case "today":
      return { start: fmt(today), end: fmt(today) };
    case "last_7": {
      const d = new Date(today); d.setDate(d.getDate() - 7);
      return { start: fmt(d), end: fmt(today) };
    }
    case "last_30": {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      return { start: fmt(d), end: fmt(today) };
    }
    case "last_month": {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: fmt(first), end: fmt(last) };
    }
    case "current_month": {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: fmt(first), end: fmt(today) };
    }
    default:
      return { start: null, end: null };
  }
}

function formatCurrency(val) {
  if (typeof val !== "number") return "₹0";
  return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatCount(val) {
  if (!val && val !== 0) return "—";
  return val.toLocaleString("en-IN");
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, icon, count, revenue, color, loading }) {
  return (
    <div style={{
      flex: 1,
      minWidth: "240px",
      background: "linear-gradient(135deg, #1a1a1a 0%, #212121 100%)",
      border: `1px solid ${color}33`,
      borderRadius: "16px",
      padding: "24px 26px",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${color}22`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Glow blob */}
      <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "110px", height: "110px", borderRadius: "50%", background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
          {icon}
        </div>
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>{label}</span>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Purchase Count</div>
          {loading ? (
            <div style={{ height: "30px", background: "#2a2a2a", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <div style={{ fontSize: "26px", fontWeight: "700", color: color, lineHeight: 1 }}>{formatCount(count)}</div>
          )}
        </div>

        <div style={{ width: "1px", background: "#2a2a2a" }} />

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Total Revenue</div>
          {loading ? (
            <div style={{ height: "30px", background: "#2a2a2a", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#fff", lineHeight: 1 }}>{formatCurrency(revenue)}</div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, borderRadius: "0 0 16px 16px" }} />
    </div>
  );
}

// ── Combined totals bar ───────────────────────────────────────────────────────
function TotalsBar({ data, loading }) {
  const totalCount = (data?.daily_pass?.count || 0) + (data?.session?.count || 0) + (data?.nutrition_plan?.count || 0) + (data?.gym_membership?.count || 0) + (data?.ai_credits?.count || 0) + (data?.ai_diet_coach?.count || 0);
  const totalRevenue = (data?.daily_pass?.total_revenue || 0) + (data?.session?.total_revenue || 0) + (data?.nutrition_plan?.total_revenue || 0) + (data?.gym_membership?.total_revenue || 0) + (data?.ai_credits?.total_revenue || 0) + (data?.ai_diet_coach?.total_revenue || 0);

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1a2e 0%, #1a1f1f 100%)",
      border: "1px solid #FF575733",
      borderRadius: "16px",
      padding: "20px 30px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "22px" }}>📊</div>
        <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>Combined GMV</span>
        <span style={{ fontSize: "11px", color: "#666", background: "#2a2a2a", padding: "2px 8px", borderRadius: "12px" }}>
          Daily Pass · Fitness Class · Nutrition · Gym Membership · AI Credits · AI Diet Coach
        </span>
      </div>

      <div style={{ display: "flex", gap: "40px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Total Purchases</div>
          {loading ? (
            <div style={{ height: "28px", width: "80px", background: "#2a2a2a", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#FF5757" }}>{formatCount(totalCount)}</div>
          )}
        </div>
        <div style={{ width: "1px", background: "#333" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px" }}>Total Revenue</div>
          {loading ? (
            <div style={{ height: "28px", width: "120px", background: "#2a2a2a", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
          ) : (
            <div style={{ fontSize: "26px", fontWeight: "800", color: "#4ade80" }}>{formatCurrency(totalRevenue)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Revenue share bar ─────────────────────────────────────────────────────────
function RevenueShareBar({ data, loading }) {
  const SEGMENTS_CONFIG = [
    { key: "daily_pass",     label: "Daily Pass",      color1: "#3b82f6", color2: "#2563eb" },
    { key: "session",        label: "Fitness Class",   color1: "#f59e0b", color2: "#d97706" },
    { key: "nutrition_plan", label: "Nutrition Plans", color1: "#a855f7", color2: "#9333ea" },
    { key: "gym_membership", label: "Gym Membership",  color1: "#4ade80", color2: "#22c55e" },
    { key: "ai_credits",     label: "AI Credits",      color1: "#06b6d4", color2: "#0891b2" },
    { key: "ai_diet_coach",  label: "AI Diet Coach",   color1: "#E91E63", color2: "#C2185B" },
  ];

  const total = SEGMENTS_CONFIG.reduce((s, seg) => s + (data?.[seg.key]?.total_revenue || 0), 0);

  const segments = SEGMENTS_CONFIG.map((seg, i) => ({
    ...seg,
    pct: total > 0 ? ((data?.[seg.key]?.total_revenue || 0) / total) * 100 : 25,
    isLast: i === SEGMENTS_CONFIG.length - 1,
    isFirst: i === 0,
  }));

  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "24px 28px" }}>
      <div style={{ fontSize: "14px", fontWeight: "600", color: "#aaa", marginBottom: "20px" }}>Revenue Share</div>

      {loading ? (
        <div style={{ height: "24px", background: "#2a2a2a", borderRadius: "12px", animation: "pulse 1.5s ease-in-out infinite" }} />
      ) : (
        <>
          <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", height: "24px", gap: "2px" }}>
            {segments.map((seg) => (
              <div key={seg.key} style={{
                width: `${seg.pct}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${seg.color1}, ${seg.color2})`,
                borderRadius: seg.isFirst ? "12px 0 0 12px" : seg.isLast ? "0 12px 12px 0" : "0",
                transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "700", color: "#fff",
                overflow: "hidden",
              }}>
                {seg.pct > 8 && `${seg.pct.toFixed(1)}%`}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "14px", flexWrap: "wrap" }}>
            {segments.map(seg => (
              <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: seg.color1 }} />
                <span style={{ fontSize: "12px", color: "#888" }}>{seg.label}</span>
                <span style={{ fontSize: "12px", color: "#aaa", fontWeight: "600" }}>{seg.pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GMVPage() {
  const [dateFilter, setDateFilter] = useState("overall");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchGMV = useCallback(async (filter, cStart, cEnd) => {
    try {
      setLoading(true);
      const params = {};
      if (filter === "custom") {
        if (!cStart || !cEnd) return;
        params.start_date = cStart;
        params.end_date = cEnd;
      } else if (filter !== "overall") {
        const { start, end } = getDateRange(filter);
        if (start) params.start_date = start;
        if (end) params.end_date = end;
      }
      const res = await axiosInstance.get("/api/admin/purchases/gmv-summary", { params });
      if (res.data.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("GMV fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dateFilter !== "custom") fetchGMV(dateFilter, null, null);
  }, [dateFilter, fetchGMV]);

  useEffect(() => {
    if (dateFilter === "custom" && customStart && customEnd) fetchGMV("custom", customStart, customEnd);
  }, [customStart, customEnd, dateFilter, fetchGMV]);

  const todayStr = new Date().toISOString().split("T")[0];

  const TABLE_ROWS = [
    { key: "daily_pass",     name: "Daily Pass",      icon: "🎟️", color: "#3b82f6" },
    { key: "session",        name: "Fitness Class",   icon: "🏋️", color: "#f59e0b" },
    { key: "nutrition_plan", name: "Nutrition Plans", icon: "🥗", color: "#a855f7" },
    { key: "gym_membership", name: "Gym Membership",  icon: "🏢", color: "#4ade80" },
    { key: "ai_credits",     name: "AI Credits",      icon: "🤖", color: "#06b6d4" },
    { key: "ai_diet_coach",  name: "AI Diet Coach",   icon: "🍎", color: "#E91E63" },
  ];

  return (
    <div className="dashboard-container">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .gmv-card-enter { animation: fadeInUp 0.4s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div className="section-container">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <h3 className="section-heading" style={{ margin: 0 }}>
              <span style={{ color: "#FF5757" }}>GMV</span> Overview
            </h3>
            <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>
              Gross Merchandise Value — Daily Pass, Fitness Class, Nutrition Plans, Gym Membership, AI Credits &amp; AI Diet Coach
              {lastUpdated && (
                <span style={{ marginLeft: "12px", color: "#444", fontSize: "11px" }}>
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCustomStart(""); setCustomEnd(""); }}
              style={{ padding: "10px 14px", backgroundColor: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "8px", color: "#fff", fontSize: "14px", cursor: "pointer" }}
            >
              {DATE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            <button
              onClick={() => dateFilter !== "custom" ? fetchGMV(dateFilter, null, null) : fetchGMV("custom", customStart, customEnd)}
              disabled={loading}
              style={{
                padding: "10px 16px", backgroundColor: loading ? "#333" : "#FF5757",
                border: "none", borderRadius: "8px", color: "#fff",
                fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: "6px", transition: "background 0.2s"
              }}
            >
              {loading ? "⟳" : "↻"} Refresh
            </button>
          </div>
        </div>

        {/* Custom date pickers */}
        {dateFilter === "custom" && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "5px" }}>Start Date</label>
              <input type="date" value={customStart} max={customEnd || todayStr}
                onChange={e => setCustomStart(e.target.value)}
                style={{ padding: "9px 12px", background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "8px", color: "#fff", fontSize: "14px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "#888", marginBottom: "5px" }}>End Date</label>
              <input type="date" value={customEnd} min={customStart} max={todayStr}
                onChange={e => setCustomEnd(e.target.value)}
                style={{ padding: "9px 12px", background: "#2a2a2a", border: "1px solid #3a3a3a", borderRadius: "8px", color: "#fff", fontSize: "14px" }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Combined totals ── */}
      <div className="section-container gmv-card-enter" style={{ animationDelay: "0ms" }}>
        <TotalsBar data={data} loading={loading} />
      </div>

      {/* ── Individual cards ── */}
      <div className="section-container gmv-card-enter" style={{ animationDelay: "80ms" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <StatCard label="Daily Pass"      icon="🎟️" count={data?.daily_pass?.count}      revenue={data?.daily_pass?.total_revenue}      color="#3b82f6" loading={loading} />
          <StatCard label="Fitness Class"   icon="🏋️" count={data?.session?.count}         revenue={data?.session?.total_revenue}         color="#f59e0b" loading={loading} />
          <StatCard label="Nutrition Plans" icon="🥗" count={data?.nutrition_plan?.count}  revenue={data?.nutrition_plan?.total_revenue}  color="#a855f7" loading={loading} />
          <StatCard label="Gym Membership"  icon="🏢" count={data?.gym_membership?.count}  revenue={data?.gym_membership?.total_revenue}  color="#4ade80" loading={loading} />
          <StatCard label="AI Credits"      icon="🤖" count={data?.ai_credits?.count}      revenue={data?.ai_credits?.total_revenue}      color="#06b6d4" loading={loading} />
          <StatCard label="AI Diet Coach"   icon="🍎" count={data?.ai_diet_coach?.count}   revenue={data?.ai_diet_coach?.total_revenue}   color="#E91E63" loading={loading} />
        </div>
      </div>

      {/* ── Revenue share ── */}
      {!loading && data && (
        <div className="section-container gmv-card-enter" style={{ animationDelay: "160ms" }}>
          <RevenueShareBar data={data} loading={loading} />
        </div>
      )}

      {/* ── Detailed table ── */}
      <div className="section-container gmv-card-enter" style={{ animationDelay: "200ms" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#aaa", marginBottom: "16px" }}>Detailed Breakdown</div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["Category", "Purchase Count", "Total Revenue", "Avg. Revenue / Purchase"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.8px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map((row, i) => {
                const count = data?.[row.key]?.count ?? 0;
                const revenue = data?.[row.key]?.total_revenue ?? 0;
                const avg = count > 0 ? revenue / count : 0;
                return (
                  <tr key={row.key} style={{ borderBottom: "1px solid #1f1f1f", background: i % 2 === 0 ? "transparent" : "#1a1a1a22" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `${row.color}22`, border: `1px solid ${row.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                          {row.icon}
                        </div>
                        <span style={{ fontWeight: "600", color: "#fff" }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {loading ? <div style={{ height: "18px", width: "60px", background: "#2a2a2a", borderRadius: "4px", animation: "pulse 1.5s infinite" }} /> : (
                        <span style={{ fontSize: "16px", fontWeight: "700", color: row.color }}>{formatCount(count)}</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {loading ? <div style={{ height: "18px", width: "90px", background: "#2a2a2a", borderRadius: "4px", animation: "pulse 1.5s infinite" }} /> : (
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>{formatCurrency(revenue)}</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {loading ? <div style={{ height: "18px", width: "70px", background: "#2a2a2a", borderRadius: "4px", animation: "pulse 1.5s infinite" }} /> : (
                        <span style={{ fontSize: "14px", color: "#888" }}>{formatCurrency(avg)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Totals row */}
              {!loading && data && (() => {
                const totalCount = TABLE_ROWS.reduce((s, r) => s + (data?.[r.key]?.count || 0), 0);
                const totalRev = TABLE_ROWS.reduce((s, r) => s + (data?.[r.key]?.total_revenue || 0), 0);
                const totalAvg = totalCount > 0 ? totalRev / totalCount : 0;
                return (
                  <tr style={{ borderTop: "2px solid #3a3a3a", background: "#1e1e1e" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: "700", color: "#FF5757", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: "#FF5757" }}>{formatCount(totalCount)}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "800", color: "#4ade80" }}>{formatCurrency(totalRev)}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "14px", color: "#888" }}>{formatCurrency(totalAvg)}</span>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
