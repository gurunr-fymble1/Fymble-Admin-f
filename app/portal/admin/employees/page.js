"use client";
import { useRouter } from "next/navigation";
import React, { useState, useMemo } from "react";
import {
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaUser,
  FaUserTie,
  FaCog,
} from "react-icons/fa";

const Employees = () => {
  // Initial roles data
  const [roles] = useState([
    // Software Team
    { id: 1, name: "Junior Frontend Developer", team: "software" },
    { id: 2, name: "Frontend Developer", team: "software" },
    { id: 3, name: "Senior Frontend Developer", team: "software" },
    { id: 4, name: "Junior Backend Developer", team: "software" },
    { id: 5, name: "Backend Developer", team: "software" },
    { id: 6, name: "Senior Backend Developer", team: "software" },
    { id: 7, name: "Junior Full Stack Developer", team: "software" },
    { id: 8, name: "Full Stack Developer", team: "software" },
    { id: 9, name: "Senior Full Stack Developer", team: "software" },
    { id: 10, name: "WordPress Developer", team: "software" },
    { id: 11, name: "AI/ML Engineer", team: "software" },
    { id: 12, name: "Support Ticket Developer", team: "software" },
    { id: 13, name: "Data Analyst", team: "software" },
    // Marketing Team
    { id: 14, name: "BDM", team: "marketing" },
    { id: 15, name: "BDE", team: "marketing" },
    // Support Team
    { id: 16, name: "Support Staff", team: "support" },
    { id: 17, name: "Telecaller", team: "support" },
    { id: 18, name: "Cameraman", team: "support" },
    { id: 19, name: "Field Worker", team: "support" },
    // Graphic Team
    { id: 20, name: "Junior UI/UX Designer", team: "graphic" },
    { id: 21, name: "UI/UX Designer", team: "graphic" },
    { id: 22, name: "Senior UI/UX Designer", team: "graphic" },
    { id: 23, name: "Junior Graphic Designer", team: "graphic" },
    { id: 24, name: "Graphic Designer", team: "graphic" },
    { id: 25, name: "Senior Graphic Designer", team: "graphic" },
    { id: 26, name: "Junior 3D Designer", team: "graphic" },
    { id: 27, name: "3D Designer", team: "graphic" },
    { id: 28, name: "Senior 3D Designer", team: "graphic" },
  ]);

  // Sample employees data
  const [allEmployees, setAllEmployees] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      gender: "Male",
      age: 28,
      position: "Senior Frontend Developer",
      team: "software",
      dateOfJoining: "2024-01-15",
      location: "Bengaluru",
      appraisalPoint: 80,
      mobile: 9987897289,
    },
    {
      id: 2,
      name: "Priya Sharma",
      gender: "Female",
      age: 26,
      position: "UI/UX Designer",
      team: "graphic",
      dateOfJoining: "2024-02-20",
      location: "Mumbai",
      appraisalPoint: 60,
      mobile: 9984597789,
    },
    {
      id: 3,
      name: "Amit Singh",
      gender: "Male",
      age: 32,
      position: "Full Stack Developer",
      team: "software",
      dateOfJoining: "2024-01-10",
      location: "Delhi",
      appraisalPoint: 99,
      mobile: 9984589457,
    },
    {
      id: 6,
      name: "Srinivas",
      gender: "Male",
      age: 42,
      position: "BDM",
      team: "marketing",
      dateOfJoining: "2024-01-10",
      location: "Pune",
      appraisalPoint: 75,
      mobile: 9784553457,
    },
    {
      id: 4,
      name: "Sneha Reddy",
      gender: "Female",
      age: 24,
      position: "BDE",
      team: "marketing",
      dateOfJoining: "2024-03-05",
      location: "Hyderabad",
      appraisalPoint: 60,
      mobile: 95675553457,
    },
    {
      id: 5,
      name: "Vikram Patel",
      gender: "Male",
      age: 30,
      position: "Backend Developer",
      team: "software",
      dateOfJoining: "2024-02-12",
      location: "Pune",
      appraisalPoint: 72,
      mobile: 9384353357,
    },
  ]);

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    gender: "",
    age: "",
    mobile: "",
    position: "",
    team: "",
    dateOfJoining: "",
    location: "",
    appraisalPoint: 60,
  });

  const [roleForm, setRoleForm] = useState({
    name: "",
    team: "",
  });

  const teams = ["software", "marketing", "support", "graphic"];
  const teamLabels = {
    software: "Software",
    marketing: "Marketing",
    support: "Support",
    graphic: "Graphic",
  };

  // Filtered and sorted data
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = allEmployees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTeam = teamFilter === "all" || employee.team === teamFilter;
      const matchesRole =
        roleFilter === "all" || employee.position === roleFilter;

      return matchesSearch && matchesTeam && matchesRole;
    });

    // Sort by joining date
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateOfJoining);
      const dateB = new Date(b.dateOfJoining);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [allEmployees, searchTerm, teamFilter, roleFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedEmployees.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredAndSortedEmployees.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "team") setTeamFilter(value);
    if (filterType === "role") setRoleFilter(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleAddEmployee = () => {
    if (
      employeeForm.name &&
      employeeForm.position &&
      employeeForm.team &&
      employeeForm.gender &&
      employeeForm.age &&
      employeeForm.dateOfJoining &&
      employeeForm.location
    ) {
      const newEmployee = {
        id: allEmployees.length + 1,
        ...employeeForm,
        age: parseInt(employeeForm.age),
      };
      setAllEmployees([...allEmployees, newEmployee]);
      setEmployeeForm({
        name: "",
        gender: "",
        age: "",
        position: "",
        team: "",
        dateOfJoining: "",
        location: "",
      });
      setShowAddEmployee(false);
    } else {
      alert("Please fill in all required fields");
    }
  };

  const handleAddRole = () => {
    if (roleForm.name && roleForm.team) {
      // Here you would typically update the roles state
      // For now, we'll just close the form
      setRoleForm({ name: "", team: "" });
      setShowAddRole(false);
      alert("Role added successfully!");
    } else {
      alert("Please fill in all required fields");
    }
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

  const getTeamBadgeColor = (team) => {
    const colors = {
      software: "#007bff",
      marketing: "#28a745",
      support: "#ffc107",
      graphic: "#6f42c1",
    };
    return colors[team] || "#6c757d";
  };

  const router = useRouter();

  return (
    <>
      <div
        style={{
          backgroundColor: "#121717",
          minHeight: "100vh",
          color: "#ffffff",
          padding: "20px",
        }}
      >
        <div className="container-fluid">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1" style={{ color: "#ffffff" }}>
                <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Employees
              </h2>
              <div style={{ color: "#888" }}>
                Total: {filteredAndSortedEmployees.length} employees
              </div>
            </div>
            <div>
              <button
                className="btn me-2"
                style={{
                  backgroundColor: "#FF5757",
                  color: "#ffffff",
                  border: "none",
                }}
                onClick={() => setShowAddRole(true)}
              >
                <FaCog className="me-2" />
                Add Role
              </button>
              <button
                className="btn"
                style={{
                  backgroundColor: "#FF5757",
                  color: "#ffffff",
                  border: "none",
                }}
                onClick={() => setShowAddEmployee(true)}
              >
                <FaPlus className="me-2" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="row pb-0">
              <div className="col-lg-3 col-md-6 col-sm-12 mb-2">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, location, position..."
                    value={searchTerm}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="col-lg-2 col-md-6 col-sm-12 mb-2">
                <select
                  className="form-select"
                  value={teamFilter}
                  onChange={(e) => handleFilterChange("team", e.target.value)}
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    color: "#ffffff",
                  }}
                >
                  <option value="all">All Teams</option>
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {teamLabels[team]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-2 col-md-6 col-sm-12 mb-2">
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    color: "#ffffff",
                  }}
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-lg-2 col-md-6 col-sm-12 mb-2">
                <button
                  className="btn w-100"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    color: "#ffffff",
                  }}
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
                  <span className="ms-2">Sort Date</span>
                </button>
              </div>

              <div className="col-lg-2 col-md-6 col-sm-12 mb-2">
                <select
                  className="form-select"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    color: "#ffffff",
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
                  <tr style={{ backgroundColor: "#2a2a2a" }}>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Position</th>
                    <th>Team</th>
                    <th>AP </th>
                    <th>Joined Date</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        onClick={() =>
                          router.push("/portal/admin/employeedetail")
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            {employee.name}
                          </div>
                        </td>
                        <td>{employee.mobile}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getTeamBadgeColor(employee.team),
                            }}
                          >
                            {employee.position}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getTeamBadgeColor(employee.team),
                              opacity: 0.7,
                            }}
                          >
                            {teamLabels[employee.team]}
                          </span>
                        </td>
                        <td>{employee.appraisalPoint}</td>
                        <td>{formatDate(employee.dateOfJoining)}</td>
                        <td>{employee.location}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        No employees found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div style={{ color: "#888" }}>
                Showing {startIndex + 1} to{" "}
                {Math.min(
                  startIndex + itemsPerPage,
                  filteredAndSortedEmployees.length
                )}{" "}
                of {filteredAndSortedEmployees.length} entries
              </div>

              <nav>
                <ul className="pagination mb-0">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
                        color: "#ffffff",
                      }}
                    >
                      <FaChevronLeft />
                    </button>
                  </li>

                  {getPaginationNumbers().map((page, index) => (
                    <li
                      key={index}
                      className={`page-item ${
                        page === currentPage ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() =>
                          typeof page === "number" && setCurrentPage(page)
                        }
                        disabled={page === "..."}
                        style={{
                          backgroundColor:
                            page === currentPage ? "#FF5757" : "#2a2a2a",
                          border: "1px solid #444",
                          color: "#ffffff",
                        }}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        backgroundColor: "#2a2a2a",
                        border: "1px solid #444",
                        color: "#ffffff",
                      }}
                    >
                      <FaChevronRight />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showAddEmployee ? "show" : ""}`}
        style={{
          backgroundColor: "#1a1a1a",
          visibility: showAddEmployee ? "visible" : "hidden",
        }}
      >
        <div
          className="offcanvas-header"
          style={{ borderBottom: "1px solid #444" }}
        >
          <h5 className="offcanvas-title" style={{ color: "#ffffff" }}>
            <FaUserTie className="me-2" style={{ color: "#FF5757" }} />
            Add New Employee
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowAddEmployee(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          <div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Name *
              </label>
              <input
                type="text"
                className="form-control"
                value={employeeForm.name}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, name: e.target.value })
                }
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Mobile Number *
              </label>
              <input
                type="text"
                className="form-control"
                value={employeeForm.mobile}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, mobile: e.target.value })
                }
                maxLength={10}
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Gender *
              </label>
              <select
                className="form-select"
                value={employeeForm.gender}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, gender: e.target.value })
                }
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Age *
              </label>
              <input
                type="number"
                className="form-control"
                value={employeeForm.age}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, age: e.target.value })
                }
                required
                min="18"
                max="65"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Team *
              </label>
              <select
                className="form-select"
                value={employeeForm.team}
                onChange={(e) =>
                  setEmployeeForm({
                    ...employeeForm,
                    team: e.target.value,
                    position: "",
                  })
                }
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {teamLabels[team]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Position *
              </label>
              <select
                className="form-select"
                value={employeeForm.position}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, position: e.target.value })
                }
                required
                disabled={!employeeForm.team}
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <option value="">Select Position</option>
                {roles
                  .filter((role) => role.team === employeeForm.team)
                  .map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Date of Joining *
              </label>
              <input
                type="date"
                className="form-control"
                value={employeeForm.dateOfJoining}
                onChange={(e) =>
                  setEmployeeForm({
                    ...employeeForm,
                    dateOfJoining: e.target.value,
                  })
                }
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Location *
              </label>
              <input
                type="text"
                className="form-control"
                value={employeeForm.location}
                onChange={(e) =>
                  setEmployeeForm({ ...employeeForm, location: e.target.value })
                }
                required
                placeholder="e.g., Bengaluru, Mumbai, Delhi"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn"
                onClick={handleAddEmployee}
                style={{
                  backgroundColor: "#FF5757",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Add Employee
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowAddEmployee(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Role Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showAddRole ? "show" : ""}`}
        style={{
          backgroundColor: "#1a1a1a",
          visibility: showAddRole ? "visible" : "hidden",
        }}
      >
        <div
          className="offcanvas-header"
          style={{ borderBottom: "1px solid #444" }}
        >
          <h5 className="offcanvas-title" style={{ color: "#ffffff" }}>
            <FaCog className="me-2" style={{ color: "#FF5757" }} />
            Add New Role
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowAddRole(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          <div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Role Name *
              </label>
              <input
                type="text"
                className="form-control"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
                required
                placeholder="e.g., Associate Developer"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Team *
              </label>
              <select
                className="form-select"
                value={roleForm.team}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, team: e.target.value })
                }
                required
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {teamLabels[team]}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn"
                onClick={handleAddRole}
                style={{
                  backgroundColor: "#FF5757",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                Add Role
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowAddRole(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for offcanvas */}
      {(showAddEmployee || showAddRole) && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => {
            setShowAddEmployee(false);
            setShowAddRole(false);
          }}
        ></div>
      )}
    </>
  );
};

export default Employees;
