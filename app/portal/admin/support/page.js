"use client";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaClock,
  FaPlay,
  FaCheck,
} from "react-icons/fa";

export default function Support() {
  // Mock data - replace with actual data
  const mockData = {
    support: {
      todayTickets: { gym: 2, client: 6 },
      totalTickets: { gym: 23, client: 67 },
      unresolvedTickets: { gym: 5, client: 12 },
    },
  };

  // Generate UUID-like ticket IDs
  const generateTicketId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  // Dummy tickets data
  const [allTickets] = useState([
    {
      id: 1,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Rajesh Kumar",
      issueType: "Technical",
      issue:
        "App crashes when trying to log workout data. The application freezes completely and requires force close. This happens consistently after entering exercise details and trying to save the workout session.",
      status: "yet to start",
      createdDate: "2024-07-08",
    },
    {
      id: 2,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "Fitness First Gym",
      issueType: "Client Management",
      issue:
        "Unable to add new client profiles to the system. When clicking the add client button, nothing happens and no error message is displayed.",
      status: "working",
      createdDate: "2024-07-09",
    },
    {
      id: 3,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Priya Sharma",
      issueType: "Subscription",
      issue:
        "Payment was deducted but subscription not activated. Premium features are still locked despite successful payment confirmation from bank.",
      status: "resolved",
      createdDate: "2024-07-07",
    },
    {
      id: 4,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "PowerGym Elite",
      issueType: "Payment & Billing",
      issue:
        "Monthly billing statement shows incorrect amount. The charged amount is higher than the agreed subscription fee mentioned in the contract.",
      status: "yet to start",
      createdDate: "2024-07-10",
    },
    {
      id: 5,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Amit Singh",
      issueType: "App Usage",
      issue:
        "Cannot sync workout data with fitness tracker. The app shows 'sync failed' error whenever attempting to connect with Fitbit device.",
      status: "working",
      createdDate: "2024-07-06",
    },
    {
      id: 6,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "Iron Paradise",
      issueType: "Analytics & Reports",
      issue:
        "Revenue reports are not generating correctly. The monthly revenue summary shows zero even though there are active subscriptions and payments received.",
      status: "resolved",
      createdDate: "2024-07-05",
    },
    {
      id: 7,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Sneha Reddy",
      issueType: "Other",
      issue:
        "Profile picture upload not working. Every time I try to upload a new profile picture, it shows 'upload failed' message.",
      status: "yet to start",
      createdDate: "2024-07-08",
    },
    {
      id: 8,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "Fitness Hub",
      issueType: "Feature Request",
      issue:
        "Need bulk member import feature. Currently adding members one by one is very time consuming. Would like to import member data from Excel sheets.",
      status: "working",
      createdDate: "2024-07-09",
    },
    {
      id: 9,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Vikram Patel",
      issueType: "Technical",
      issue:
        "GPS tracking not working during outdoor runs. The app fails to track location and distance covered during jogging sessions.",
      status: "resolved",
      createdDate: "2024-07-04",
    },
    {
      id: 10,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "Muscle Factory",
      issueType: "Data Import/Export",
      issue:
        "Cannot export member attendance data. The export button is greyed out and clicking it doesn't generate any download file.",
      status: "yet to start",
      createdDate: "2024-07-10",
    },
    {
      id: 11,
      ticketId: "fittbot-998e988323",
      source: "Fittbot",
      name: "Kavya Nair",
      issueType: "Subscription",
      issue:
        "Auto-renewal disabled but still getting charged. Despite turning off auto-renewal from settings, the subscription was renewed automatically.",
      status: "working",
      createdDate: "2024-07-07",
    },
    {
      id: 12,
      ticketId: "fittbot-998e988323",
      source: "Fymble Business",
      name: "FitZone Pro",
      issueType: "Technical",
      issue:
        "Dashboard loading very slowly. It takes more than 2 minutes to load the main dashboard with member statistics and recent activity.",
      status: "resolved",
      createdDate: "2024-07-06",
    },
  ]);

  // State variables for table
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Issue types based on source
  const fittbotIssueTypes = ["Technical", "Subscription", "App Usage", "Other"];
  const fittbotBusinessIssueTypes = [
    "Technical",
    "Client Management",
    "Payment & Billing",
    "Analytics & Reports",
    "Feature Request",
    "Data Import/Export",
    "Other",
  ];

  // Get all unique issue types for filter
  const allIssueTypes = [
    ...new Set([...fittbotIssueTypes, ...fittbotBusinessIssueTypes]),
  ];

  // Status options
  const statusOptions = ["yet to start", "working", "resolved"];

  // Update ticket status
  const updateTicketStatus = (ticketId, newStatus) => {
    // In real app, this would make an API call
    const updatedTickets = allTickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
    );
    // Since we're using useState, we can't directly update here
    // This would be handled by your state management system
  };

  // Filtered and sorted data
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = allTickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        sourceFilter === "all" || ticket.source === sourceFilter;
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesIssueType =
        issueTypeFilter === "all" || ticket.issueType === issueTypeFilter;

      return (
        matchesSearch && matchesSource && matchesStatus && matchesIssueType
      );
    });

    // Sort by created date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate);
      const dateB = new Date(b.createdDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [
    allTickets,
    searchTerm,
    sourceFilter,
    statusFilter,
    issueTypeFilter,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredAndSortedTickets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "source") setSourceFilter(value);
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "issueType") setIssueTypeFilter(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const truncateText = (text, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "yet to start":
        return <FaClock />;
      case "working":
        return <FaPlay />;
      case "resolved":
        return <FaCheck />;
      default:
        return <FaClock />;
    }
  };

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  return (
    <div className="dashboard-container">
      {/* Support Tickets Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Support</span> Tickets
        </h3>
        <div className="row g-4">
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Today&rsquo;s Support Tickets</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot business</span>
                    <span className="ticket-number">
                      {mockData.support.todayTickets.gym}
                    </span>
                  </div>
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot</span>
                    <span className="ticket-number">
                      {mockData.support.todayTickets.client}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Total Support Tickets */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Total Support Tickets</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot business</span>
                    <span className="ticket-number">
                      {mockData.support.totalTickets.gym}
                    </span>
                  </div>
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot</span>
                    <span className="ticket-number">
                      {mockData.support.totalTickets.client}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unresolved Tickets */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Unresolved Tickets</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot business</span>
                    <span className="ticket-number urgent">
                      {mockData.support.unresolvedTickets.gym}
                    </span>
                  </div>
                  <div className="ticket-item">
                    <span className="ticket-label">Fittbot</span>
                    <span className="ticket-number urgent">
                      {mockData.support.unresolvedTickets.client}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Tickets Table */}
      <div className="users-container" style={{ marginTop: "2rem" }}>
        <div className="users-header">
          <h2 className="users-title">
            Support <span style={{ color: "#FF5757" }}>Tickets</span> List
          </h2>
          <div className="users-count">
            Total: {filteredAndSortedTickets.length} tickets
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          <div className="row pb-0">
            <div className="col-lg-2 col-md-6 col-sm-12">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by ID, name..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={sourceFilter}
                onChange={(e) => handleFilterChange("source", e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="Fymble">Fymble</option>
                <option value="Fymble Business">Fymble Business</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={issueTypeFilter}
                onChange={(e) =>
                  handleFilterChange("issueType", e.target.value)
                }
              >
                <option value="all">All Issue Types</option>
                {allIssueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <button
                className="sort-btn"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
                Sort Date
              </button>
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
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-container">
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Source</th>
                  <th>Name</th>
                  <th>Issue Type</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <div
                          className="ticket-id"
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {ticket.ticketId.split("-")[0]}...
                        </div>
                      </td>
                      <td>
                        <span
                          className={`source-badge ${
                            ticket.source === "Fittbot"
                              ? "fittbot"
                              : "fittbot-business"
                          }`}
                        >
                          {ticket.source}
                        </span>
                      </td>
                      <td>
                        <div className="user-name">{ticket.name}</div>
                      </td>
                      <td>
                        <span className="issue-type-badge">
                          {ticket.issueType}
                        </span>
                      </td>
                      <td>
                        <div className="issue-text">
                          {truncateText(ticket.issue)}
                          {ticket.issue.length > 80 && (
                            <button
                              className="view-more-btn"
                              onClick={() => openModal(ticket)}
                            >
                              <FaEye /> View More
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <select
                          className={`status-select ${ticket.status.replace(
                            " ",
                            "-"
                          )}`}
                          value={ticket.status}
                          onChange={(e) =>
                            updateTicketStatus(ticket.id, e.target.value)
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDate(ticket.createdDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No tickets found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startIndex + 1} to{" "}
              {Math.min(
                startIndex + itemsPerPage,
                filteredAndSortedTickets.length
              )}{" "}
              of {filteredAndSortedTickets.length} entries
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

      {/* Modal for full issue description */}
      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Ticket Details</h4>
              <button className="modal-close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="ticket-detail">
                <strong>Ticket ID:</strong>
                <div style={{ color: "#201e1e" }}>
                  {selectedTicket.ticketId}
                </div>
              </div>
              <div className="ticket-detail">
                <strong>Source:</strong>
                <div style={{ color: "#201e1e" }}> {selectedTicket.source}</div>
              </div>
              <div className="ticket-detail">
                <strong>Name:</strong>{" "}
                <div style={{ color: "#201e1e" }}> {selectedTicket.name}</div>
              </div>
              <div className="ticket-detail">
                <strong>Issue Type:</strong>{" "}
                <div style={{ color: "#201e1e" }}>
                  {" "}
                  {selectedTicket.issueType}
                </div>
              </div>
              <div className="ticket-detail">
                <strong>Status:</strong>
                <span
                  className={`status-badge ${selectedTicket.status.replace(
                    " ",
                    "-"
                  )}`}
                >
                  <div style={{ color: "#201e1e" }}>
                    {" "}
                    {selectedTicket.status}
                  </div>
                </span>
              </div>
              <div className="ticket-detail">
                <strong>Issue Description:</strong>
                <p className="issue-description"> {selectedTicket.issue}</p>
              </div>
              <div className="ticket-detail">
                <strong>Created Date:</strong>{" "}
                <div style={{ color: "#201e1e" }}>
                  {" "}
                  {formatDate(selectedTicket.createdDate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .source-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .source-badge.fittbot {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .source-badge.fittbot-business {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }

        .issue-type-badge {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 500;
          background-color: #f5f5f5;
          color: #666;
        }

        .issue-text {
          max-width: 300px;
          line-height: 1.4;
        }

        .view-more-btn {
          background: none;
          border: none;
          color: #ff5757;
          cursor: pointer;
          font-size: 0.75rem;
          margin-left: 8px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .view-more-btn:hover {
          text-decoration: underline;
        }

        .status-select {
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid #ddd;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
        }

        .status-select.yet-to-start {
          background-color: #fff3e0;
          color: #f57c00;
        }

        .status-select.working {
          background-color: #e8f5e8;
          color: #388e3c;
        }

        .status-select.resolved {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          padding: 1rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h4 {
          margin: 0;
          color: #333;
        }

        .modal-close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 1rem;
        }

        .ticket-detail {
          margin-bottom: 1rem;
        }

        .ticket-detail strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .issue-description {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          line-height: 1.6;
          margin-top: 0.5rem;
          color: #000000;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 8px;
        }

        .status-badge.yet-to-start {
          background-color: #fff3e0;
          color: #f57c00;
        }

        .status-badge.working {
          background-color: #e8f5e8;
          color: #388e3c;
        }

        .status-badge.resolved {
          background-color: #f3e5f5;
          color: #7b1fa2;
        }
      `}</style>
    </div>
  );
}
