"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "../../layout";
import axiosInstance from "@/lib/axios";
import { FaTag, FaCalendarCheck } from "react-icons/fa";

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
    kyraAI: {
      active_subscribers: 0,
      kyra_users: 0,
    },
  });

  const [priceNotifications, setPriceNotifications] = useState([]);
  const [showPriceNotificationModal, setShowPriceNotificationModal] = useState(false);
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [showBookingNotificationModal, setShowBookingNotificationModal] = useState(false);

  const getBadgeStyles = (type) => {
    switch (type) {
      case "Kyra AI":
        return {
          backgroundColor: "rgba(168, 85, 247, 0.15)", // purple
          color: "#c084fc",
        };
      case "Nutrition Plan":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)", // green
          color: "#34d399",
        };
      case "Gym Membership":
        return {
          backgroundColor: "rgba(245, 158, 11, 0.15)", // amber
          color: "#fbbf24",
        };
      case "Daily Pass":
        return {
          backgroundColor: "rgba(59, 130, 246, 0.15)", // blue
          color: "#60a5fa",
        };
      case "Fitness Class":
        return {
          backgroundColor: "rgba(6, 182, 212, 0.15)", // cyan
          color: "#22d3ee",
        };
      default:
        return {
          backgroundColor: "rgba(255, 87, 87, 0.15)",
          color: "#FF5757",
        };
    }
  };

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
    fetchPriceChangeNotifications();
    fetchBookingNotifications();
  }, []);

  const fetchPriceChangeNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard/price-change-notifications/pending");
      if (response.data.success && response.data.count > 0) {
        setPriceNotifications(response.data.notifications);
        setShowPriceNotificationModal(true);
      }
    } catch (err) {
      console.error("Error fetching price change notifications:", err);
    }
  };

  const handleAcknowledgePriceNotifications = async () => {
    try {
      await axiosInstance.post("/api/admin/dashboard/price-change-notifications/mark-viewed");
      setShowPriceNotificationModal(false);
      setPriceNotifications([]);
    } catch (err) {
      console.error("Error marking price notifications as viewed:", err);
      setShowPriceNotificationModal(false);
    }
  };

  const fetchBookingNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard/bookings-notifications/pending");
      if (response.data.success && response.data.count > 0) {
        setBookingNotifications(response.data.notifications);
        setShowBookingNotificationModal(true);
      }
    } catch (err) {
      console.error("Error fetching booking notifications:", err);
    }
  };

  const handleAcknowledgeBookingNotifications = async () => {
    try {
      await axiosInstance.post("/api/admin/dashboard/bookings-notifications/mark-viewed");
      setShowBookingNotificationModal(false);
      setBookingNotifications([]);
    } catch (err) {
      console.error("Error marking booking notifications as viewed:", err);
      setShowBookingNotificationModal(false);
    }
  };

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

      {/* Kyra AI Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Kyra</span> AI
        </h3>
        <div className="row g-4">
          {/* Active Subscriptions Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/kyra?tab=subscriptions")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Active subscriptions</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.kyraAI?.active_subscribers || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Kyra Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div
              className="dashboard-card"
              style={{ cursor: "pointer" }}
              onClick={() => (window.location.href = "/portal/admin/kyra?tab=users")}
            >
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Kyra Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {dashboardData.kyraAI?.kyra_users || 0}
                </div>
              </div>
            </div>
          </div>
        </div>        
      </div>

      {/* Price Change Notifications Modal */}
      {showPriceNotificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={handleAcknowledgePriceNotifications}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              padding: "30px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "550px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "15px",
                fontSize: "22px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaTag style={{ color: "#FF5757" }} />
              Gym Price Updates
            </h3>
            
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
              The following gyms have recently updated their prices:
            </p>

            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                marginBottom: "25px",
                paddingRight: "5px",
              }}
            >
              {priceNotifications.map((notif) => (
                <div
                  key={notif.notification_id}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "600", color: "#f9fafb", fontSize: "15px" }}>
                      {notif.gym_name}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        color: "#ef4444",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        textTransform: "capitalize",
                        fontWeight: "500",
                        alignSelf: "center",
                      }}
                    >
                      {notif.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "15px", fontSize: "13px", color: "#d1d5db" }}>
                    <div>
                      Old Price: <span style={{ textDecoration: "line-through", color: "#9ca3af" }}>₹{notif.last_price}</span>
                    </div>
                    <div>
                      New Price: <span style={{ color: "#10b981", fontWeight: "600" }}>₹{notif.latest_price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAcknowledgePriceNotifications}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#FF5757",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Notifications Modal */}
      {showBookingNotificationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={handleAcknowledgeBookingNotifications}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              padding: "30px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "600px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: "#FF5757",
                marginBottom: "15px",
                fontSize: "22px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FaCalendarCheck style={{ color: "#FF5757" }} />
              New Bookings Today
            </h3>
            
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "20px" }}>
              The following new bookings have been received today:
            </p>

            <div
              style={{
                maxHeight: "350px",
                overflowY: "auto",
                marginBottom: "25px",
                paddingRight: "5px",
              }}
            >
              {bookingNotifications.map((notif) => (
                  <div
                  key={notif.id}
                    style={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      padding: "14px 16px",
                    marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "600", color: "#f9fafb", fontSize: "15px" }}>
                        {notif.client_name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontWeight: "600",
                          alignSelf: "center",
                          ...getBadgeStyles(notif.type)
                        }}
                      >
                        {notif.type}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "6px" }}>
                      {notif.details}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                      <span style={{ color: "#10b981", fontWeight: "600", fontSize: "14px" }}>
                        ₹{notif.amount}
                      </span>
                      <span style={{ color: "#6b7280", fontSize: "12px" }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleAcknowledgeBookingNotifications}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#FF5757",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#e64c4c")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "#FF5757")}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
