"use client";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaCheck,
  FaTimes,
  FaHistory,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

export default function BDMRequests() {
  // Dummy data for BDM requests
  const [allRequests] = useState([
    {
      id: 1,
      bdmName: "Rajesh Kumar",
      bdmEmail: "rajesh.kumar@fittbot.com",
      bdmMobile: "+91 9876543210",
      requestedGymName: "Fitness First",
      gymLocation: "Andheri West, Mumbai",
      requestDate: "2024-07-08",
      status: "pending",
      note: "Need complete gym details for partnership discussion",
      retentionRate: 87,
    },
    {
      id: 2,
      bdmName: "Priya Sharma",
      bdmEmail: "priya.sharma@fittbot.com",
      bdmMobile: "+91 9876543211",
      requestedGymName: "PowerGym Elite",
      gymLocation: "Karol Bagh, Delhi",
      requestDate: "2024-07-07",
      status: "pending",
      note: "Client interested in gym membership details",
      retentionRate: 92,
    },
    {
      id: 3,
      bdmName: "Amit Singh",
      bdmEmail: "amit.singh@fittbot.com",
      bdmMobile: "+91 9876543212",
      requestedGymName: "Iron Paradise",
      gymLocation: "Koramangala, Bangalore",
      requestDate: "2024-07-06",
      status: "pending",
      note: "Urgent - Client meeting scheduled tomorrow",
      retentionRate: 78,
    },
    {
      id: 4,
      bdmName: "Sneha Reddy",
      bdmEmail: "sneha.reddy@fittbot.com",
      bdmMobile: "+91 9876543213",
      requestedGymName: "Fitness Hub",
      gymLocation: "Banjara Hills, Hyderabad",
      requestDate: "2024-07-05",
      status: "accepted",
      note: "Need pricing and facilities information",
      retentionRate: 95,
    },
    {
      id: 5,
      bdmName: "Vikram Patel",
      bdmEmail: "vikram.patel@fittbot.com",
      bdmMobile: "+91 9876543214",
      requestedGymName: "Muscle Factory",
      gymLocation: "Hinjewadi, Pune",
      requestDate: "2024-07-04",
      status: "rejected",
      note: "Corporate bulk membership inquiry",
      retentionRate: 65,
    },
    {
      id: 6,
      bdmName: "Kavya Nair",
      bdmEmail: "kavya.nair@fittbot.com",
      bdmMobile: "+91 9876543215",
      requestedGymName: "FitZone Pro",
      gymLocation: "T. Nagar, Chennai",
      requestDate: "2024-07-09",
      status: "pending",
      note: "Premium membership packages needed",
      retentionRate: 89,
    },
    {
      id: 7,
      bdmName: "Rohit Gupta",
      bdmEmail: "rohit.gupta@fittbot.com",
      bdmMobile: "+91 9876543216",
      requestedGymName: "Elite Fitness",
      gymLocation: "Salt Lake, Kolkata",
      requestDate: "2024-07-03",
      status: "accepted",
      note: "Family membership options required",
      retentionRate: 83,
    },
    {
      id: 8,
      bdmName: "Meera Joshi",
      bdmEmail: "meera.joshi@fittbot.com",
      bdmMobile: "+91 9876543217",
      requestedGymName: "Pro Gym",
      gymLocation: "Satellite, Ahmedabad",
      requestDate: "2024-07-02",
      status: "rejected",
      note: "Personal training rates information",
      retentionRate: 71,
    },
  ]);

  // State variables
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [requests, setRequests] = useState(allRequests);

  // Handle accept/reject actions
  const handleAccept = (requestId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "accepted",
              actionDate: new Date().toISOString().split("T")[0],
            }
          : request
      )
    );
  };

  const handleReject = (requestId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "rejected",
              actionDate: new Date().toISOString().split("T")[0],
            }
          : request
      )
    );
  };

  // Filter requests based on active tab
  const filteredRequests = useMemo(() => {
    let filtered = requests.filter((request) => {
      const matchesSearch =
        request.bdmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requestedGymName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        request.gymLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.bdmEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "active"
          ? request.status === "pending"
          : request.status !== "pending";

      return matchesSearch && matchesTab;
    });

    // Sort by request date (newest first)
    filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    return filtered;
  }, [requests, searchTerm, activeTab]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (value) => {
    setCurrentPage(1);
    setSearchTerm(value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (bdmName) => {
    return bdmName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRetentionRateColor = (rate) => {
    if (rate >= 90) return "#22c55e"; // Green
    if (rate >= 80) return "#f59e0b"; // Amber
    if (rate >= 70) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      style={{ backgroundColor: "#121717", minHeight: "100vh", color: "#fff" }}
    >
      <div className="bdm-requests-container">
        <div className="bdm-requests-header">
          <h2 className="bdm-requests-title">
            <span style={{ color: "#FF5757" }}>BDM</span> Requests
          </h2>
          <div className="requests-count">
            {activeTab === "active" ? "Active" : "History"}:{" "}
            {filteredRequests.length} requests
          </div>
        </div>

        {/* Tabs Section */}
        <div className="tabs-section">
          <div className="row">
            <div className="col-12">
              <div className="tabs-container">
                <button
                  className={`tab-btn ${
                    activeTab === "active" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("active")}
                >
                  <FaUsers className="tab-icon" />
                  Active Requests
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "history" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("history")}
                >
                  <FaHistory className="tab-icon" />
                  Request History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="row pb-0">
            <div className="col-lg-4 col-md-6 col-sm-12">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by BDM name, gym, location..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={6}>6 per page</option>
                <option value={12}>12 per page</option>
                <option value={18}>18 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Grid */}
        <div className="requests-grid">
          <div className="row">
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div
                  key={request.id}
                  className="col-lg-6 col-md-6 col-sm-12 mb-4"
                >
                  <div className="request-card">
                    <div className="request-header">
                      <div className="profile-section">
                        <div className="profile-avatar">
                          {getInitials(request.bdmName)}
                        </div>
                        <div className="profile-info">
                          <h4 className="profile-name">{request.bdmName}</h4>
                          <p className="bdm-role">{request.bdmMobile}</p>
                        </div>
                        <div
                          className="retention-circle"
                          style={{
                            borderColor: getRetentionRateColor(
                              request.retentionRate
                            ),
                          }}
                        >
                          <span
                            className="retention-percentage"
                            style={{
                              color: getRetentionRateColor(
                                request.retentionRate
                              ),
                            }}
                          >
                            {request.retentionRate}
                          </span>
                        </div>
                      </div>
                      {activeTab === "history" && (
                        <div className={`status-badge-large ${request.status}`}>
                          {request.status === "accepted" ? (
                            <FaCheck />
                          ) : (
                            <FaTimes />
                          )}
                          {request.status}
                        </div>
                      )}
                    </div>

                    <div className="request-details">
                      <div className="detail-section">
                        <div className="detail-row">
                          <span className="detail-label">Gym Name:</span>
                          <span className="detail-value">
                            {request.requestedGymName}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">
                            {request.gymLocation}
                          </span>
                        </div>
                      </div>

                      <div className="detail-section">
                        <div className="detail-row">
                          <span className="detail-label">
                            {activeTab === "active"
                              ? "Request Date:"
                              : "Action Date:"}
                          </span>
                          <span className="detail-value">
                            {formatDate(
                              activeTab === "active"
                                ? request.requestDate
                                : request.actionDate || request.requestDate
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {activeTab === "active" && (
                      <div className="request-actions">
                        <button
                          className="action-btn accept-btn"
                          onClick={() => handleAccept(request.id)}
                        >
                          <FaCheck />
                          Accept
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleReject(request.id)}
                        >
                          <FaTimes />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="no-data-card">
                  <div className="no-data-content">
                    <h3>No requests found</h3>
                    <p>
                      {activeTab === "active"
                        ? "There are no active requests at the moment."
                        : "No request history available."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + itemsPerPage, filteredRequests.length)} of{" "}
              {filteredRequests.length} entries
            </div>

            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>

              {getPaginationNumbers().map((page, index) => (
                <button
                  key={index}
                  className={`pagination-btn ${
                    page === currentPage ? "active" : ""
                  } ${page === "..." ? "dots" : ""}`}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                  disabled={page === "..."}
                >
                  {page}
                </button>
              ))}

              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .bdm-requests-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .bdm-requests-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .bdm-requests-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }

        .requests-count {
          color: #8b949e;
          font-size: 16px;
          font-weight: 500;
        }

        .tabs-section {
          margin-bottom: 25px;
        }

        .tabs-container {
          display: flex;
          gap: 10px;
          border-bottom: 2px solid #30363d;
          padding-bottom: 0;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: #8b949e;
          padding: 12px 20px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          color: #fff;
          background: rgba(255, 87, 87, 0.1);
        }

        .tab-btn.active {
          color: #ff5757;
          border-bottom-color: #ff5757;
        }

        .tab-icon {
          font-size: 14px;
        }

        .filters-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          border: 1px solid #30363d;
        }

        .search-box {
          position: relative;
          width: 100%;
        }

        .search-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #8b949e;
          font-size: 16px;
        }

        .search-input {
          width: 100%;
          padding: 12px 15px 12px 45px;
          background: #1c2128;
          border: 2px solid #30363d;
          border-radius: 8px;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          border-color: #ff5757;
          box-shadow: 0 0 0 3px rgba(255, 87, 87, 0.1);
        }

        .search-input::placeholder {
          color: #6c757d;
        }

        .filter-select {
          width: 100%;
          padding: 12px 15px;
          background: #1c2128;
          border: 2px solid #30363d;
          border-radius: 8px;
          color: #fff;
          font-size: 16px;
          outline: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-select:focus {
          border-color: #ff5757;
          box-shadow: 0 0 0 3px rgba(255, 87, 87, 0.1);
        }

        .filter-select option {
          background: #1c2128;
          color: #fff;
        }

        .requests-grid {
          margin-bottom: 30px;
        }

        .request-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 20px;
          height: 100%;
          transition: all 0.3s ease;
        }

        .request-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          border-color: #ff5757;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .profile-section {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
        }

        .profile-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ff5757, #ff8a80);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          flex-shrink: 0;
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: 600;
          color: #fff;
        }

        .bdm-role {
          margin: 0;
          color: #8b949e;
          font-size: 14px;
        }

        .retention-circle {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .retention-percentage {
          font-size: 12px;
          font-weight: 700;
          text-align: center;
          line-height: 1;
        }

        .status-badge-large {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge-large.accepted {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge-large.rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .request-details {
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #8b949e;
          font-size: 14px;
          font-weight: 500;
        }

        .detail-value {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }

        .request-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .action-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s ease;
        }

        .accept-btn {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .accept-btn:hover {
          background: rgba(34, 197, 94, 0.3);
          transform: translateY(-1px);
        }

        .reject-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .reject-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          transform: translateY(-1px);
        }

        .no-data-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 60px 20px;
          text-align: center;
        }

        .no-data-content h3 {
          color: #8b949e;
          margin-bottom: 10px;
          font-size: 24px;
        }

        .no-data-content p {
          color: #6c757d;
          font-size: 16px;
          margin: 0;
        }

        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          padding: 20px 0;
        }

        .pagination-info {
          color: #8b949e;
          font-size: 14px;
        }

        .pagination {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .pagination-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid #30363d;
          color: #8b949e;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
          min-width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 87, 87, 0.1);
          border-color: #ff5757;
          color: #ff5757;
        }

        .pagination-btn.active {
          background: #ff5757;
          border-color: #ff5757;
          color: #fff;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-btn.dots {
          background: transparent;
          border: none;
          cursor: default;
        }

        .pagination-btn.dots:hover {
          background: transparent;
          border: none;
          color: #8b949e;
        }

        @media (max-width: 768px) {
          .bdm-requests-container {
            padding: 15px;
          }

          .bdm-requests-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .bdm-requests-title {
            font-size: 24px;
          }

          .tabs-container {
            width: 100%;
            overflow-x: auto;
          }

          .request-header {
            flex-direction: column;
            gap: 15px;
          }

          .profile-section {
            width: 100%;
          }

          .status-badge-large {
            align-self: flex-start;
          }

          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }

          .detail-value {
            max-width: 100%;
            text-align: left;
          }

          .pagination-container {
            flex-direction: column;
            text-align: center;
          }

          .retention-circle {
            width: 40px;
            height: 40px;
          }

          .retention-percentage {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
