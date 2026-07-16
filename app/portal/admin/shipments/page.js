"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaShippingFast,
  FaBoxOpen,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTabletAlt,
  FaUser,
  FaUserTie,
} from "react-icons/fa";

export default function Shipments() {
  const searchParams = useSearchParams();

  // Get URL parameters
  const gymFromUrl = searchParams.get("gym") || "";
  const statusFromUrl = searchParams.get("status") || "all";
  const bdeFromUrl = searchParams.get("bde") || "";

  // Dummy shipment data with BDM/BDE context
  const [allShipments] = useState([
    {
      id: 1,
      modelNumber: "XPAD-FH-001",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness Hub",
      bdm: "Rajesh Kumar",
      bde: "Amit Singh",
      status: "delivered",
      trackingNumber: "INX123456789",
      receiptDate: "2024-03-10",
      assignedDate: "2024-03-12",
      deliveredDate: "2024-03-15",
    },
    {
      id: 2,
      modelNumber: "XPAD-PGE-002",

      tabletModel: "Infinix XPAD",
      gymName: "PowerGym Elite",
      bdm: "Priya Sharma",
      bde: "Vikram Patel",
      status: "shipped",
      trackingNumber: "INX123456790",
      receiptDate: "2024-03-12",
      assignedDate: "2024-03-14",
      deliveredDate: null,
    },
    {
      id: 3,
      modelNumber: "XPAD-IP-003",

      tabletModel: "Infinix XPAD",
      gymName: "Iron Paradise",
      bdm: "Sneha Reddy",
      bde: "Kavya Nair",
      status: "pending",
      trackingNumber: "INX123456791",
      receiptDate: "2024-03-15",
      assignedDate: "2024-03-17",
      deliveredDate: null,
    },
    {
      id: 4,
      modelNumber: "XPAD-FH-004",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness Hub",
      bdm: "Rajesh Kumar",
      bde: "Rohit Gupta",
      status: "delivered",
      trackingNumber: "INX123456792",
      receiptDate: "2024-03-08",
      assignedDate: "2024-03-10",
      deliveredDate: "2024-03-12",
    },
    {
      id: 5,
      modelNumber: "XPAD-MF-005",

      tabletModel: "Infinix XPAD",
      gymName: "Muscle Factory",
      bdm: "Meera Joshi",
      bde: "Arjun Rao",
      status: "cancelled",
      trackingNumber: "INX123456793",
      receiptDate: "2024-03-05",
      assignedDate: "2024-03-07",
      deliveredDate: null,
    },
    {
      id: 6,
      modelNumber: "XPAD-FZP-006",

      tabletModel: "Infinix XPAD",
      gymName: "FitZone Pro",
      bdm: "Divya Iyer",
      bde: "Karthik Menon",
      status: "shipped",
      trackingNumber: "INX123456794",
      receiptDate: "2024-03-14",
      assignedDate: "2024-03-16",
      deliveredDate: null,
    },
    {
      id: 7,
      modelNumber: "XPAD-FF-007",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness First",
      bdm: "Ananya Das",
      bde: "Suresh Pillai",
      status: "delivered",
      trackingNumber: "INX123456795",
      receiptDate: "2024-03-09",
      assignedDate: "2024-03-11",
      deliveredDate: "2024-03-14",
    },
    {
      id: 8,
      modelNumber: "XPAD-PGE-008",

      tabletModel: "Infinix XPAD",
      gymName: "PowerGym Elite",
      bdm: "Priya Sharma",
      bde: "Pooja Agarwal",
      status: "pending",
      trackingNumber: "INX123456796",
      receiptDate: "2024-03-16",
      assignedDate: "2024-03-18",
      deliveredDate: null,
    },
    {
      id: 9,
      modelNumber: "XPAD-IP-009",

      tabletModel: "Infinix XPAD",
      gymName: "Iron Paradise",
      bdm: "Sneha Reddy",
      bde: "Manoj Kumar",
      status: "shipped",
      trackingNumber: "INX123456797",
      receiptDate: "2024-03-12",
      assignedDate: "2024-03-14",
      deliveredDate: null,
    },
    {
      id: 10,
      modelNumber: "XPAD-FH-010",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness Hub",
      bdm: "Rajesh Kumar",
      bde: "Rashmi Sinha",
      status: "delivered",
      trackingNumber: "INX123456798",
      receiptDate: "2024-03-08",
      assignedDate: "2024-03-10",
      deliveredDate: "2024-03-13",
    },
    {
      id: 11,
      modelNumber: "XPAD-MF-011",

      tabletModel: "Infinix XPAD",
      gymName: "Muscle Factory",
      bdm: "Meera Joshi",
      bde: "Deepak Verma",
      status: "pending",
      trackingNumber: "INX123456799",
      receiptDate: "2024-03-17",
      assignedDate: "2024-03-19",
      deliveredDate: null,
    },
    {
      id: 12,
      modelNumber: "XPAD-FZP-012",

      tabletModel: "Infinix XPAD",
      gymName: "FitZone Pro",
      bdm: "Divya Iyer",
      bde: "Shruti Bose",
      status: "shipped",
      trackingNumber: "INX123456800",
      receiptDate: "2024-03-11",
      assignedDate: "2024-03-13",
      deliveredDate: null,
    },
    {
      id: 13,
      modelNumber: "XPAD-FF-013",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness First",
      bdm: "Ananya Das",
      bde: "Rahul Tiwari",
      status: "delivered",
      trackingNumber: "INX123456801",
      receiptDate: "2024-03-06",
      assignedDate: "2024-03-08",
      deliveredDate: "2024-03-11",
    },
    {
      id: 14,
      modelNumber: "XPAD-PGE-014",

      tabletModel: "Infinix XPAD",
      gymName: "PowerGym Elite",
      bdm: "Priya Sharma",
      bde: "Neha Kapoor",
      status: "pending",
      trackingNumber: "INX123456802",
      receiptDate: "2024-03-18",
      assignedDate: "2024-03-20",
      deliveredDate: null,
    },
    {
      id: 15,
      modelNumber: "XPAD-IP-015",

      tabletModel: "Infinix XPAD",
      gymName: "Iron Paradise",
      bdm: "Sneha Reddy",
      bde: "Sanjay Mishra",
      status: "shipped",
      trackingNumber: "INX123456803",
      receiptDate: "2024-03-13",
      assignedDate: "2024-03-15",
      deliveredDate: null,
    },
    {
      id: 16,
      modelNumber: "XPAD-FH-016",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness Hub",
      bdm: "Rajesh Kumar",
      bde: "Swati Pandey",
      status: "delivered",
      trackingNumber: "INX123456804",
      receiptDate: "2024-03-04",
      assignedDate: "2024-03-06",
      deliveredDate: "2024-03-09",
    },
    {
      id: 17,
      modelNumber: "XPAD-MF-017",

      tabletModel: "Infinix XPAD",
      gymName: "Muscle Factory",
      bdm: "Meera Joshi",
      bde: "Naveen Raj",
      status: "cancelled",
      trackingNumber: "INX123456805",
      receiptDate: "2024-03-03",
      assignedDate: "2024-03-05",
      deliveredDate: null,
    },
    {
      id: 18,
      modelNumber: "XPAD-FZP-018",

      tabletModel: "Infinix XPAD",
      gymName: "FitZone Pro",
      bdm: "Divya Iyer",
      bde: "Preeti Goel",
      status: "shipped",
      trackingNumber: "INX123456806",
      receiptDate: "2024-03-15",
      assignedDate: "2024-03-17",
      deliveredDate: null,
    },
    {
      id: 19,
      modelNumber: "XPAD-FF-019",

      tabletModel: "Infinix XPAD",
      gymName: "Fitness First",
      bdm: "Ananya Das",
      bde: "Ashish Jain",
      status: "pending",
      trackingNumber: "INX123456807",
      receiptDate: "2024-03-19",
      assignedDate: "2024-03-21",
      deliveredDate: null,
    },
    {
      id: 20,
      modelNumber: "XPAD-PGE-020",

      tabletModel: "Infinix XPAD",
      gymName: "PowerGym Elite",
      bdm: "Priya Sharma",
      bde: "Vikram Patel",
      status: "delivered",
      trackingNumber: "INX123456808",
      receiptDate: "2024-03-02",
      assignedDate: "2024-03-04",
      deliveredDate: "2024-03-07",
    },
  ]);

  // State variables - Initialize with URL parameters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bdeFilter, setBdeFilter] = useState("all");
  const [bdmFilter, setBdmFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Update filters when URL parameters change
  useEffect(() => {
    if (gymFromUrl && gymFromUrl.trim() !== "") {
      setSearchTerm(gymFromUrl);
    }
    if (
      statusFromUrl &&
      statusFromUrl !== "all" &&
      statusFromUrl.trim() !== ""
    ) {
      setStatusFilter(statusFromUrl);
    }
    if (bdeFromUrl && bdeFromUrl !== "all" && bdeFromUrl.trim() !== "") {
      setBdeFilter(bdeFromUrl);
    }
  }, [gymFromUrl, statusFromUrl, bdeFromUrl]);

  // Get unique BDMs and BDEs for filters
  const bdms = [...new Set(allShipments.map((shipment) => shipment.bdm))];
  const bdes = [...new Set(allShipments.map((shipment) => shipment.bde))];

  // Filtered and sorted data
  const filteredAndSortedShipments = useMemo(() => {
    let filtered = allShipments.filter((shipment) => {
      const matchesSearch =
        !searchTerm ||
        shipment.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.bde.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.bdm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || shipment.status === statusFilter;
      const matchesBde = bdeFilter === "all" || shipment.bde === bdeFilter;
      const matchesBdm = bdmFilter === "all" || shipment.bdm === bdmFilter;

      return matchesSearch && matchesStatus && matchesBde && matchesBdm;
    });

    // Sort by receipt date
    filtered.sort((a, b) => {
      const dateA = new Date(a.receiptDate);
      const dateB = new Date(b.receiptDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [allShipments, searchTerm, statusFilter, bdeFilter, bdmFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedShipments.length / itemsPerPage
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = filteredAndSortedShipments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "bde") setBdeFilter(value);
    if (filterType === "bdm") setBdmFilter(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <FaCheckCircle />;
      case "shipped":
        return <FaShippingFast />;
      case "pending":
        return <FaClock />;
      case "cancelled":
        return <FaTimesCircle />;
      default:
        return <FaBoxOpen />;
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

  return (
    <div className="users-container" style={{ backgroundColor: "#121717" }}>
      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> XPAD Shipments
          {gymFromUrl && (
            <span
              style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}
            >
              - {gymFromUrl}
            </span>
          )}
        </h2>
        <div className="users-count">
          Total: {filteredAndSortedShipments.length} shipments
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="row pb-0">
          <div className="col-lg-3 col-md-6 col-sm-12">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by model, gym, BDE, BDM, tracking..."
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
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={bdeFilter}
              onChange={(e) => handleFilterChange("bde", e.target.value)}
            >
              <option value="all">All BDEs</option>
              {bdes.map((bde) => (
                <option key={bde} value={bde}>
                  {bde}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={bdmFilter}
              onChange={(e) => handleFilterChange("bdm", e.target.value)}
            >
              <option value="all">All BDMs</option>
              {bdms.map((bdm) => (
                <option key={bdm} value={bdm}>
                  {bdm}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <button
              className="sort-btn"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
              Sort Receipt Date
            </button>
          </div>

          <div className="col-lg-1 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
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
                <th>Model Number</th>

                <th>Tablet Model</th>
                <th>Gym Name</th>
                <th>BDM</th>
                <th>BDE</th>
                <th>Status</th>
                <th>Receipt Date</th>
                <th>Assigned Date</th>
                <th>Delivered Date</th>
                <th>Tracking</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.length > 0 ? (
                paginatedShipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>
                      <div
                        className="user-name"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FaTabletAlt style={{ color: "#FF5757" }} />
                        {shipment.modelNumber}
                      </div>
                    </td>

                    <td>
                      <span className="plan-badge">{shipment.tabletModel}</span>
                    </td>
                    <td>
                      {shipment.status === "delivered" ? (
                        shipment.gymName
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          Not delivered
                        </span>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FaUserTie
                          style={{ color: "#4CAF50", fontSize: "12px" }}
                        />
                        <span style={{ fontSize: "13px" }}>{shipment.bdm}</span>
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <FaUser
                          style={{ color: "#2196F3", fontSize: "12px" }}
                        />
                        <span style={{ fontSize: "13px" }}>{shipment.bde}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${shipment.status}`}>
                        {getStatusIcon(shipment.status)}
                        {shipment.status}
                      </span>
                    </td>
                    <td>{formatDate(shipment.receiptDate)}</td>
                    <td>{formatDate(shipment.assignedDate)}</td>
                    <td>
                      {shipment.deliveredDate ? (
                        formatDate(shipment.deliveredDate)
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>
                          Not delivered
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          fontFamily: "monospace",
                        }}
                      >
                        {shipment.trackingNumber}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="no-data">
                    No shipments found matching your criteria
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
              filteredAndSortedShipments.length
            )}{" "}
            of {filteredAndSortedShipments.length} entries
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
                onClick={() => typeof page === "number" && setCurrentPage(page)}
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
  );
}
