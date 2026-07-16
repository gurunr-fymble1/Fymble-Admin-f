"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../../layout";
import axiosInstance from "@/lib/axios";
import { FaTag } from "react-icons/fa";

export default function Home() {
  const router = useRouter();
  const { role } = useRole();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    gymPlans: {
      sessionPlans: 0,
      membershipPlans: 0,
      dailyPass: 0,
    },
    gymPhotos: {
      studio: 0,
      onboard: 0,
      noUploads: 0,
    },
    support: {
      totalTickets: { gym: 0, client: 0 },
      unresolvedTickets: { gym: 0, client: 0 },
      resolvedToday: 0,
    },
    business: {
      gymOwners: { today: 0, week: 0, month: 0, overall: 0 },
      gyms: { today: 0, week: 0, month: 0, overall: 0 },
      dailyPassGyms: 0,
      verifiedGyms: { verified: 0, total: 0 },
      unverifiedGyms: 0,
      unverifiedSplitup: { red: 0, hold: 0 },
    },
  });

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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const response = await axiosInstance.get("/api/admin/dashboard/overview");

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch dashboard data"
        );
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
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
                Loading dashboard data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Gym Plans Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Gym</span> Plans
        </h3>
        <div className="row g-4">
          {/* Session Plans Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=session")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Session Plans</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPlans.sessionPlans}
                </div>
              </div>
            </div>
          </div>

          {/* Membership Plans Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=membership")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Membership Plans</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPlans.membershipPlans}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Pass Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/gymplans?type=dailyPass")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Daily Pass</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPlans.dailyPass}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fymble Business Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Business
        </h3>
        <div className="row g-4">
          {/* Verified Gyms Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/verified-gyms")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Verified Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.business.verifiedGyms?.verified || 0} / {dashboardData.business.verifiedGyms?.total || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Unverified Gyms Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/unverified-gyms")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Unverified Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.business.unverifiedGyms || 0} / {dashboardData.business.verifiedGyms?.total || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Unverified Splitup Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/unverified-splitup")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Unverified Splitup</h6>
              </div>
              <div className="card-body-custom">
                <div style={{ display: "flex", gap: "20px" }}>
                  {/* Red Section */}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
                      <FaTag size={24} style={{ color: "#ef4444" }} />
                    </div>
                    <div className="metric-number" style={{ fontSize: "24px" }}>
                      {dashboardData.business.unverifiedSplitup?.red || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      Red
                    </div>
                  </div>

                  {/* Hold Section */}
                  <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid #333" }}>
                    <div style={{ marginBottom: "8px", display: "flex", justifyContent: "center" }}>
                      <FaTag size={24} style={{ color: "#eab308" }} />
                    </div>
                    <div className="metric-number" style={{ fontSize: "24px" }}>
                      {dashboardData.business.unverifiedSplitup?.hold || 0}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      Hold
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gym Photos Details Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Gym</span> Photos Details
        </h3>
        <div className="row g-4">
          {/* Studio Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=studio")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Verified Studio</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.studio || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Onboard Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=onboard")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Pending Photo verification</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.onboard || 0}
                </div>
              </div>
            </div>
          </div>

          {/* No Uploads Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/admin/gymphotos?type=noUploads")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Photos Not Uploaded</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.gymPhotos.noUploads || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Tickets Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Support</span> Tickets
        </h3>
        <div className="row g-4">
          {/* Gym Support Tickets Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/support/tickets?type=gym")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Gym</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.support.totalTickets.gym}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  Total support tickets
                </div>
              </div>
            </div>
          </div>

          {/* Client Support Tickets Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/portal/support/tickets?type=client")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Client</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.support.totalTickets.client}
                </div>
                <div style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
                  Total support tickets
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
