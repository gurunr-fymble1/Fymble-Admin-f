"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/lib/axios";

export default function Marketing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marketingStats, setMarketingStats] = useState({
    bdes: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    bdms: {
      total: 0,
      active: 0,
      inactive: 0,
    },
  });

  // Gym Visits Summary
  const [gymVisitsLoading, setGymVisitsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState("today");
  const [managerFilter, setManagerFilter] = useState("all");
  const [managers, setManagers] = useState([]);
  const [gymVisitsStats, setGymVisitsStats] = useState({
    assigned: 0,
    visited: 0,
    converted: 0,
  });

  // Attendance Stats
  const [attendanceStats, setAttendanceStats] = useState({
    bdes: 0,
    bdms: 0,
  });

  // Add spinner animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetchMarketingStats();
    fetchManagers();
    fetchAttendanceStats();
  }, []);

  useEffect(() => {
    fetchGymVisitsStats();
  }, [timeFilter, managerFilter]);

  const fetchMarketingStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/admin/marketing/stats");

      if (response.data.status === 200) {
        setMarketingStats(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch marketing stats"
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to load marketing statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/marketing/bdms", {
        params: { time_filter: "all" },
      });

      if (response.data.status === 200) {
        setManagers(response.data.data);
      }
    } catch (err) {
    }
  };

  const fetchGymVisitsStats = async () => {
    try {
      setGymVisitsLoading(true);
      const response = await axiosInstance.get(
        "/api/admin/marketing/gym-visits/summary",
        {
          params: {
            time_filter: timeFilter,
            manager_id: managerFilter === "all" ? undefined : managerFilter,
          },
        }
      );

      if (response.data.status === 200) {
        setGymVisitsStats(response.data.data);
      }
    } catch (err) {
    } finally {
      setGymVisitsLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/admin/marketing/attendance/stats"
      );

      if (response.data.status === 200) {
        setAttendanceStats(response.data.data);
      }
    } catch (err) {
    }
  };

  const handleBDEClick = () => {
    router.push("/portal/admin/marketing/bdes");
  };

  const handleBDMClick = () => {
    router.push("/portal/admin/marketing/bdms");
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="section-container">
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
              <p style={{ fontSize: "14px", color: "#ccc" }}>
                Loading marketing statistics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="section-container">
          <div
            style={{ textAlign: "center", padding: "40px", color: "#ff5757" }}
          >
            Error: {error}
            <br />
            <button
              onClick={fetchMarketingStats}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                background: "#FF5757",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ position: "relative" }}>
      {/* Full Page Loading Overlay for Gym Visits */}
      {gymVisitsLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(26, 26, 26, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
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
            <p style={{ fontSize: "14px", color: "#ccc" }}>
              Loading gym visits stats...
            </p>
          </div>
        </div>
      )}

      {/* Team Count Section */}
      <div className="section-container">
        <h5 className="section-heading">
          <span style={{ color: "#FF5757" }}>Team</span> Count
        </h5>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* BDEs Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={handleBDEClick}
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">BDEs</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{marketingStats.bdes.total}</div>
              </div>
            </div>
          </div>

          {/* BDMs Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={handleBDMClick}
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">BDMs</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{marketingStats.bdms.total}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Section */}
      <div className="section-container">
        <h5 className="section-heading">
          <span style={{ color: "#FF5757" }}>Today&rsquo;s</span> Attendance
        </h5>
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* BDEs Attendance Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/portal/admin/marketing/attendance?role=BDE")
              }
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">BDEs</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{attendanceStats.bdes}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "0.5rem",
                  }}
                >
                  BDEs with atleast one punch in records
                </div>
              </div>
            </div>
          </div>

          {/* BDMs Attendance Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/portal/admin/marketing/attendance?role=BDM")
              }
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">BDMs</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{attendanceStats.bdms}</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    marginTop: "0.5rem",
                  }}
                >
                  BDMs with atleast one punch in records
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Visits Summary Section */}
      <div className="section-container">
        {/* Header with Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h5 className="section-heading" style={{ margin: 0 }}>
            <span style={{ color: "#FF5757" }}>Gym</span> Visits
          </h5>

          {/* Filters */}
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            {/* Time Filter */}
            <select
              className="filter-select"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{ minWidth: "120px" }}
            >
              <option value="today">Today</option>
              <option value="all">All Time</option>
            </select>

            {/* Manager Filter */}
            <select
              className="filter-select"
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              style={{ minWidth: "200px" }}
            >
              <option value="all">All Managers</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gym Visits Stats Cards */}
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            opacity: gymVisitsLoading ? 0.5 : 1,
            transition: "opacity 0.3s",
          }}
        >
          {/* Assigned Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={() =>
                router.push(
                  `/portal/admin/marketing/gym-visits?type=assigned&time=${timeFilter}&manager=${managerFilter}`
                )
              }
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">Assigned</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{gymVisitsStats.assigned}</div>
              </div>
            </div>
          </div>

          {/* Visited Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={() =>
                router.push(
                  `/portal/admin/marketing/gym-visits?type=visited&time=${timeFilter}&manager=${managerFilter}`
                )
              }
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">Visited</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{gymVisitsStats.visited}</div>
              </div>
            </div>
          </div>

          {/* Converted Card */}
          <div style={{ flex: "0 0 auto", width: "250px" }}>
            <div
              className="dashboard-card"
              onClick={() =>
                router.push(
                  `/portal/admin/marketing/gym-visits?type=converted&time=${timeFilter}&manager=${managerFilter}`
                )
              }
              style={{ cursor: "pointer" }}
            >
              <div
                className="card-header-custom extra-space"
                style={{ justifyContent: "center" }}
              >
                <h6 className="card-title">Converted</h6>
              </div>
              <div className="card-body-custom" style={{ textAlign: "center" }}>
                <div className="metric-number">{gymVisitsStats.converted}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
