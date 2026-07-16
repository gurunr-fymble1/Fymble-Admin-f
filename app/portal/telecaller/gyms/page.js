"use client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  FaSearch,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaChevronLeft,
  FaChevronRight,
  FaUserCheck,
  FaUserTimes,
  FaDumbbell,
} from "react-icons/fa";

export default function GymStats() {
  // Dummy gym data
  const [allGyms] = useState([
    {
      id: 1,
      gymName: "Fitness Hub",
      ownerName: "Rajesh Kumar",
      mobile: "9876543210",
      location: "Mumbai",
      totalClients: 145,
      activeClients: 98,
      status: "active",
      joinedDate: "2024-01-15",
    },
    {
      id: 2,
      gymName: "Fitness Hub",
      ownerName: "Priya Sharma",
      mobile: "9876543211",
      location: "Delhi",
      totalClients: 78,
      activeClients: 52,
      status: "active",
      joinedDate: "2024-02-20",
    },
    {
      id: 3,
      gymName: "Iron Paradise",
      ownerName: "Amit Singh",
      mobile: "9876543212",
      location: "Bangalore",
      totalClients: 89,
      activeClients: 23,
      status: "inactive",
      joinedDate: "2024-01-10",
    },
    {
      id: 4,
      gymName: "Fitness Hub Central",
      ownerName: "Sneha Reddy",
      mobile: "9876543213",
      location: "Hyderabad",
      totalClients: 234,
      activeClients: 187,
      status: "active",
      joinedDate: "2024-03-05",
    },
    {
      id: 5,
      gymName: "Muscle Factory",
      ownerName: "Vikram Patel",
      mobile: "9876543214",
      location: "Pune",
      totalClients: 45,
      activeClients: 31,
      status: "active",
      joinedDate: "2024-02-12",
    },
    {
      id: 6,
      gymName: "FitZone Pro",
      ownerName: "Kavya Nair",
      mobile: "9876543215",
      location: "Kochi",
      totalClients: 167,
      activeClients: 134,
      status: "active",
      joinedDate: "2024-01-25",
    },
    {
      id: 7,
      gymName: "Elite Fitness Center",
      ownerName: "Rohit Gupta",
      mobile: "9876543216",
      location: "Chennai",
      totalClients: 123,
      activeClients: 45,
      status: "inactive",
      joinedDate: "2024-03-12",
    },
    {
      id: 8,
      gymName: "Body Transformation",
      ownerName: "Meera Joshi",
      mobile: "9876543217",
      location: "Jaipur",
      totalClients: 67,
      activeClients: 43,
      status: "active",
      joinedDate: "2024-02-28",
    },
    {
      id: 9,
      gymName: "Strength & Conditioning",
      ownerName: "Arjun Rao",
      mobile: "9876543218",
      location: "Bangalore",
      totalClients: 189,
      activeClients: 156,
      status: "active",
      joinedDate: "2024-01-08",
    },
    {
      id: 10,
      gymName: "Wellness Studio",
      ownerName: "Divya Iyer",
      mobile: "9876543219",
      location: "Coimbatore",
      totalClients: 34,
      activeClients: 28,
      status: "active",
      joinedDate: "2024-03-18",
    },
    {
      id: 11,
      gymName: "Hardcore Gym",
      ownerName: "Karthik Menon",
      mobile: "9876543220",
      location: "Mumbai",
      totalClients: 98,
      activeClients: 32,
      status: "inactive",
      joinedDate: "2024-02-05",
    },
    {
      id: 12,
      gymName: "Total Fitness",
      ownerName: "Ananya Das",
      mobile: "9876543221",
      location: "Kolkata",
      totalClients: 156,
      activeClients: 123,
      status: "active",
      joinedDate: "2024-01-30",
    },
    {
      id: 13,
      gymName: "Beast Mode Gym",
      ownerName: "Suresh Pillai",
      mobile: "9876543222",
      location: "Thiruvananthapuram",
      totalClients: 78,
      activeClients: 61,
      status: "active",
      joinedDate: "2024-03-08",
    },
    {
      id: 14,
      gymName: "Fit & Fine Studio",
      ownerName: "Pooja Agarwal",
      mobile: "9876543223",
      location: "Gurgaon",
      totalClients: 43,
      activeClients: 18,
      status: "inactive",
      joinedDate: "2024-02-15",
    },
    {
      id: 15,
      gymName: "Champion's Gym",
      ownerName: "Manoj Kumar",
      mobile: "9876543224",
      location: "Noida",
      totalClients: 212,
      activeClients: 189,
      status: "active",
      joinedDate: "2024-01-20",
    },
    {
      id: 16,
      gymName: "Fitness Hub",
      ownerName: "Rashmi Sinha",
      mobile: "9876543225",
      location: "Patna",
      totalClients: 87,
      activeClients: 69,
      status: "active",
      joinedDate: "2024-03-22",
    },
    {
      id: 17,
      gymName: "Power House Gym",
      ownerName: "Deepak Verma",
      mobile: "9876543226",
      location: "Lucknow",
      totalClients: 134,
      activeClients: 56,
      status: "inactive",
      joinedDate: "2024-02-08",
    },
    {
      id: 18,
      gymName: "Matrix Fitness",
      ownerName: "Shruti Bose",
      mobile: "9876543227",
      location: "Kolkata",
      totalClients: 67,
      activeClients: 54,
      status: "active",
      joinedDate: "2024-01-12",
    },
    {
      id: 19,
      gymName: "Urban Fitness",
      ownerName: "Rahul Tiwari",
      mobile: "9876543228",
      location: "Indore",
      totalClients: 178,
      activeClients: 142,
      status: "active",
      joinedDate: "2024-03-15",
    },
    {
      id: 20,
      gymName: "Gold's Gym Franchise",
      ownerName: "Neha Kapoor",
      mobile: "9876543229",
      location: "Delhi",
      totalClients: 298,
      activeClients: 234,
      status: "active",
      joinedDate: "2024-02-25",
    },
    {
      id: 21,
      gymName: "CrossFit Box",
      ownerName: "Sanjay Mishra",
      mobile: "9876543230",
      location: "Ahmedabad",
      totalClients: 56,
      activeClients: 21,
      status: "inactive",
      joinedDate: "2024-01-05",
    },
    {
      id: 22,
      gymName: "Yoga & Fitness Center",
      ownerName: "Swati Pandey",
      mobile: "9876543231",
      location: "Bhopal",
      totalClients: 112,
      activeClients: 89,
      status: "active",
      joinedDate: "2024-03-10",
    },
    {
      id: 23,
      gymName: "Anytime Fitness",
      ownerName: "Naveen Raj",
      mobile: "9876543232",
      location: "Chennai",
      totalClients: 189,
      activeClients: 145,
      status: "active",
      joinedDate: "2024-02-18",
    },
    {
      id: 24,
      gymName: "Body Sculpt Studio",
      ownerName: "Preeti Goel",
      mobile: "9876543233",
      location: "Chandigarh",
      totalClients: 76,
      activeClients: 58,
      status: "active",
      joinedDate: "2024-01-28",
    },
    {
      id: 25,
      gymName: "Peak Performance",
      ownerName: "Ashish Jain",
      mobile: "9876543234",
      location: "Surat",
      totalClients: 145,
      activeClients: 112,
      status: "active",
      joinedDate: "2024-03-20",
    },
  ]);

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalClientsFilter, setTotalClientsFilter] = useState("all");
  const [activeClientsFilter, setActiveClientsFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();
  const clientRanges = [
    { value: "0-50", label: "0-50" },
    { value: "51-100", label: "51-100" },
    { value: "101-150", label: "101-150" },
    { value: "151-200", label: "151-200" },
    { value: ">200", label: ">200" },
  ];

  // Helper function to calculate retention rate
  const calculateRetentionRate = (activeClients, totalClients) => {
    if (totalClients === 0) return 0;
    return Math.round((activeClients / totalClients) * 100);
  };

  // Helper function to get retention rate color class
  const getRetentionRateClass = (rate) => {
    if (rate >= 80) return "retention-excellent"; // Green
    if (rate >= 60) return "retention-good"; // Yellow
    if (rate >= 40) return "retention-fair"; // Orange
    return "retention-poor"; // Red
  };

  // Helper function to check if gym matches client range filter
  const matchesClientRange = (clientCount, range) => {
    switch (range) {
      case "0-50":
        return clientCount >= 0 && clientCount <= 50;
      case "51-100":
        return clientCount >= 51 && clientCount <= 100;
      case "101-150":
        return clientCount >= 101 && clientCount <= 150;
      case "151-200":
        return clientCount >= 151 && clientCount <= 200;
      case ">200":
        return clientCount > 200;
      default:
        return true;
    }
  };

  // Filtered and sorted data
  const filteredAndSortedGyms = useMemo(() => {
    let filtered = allGyms.filter((gym) => {
      const matchesSearch =
        gym.gymName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gym.mobile.includes(searchTerm) ||
        gym.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || gym.status === statusFilter;
      const matchesTotalClients =
        totalClientsFilter === "all" ||
        matchesClientRange(gym.totalClients, totalClientsFilter);
      const matchesActiveClients =
        activeClientsFilter === "all" ||
        matchesClientRange(gym.activeClients, activeClientsFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTotalClients &&
        matchesActiveClients
      );
    });

    // Sort by joined date
    filtered.sort((a, b) => {
      const dateA = new Date(a.joinedDate);
      const dateB = new Date(b.joinedDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [
    allGyms,
    searchTerm,
    statusFilter,
    totalClientsFilter,
    activeClientsFilter,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedGyms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGyms = filteredAndSortedGyms.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "status") setStatusFilter(value);
    if (filterType === "totalClients") setTotalClientsFilter(value);
    if (filterType === "activeClients") setActiveClientsFilter(value);
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

  return (
    <div className="users-container">
      <style jsx>{`
        .retention-excellent {
          background-color: #28a745 !important;
          color: white !important;
        }
        .retention-good {
          background-color: #ffc107 !important;
          color: #212529 !important;
        }
        .retention-fair {
          background-color: #fd7e14 !important;
          color: white !important;
        }
        .retention-poor {
          background-color: #dc3545 !important;
          color: white !important;
        }
      `}</style>

      <div className="users-header">
        <h2 className="users-title">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Business Gyms
        </h2>
        <div className="users-count">
          Total: {filteredAndSortedGyms.length} gyms
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
                placeholder="Search by gym, owner, mobile, location..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={totalClientsFilter}
              onChange={(e) =>
                handleFilterChange("totalClients", e.target.value)
              }
            >
              <option value="all">Clients</option>
              {clientRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12">
            <select
              className="filter-select"
              value={activeClientsFilter}
              onChange={(e) =>
                handleFilterChange("activeClients", e.target.value)
              }
            >
              <option value="all">Active Clients</option>
              {clientRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
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
                <th>Gym Name</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>City</th>
                <th>Total</th>
                <th>Active</th>
                <th>Retention</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGyms.length > 0 ? (
                paginatedGyms.map((gym) => {
                  const retentionRate = calculateRetentionRate(
                    gym.activeClients,
                    gym.totalClients
                  );
                  return (
                    <tr key={gym.id}>
                      <td>
                        <div className="user-name">{gym.gymName}</div>
                      </td>
                      <td>{gym.ownerName}</td>
                      <td>{gym.mobile}</td>
                      <td>{gym.location}</td>
                      <td>
                        <span className="plan-badge">{gym.totalClients}</span>
                      </td>
                      <td>
                        <span className="plan-badge">{gym.activeClients}</span>
                      </td>
                      <td
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          router.push(
                            `/portal/telecaller/unretainedusers?gym=${encodeURIComponent(
                              gym.gymName
                            )}&status=inactive`
                          )
                        }
                      >
                        <span
                          className={`plan-badge ${getRetentionRateClass(
                            retentionRate
                          )}`}
                        >
                          {retentionRate}%
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${gym.status}`}>
                          {gym.status === "active" ? (
                            <FaUserCheck />
                          ) : (
                            <FaUserTimes />
                          )}
                          {gym.status}
                        </span>
                      </td>
                      <td>{formatDate(gym.joinedDate)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="no-data">
                    No gyms found matching your criteria
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
            {Math.min(startIndex + itemsPerPage, filteredAndSortedGyms.length)}{" "}
            of {filteredAndSortedGyms.length} entries
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
