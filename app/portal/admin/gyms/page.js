"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function GymsPage() {
  const [loading, setLoading] = useState(true);
  const [totalGyms, setTotalGyms] = useState(0);
  const [activeGyms, setActiveGyms] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [citiesData, setCitiesData] = useState([]);
  const [statesData, setStatesData] = useState([]);
  const [viewMode, setViewMode] = useState("city"); // "city" or "state"
  const [hoveredBar, setHoveredBar] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Fetch all gyms data in a single API call
  const fetchGymsData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/admin/gyms/data", {
        params: { limit: 100 }
      });

      if (response.data.success) {
        setTotalGyms(response.data.data.total_gyms);
        setActiveGyms(response.data.data.active_gyms);
        setTotalRevenue(response.data.data.total_revenue || 0);
        setCitiesData(response.data.data.cities);
        setStatesData(response.data.data.states || []);
      }
    } catch (err) {
      console.error("Error fetching gyms data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGymsData();
  }, []);

  // Calculate active gym ratio - 2 decimal places
  const activeRatio = totalGyms > 0 ? ((activeGyms / totalGyms) * 100).toFixed(2) : "0.00";

  // Calculate average revenue per active gym
  const avgRevenuePerActiveGym = activeGyms > 0 ? (totalRevenue / activeGyms).toFixed(0) : "0";

  // Get current data based on view mode
  const currentData = viewMode === "city" ? citiesData : statesData;
  const currentLabel = viewMode === "city" ? "city" : "state";

  // Calculate max count for bar chart scaling
  const maxCount = currentData.length > 0 ? Math.max(...currentData.map(c => c.count)) : 0;

  return (
    <div className="dashboard-container">
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
            {/* Total Gyms Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Total Gyms</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#FF5757" }}>
                    {totalGyms.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Registered gyms count
                  </div>
                </div>
              </div>
            </div>

            {/* Active Gyms Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Active Gyms</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                    {activeGyms.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Gyms with orders
                  </div>
                </div>
              </div>
            </div>

            {/* Active Gym Ratio Card */}
            <div className="col-xl-3 col-lg-6">
              <div className="dashboard-card">
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Active Gym Ratio</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#3b82f6" }}>
                    {activeRatio}%
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Active gyms percentage
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue per Gym Card - Clickable */}
            <div
              className="col-xl-3 col-lg-6"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gyms/revenue")}
            >
              <div
                className="dashboard-card"
                style={{
                  transition: "transform 0.2s, box-shadow 0.2s",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(255, 87, 87, 0.2)";
                  e.currentTarget.style.borderColor = "#FF5757";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">Revenue per Gym</h6>
                </div>
                <div className="card-body-custom">
                  <div className="metric-number" style={{ fontSize: "32px", fontWeight: "700", color: "#22c55e" }}>
                    ₹{parseInt(avgRevenuePerActiveGym).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                    Average revenue of active gym
                  </div>
                  <div style={{ fontSize: "11px", color: "#FF5757", marginTop: "6px", fontWeight: "500" }}>
                    Click to view details →
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gyms per City/State Bar Chart */}
          <div className="row g-4" style={{ marginTop: "25px" }}>
            <div className="col-12">
              <div className="dashboard-card">
                <div className="card-header-custom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h6 className="card-title">Gyms per {viewMode === "city" ? "City" : "State"}</h6>
                    <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                      {citiesData.length} cities • {statesData.length} states
                    </div>
                  </div>
                  {/* Toggle Buttons */}
                  <div style={{ display: "flex", gap: "8px", backgroundColor: "#1f2937", borderRadius: "6px", padding: "4px" }}>
                    <button
                      onClick={() => setViewMode("city")}
                      style={{
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: viewMode === "city" ? "#FF5757" : "transparent",
                        color: viewMode === "city" ? "#fff" : "#ccc",
                        transition: "all 0.2s"
                      }}
                    >
                      City
                    </button>
                    <button
                      onClick={() => setViewMode("state")}
                      style={{
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontWeight: "500",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        backgroundColor: viewMode === "state" ? "#FF5757" : "transparent",
                        color: viewMode === "state" ? "#fff" : "#ccc",
                        transition: "all 0.2s"
                      }}
                    >
                      State
                    </button>
                  </div>
                </div>
                <div className="card-body-custom">
                  {currentData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      No data available
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "1rem", height: "250px", paddingTop: "2rem", minWidth: "max-content" }}>
                        {currentData.map((item, index) => {
                          const barHeight = maxCount > 0 ? (item.count / maxCount) * 180 : 0;
                          const label = viewMode === "city" ? item.city : item.state;

                          return (
                            <div
                              key={index}
                              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "70px", flexShrink: 0 }}
                            >
                              <div style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#fff",
                                marginBottom: "6px",
                                height: "16px"
                              }}>
                                {item.count.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: `${barHeight}px`,
                                  backgroundColor: "#FF5757",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s ease, backgroundColor 0.2s ease",
                                  minHeight: "4px",
                                  cursor: "pointer"
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.backgroundColor = "#ff6b6b";
                                  setHoveredBar({ label, count: item.count });
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.backgroundColor = "#FF5757";
                                  setHoveredBar(null);
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "#888",
                                  marginTop: "8px",
                                  textAlign: "center",
                                  wordBreak: "break-word",
                                  textTransform: "capitalize",
                                  height: "32px",
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}
                                onMouseEnter={(e) => {
                                  setHoveredBar({ label, count: item.count });
                                  setTooltipPos({
                                    x: e.clientX,
                                    y: e.clientY
                                  });
                                }}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Tooltip - Outside overflow container */}
          {hoveredBar && (
            <div
              style={{
                position: "fixed",
                left: `${tooltipPos.x + 15}px`,
                top: `${tooltipPos.y - 50}px`,
                backgroundColor: "#1e1e1e",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                whiteSpace: "nowrap",
                zIndex: 10000,
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                border: "1px solid #FF5757",
                pointerEvents: "none"
              }}
            >
              <div style={{ marginBottom: "3px", color: "#FF5757", fontWeight: "700", fontSize: "14px" }}>
                {hoveredBar.label}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>
                {hoveredBar.count.toLocaleString()} gyms
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
