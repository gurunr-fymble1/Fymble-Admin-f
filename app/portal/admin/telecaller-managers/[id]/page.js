"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { FaArrowLeft, FaPhone, FaChevronRight } from "react-icons/fa";

export default function ManagerTelecallers() {
  const router = useRouter();
  const params = useParams();
  const managerId = params.id;

  const [loading, setLoading] = useState(true);
  const [manager, setManager] = useState(null);
  const [telecallers, setTelecallers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTelecallers, setFilteredTelecallers] = useState([]);

  const fetchTelecallers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/telecaller-managers/${managerId}/telecallers`);

      if (response.data.success) {
        setManager(response.data.data.manager);
        setTelecallers(response.data.data.telecallers || []);
        setFilteredTelecallers(response.data.data.telecallers || []);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [managerId]);

  useEffect(() => {
    if (managerId) {
      fetchTelecallers();
    }
  }, [managerId, fetchTelecallers]);

  useEffect(() => {
    // Filter telecallers based on search term
    if (searchTerm) {
      const filtered = telecallers.filter((telecaller) =>
        telecaller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        telecaller.mobile_number.includes(searchTerm)
      );
      setFilteredTelecallers(filtered);
    } else {
      setFilteredTelecallers(telecallers);
    }
  }, [searchTerm, telecallers]);

  return (
    <div className="dashboard-container">
      <div className="section-container">
        {/* Header with Back Button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "30px"
        }}>
          <button
            onClick={() => router.push("/portal/admin/telecaller-managers")}
            style={{
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "10px 16px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#3a3a3a"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#2a2a2a"}
          >
            <FaArrowLeft size={14} />
            Back
          </button>
          <div>
            <h1 style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#fff",
              margin: "0",
            }}>
              {manager?.name || "Manager"}&apos;s Team
            </h1>
            <p style={{
              color: "#888",
              fontSize: "14px",
              margin: "4px 0 0 0",
            }}>
              Viewing telecallers under this manager
            </p>
          </div>
        </div>

        {/* Manager Info Card */}
        {manager && (
          <div style={{
            backgroundColor: "#2a2a2a",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div>
              <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                Manager Name
              </div>
              <div style={{ fontSize: "18px", fontWeight: "600", color: "#fff" }}>
                {manager.name}
              </div>
            </div>
            <div>
              <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                Mobile Number
              </div>
              <div style={{
                fontSize: "16px",
                color: "#ccc",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <FaPhone style={{ color: "#FF5757", fontSize: "14px" }} />
                {manager.mobile_number}
              </div>
            </div>
            <div>
              <div style={{ color: "#888", fontSize: "14px", marginBottom: "4px" }}>
                Total Telecallers
              </div>
              <div style={{ fontSize: "32px", fontWeight: "600", color: "#FF5757" }}>
                {telecallers.length}
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div style={{
          marginBottom: "20px",
          display: "flex",
          gap: "15px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          <div style={{
            position: "relative",
            flex: 1,
            minWidth: "300px",
            maxWidth: "500px"
          }}>
            <FaPhone
              style={{
                position: "absolute",
                left: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#888"
              }}
            />
            <input
              type="text"
              placeholder="Search by name or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 15px 12px 45px",
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            padding: "40px",
          }}>
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
                Loading telecallers...
              </p>
            </div>
          </div>
        ) : (
          /* Table */
          <div style={{
            backgroundColor: "#1e1e1e",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #333"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#2a2a2a",
                    borderBottom: "1px solid #333"
                  }}>
                    <th style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ccc",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Name
                    </th>
                    <th style={{
                      padding: "16px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#ccc",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      Mobile Number
                    </th>
                    <th style={{ width: "50px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTelecallers.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{
                        padding: "60px",
                        textAlign: "center",
                        color: "#888"
                      }}>
                        <div style={{ marginBottom: "16px" }}>
                          <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ opacity: 0.3 }}
                          >
                            <path
                              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                              fill="#888"
                            />
                          </svg>
                        </div>
                        <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                          {searchTerm ? "No telecallers found" : "No telecallers found"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#666" }}>
                          {searchTerm
                            ? "Try adjusting your search criteria"
                            : "Telecallers will appear here"}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTelecallers.map((telecaller, index) => (
                      <tr
                        key={telecaller.id}
                        style={{
                          borderBottom: index !== filteredTelecallers.length - 1 ? "1px solid #333" : "none",
                          transition: "background-color 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={() => router.push(`/portal/admin/telecaller-managers/${managerId}/${telecaller.id}`)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2a2a2a"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "16px", color: "#ccc" }}>
                          {telecaller.name}
                        </td>
                        <td style={{ padding: "16px", color: "#ccc" }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                          }}>
                            <FaPhone style={{ color: "#FF5757", fontSize: "12px" }} />
                            {telecaller.mobile_number}
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <FaChevronRight style={{ color: "#666", fontSize: "12px" }} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
