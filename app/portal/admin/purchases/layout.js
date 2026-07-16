"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRole } from "../../layout";
import BookingAverages from "./components/BookingAverages";

export default function PurchasesLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useRole();

  const defaultTab = "all";
  const [activeTab, setActiveTab] = useState(defaultTab);


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
    } else {
      setActiveTab(defaultTab);
    }
  }, [pathname, defaultTab]);

  // Define tabs - include purchase-count only for non-support roles
  const tabs = [
    { id: "all", name: "Fitness Classes/Daily Pass", path: "/portal/admin/purchases/all" },
    { id: "nutritionist-plans", name: "Nutrition Plans", path: "/portal/admin/purchases/nutritionist-plans" },
    { id: "gym-memberships", name: "Gym Memberships", path: "/portal/admin/purchases/gym-memberships" },
    { id: "ai-credits", name: "AI Credits", path: "/portal/admin/purchases/ai-credits" },
    { id: "ai-diet-coach", name: "AI Diet Coach", path: "/portal/admin/purchases/ai-diet-coach" },
    { id: "today", name: "Today's Schedule", path: "/portal/admin/purchases/today" },
    { id: "client-purchase-count", name: "Purchase Count", path: "/portal/admin/purchases/client-purchase-count" },
    ...(role !== "support" ? [{ id: "purchase-count", name: "Purchase Analysis", path: "/portal/admin/purchases/purchase-count" }] : []),
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
    </div>
  );
}
