"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

export default function MRR() {
  const [loading, setLoading] = useState(true);
  const [mrrData, setMrrData] = useState({
    currentMonthRevenue: 0,
    previousMonthRevenue: 0,
    arr: 0,
    breakdown: {
      current_month: {
        fittbot_subscription: 0,
        ai_credits: 0,
        ai_diet_coach: 0,
        gym_membership: 0,
        daily_pass: 0,
        sessions: 0,
      },
    },
  });
  const [error, setError] = useState(null);

  // Pie chart interaction states
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Format currency - show exactly 2 decimal places
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const fetchMRRData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/mrr/data");

      if (response.data.success) {
        setMrrData({
          currentMonthRevenue: response.data.data.currentMonthRevenue,
          previousMonthRevenue: response.data.data.previousMonthRevenue,
          arr: response.data.data.arr,
          breakdown: response.data.data.breakdown || {
            current_month: {
              fittbot_subscription: 0,
              ai_credits: 0,
              ai_diet_coach: 0,
              gym_membership: 0,
              daily_pass: 0,
              sessions: 0,
            },
          },
        });
      } else {
        throw new Error(response.data.message || "Failed to load MRR data");
      }
    } catch (err) {
      console.error("Error fetching MRR data:", err);
      setError("Failed to load MRR data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMRRData();
  }, []);

  return (
    <div className="dashboard-container">
      {error && (
        <div
          style={{
            backgroundColor: "#ef4444",
            color: "white",
            padding: "12px 20px",
            borderRadius: "6px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <div style={{ color: "#888" }}>Loading...</div>
        </div>
      ) : (
        <div className="section-container">
          <div className="row g-4">
            {/* Current Month Revenue Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">MRR</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {formatCurrency(mrrData.currentMonthRevenue)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Revenue for this month
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Month Revenue Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Previous Month Revenue</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700" }}>
                    {formatCurrency(mrrData.previousMonthRevenue)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Revenue for last month
                  </div>
                </div>
              </div>
            </div>

            {/* ARR Card */}
            <div className="col-xl-4 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">ARR</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#FF5757" }}>
                    {formatCurrency(mrrData.arr)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Annual Recurring Revenue
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown - Current Month */}
          {mrrData.breakdown?.current_month && (() => {
            const breakdown = mrrData.breakdown.current_month;
            const total = mrrData.currentMonthRevenue;

            if (total === 0) return null;

            // Calculate percentages
            const fittbotPercent = ((breakdown.fittbot_subscription || 0) / total) * 100;
            const aiCreditsPercent = ((breakdown.ai_credits || 0) / total) * 100;
            const aiDietCoachPercent = ((breakdown.ai_diet_coach || 0) / total) * 100;
            const gymPercent = ((breakdown.gym_membership || 0) / total) * 100;
            const dailyPassPercent = ((breakdown.daily_pass || 0) / total) * 100;
            const sessionsPercent = ((breakdown.sessions || 0) / total) * 100;

            // Create segments for pie chart (only non-zero values)
            const segments = [
              {
                id: 'fittbot',
                name: 'Nutrition Plan',
                value: breakdown.fittbot_subscription || 0,
                percent: fittbotPercent,
                color: '#FF5757',
                startAngle: 0,
                endAngle: fittbotPercent * 3.6
              },
              {
                id: 'aiCredits',
                name: 'AI Credits',
                value: breakdown.ai_credits || 0,
                percent: aiCreditsPercent,
                color: '#a855f7',
                startAngle: fittbotPercent * 3.6,
                endAngle: (fittbotPercent + aiCreditsPercent) * 3.6
              },
              {
                id: 'aiDietCoach',
                name: 'AI Diet Coach',
                value: breakdown.ai_diet_coach || 0,
                percent: aiDietCoachPercent,
                color: '#ec4899',
                startAngle: (fittbotPercent + aiCreditsPercent) * 3.6,
                endAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent) * 3.6
              },
              {
                id: 'gym',
                name: 'Gym Membership',
                value: breakdown.gym_membership || 0,
                percent: gymPercent,
                color: '#4ade80',
                startAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent) * 3.6,
                endAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent + gymPercent) * 3.6
              },
              {
                id: 'dailyPass',
                name: 'Daily Pass',
                value: breakdown.daily_pass || 0,
                percent: dailyPassPercent,
                color: '#60a5fa',
                startAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent + gymPercent) * 3.6,
                endAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent + gymPercent + dailyPassPercent) * 3.6
              },
              {
                id: 'sessions',
                name: 'Fitness classes',
                value: breakdown.sessions || 0,
                percent: sessionsPercent,
                color: '#fbbf24',
                startAngle: (fittbotPercent + aiCreditsPercent + aiDietCoachPercent + gymPercent + dailyPassPercent) * 3.6,
                endAngle: 360
              }
            ];

            // Filter segments for pie chart (only show non-zero in chart)
            const pieSegments = segments.filter(s => s.value > 0);

            // Convert polar to cartesian coordinates
            const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
              const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
              return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians))
              };
            };

            // Create SVG arc path
            const createArcPath = (startAngle, endAngle, innerRadius, outerRadius, isHovered) => {
              const radius = isHovered ? outerRadius + 5 : outerRadius;
              const start = polarToCartesian(100, 100, radius, endAngle);
              const end = polarToCartesian(100, 100, radius, startAngle);
              const startInner = polarToCartesian(100, 100, innerRadius, endAngle);
              const endInner = polarToCartesian(100, 100, innerRadius, startAngle);

              const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

              return [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                "L", endInner.x, endInner.y,
                "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
                "Z"
              ].join(" ");
            };

            return (
              <div className="col-12" style={{ marginTop: "25px" }}>
                <div className="dashboard-card">
                  <div className="card-header-custom">
                    <h6 className="card-title" style={{ textAlign: "center", fontSize: "14px" }}>Current Month Revenue Breakdown</h6>
                  </div>
                  <div className="card-body-custom" style={{ padding: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "50px", flexWrap: "wrap" }}>
                      {/* Animated SVG Pie Chart */}
                      <div style={{ position: "relative", width: "220px", height: "220px" }}>
                        <svg
                          width="220"
                          height="220"
                          viewBox="0 0 200 200"
                          style={{
                            filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))",
                            transform: "rotate(-90deg)"
                          }}
                        >
                          {pieSegments.map((segment, index) => {
                            const isHovered = hoveredSegment === segment.id;
                            const shouldDim = hoveredSegment && hoveredSegment !== segment.id;

                            return (
                              <g key={segment.id}>
                                {/* Main arc with gradient effect */}
                                <defs>
                                  <linearGradient id={`gradient-${segment.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: segment.color, stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: segment.color, stopOpacity: 0.8 }} />
                                  </linearGradient>
                                  <filter id={`glow-${segment.id}`}>
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                    <feMerge>
                                      <feMergeNode in="coloredBlur"/>
                                      <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                  </filter>
                                </defs>

                                <path
                                  d={createArcPath(segment.startAngle, segment.endAngle, 50, 90, isHovered)}
                                  fill={`url(#gradient-${segment.id})`}
                                  stroke={shouldDim ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
                                  strokeWidth="2"
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    opacity: shouldDim ? 0.4 : 1,
                                    filter: isHovered ? `url(#glow-${segment.id})` : "none"
                                  }}
                                  onMouseEnter={() => setHoveredSegment(segment.id)}
                                  onMouseLeave={() => setHoveredSegment(null)}
                                />

                                {/* Animated entry effect */}
                                <animate
                                  attributeName="opacity"
                                  from="0"
                                  to={shouldDim ? "0.4" : "1"}
                                  dur="0.5s"
                                  begin={`${index * 0.1}s`}
                                  fill="freeze"
                                />
                              </g>
                            );
                          })}

                          {/* Center circle with gradient */}
                          <circle
                            cx="100"
                            cy="100"
                            r="45"
                            fill="url(#centerGradient)"
                            style={{
                              filter: "drop-shadow(0 0 20px rgba(0, 0, 0, 0.5)) inset"
                            }}
                          />

                          {/* Center gradient definition */}
                          <defs>
                            <radialGradient id="centerGradient">
                              <stop offset="0%" style={{ stopColor: "#2a2a2a" }} />
                              <stop offset="100%" style={{ stopColor: "#1a1a1a" }} />
                            </radialGradient>
                          </defs>
                        </svg>

                        {/* Center content */}
                        <div style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                          pointerEvents: "none"
                        }}>
                          <div style={{
                            fontSize: "10px",
                            color: "#888",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: "4px"
                          }}>
                            Total
                          </div>
                          <div style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            color: "#fff",
                            textShadow: "0 2px 10px rgba(0, 0, 0, 0.5)"
                          }}>
                            {formatCurrency(total)}
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Legend with animations - 2 columns */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", minWidth: "320px" }}>
                        {segments.map((segment) => {
                          const isHovered = hoveredSegment === segment.id;
                          const shouldDim = hoveredSegment && hoveredSegment !== segment.id;

                          return (
                            <div
                              key={segment.id}
                              onMouseEnter={() => setHoveredSegment(segment.id)}
                              onMouseLeave={() => setHoveredSegment(null)}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                padding: "10px 12px",
                                backgroundColor: isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
                                borderRadius: "8px",
                                border: `1px solid ${isHovered ? segment.color : "rgba(255, 255, 255, 0.1)"}`,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                opacity: shouldDim ? 0.4 : 1,
                                transform: isHovered ? "translateY(-3px)" : "translateY(0)"
                              }}
                            >
                              {/* Header with color indicator and name */}
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "2px",
                                    background: `linear-gradient(135deg, ${segment.color} 0%, ${segment.color}dd 100%)`,
                                    boxShadow: isHovered ? `0 0 10px ${segment.color}80` : "none",
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                  }}
                                />
                                <div style={{
                                  fontSize: "11px",
                                  color: isHovered ? "#fff" : "#ccc",
                                  fontWeight: isHovered ? "600" : "500",
                                  transition: "all 0.3s ease",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}>
                                  {segment.name}
                                </div>
                              </div>

                              {/* Value and percent */}
                              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginLeft: "18px" }}>
                                <div style={{
                                  fontSize: "14px",
                                  fontWeight: "700",
                                  color: "#fff",
                                  textShadow: isHovered ? `0 0 10px ${segment.color}40` : "none"
                                }}>
                                  {formatCurrency(segment.value)}
                                </div>
                                <div style={{
                                  fontSize: "10px",
                                  color: "#888"
                                }}>
                                  {segment.percent.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
