"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const SOURCE_COLORS = {
  daily_pass: "#FF5757",
  sessions: "#28a745",
  gym_membership: "#ffc107",
  kyra_ai: "#a855f7",
  other: "#6b7280"
};

const SOURCE_LABELS = {
  daily_pass: "Daily Pass",
  sessions: "Fitness Classes",
  gym_membership: "Gym Membership",
  kyra_ai: "Kyra AI",
  other: "Other"
};

export default function BookingAverages() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAverages();
  }, []);

  const fetchAverages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/api/admin/dashboard/booking-averages");
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch averages");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Failed to fetch averages";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ textAlign: "center", color: "#888" }}>Loading averages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ textAlign: "center", color: "#ef4444" }}>Error: {error}</div>
      </div>
    );
  }

  // Prepare chart data for each average with source breakdown
  const prepareChartData = (breakdown) => {
    const groupedBreakdown = {
      daily_pass: breakdown.daily_pass || 0,
      sessions: breakdown.sessions || 0,
      gym_membership: breakdown.gym_membership || 0,
      kyra_ai: breakdown.kyra_ai || 0,
      other: (breakdown.fittbot_subscription || 0) + (breakdown.ai_credits || 0) + (breakdown.ai_diet_coach || 0)
    };
    return Object.entries(groupedBreakdown).map(([source, value]) => ({
      name: SOURCE_LABELS[source],
      value: value,
      source: source
    })).filter(item => item.value > 0); // Only show sources with values
  };

  const monthlyChartData = prepareChartData(data.monthlyBreakdown);
  const weeklyChartData = prepareChartData(data.weeklyBreakdown);
  const dailyChartData = prepareChartData(data.dailyBreakdown);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#333",
            padding: "10px",
            border: "1px solid #555",
            borderRadius: "4px",
            color: "#fff",
          }}
        >
          <p style={{ margin: 0 }}>{`${payload[0].name}: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ data }) => {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginTop: "10px" }}>
        {data.map((entry, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#ccc" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: SOURCE_COLORS[entry.source],
              }}
            />
            <span>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      <h4
        style={{
          color: "#fff",
          marginBottom: "20px",
          fontSize: "18px",
          fontWeight: "600",
        }}
      >
        Booking Averages
      </h4>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Monthly Average */}
        <div
          style={{
            backgroundColor: "#222",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "15px",
            textAlign: "center",
          }}
        >
          <h5 style={{ color: "#ffffffff", marginBottom: "2px", fontSize: "14px" }}>
            Monthly Average
          </h5>
          <div style={{ color: "#888", fontSize: "11px", marginBottom: "10px" }}>
            Last 3 months
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={monthlyChartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {monthlyChartData.map((entry, index) => (
                  <Cell key={`monthly-${index}`} fill={SOURCE_COLORS[entry.source]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={monthlyChartData} />
          <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>
            {data.monthlyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginTop: "5px" }}>
            bookings/month
          </div>
        </div>

        {/* Weekly Average */}
        <div
          style={{
            backgroundColor: "#222",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "15px",
            textAlign: "center",
          }}
        >
          <h5 style={{ color: "#ffffffff", marginBottom: "2px", fontSize: "14px" }}>
            Weekly Average
          </h5>
          <div style={{ color: "#888", fontSize: "11px", marginBottom: "10px" }}>
            Last 4 Weeks
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={weeklyChartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {weeklyChartData.map((entry, index) => (
                  <Cell key={`weekly-${index}`} fill={SOURCE_COLORS[entry.source]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={weeklyChartData} />
          <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>
            {data.weeklyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginTop: "5px" }}>
            bookings/week
          </div>
        </div>

        {/* Daily Average */}
        <div
          style={{
            backgroundColor: "#222",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "15px",
            textAlign: "center",
          }}
        >
          <h5 style={{ color: "#fbfbfbff", marginBottom: "2px", fontSize: "14px" }}>
            Daily Average
          </h5>
          <div style={{ color: "#888", fontSize: "11px", marginBottom: "10px" }}>
            Last 7 Days
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={dailyChartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {dailyChartData.map((entry, index) => (
                  <Cell key={`daily-${index}`} fill={SOURCE_COLORS[entry.source]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <CustomLegend data={dailyChartData} />
          <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>
            {data.dailyAverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: "#888", fontSize: "12px", marginTop: "5px" }}>
            bookings/day
          </div>
        </div>
      </div>
    </div>
  );
}
