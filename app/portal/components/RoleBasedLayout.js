"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineMenu,
  HiOutlineUserAdd,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiCurrencyRupee,
  HiOutlineSpeakerphone,
  HiOutlinePhone,
  HiOutlineCreditCard,
  HiOutlineReceiptTax,
  HiOutlineShieldCheck,
  HiOutlineCollection
} from "react-icons/hi";
import { MdWorkOutline, MdOutlineTabletMac, MdRestaurantMenu } from "react-icons/md";

// Custom Gyms Icon component
import { useRole } from "../layout"; // Import the useRole hook
import axiosInstance from "@/lib/axios";

// Custom User Conversion Icon component
function UserConversionIcon({ size = 20 }) {
  return (
    <img
      src="/user_conversion.svg"
      alt="User Conversion"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

// Custom Business Icon component
function BusinessIcon({ size = 20 }) {
  return (
    <img
      src="/business.svg"
      alt="Business"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}
function BookingsIcon({ size = 20 }) {
  return (
    <img
      src="/bookings.svg"
      alt="Bookings"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function FinanceIcon({ size = 20 }) {
  return (
    <img
      src="/finance.svg"
      alt="Finance"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );

}

function ExpensesIcon({ size = 24 }) {
  return (
    <img
      src="/expenses.svg"
      alt="Expenses"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}
function GymsIcon({ size = 20 }) {
  return (
    <img
      src="/gyms.svg"
      alt="Gyms"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function UnitEconomicsIcon({ size = 20 }) {
  return (
    <img
      src="/unit_economics.svg"
      alt="Unit Economics"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );

}
function UserStatsIcon({ size = 20 }) {
  return (
    <img
      src="/user_stats.svg"
      alt="User Stats"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );

}
function CashFlowIcon({ size = 20 }) {
  return (
    <img
      src="/cash_flow.svg"
      alt="Cash Flow"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function SummaryIcon({ size = 20 }) {
  return (
    <img
      src="/summary.svg"
      alt="Summary"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function FymbleUsersIcon({ size = 20 }) {
  return (
    <img
      src="/fymble_users.svg"
      alt="Fymble Users"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function TechSupportIcon({ size = 20 }) {
  return (
    <img
      src="/tech_support.svg"
      alt="Tech Support"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function TaxComplianceIcon({ size = 20 }) {
  return (
    <img
      src="/tax_compliance.svg"
      alt="Tax & Compliance"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function MRRIcon({ size = 20 }) {
  return (
    <img
      src="/mrr.svg"
      alt="MRR"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function StrategicInsightsIcon({ size = 20 }) {
  return (
    <img
      src="/strategic_insights.svg"
      alt="Strategic Insights"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function SupportTicketsIcon({ size = 20 }) {
  return (
    <img
      src="/support_tickets.svg"
      alt="Support Tickets"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}

function UserTrackingIcon({ size = 20 }) {
  return (
    <img
      src="/user_tracking.svg"
      alt="User Tracking"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
    />
  );
}



export default function RoleBasedLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [strategicInsightsOpen, setStrategicInsightsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef(null);
  const { role, user } = useRole(); // Get role and user from context
  const themeColor = role === "nutritionist" ? "#10b981" : "#FF5757";

  // Strategic Insights sub-items
  const strategicInsightsItems = [
    { name: "Financials Dashboard", icon: FinanceIcon, path: "/portal/admin/financials" },
    { name: "Users Stats", icon: UserStatsIcon, path: "/portal/admin/users-stats" },
    { name: "Gyms", icon: GymsIcon, path: "/portal/admin/gyms" },
    { name: "Unit Economics", icon: UnitEconomicsIcon, path: "/portal/admin/unit-economics" },
    { name: "Expenses", icon: ExpensesIcon, path: "/portal/admin/expenses" },
    { name: "Cash Flow", icon: CashFlowIcon, path: "/portal/admin/cash-flow" },
    { name: "Tax & Compliance", icon: TaxComplianceIcon, path: "/portal/admin/tax-compliance" },
    { name: "MRR", icon: MRRIcon, path: "/portal/admin/mrr" },
    // { name: "GMV", icon: HiOutlineChartBar, path: "/portal/admin/gmv" },
  ];

  // Define navigation items based on role
  const getNavigationItems = () => {
    switch (role) {
      case "admin":
        return [
          {
            name: "Strategic Insights",
            icon: StrategicInsightsIcon,
            path: "/portal/admin/financials",
          },
          {
            name: "Summary",
            icon: SummaryIcon,
            path: "/portal/admin/home",
          },
          {
            name: "Fymble Users",
            icon: FymbleUsersIcon,
            path: "/portal/admin/users",
          },
          {
            name: "Fymble Business Users",
            icon: BusinessIcon,
            path: "/portal/admin/stats",
          },
          // {
          //   name: "Revenue",
          //   icon: HiOutlineCurrencyDollar,
          //   path: "/portal/admin/revenue",
          // },
          {
            name: "Tech Support Inhouse",
            icon: TechSupportIcon,
            path: "/portal/admin/telecaller-managers",
          },
          {
            name: "User Conversion",
            icon: UserConversionIcon,
            path: "/portal/admin/user-conversion",
          },
          {
            name: "User Tracking",
            icon: UserTrackingIcon,
            path: "/portal/admin/tracking",
          },
          {
            name: "Bookings",
            icon: BookingsIcon,
            path: "/portal/admin/purchases",
          },
          {
            name: "Support Tickets",
            icon: SupportTicketsIcon,
            path: "/portal/admin/tickets",
          },
          {
            name: "Export Logs",
            icon: HiOutlineShieldCheck,
            path: "/portal/admin/export-logs",
          },
          {
            name: "Payout Calculation",
            icon: HiCurrencyRupee,
            path: "/portal/admin/payment-data",
          },
          // {
          //   name: "Nutrition Activity",
          //   icon: MdRestaurantMenu,
          //   path: "/portal/admin/nutrition-activity",
          // },
          // {
          //   name: "Marketing",
          //   icon: HiOutlineSpeakerphone,
          //   path: "/portal/admin/marketing",
          // },
          // {
          //   name: "Support",
          //   icon: HiOutlineExclamationCircle,
          //   path: "/portal/admin/support",
          // },
          // {
          //   name: "Employees",
          //   icon: MdWorkOutline,
          //   path: "/portal/admin/employees",
          // },
          // {
          //   name: "BDM Requests",
          //   icon: HiOutlineUserAdd,
          //   path: "/portal/admin/requests",
          // },
          // {
          //   name: "All Gyms",
          //   icon: HiOutlineBuildingOffice2,
          //   path: "/portal/admin/allgyms",
          // },
          // {
          //   name: "Shipments",
          //   icon: MdOutlineTabletMac,
          //   path: "/portal/admin/shipments",
          // },
        ];
      case "support":
        return [
          {
            name: "Summary",
            icon: HiOutlineHome,
            path: "/portal/support/home",
          },
          {
            name: "Registered Gyms",
            icon: HiOutlineChartBar,
            path: "/portal/support/fittbotbusiness",
          },
          {
            name: "User Tracking",
            icon: UserTrackingIcon,
            path: "/portal/admin/tracking",
          },
          {
            name: "Support Tickets",
            icon: SupportTicketsIcon,
            path: "/portal/support/tickets",
          },
          {
            name: "Bookings",
            icon: BookingsIcon,
            path: "/portal/admin/purchases",
          },
          {
            name: "Payout Calculation",
            icon: HiCurrencyRupee,
            path: "/portal/admin/payment-data",
          },
        ];
      case "telecaller":
        return [
          {
            name: "Summary",
            icon: HiOutlineHome,
            path: "/portal/telecaller/home",
          },
          {
            name: "Gym Stats",
            icon: HiOutlineChartBar,
            path: "/portal/telecaller/gyms",
          },
          {
            name: "Unretained Users",
            icon: HiCurrencyRupee,
            path: "/portal/telecaller/unretainedusers",
          },
        ];
      case "nutritionist":
        return [
          {
            name: "Sessions",
            icon: HiOutlineHome,
            path: "/portal/nutritionist/home",
          },
          {
            name: "Completed List",
            icon: HiOutlineUsers,
            path: "/portal/nutritionist/completed-list",
          },
          {
            name: "Food Template",
            icon: MdRestaurantMenu,
            path: "/portal/nutritionist/create-template",
          },
          {
            name: "Food Collections",
            icon: HiOutlineCollection,
            path: "/portal/nutritionist/food-collections",
          },
        ];

      case "accountant":
        return [
          {
            name: "Summary",
            icon: SummaryIcon,
            path: "/portal/admin/home",
          },
          {
            name: "Bookings",
            icon: BookingsIcon,
            path: "/portal/admin/purchases",
          },
          {
            name: "Strategic Insights",
            icon: StrategicInsightsIcon,
            path: "/portal/admin/financials",
          },
        ];

      default:
        return [];
    }
  };

  // Get user info based on role and user data
  const getUserInfo = () => {
    const userName = user?.name || "User";

    switch (role) {
      case "admin":
        return {
          name: userName,
          title: "Admin",
          dashboardType: "Admin dashboard",
          profilePath: "/portal/admin/profile",
        };
      case "support":
        return {
          name: userName,
          title: "Support Lead",
          dashboardType: "Support dashboard",
          profilePath: "/portal/support/profile",
        };
      case "telecaller":
        return {
          name: userName,
          title: "Tech Support Inhouse",
          dashboardType: "Tech Support Inhouse dashboard",
          profilePath: "/portal/telecaller/profile",
        };
      case "nutritionist":
        return {
          name: userName,
          title: "Nutritionist",
          dashboardType: "Nutritionist dashboard",
          profilePath: "/portal/nutritionist/profile",
        };
      case "accountant":
        return {
          name: userName,
          title: "Accountant",
          dashboardType: "Accountant dashboard",
          profilePath: "/portal/admin/home",
        };

      default:
        return {
          name: userName,
          title: "Unknown",
          dashboardType: "Dashboard",
          profilePath: "/profile",
        };
    }
  };

  // Check if user has access to current route
  const hasAccess = (userRole, pathname) => {
    const roleRoutes = {
      admin: ["/portal/admin"],
      accountant: [
        "/portal/admin/home",
        "/portal/admin/purchases",
        "/portal/admin/financials",
        "/portal/admin/users-stats",
        "/portal/admin/gyms",
        "/portal/admin/unit-economics",
        "/portal/admin/expenses",
        "/portal/admin/cash-flow",
        "/portal/admin/tax-compliance",
        "/portal/admin/mrr"
      ],
      support: ["/portal/support", "/portal/admin/gymplans", "/portal/admin/gymphotos", "/portal/admin/gymdetails", 
        "/portal/admin/verified-gyms", "/portal/admin/unverified-gyms", "/portal/admin/unverified-splitup", "/portal/admin/purchases", 
        "/portal/admin/tracking", "/portal/admin/payment-data", "/portal/admin/kyra"],
      telecaller: ["/portal/telecaller"],
      nutritionist: ["/portal/nutritionist"],
    };

    const allowedRoutes = roleRoutes[userRole] || [];
    return allowedRoutes.some((route) => pathname.startsWith(route));
  };

  const navigationItems = getNavigationItems();
  const userInfo = getUserInfo();
  const accessDenied = !hasAccess(role, pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-collapse sidebar on consultation page for better view
  useEffect(() => {
    if (pathname && pathname.includes("/portal/nutritionist/consultation/")) {
      setSidebarCollapsed(true);
    }
  }, [pathname]);

  if (accessDenied) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#111827",
          color: "white",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ textAlign: "center" }}>Access Denied</h2>
          <p style={{ textAlign: "center" }}>
            You don&rsquo;t have permission to view this page.
          </p>
          <button
            onClick={() => router.push(role === "accountant" ? "/portal/admin/home" : `/portal/${role}/home`)}
            style={{
              backgroundColor: themeColor,
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            Go to Your Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Function to handle navigation
  const handleNavigation = (path) => {
    // Close Strategic Insights toggle if navigating to a page outside of it
    const isStrategicInsightsPath = strategicInsightsItems.some(item => path.startsWith(item.path));
    if (!isStrategicInsightsPath) {
      setStrategicInsightsOpen(false);
    }
    router.push(path);
  };

  // Function to check if a navigation item is active
  const isActive = (path) => {
    // For exact match on home/dashboard pages
    if (path.endsWith("/home") || path.endsWith("/dashboard")) {
      return pathname === path;
    }
    // For other pages, check if current path starts with the nav item path
    // This allows sub-pages (like /marketing/bdes) to highlight the parent (Marketing)
    return pathname.startsWith(path);
  };

  // Function to handle profile click
  const handleProfileClick = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  // Function to handle profile menu navigation
  const handleProfileNavigation = () => {
    setProfileDropdownOpen(false);
    router.push(userInfo.profilePath);
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      // Call logout API
      await axiosInstance.post("/auth/logout");
    } catch (error) {
    } finally {
      // Clear authentication data
      localStorage.removeItem("user");
      sessionStorage.clear();

      setProfileDropdownOpen(false);

      // Redirect to login page
      router.push("/");
    }
  };

  const handleTOTPSetup = () => {
    setProfileDropdownOpen(false);
    router.push("/portal/totp-setup");
  };

  const sidebarStyle = {
    position: "fixed",
    left: 0,
    top: 0,
    height: "100vh",
    backgroundColor: role === "nutritionist" ? "#ffffff" : "#121717",
    borderRight: role === "nutritionist" ? "1px solid #e5e7eb" : "1px solid #374151",
    transition: "all 0.3s ease-in-out",
    zIndex: 1030,
    width: sidebarCollapsed ? "64px" : "256px",
  };

  const mainContentStyle = {
    marginLeft: sidebarCollapsed ? "64px" : "256px",
    transition: "margin-left 0.3s ease-in-out",
    minHeight: "100vh",
    backgroundColor: "#111827",
  };

  return (
    <div
      className={role === "nutritionist" ? "theme-nutritionist" : "theme-admin"}
      style={{ minHeight: "100vh", backgroundColor: role === "nutritionist" ? "#f9fafb" : "#111827", color: role === "nutritionist" ? "#111827" : "white" }}
    >
      {/* Sidebar */}
      <div style={sidebarStyle}>
        {/* Sidebar Header */}
        <div
          style={{
            padding: "1rem",
            borderBottom: role === "nutritionist" ? "1px solid #e5e7eb" : "1px solid #374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 5,
          }}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "none",
              border: "none",
              color: role === "nutritionist" ? "#10b981" : "#FFFFFF",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#374151";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            <HiOutlineMenu size={22} />
          </button>
          {!sidebarCollapsed && (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {role === "admin" || role === "support" || role === "accountant" ? (
                <img 
                  src="/Fymble.png" 
                  alt="Fymble" 
                  style={{ height: "25px", width: "auto", display: "block" }} 
                />
              ) : (
                <span
                  style={{ fontWeight: "600", fontSize: "24px", color: role === "nutritionist" ? "#111827" : "white" }}
                >
                  <span style={{ color: themeColor }}>Fy</span><span style={{ color: role === "nutritionist" ? "#111827" : "#fff" }}>mble</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{
          marginTop: "1.5rem",
          padding: "0 0.5rem",
          overflowY: "auto",
          maxHeight: "calc(100vh - 100px)",
          scrollbarWidth: "thin",
          WebkitOverflowScrolling: "touch"
        }}>
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);

            // Check if this is the Strategic Insights section
            if (item.name === "Strategic Insights") {
              const hasActiveSubItem = strategicInsightsItems.some(subItem => isActive(subItem.path));

              return (
                <div key={item.name} style={{ marginBottom: "8px" }}>
                  {/* Strategic Insights Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      margin: "4px 0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: hasActiveSubItem ? (role === "nutritionist" ? "#ecfdf5" : "#374151") : "transparent",
                      color: hasActiveSubItem ? (role === "nutritionist" ? "#10b981" : "white") : (role === "nutritionist" ? "#4b5563" : "#9ca3af"),
                      transition: "all 0.2s ease-in-out",
                      userSelect: "none",
                    }}
                    onClick={() => setStrategicInsightsOpen(!strategicInsightsOpen)}
                    onMouseEnter={(e) => {
                      if (!hasActiveSubItem) {
                        e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#1f2937";
                        e.currentTarget.style.color = role === "nutritionist" ? "#111827" : "white";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!hasActiveSubItem) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = role === "nutritionist" ? "#4b5563" : "#9ca3af";
                      }
                    }}
                  >
                    <IconComponent size={20} style={{ flexShrink: 0 }} />
                    {!sidebarCollapsed && (
                      <>
                        <span
                          style={{
                            marginLeft: "12px",
                            fontWeight: "600",
                            display: "block",
                          }}
                        >
                          {item.name}
                        </span>
                        <div style={{
                          marginLeft: "auto",
                          transform: strategicInsightsOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease-in-out",
                          display: "flex",
                          alignItems: "center"
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Strategic Insights Sub-items */}
                  {(!sidebarCollapsed || strategicInsightsOpen) && strategicInsightsOpen && (
                    <div style={{
                      marginLeft: sidebarCollapsed ? "0" : "16px",
                      marginTop: "4px",
                      paddingLeft: sidebarCollapsed ? "0" : "12px",
                      borderLeft: sidebarCollapsed ? "none" : (role === "nutritionist" ? "1px solid #e5e7eb" : "1px solid #374151"),
                    }}>
                      {strategicInsightsItems
                        .filter((subItem) => hasAccess(role, subItem.path))
                        .map((subItem) => {
                        const subActive = isActive(subItem.path);
                        const SubIconComponent = subItem.icon;

                        return (
                          <div
                            key={subItem.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: sidebarCollapsed ? "12px 16px" : "8px 12px",
                              margin: "2px 0",
                              borderRadius: "6px",
                              cursor: "pointer",
                              backgroundColor: subActive ? themeColor : "transparent",
                              color: subActive ? "white" : "#6b7280",
                              transition: "all 0.2s ease-in-out",
                              userSelect: "none",
                            }}
                            onClick={() => handleNavigation(subItem.path)}
                            onMouseEnter={(e) => {
                              if (!subActive) {
                                e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#1f2937";
                                e.currentTarget.style.color = role === "nutritionist" ? "#111827" : "white";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!subActive) {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = role === "nutritionist" ? "#6b7280" : "#6b7280";
                              }
                            }}
                          >
                            <SubIconComponent size={16} style={{ flexShrink: 0 }} />
                            {!sidebarCollapsed && (
                              <span
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  marginLeft: "8px",
                                }}
                              >
                                {subItem.name}
                              </span>
                            )}
                            {subActive && (
                              <div
                                style={{
                                  width: "3px",
                                  height: "12px",
                                  backgroundColor: "white",
                                  borderRadius: "2px",
                                  marginLeft: "auto",
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  margin: "4px 0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  backgroundColor: active ? (role === "nutritionist" ? "#ecfdf5" : "#565656") : "transparent",
                  color: active ? (role === "nutritionist" ? "#10b981" : "white") : (role === "nutritionist" ? "#4b5563" : "#9ca3af"),
                  textDecoration: "none",
                  transition: "all 0.2s ease-in-out",
                  userSelect: "none",
                }}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#374151";
                    e.currentTarget.style.color = role === "nutritionist" ? "#111827" : "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = role === "nutritionist" ? "#4b5563" : "#9ca3af";
                  }
                }}
              >
                <IconComponent
                  size={20}
                  style={{
                    flexShrink: 0,
                    color: role === "nutritionist" ? (active ? "#10b981" : "#4b5563") : "#ffffff"
                  }}
                />
                {!sidebarCollapsed && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontWeight: "500",
                      display: "block",
                    }}
                  >
                    {item.name}
                  </span>
                )}
                {/* Active indicator */}
                {active && (
                  <div
                    style={{
                      width: "4px",
                      height: "20px",
                      backgroundColor: themeColor,
                      borderRadius: "2px",
                      marginLeft: "auto",
                      display: sidebarCollapsed ? "none" : "block",
                    }}
                  />
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={mainContentStyle}>
        {/* Header */}
        <header
          style={{
            backgroundColor: role === "nutritionist" ? "#ffffff" : "#121717",
            borderBottom: role === "nutritionist" ? "1px solid #e5e7eb" : "1px solid #374151",
            padding: "0.7rem 1.5rem",
            position: "fixed",
            top: 0,
            right: 0,
            left: sidebarCollapsed ? 64 : 256,
            zIndex: 999,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left side - Greeting */}
            <div>
              <h1
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: role === "nutritionist" ? "#111827" : "white",
                  margin: "0",
                  textTransform: "capitalize"
                }}
              >
                Hi {userInfo.name}
              </h1>
              <p
                style={{
                  color: role === "nutritionist" ? "#4b5563" : "#9ca3af",
                  fontSize: "16px",
                  margin: "4px 0 0 0",
                }}
              >
                Welcome to <span style={{ color: themeColor }}>Fymble</span>{" "}
                {userInfo.dashboardType}
              </p>
            </div>

            {/* Right side - Profile Dropdown */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  padding: "8px",
                  borderRadius: "8px",
                  transition: "background-color 0.2s",
                }}
                onClick={handleProfileClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#374151";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* User Info */}
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      color: role === "nutritionist" ? "#111827" : "white",
                      fontWeight: "600",
                      fontSize: "14px",
                      margin: "0",
                      lineHeight: "1.2",
                      textTransform: "capitalize"
                    }}
                  >
                    {userInfo.name}
                  </div>
                  <div
                    style={{
                      color: role === "nutritionist" ? "#6b7280" : "#9ca3af",
                      fontSize: "12px",
                      margin: "2px 0 0 0",
                      lineHeight: "1.2",
                    }}
                  >
                    {userInfo.title}
                  </div>
                </div>
                <div
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    backgroundColor: themeColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "200",
                    fontSize: "16px",
                  }}
                >
                  {userInfo.name.charAt(0)}
                </div>
                <HiOutlineChevronDown
                  size={16}
                  style={{
                    color: role === "nutritionist" ? "#111827" : "#9ca3af",
                    transform: profileDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s ease-in-out",
                  }}
                />
              </div>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    marginTop: "8px",
                    width: "200px",
                    backgroundColor: role === "nutritionist" ? "#ffffff" : "#1f2937",
                    border: role === "nutritionist" ? "1px solid #e5e7eb" : "1px solid #374151",
                    borderRadius: "8px",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: "8px 0" }}>
                    {/* TOTP Setup Option */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 16px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        color: "#10b981",
                      }}
                      onClick={handleTOTPSetup}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#374151";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <HiOutlineShieldCheck size={22} />
                      <span
                        style={{
                          marginLeft: "12px",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        2FA Setup
                      </span>
                    </div>

                    {/* Logout Option */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 16px",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        color: "#ef4444",
                      }}
                      onClick={handleLogout}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = role === "nutritionist" ? "#f3f4f6" : "#374151";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <HiOutlineLogout size={22} />
                      <span
                        style={{
                          marginLeft: "12px",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        Logout
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div
          style={{
            padding: "1rem",
            backgroundColor: role === "nutritionist" ? "#f9fafb" : "#121717",
            marginTop: "70px",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
