"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "../../layout";
import BookingAverages from "./components/BookingAverages";
import axiosInstance from "@/lib/axios";
import { FaTag, FaCalendarCheck } from "react-icons/fa";
import { formatGymName } from "@/lib/utils";

export default function PurchasesLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useRole();

  const defaultTab = "all";
  const [activeTab, setActiveTab] = useState(defaultTab);

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
      case "Weekly Pass":
        return {
          backgroundColor: "rgba(16, 185, 129, 0.15)", // green
          color: "#34d399",
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
    if (role === "admin" || role === "support") {
      fetchPriceChangeNotifications();
      fetchBookingNotifications();
    }
  }, [pathname, role]);

  const fetchPriceChangeNotifications = async () => {
    try {
      const response = await axiosInstance.get("/api/admin/dashboard/price-change-notifications/pending");
      if (response.data?.notifications?.length > 0) {
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
      if (response.data?.notifications?.length > 0) {
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


  useEffect(() => {
    if (pathname.includes("/client-purchase-count")) {
      setActiveTab("client-purchase-count");
    } else if (pathname.includes("/purchase-count")) {
      setActiveTab("purchase-count");
    } else if (pathname.includes("/all")) {
      setActiveTab("all");
    } else if (pathname.includes("/today")) {
      setActiveTab("today");
    } else if (pathname.includes("/gym-memberships")) {
      setActiveTab("gym-memberships");
    } else if (pathname.includes("/nutritionist-plans")) {
      setActiveTab("nutritionist-plans");
    } else if (pathname.includes("/ai-credits")) {
      setActiveTab("ai-credits");
    } else if (pathname.includes("/ai-diet-coach")) {
      setActiveTab("ai-diet-coach");
    } else if (pathname.includes("/kyra")) {
      setActiveTab("ai-plans");
    } else {
      setActiveTab(defaultTab);
    }
  }, [pathname, defaultTab]);

  // Define tabs - include purchase-count only for non-support roles
  const tabs = [
    { id: "all", name: "Daily Pass & Classes", path: "/portal/admin/purchases/all" },
    { id: "ai-plans", name: "Kyra AI", path: "/portal/admin/purchases/kyra" },
    // { id: "nutritionist-plans", name: "Nutrition Plans", path: "/portal/admin/purchases/nutritionist-plans" },
    { id: "gym-memberships", name: "Gym Memberships", path: "/portal/admin/purchases/gym-memberships" },
    // { id: "ai-credits", name: "AI Credits", path: "/portal/admin/purchases/ai-credits" },
    // { id: "ai-diet-coach", name: "AI Diet Coach", path: "/portal/admin/purchases/ai-diet-coach" },
    { id: "today", name: "Today's Schedule", path: "/portal/admin/purchases/today" },
    { id: "client-purchase-count", name: "Purchase Count", path: "/portal/admin/purchases/client-purchase-count" },
    { id: "purchase-count", name: "Purchase Analysis", path: "/portal/admin/purchases/purchase-count" },
  ];

  const handleTabClick = (tab) => {
    setActiveTab(tab.id);
    router.push(tab.path);
  };

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Booking Averages Section */}
        <BookingAverages />

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "nowrap",
            overflowX: "auto",
            borderBottom: "2px solid #333",
            marginBottom: "2rem",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              style={{
                padding: "12px 24px",
                background: "transparent",
                border: "none",
                color: activeTab === tab.id ? "#FF5757" : "#888",
                fontSize: "16px",
                fontWeight: activeTab === tab.id ? "600" : "400",
                cursor: "pointer",
                whiteSpace: "nowrap",
                borderBottom: activeTab === tab.id ? "2px solid #FF5757" : "2px solid transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = "#aaa";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.color = "#888";
                }
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area - Child routes will be rendered here */}
        {children}
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
                      {formatGymName(notif.gym_name)}
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
                Got It
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
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
