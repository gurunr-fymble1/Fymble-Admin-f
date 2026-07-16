"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

export default function ClientPurchaseSummaryPage() {
  const { client_id } = useParams();
  const searchParams = useSearchParams();
  const clientName = searchParams.get("name") || "Client";
  const router = useRouter();

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/admin/purchases/client-purchase-summary/${client_id}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching client purchase summary:", error);
      } finally {
        setLoading(false);
      }
    };

    if (client_id) {
      fetchData();
    }
  }, [client_id]);

  const categoryLabels = {
    daily_pass: "Daily Pass",
    sessions: "Fitness Classes",
    fittbot_subscription: "Nutrition Plan",
    ai_credits: "AI Credits",
    ai_diet_coach: "AI Diet Coach",
    gym_membership: "Gym Membership"
  };

  const categoryColors = {
    daily_pass: "#3b82f6",
    sessions: "#f59e0b",
    fittbot_subscription: "#FF5757",
    ai_credits: "#a855f7",
    ai_diet_coach: "#E91E63",
    gym_membership: "#22c55e"
  };

  const renderCategoryCards = () => {
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
          <div style={{ color: "#888" }}>Loading summary...</div>
        </div>
      );
    }

    if (Object.keys(data).length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333" }}>
          <p style={{ color: "#888", fontSize: "16px", margin: 0 }}>No purchases found for this client.</p>
        </div>
      );
    }

    return (
      <div className="row g-4">
        {Object.entries(data).map(([category, items]) => {
          let totalCount = 0;
          if (Array.isArray(items)) {
            totalCount = items.reduce((sum, item) => sum + item.count, 0);
          } else if (items.count) {
            totalCount = items.count;
          }

          if (totalCount === 0) return null;

          const label = categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const color = categoryColors[category] || "white";

          return (
            <div className="col-12 col-md-6 col-xl-4" key={category}>
              <div className="dashboard-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="card-header-custom extra-space">
                  <h6 className="card-title">{label}</h6>
                  <span
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontSize: "12px",
                      border: `1px solid ${color}40`
                    }}
                  >
                    {totalCount} Total
                  </span>
                </div>

                <div className="card-body-custom" style={{ flex: 1 }}>
                  <div className="metric-number" style={{ color: color, fontSize: "32px", marginBottom: "1rem" }}>
                    {totalCount}
                  </div>

                  {Array.isArray(items) && items.length > 0 && (
                    <div style={{ marginTop: "auto", borderTop: "1px solid #333", paddingTop: "1rem" }}>
                      <p style={{ color: "#888", fontSize: "10px", marginBottom: "12px", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                        Breakdown by Gym
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {items.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#1e1e1e60", borderRadius: "8px" }}>
                            <span style={{ color: "#aaa", fontSize: "13px", fontWeight: "500" }}>
                              {item.gym_name || "Unknown Gym"}
                            </span>
                            <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>
                              {item.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "80vh", color: "white" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "2rem",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#333"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <FaArrowLeft /> Back
        </button>
        <div>
          <h5 style={{ color: "#888", fontSize: "14px", fontWeight: "400", marginBottom: "0" }}>
            Purchase Summary for
          </h5>
          <p style={{ color: "#fff", fontSize: "20px", fontWeight: "600", marginBottom: "0", textTransform: "capitalize" }}>
            {clientName}
          </p>
        </div>
        <button
          onClick={() => router.push(`/portal/admin/users/${client_id}/purchase-history`)}
          style={{
            marginLeft: "auto",
            backgroundColor: "#28a745",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#218838"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#28a745"; }}
        >
          Click for more info
        </button>
      </div>

      {renderCategoryCards()}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
