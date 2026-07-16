"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
  FaUser,
  FaPhone,
  FaVenusMars,
  FaBirthdayCake,
  FaUsers,
  FaBriefcase,
  FaCalendarAlt,
  FaStar,
  FaPlus,
  FaMinus,
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaTimes,
  FaUserPlus,
  FaSearch,
  FaCheck,
  FaUserTie,
} from "react-icons/fa";

const EmployeeDetail = () => {
  // Add custom CSS for better styling
  const customStyles = `
    .search-box {
      position: relative;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #888;
      z-index: 10;
    }
    .search-input {
      background-color: #2a2a2a;
      border: 1px solid #444;
      color: #ffffff;
      padding-left: 40px;
      width: 100%;
      height: 38px;
      border-radius: 6px;
    }
    .search-input:focus {
      outline: none;
      border-color: #FF5757;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 87, 0.25);
    }
    .search-input::placeholder {
      color: #888;
    }
  `;

  // Inject styles
  React.useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    return () => document.head.removeChild(styleElement);
  }, []);

  // Sample employee data - Changed to BDM role
  const [employee, setEmployee] = useState({
    id: 1,
    name: "Rajesh Kumar",
    mobile: "+91 9876543210",
    gender: "Male",
    age: 28,
    team: "marketing",
    role: "BDM", // Changed to BDM
    joinedDate: "2024-01-15",
    appraisalPoints: 85,
    profileImage: null,
    assignedBDEs: [2, 4], // Assigned BDE IDs
    assignedBDM: null, // For BDE employees
  });

  // Sample BDE employees list
  const [allBDEs] = useState([
    {
      id: 2,
      name: "Priya Sharma",
      mobile: "+91 9876543211",
      team: "marketing",
      role: "BDE",
      joinedDate: "2024-02-01",
    },
    {
      id: 3,
      name: "Amit Singh",
      mobile: "+91 9876543212",
      team: "marketing",
      role: "BDE",
      joinedDate: "2024-02-10",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      mobile: "+91 9876543213",
      team: "marketing",
      role: "BDE",
      joinedDate: "2024-02-15",
    },
    {
      id: 5,
      name: "Vikram Patel",
      mobile: "+91 9876543214",
      team: "marketing",
      role: "BDE",
      joinedDate: "2024-02-20",
    },
    {
      id: 6,
      name: "Anita Gupta",
      mobile: "+91 9876543215",
      team: "marketing",
      role: "BDE",
      joinedDate: "2024-03-01",
    },
  ]);

  // Sample BDM for BDE employees
  const [assignedBDM] = useState({
    id: 1,
    name: "Rajesh Kumar",
    mobile: "+91 9876543210",
    role: "BDM",
  });

  const [appraisalHistory, setAppraisalHistory] = useState([
    {
      id: 1,
      type: "add",
      points: 10,
      feedback:
        "Excellent performance on the React project. Delivered ahead of schedule with clean code.",
      date: "2024-03-15",
      addedBy: "John Smith (Manager)",
    },
    {
      id: 2,
      type: "add",
      points: 5,
      feedback:
        "Great collaboration with the design team. Helped resolve UI/UX issues efficiently.",
      date: "2024-02-20",
      addedBy: "Sarah Johnson (Team Lead)",
    },
    {
      id: 3,
      type: "reduce",
      points: -3,
      feedback:
        "Late submission of weekly reports. Need to improve on documentation timelines.",
      date: "2024-02-10",
      addedBy: "John Smith (Manager)",
    },
  ]);

  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [showBDEAssignment, setShowBDEAssignment] = useState(false);
  const [appraisalType, setAppraisalType] = useState("add");
  const [bdeSearchTerm, setBdeSearchTerm] = useState("");
  const [selectedBDEs, setSelectedBDEs] = useState([]);

  const [appraisalForm, setAppraisalForm] = useState({
    points: "",
    feedback: "",
  });

  const teamLabels = {
    software: "Software",
    marketing: "Marketing",
    support: "Support",
    graphic: "Graphic",
  };

  const router = useRouter();

  const getTeamColor = (team) => {
    const colors = {
      software: "#007bff",
      marketing: "#28a745",
      support: "#ffc107",
      graphic: "#6f42c1",
    };
    return colors[team] || "#6c757d";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getAppraisalLevel = (points) => {
    if (points >= 90) return { level: "Excellent", color: "#28a745" };
    if (points >= 75) return { level: "Good", color: "#007bff" };
    if (points >= 60) return { level: "Average", color: "#ffc107" };
    if (points >= 40) return { level: "Below Average", color: "#fd7e14" };
    return { level: "Needs Improvement", color: "#dc3545" };
  };

  const handleAppraisalSubmit = () => {
    if (appraisalForm.points && appraisalForm.feedback) {
      const pointsValue = parseInt(appraisalForm.points);
      const finalPoints = appraisalType === "add" ? pointsValue : -pointsValue;

      const newAppraisal = {
        id: appraisalHistory.length + 1,
        type: appraisalType,
        points: finalPoints,
        feedback: appraisalForm.feedback,
        date: new Date().toISOString().split("T")[0],
        addedBy: "Current User (Manager)",
      };

      setAppraisalHistory([newAppraisal, ...appraisalHistory]);
      setEmployee((prev) => ({
        ...prev,
        appraisalPoints: Math.max(
          0,
          Math.min(100, prev.appraisalPoints + finalPoints)
        ),
      }));

      setAppraisalForm({ points: "", feedback: "" });
      setShowAppraisalForm(false);
    } else {
      alert("Please fill in all fields");
    }
  };

  const openAppraisalForm = (type) => {
    setAppraisalType(type);
    setShowAppraisalForm(true);
  };

  // BDE Assignment Functions
  const openBDEAssignment = () => {
    setSelectedBDEs([...employee.assignedBDEs]);
    setShowBDEAssignment(true);
  };

  const handleBDESelection = (bdeId) => {
    setSelectedBDEs((prev) => {
      if (prev.includes(bdeId)) {
        return prev.filter((id) => id !== bdeId);
      } else {
        return [...prev, bdeId];
      }
    });
  };

  const handleAssignBDEs = () => {
    setEmployee((prev) => ({
      ...prev,
      assignedBDEs: [...selectedBDEs],
    }));
    setShowBDEAssignment(false);
    setBdeSearchTerm("");
  };

  // Filter BDEs based on search
  const filteredBDEs = allBDEs.filter(
    (bde) =>
      bde.name.toLowerCase().includes(bdeSearchTerm.toLowerCase()) ||
      bde.mobile.includes(bdeSearchTerm)
  );

  // Get assigned BDE details
  const getAssignedBDEs = () => {
    return allBDEs.filter((bde) => employee.assignedBDEs.includes(bde.id));
  };

  const appraisalLevel = getAppraisalLevel(employee.appraisalPoints);

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
          <div className="d-flex align-items-center mb-4">
            <button
              className="btn me-3"
              style={{
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                color: "#ffffff",
              }}
              onClick={() => router.push("/portal/admin/employees")}
            >
              <FaArrowLeft />
            </button>
            <h3 className="mb-0" style={{ color: "#ffffff" }}>
              <span style={{ color: "#FF5757" }}>Employee</span> Profile
            </h3>
          </div>

          <div className="row">
            {/* Employee Profile Card */}
            <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
              <div
                className="card h-100"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              >
                <div className="card-body text-center">
                  {/* Profile Picture */}
                  <div className="mb-4">
                    <div
                      className="rounded-circle mx-auto d-flex align-items-center justify-content-center"
                      style={{
                        width: "120px",
                        height: "120px",
                        backgroundColor: "#FF5757",
                        fontSize: "48px",
                        color: "#ffffff",
                      }}
                    >
                      <FaUser />
                    </div>
                  </div>

                  {/* Employee Name */}
                  <h4 className="mb-2" style={{ color: "#ffffff" }}>
                    {employee.name}
                  </h4>

                  {/* Role and Team */}
                  <div className="mb-3">
                    <span
                      className="badge me-2"
                      style={{
                        backgroundColor: getTeamColor(employee.team),
                        fontSize: "12px",
                      }}
                    >
                      {employee.role}
                    </span>
                    <br />
                    <span
                      className="badge mt-2"
                      style={{
                        backgroundColor: getTeamColor(employee.team),
                        opacity: 0.7,
                        fontSize: "11px",
                      }}
                    >
                      {teamLabels[employee.team]} Team
                    </span>
                  </div>

                  {/* Appraisal Points */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-center mb-2">
                      <FaStar className="me-2" style={{ color: "#FFD700" }} />
                      <span
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: appraisalLevel.color,
                        }}
                      >
                        {employee.appraisalPoints}
                      </span>
                      <span className="ms-1" style={{ color: "#888" }}>
                        /100
                      </span>
                    </div>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: appraisalLevel.color,
                        fontSize: "12px",
                      }}
                    >
                      {appraisalLevel.level}
                    </span>
                  </div>

                  {/* Appraisal Action Buttons */}
                  <div className="d-grid gap-2">
                    <button
                      className="btn"
                      onClick={() => openAppraisalForm("add")}
                      style={{
                        backgroundColor: "#28a745",
                        color: "#ffffff",
                        border: "none",
                      }}
                    >
                      <FaPlus className="me-2" />
                      Add Appraisal Points
                    </button>
                    <button
                      className="btn"
                      onClick={() => openAppraisalForm("reduce")}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "#ffffff",
                        border: "none",
                      }}
                    >
                      <FaMinus className="me-2" />
                      Reduce Appraisal Points
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div className="col-lg-8 col-md-6 col-sm-12 mb-4">
              <div
                className="card h-100"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              >
                <div
                  className="card-header d-flex justify-content-between align-items-center"
                  style={{
                    backgroundColor: "#2a2a2a",
                    borderBottom: "1px solid #444",
                  }}
                >
                  <h5 className="mb-0" style={{ color: "#ffffff" }}>
                    <FaUser className="me-2" style={{ color: "#FF5757" }} />
                    Employee Information
                  </h5>
                  {/* Assign BDE Button for BDM */}
                  {employee.role === "BDM" && (
                    <button
                      className="btn btn-sm"
                      onClick={openBDEAssignment}
                      style={{
                        backgroundColor: "#FF5757",
                        color: "#ffffff",
                        border: "none",
                      }}
                    >
                      <FaUserPlus className="me-2" />
                      Assign BDE
                    </button>
                  )}
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaPhone
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Mobile Number</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {employee.mobile}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaVenusMars
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Gender</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {employee.gender}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaBirthdayCake
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Age</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {employee.age} years
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaUsers
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Team</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {teamLabels[employee.team]}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaBriefcase
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Position</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {employee.role}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt
                          className="me-3"
                          style={{ color: "#FF5757", width: "20px" }}
                        />
                        <div>
                          <small style={{ color: "#888" }}>Joined Date</small>
                          <div style={{ color: "#ffffff", fontWeight: "500" }}>
                            {formatDate(employee.joinedDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show Assigned BDEs for BDM */}
                    {employee.role === "BDM" &&
                      getAssignedBDEs().length > 0 && (
                        <div className="col-12 mb-3">
                          <div className="d-flex align-items-start">
                            <FaUsers
                              className="me-3 mt-1"
                              style={{ color: "#FF5757", width: "20px" }}
                            />
                            <div className="flex-grow-1">
                              <small style={{ color: "#888" }}>
                                Assigned BDEs
                              </small>
                              <div className="mt-2">
                                {getAssignedBDEs().map((bde) => (
                                  <span
                                    key={bde.id}
                                    className="badge me-2 mb-2"
                                    style={{
                                      backgroundColor: "#28a745",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {bde.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Show Assigned BDM for BDE */}
                    {employee.role === "BDE" && (
                      <div className="col-12 mb-3">
                        <div className="d-flex align-items-center">
                          <FaUserTie
                            className="me-3"
                            style={{ color: "#FF5757", width: "20px" }}
                          />
                          <div>
                            <small style={{ color: "#888" }}>
                              Reporting BDM
                            </small>
                            <div
                              style={{ color: "#ffffff", fontWeight: "500" }}
                            >
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: "#007bff",
                                  fontSize: "12px",
                                }}
                              >
                                {assignedBDM.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appraisal History */}
          <div className="row">
            <div className="col-12">
              <div
                className="card"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
              >
                <div
                  className="card-header"
                  style={{
                    backgroundColor: "#2a2a2a",
                    borderBottom: "1px solid #444",
                  }}
                >
                  <h5 className="mb-0" style={{ color: "#ffffff" }}>
                    <FaStar className="me-2" style={{ color: "#FFD700" }} />
                    Appraisal History
                  </h5>
                </div>
                <div className="card-body">
                  {appraisalHistory.length > 0 ? (
                    <div className="timeline">
                      {appraisalHistory.map((item) => (
                        <div key={item.id} className="mb-4">
                          <div className="d-flex">
                            <div className="me-3">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  backgroundColor:
                                    item.type === "add" ? "#28a745" : "#dc3545",
                                }}
                              >
                                {item.type === "add" ? <FaPlus /> : <FaMinus />}
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <span
                                    className="badge me-2"
                                    style={{
                                      backgroundColor:
                                        item.type === "add"
                                          ? "#28a745"
                                          : "#dc3545",
                                    }}
                                  >
                                    {item.points > 0
                                      ? `+${item.points}`
                                      : item.points}{" "}
                                    points
                                  </span>
                                  <small style={{ color: "#888" }}>
                                    {formatDate(item.date)}
                                  </small>
                                </div>
                              </div>
                              <p className="mb-1" style={{ color: "#ffffff" }}>
                                {item.feedback}
                              </p>
                              <small style={{ color: "#888" }}>
                                Added by: {item.addedBy}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4" style={{ color: "#888" }}>
                      No appraisal history available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BDE Assignment Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showBDEAssignment ? "show" : ""}`}
        style={{
          backgroundColor: "#1a1a1a",
          visibility: showBDEAssignment ? "visible" : "hidden",
          width: "400px",
        }}
      >
        <div
          className="offcanvas-header"
          style={{ borderBottom: "1px solid #444" }}
        >
          <h5 className="offcanvas-title" style={{ color: "#ffffff" }}>
            <FaUserPlus className="me-2" style={{ color: "#FF5757" }} />
            Assign BDEs to {employee.name}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowBDEAssignment(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          {/* Search Box */}
          <div className="mb-3">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search BDEs..."
                value={bdeSearchTerm}
                onChange={(e) => setBdeSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* BDE List */}
          <div
            className="mb-3"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {filteredBDEs.length > 0 ? (
              filteredBDEs.map((bde) => (
                <div
                  key={bde.id}
                  className="d-flex align-items-center justify-content-between p-3 mb-2"
                  style={{
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleBDESelection(bde.id)}
                >
                  <div className="flex-grow-1">
                    <div style={{ color: "#ffffff", fontWeight: "500" }}>
                      {bde.name}
                    </div>
                    <small style={{ color: "#888" }}>
                      {bde.mobile} • Joined: {formatDate(bde.joinedDate)}
                    </small>
                  </div>
                  <div>
                    {selectedBDEs.includes(bde.id) && (
                      <FaCheck style={{ color: "#28a745", fontSize: "18px" }} />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4" style={{ color: "#888" }}>
                No BDEs found
              </div>
            )}
          </div>

          {/* Selected Count */}
          <div className="mb-3">
            <small style={{ color: "#888" }}>
              Selected: {selectedBDEs.length} BDE(s)
            </small>
          </div>

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn"
              onClick={handleAssignBDEs}
              style={{
                backgroundColor: "#28a745",
                color: "#ffffff",
                border: "none",
              }}
            >
              <FaSave className="me-2" />
              Assign Selected BDEs
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setShowBDEAssignment(false)}
              style={{
                backgroundColor: "#2a2a2a",
                border: "1px solid #444",
                color: "#ffffff",
              }}
            >
              <FaTimes className="me-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Appraisal Form Offcanvas */}
      <div
        className={`offcanvas offcanvas-end ${showAppraisalForm ? "show" : ""}`}
        style={{
          backgroundColor: "#1a1a1a",
          visibility: showAppraisalForm ? "visible" : "hidden",
        }}
      >
        <div
          className="offcanvas-header"
          style={{ borderBottom: "1px solid #444" }}
        >
          <h5 className="offcanvas-title" style={{ color: "#ffffff" }}>
            {appraisalType === "add" ? (
              <FaPlus className="me-2" style={{ color: "#28a745" }} />
            ) : (
              <FaMinus className="me-2" style={{ color: "#dc3545" }} />
            )}
            {appraisalType === "add" ? "Add" : "Reduce"} Appraisal Points
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={() => setShowAppraisalForm(false)}
          ></button>
        </div>
        <div className="offcanvas-body">
          <div>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Points {appraisalType === "add" ? "to Add" : "to Reduce"} *
              </label>
              <input
                type="number"
                className="form-control"
                value={appraisalForm.points}
                onChange={(e) =>
                  setAppraisalForm({ ...appraisalForm, points: e.target.value })
                }
                min="1"
                max="20"
                placeholder="Enter points (1-20)"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              />
              <small style={{ color: "#888" }}>
                Maximum 20 points per transaction
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#ffffff" }}>
                Feedback/Reason *
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={appraisalForm.feedback}
                onChange={(e) =>
                  setAppraisalForm({
                    ...appraisalForm,
                    feedback: e.target.value,
                  })
                }
                placeholder="Provide detailed feedback for this appraisal change..."
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              ></textarea>
            </div>

            <div className="mb-3">
              <div
                className="alert"
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <strong>Current Points:</strong> {employee.appraisalPoints}/100
                <br />
                <strong>After Change:</strong>{" "}
                {Math.max(
                  0,
                  Math.min(
                    100,
                    employee.appraisalPoints +
                      (appraisalType === "add"
                        ? parseInt(appraisalForm.points || 0)
                        : -parseInt(appraisalForm.points || 0))
                  )
                )}
              </div>
            </div>

            <div className="d-grid gap-2">
              <button
                type="button"
                className="btn"
                onClick={handleAppraisalSubmit}
                style={{
                  backgroundColor:
                    appraisalType === "add" ? "#28a745" : "#dc3545",
                  color: "#ffffff",
                  border: "none",
                }}
              >
                <FaSave className="me-2" />
                {appraisalType === "add" ? "Add" : "Reduce"} Points
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowAppraisalForm(false)}
                style={{
                  backgroundColor: "#2a2a2a",
                  border: "1px solid #444",
                  color: "#ffffff",
                }}
              >
                <FaTimes className="me-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for offcanvas */}
      {(showAppraisalForm || showBDEAssignment) && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => {
            setShowAppraisalForm(false);
            setShowBDEAssignment(false);
          }}
        ></div>
      )}
    </>
  );
};

export default EmployeeDetail;
