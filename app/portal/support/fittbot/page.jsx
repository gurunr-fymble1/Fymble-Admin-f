"use client";
import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaTimes,
  FaClock,
  FaPlay,
  FaCheck,
  FaUser,
  FaExclamationTriangle,
  FaComment,
  FaEdit,
  FaCalendarAlt,
  FaHistory,
  FaUserPlus,
  FaExchangeAlt,
} from "react-icons/fa";

const FittbotTicketsPage = () => {
  // Mock support agents
  const supportAgents = [
    { id: 1, name: "Rahul Sharma", email: "rahul@fittbot.com", avatar: "RS" },
    { id: 2, name: "Priya Singh", email: "priya@fittbot.com", avatar: "PS" },
    { id: 3, name: "Amit Kumar", email: "amit@fittbot.com", avatar: "AK" },
    { id: 4, name: "Sneha Patel", email: "sneha@fittbot.com", avatar: "SP" },
    { id: 5, name: "Vikram Reddy", email: "vikram@fittbot.com", avatar: "VR" },
  ];

  // Fittbot tickets data
  const [fittbotTickets, setFittbotTickets] = useState([
    {
      id: 1,
      ticketId: "FB-2024-001",
      name: "Rajesh Kumar",
      email: "rajesh@gmail.com",
      issueType: "Technical",
      issue:
        "App crashes when trying to log workout data. The application freezes completely and requires force close. This happens consistently after entering exercise details and trying to save the workout session.",
      status: "yet to start",
      assignedTo: null,
      createdDate: "2024-07-08",
      dueDate: "2024-07-15",
      lastUpdated: "2024-07-08",
      comments: [],
      tags: ["app-crash", "workout-data"],
    },
    {
      id: 2,
      ticketId: "FB-2024-002",
      name: "Priya Sharma",
      email: "priya@gmail.com",
      issueType: "Subscription",

      issue:
        "Payment was deducted but subscription not activated. Premium features are still locked despite successful payment confirmation from bank.",
      status: "working",
      assignedTo: supportAgents[0],
      createdDate: "2024-07-07",
      dueDate: "2024-07-14",
      lastUpdated: "2024-07-09",
      comments: [
        {
          id: 1,
          author: "Rahul Sharma",
          text: "Checking payment gateway logs",
          timestamp: "2024-07-09 10:30",
        },
      ],
      tags: ["payment", "subscription"],
    },
    {
      id: 3,
      ticketId: "FB-2024-003",
      name: "Amit Singh",
      email: "amit@gmail.com",
      issueType: "App Usage",

      issue:
        "Cannot sync workout data with fitness tracker. The app shows 'sync failed' error whenever attempting to connect with Fitbit device.",
      status: "resolved",
      assignedTo: supportAgents[1],
      createdDate: "2024-07-06",
      dueDate: "2024-07-13",
      lastUpdated: "2024-07-10",
      comments: [
        {
          id: 1,
          author: "Priya Singh",
          text: "Issue resolved by updating device permissions",
          timestamp: "2024-07-10 14:20",
        },
      ],
      tags: ["fitbit", "sync", "resolved"],
    },
    {
      id: 4,
      ticketId: "FB-2024-004",
      name: "Sneha Reddy",
      email: "sneha@gmail.com",
      issueType: "Other",

      issue:
        "Profile picture upload not working. Every time I try to upload a new profile picture, it shows 'upload failed' message.",
      status: "yet to start",
      assignedTo: null,
      createdDate: "2024-07-08",
      dueDate: "2024-07-22",
      lastUpdated: "2024-07-08",
      comments: [],
      tags: ["profile", "upload"],
    },
    {
      id: 5,
      ticketId: "FB-2024-005",
      name: "Vikram Patel",
      email: "vikram@gmail.com",
      issueType: "Technical",

      issue:
        "GPS tracking not working during outdoor runs. The app fails to track location and distance covered during jogging sessions.",
      status: "working",
      assignedTo: supportAgents[2],
      createdDate: "2024-07-04",
      dueDate: "2024-07-11",
      lastUpdated: "2024-07-09",
      comments: [
        {
          id: 1,
          author: "Amit Kumar",
          text: "Testing GPS permissions and location services",
          timestamp: "2024-07-09 09:15",
        },
      ],
      tags: ["gps", "tracking", "outdoor"],
    },
    {
      id: 6,
      ticketId: "FB-2024-006",
      name: "Kavya Nair",
      email: "kavya@gmail.com",
      issueType: "Subscription",

      issue:
        "Auto-renewal disabled but still getting charged. Despite turning off auto-renewal from settings, the subscription was renewed automatically.",
      status: "yet to start",
      assignedTo: null,
      createdDate: "2024-07-07",
      dueDate: "2024-07-14",
      lastUpdated: "2024-07-07",
      comments: [],
      tags: ["auto-renewal", "billing"],
    },
  ]);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newComment, setNewComment] = useState("");

  // Constants
  const statusOptions = ["yet to start", "working", "resolved"];
  const fittbotIssueTypes = ["Technical", "Subscription", "App Usage", "Other"];

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const canAssign = (status) => {
    return status === "yet to start";
  };

  const canChangeAssignment = (status) => {
    return status === "working" || status === "resolved";
  };

  // Assignment functions
  const assignTicket = (ticketId, agent) => {
    const updatedTickets = fittbotTickets.map((ticket) => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          assignedTo: agent,
          status: ticket.status === "yet to start" ? "working" : ticket.status,
          lastUpdated: new Date().toISOString().split("T")[0],
          comments: [
            ...ticket.comments,
            {
              id: ticket.comments.length + 1,
              author: "System",
              text: `Ticket assigned to ${agent.name}`,
              timestamp: new Date().toLocaleString(),
            },
          ],
        };
      }
      return ticket;
    });
    setFittbotTickets(updatedTickets);
    setShowAssignModal(false);
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    const ticket = fittbotTickets.find((t) => t.id === ticketId);

    // Prevent changing to "working" without assignment
    if (newStatus === "working" && !ticket.assignedTo) {
      alert(
        "Please assign the ticket to someone before changing status to 'working'"
      );
      return;
    }

    const updatedTickets = fittbotTickets.map((ticket) => {
      if (ticket.id === ticketId) {
        return {
          ...ticket,
          status: newStatus,
          lastUpdated: new Date().toISOString().split("T")[0],
          comments: [
            ...ticket.comments,
            {
              id: ticket.comments.length + 1,
              author: "System",
              text: `Status changed to ${newStatus}`,
              timestamp: new Date().toLocaleString(),
            },
          ],
        };
      }
      return ticket;
    });
    setFittbotTickets(updatedTickets);
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const updatedTickets = fittbotTickets.map((ticket) => {
      if (ticket.id === selectedTicket.id) {
        const updatedTicket = {
          ...ticket,
          comments: [
            ...ticket.comments,
            {
              id: ticket.comments.length + 1,
              author: "Support Agent",
              text: newComment,
              timestamp: new Date().toLocaleString(),
            },
          ],
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        setSelectedTicket(updatedTicket);
        return updatedTicket;
      }
      return ticket;
    });
    setFittbotTickets(updatedTickets);
    setNewComment("");
  };

  // Filtered and sorted tickets
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = fittbotTickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesIssueType =
        issueTypeFilter === "all" || ticket.issueType === issueTypeFilter;
      const matchesAssignee =
        assigneeFilter === "all" ||
        (assigneeFilter === "unassigned" && !ticket.assignedTo) ||
        (ticket.assignedTo &&
          ticket.assignedTo.id.toString() === assigneeFilter);

      return (
        matchesSearch && matchesStatus && matchesIssueType && matchesAssignee
      );
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.createdDate);
      const dateB = new Date(b.createdDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [
    fittbotTickets,
    searchTerm,
    statusFilter,
    issueTypeFilter,
    assigneeFilter,
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
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "issueType") setIssueTypeFilter(value);
    if (filterType === "assignee") setAssigneeFilter(value);
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

  const openModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const openAssignModal = (ticket) => {
    setSelectedTicket(ticket);
    setShowAssignModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
    setNewComment("");
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTicket(null);
  };

  return (
    <div className="dashboard-container">
      {/* Support Tickets Section */}
      <div className="section-container">
        <h3 className="section-heading">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Support Tickets
        </h3>
        <div className="row g-4">
          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Total Tickets</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-number">
                      {fittbotTickets.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Unassigned</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-number urgent">
                      {fittbotTickets.filter((t) => !t.assignedTo).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Working</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-number">
                      {
                        fittbotTickets.filter((t) => t.status === "working")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom">
                <h6 className="card-title">Unresolved</h6>
              </div>
              <div className="card-body-custom">
                <div className="ticket-breakdown">
                  <div className="ticket-item">
                    <span className="ticket-number urgent">
                      {fittbotTickets.filter((t) => !t.assignedTo).length}
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
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
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
                {fittbotIssueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6 col-sm-12">
              <select
                className="filter-select"
                value={assigneeFilter}
                onChange={(e) => handleFilterChange("assignee", e.target.value)}
              >
                <option value="all">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {supportAgents.map((agent) => (
                  <option key={agent.id} value={agent.id.toString()}>
                    {agent.name}
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
                  <th>Customer</th>
                  <th>Issue Type</th>

                  <th>Issue</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th> Date</th>
                  <th>Actions</th>
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
                            fontWeight: "600",
                            color: "#007bff",
                          }}
                        >
                          {ticket.ticketId}
                        </div>
                      </td>
                      <td>
                        <div className="user-name">{ticket.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>
                          {ticket.email}
                        </div>
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
                      <td>
                        <div className="assignee-cell">
                          {ticket.assignedTo ? (
                            <div className="assignee-info">
                              <div className="avatar">
                                {ticket.assignedTo.avatar}
                              </div>
                              <span>{ticket.assignedTo.name}</span>
                            </div>
                          ) : (
                            <span className="unassigned">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(ticket.dueDate)}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="action-btn view"
                            onClick={() => openModal(ticket)}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          {canAssign(ticket.status) && (
                            <button
                              className="action-btn assign"
                              onClick={() => openAssignModal(ticket)}
                              title="Assign Ticket"
                            >
                              <FaUserPlus />
                            </button>
                          )}
                          {canChangeAssignment(ticket.status) &&
                            ticket.assignedTo && (
                              <button
                                className="action-btn reassign"
                                onClick={() => openAssignModal(ticket)}
                                title="Change Assignment"
                              >
                                <FaExchangeAlt />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
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
          <div
            className="modal-content large-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h4>Ticket Details - {selectedTicket.ticketId}</h4>
              <button className="modal-close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="ticket-details-grid">
                <div className="detail-section">
                  <h4>Ticket Information</h4>
                  <div className="detail-row">
                    <span className="label">Customer:</span>
                    <span className="text-dark">
                      {selectedTicket.name} ({selectedTicket.email})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Issue Type:</span>
                    <span className="text-dark">
                      {selectedTicket.issueType}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className="text-dark">{selectedTicket.status}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Assigned To:</span>
                    <span>
                      {selectedTicket.assignedTo ? (
                        <div className="assignee-info text-dark">
                          <div className="avatar">
                            {selectedTicket.assignedTo.avatar}
                          </div>
                          {selectedTicket.assignedTo.name}
                        </div>
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Created:</span>
                    <span className="text-dark">
                      {formatDate(selectedTicket.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Issue Description</h4>
                  <div className="issue-description">
                    {selectedTicket.issue}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedTicket && (
        <div className="modal-overlay" onClick={closeAssignModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>
                {selectedTicket.assignedTo
                  ? "Change Assignment"
                  : "Assign Ticket"}
              </h4>
              <button className="modal-close-btn" onClick={closeAssignModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="ticket-info">
                <p>
                  <strong>Ticket:</strong> {selectedTicket.ticketId}
                </p>
                <p>
                  <strong>Customer:</strong> {selectedTicket.name}
                </p>
                {selectedTicket.assignedTo && (
                  <p>
                    <strong>Currently assigned to:</strong>{" "}
                    {selectedTicket.assignedTo.name}
                  </p>
                )}
              </div>

              <div className="agents-list">
                <h4>Select Agent:</h4>
                {supportAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="agent-option"
                    onClick={() => assignTicket(selectedTicket.id, agent)}
                  >
                    <div className="avatar">{agent.avatar}</div>
                    <div className="agent-details">
                      <div className="name">{agent.name}</div>
                      <div className="email">{agent.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .assignee-cell {
          min-width: 150px;
        }

        .assignee-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }

        .unassigned {
          color: #999;
          font-style: italic;
        }

        .actions {
          display: flex;
          gap: 5px;
        }

        .action-btn {
          padding: 8px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .action-btn.view {
          background: #007bff;
          color: white;
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

        .action-btn.assign {
          background: #28a745;
          color: white;
        }

        .action-btn.reassign {
          background: #ffc107;
          color: #333;
        }

        .action-btn:hover {
          opacity: 0.8;
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
        .detail-section h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 16px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 5px;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .detail-row .label {
          font-weight: 600;
          color: #666;
        }

        .issue-description {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          line-height: 1.6;
          margin-bottom: 20px;
          color: #000000;
        }

        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .tag {
          background: #007bff;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .ticket-info {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .ticket-info p {
          margin: 5px 0;
        }

        .agents-list h4 {
          margin-bottom: 15px;
          color: #333;
        }

        .agent-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 6px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .agent-option:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .agent-details .name {
          font-weight: 500;
          color: #333;
        }

        .agent-details .email {
          font-size: 12px;
          color: #666;
        }

        @media (max-width: 768px) {
          .ticket-details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default FittbotTicketsPage;
