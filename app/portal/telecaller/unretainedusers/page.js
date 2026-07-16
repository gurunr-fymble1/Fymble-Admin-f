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
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";

export default function Users() {
  const searchParams = useSearchParams();

  // Get URL parameters
  const gymFromUrl = searchParams.get("gym") || "";

  // Dummy data
  const [allUsers] = useState([
    {
      id: 1,
      name: "Rajesh Kumar",
      mobile: "+91 9876543210",
      gymName: "Fitness Hub",
      status: "inactive",
      plan: "Smart Plan",
      joinedDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Priya Sharma",
      mobile: "+91 9876543211",
      gymName: "PowerGym Elite",
      status: "inactive",
      plan: "Gold Plan",
      joinedDate: "2024-02-20",
    },
    {
      id: 3,
      name: "Amit Singh",
      mobile: "+91 9876543212",
      gymName: "Iron Paradise",
      status: "inactive",
      plan: "Platinum Plan",
      joinedDate: "2024-01-10",
    },
    {
      id: 4,
      name: "Sneha Reddy",
      mobile: "+91 9876543213",
      gymName: "Fitness Hub",
      status: "inactive",
      plan: "Diamond Plan",
      joinedDate: "2024-03-05",
    },
    {
      id: 5,
      name: "Vikram Patel",
      mobile: "+91 9876543214",
      gymName: "Muscle Factory",
      status: "inactive",
      plan: "Pro Plan",
      joinedDate: "2024-02-12",
    },
    {
      id: 6,
      name: "Kavya Nair",
      mobile: "+91 9876543215",
      gymName: "FitZone Pro",
      status: "inactive",
      plan: "Ultimate Plan",
      joinedDate: "2024-01-25",
    },
    {
      id: 7,
      name: "Rohit Gupta",
      mobile: "+91 9876543216",
      gymName: "Fitness First",
      status: "inactive",
      plan: "Smart Plan",
      joinedDate: "2024-03-12",
    },
    {
      id: 8,
      name: "Meera Joshi",
      mobile: "+91 9876543217",
      gymName: "PowerGym Elite",
      status: "inactive",
      plan: "Gold Plan",
      joinedDate: "2024-02-28",
    },
    {
      id: 9,
      name: "Arjun Rao",
      mobile: "+91 9876543218",
      gymName: "Iron Paradise",
      status: "inactive",
      plan: "Platinum Plan",
      joinedDate: "2024-01-08",
    },
    {
      id: 10,
      name: "Divya Iyer",
      mobile: "+91 9876543219",
      gymName: "Fitness Hub",
      status: "inactive",
      plan: "Diamond Plan",
      joinedDate: "2024-03-18",
    },
    {
      id: 11,
      name: "Karthik Menon",
      mobile: "+91 9876543220",
      gymName: "Muscle Factory",
      status: "inactive",
      plan: "Pro Plan",
      joinedDate: "2024-02-05",
    },
    {
      id: 12,
      name: "Ananya Das",
      mobile: "+91 9876543221",
      gymName: "FitZone Pro",
      status: "inactive",
      plan: "Ultimate Plan",
      joinedDate: "2024-01-30",
    },
    {
      id: 13,
      name: "Suresh Pillai",
      mobile: "+91 9876543222",
      gymName: "Fitness First",
      status: "inactive",
      plan: "Smart Plan",
      joinedDate: "2024-03-08",
    },
    {
      id: 14,
      name: "Pooja Agarwal",
      mobile: "+91 9876543223",
      gymName: "PowerGym Elite",
      status: "inactive",
      plan: "Gold Plan",
      joinedDate: "2024-02-15",
    },
    {
      id: 15,
      name: "Manoj Kumar",
      mobile: "+91 9876543224",
      gymName: "Iron Paradise",
      status: "inactive",
      plan: "Platinum Plan",
      joinedDate: "2024-01-20",
    },
    {
      id: 16,
      name: "Rashmi Sinha",
      mobile: "+91 9876543225",
      gymName: "Fitness Hub",
      status: "inactive",
      plan: "Diamond Plan",
      joinedDate: "2024-03-22",
    },
    {
      id: 17,
      name: "Deepak Verma",
      mobile: "+91 9876543226",
      gymName: "Muscle Factory",
      status: "inactive",
      plan: "Pro Plan",
      joinedDate: "2024-02-08",
    },
    {
      id: 18,
      name: "Shruti Bose",
      mobile: "+91 9876543227",
      gymName: "FitZone Pro",
      status: "inactive",
      plan: "Ultimate Plan",
      joinedDate: "2024-01-12",
    },
    {
      id: 19,
      name: "Rahul Tiwari",
      mobile: "+91 9876543228",
      gymName: "Fitness First",
      status: "inactive",
      plan: "Smart Plan",
      joinedDate: "2024-03-15",
    },
    {
      id: 20,
      name: "Neha Kapoor",
      mobile: "+91 9876543229",
      gymName: "PowerGym Elite",
      status: "inactive",
      plan: "Gold Plan",
      joinedDate: "2024-02-25",
    },
    {
      id: 21,
      name: "Sanjay Mishra",
      mobile: "+91 9876543230",
      gymName: "Iron Paradise",
      status: "inactive",
      plan: "Platinum Plan",
      joinedDate: "2024-01-05",
    },
    {
      id: 22,
      name: "Swati Pandey",
      mobile: "+91 9876543231",
      gymName: "Fitness Hub",
      status: "inactive",
      plan: "Diamond Plan",
      joinedDate: "2024-03-10",
    },
    {
      id: 23,
      name: "Naveen Raj",
      mobile: "+91 9876543232",
      gymName: "Muscle Factory",
      status: "inactive",
      plan: "Pro Plan",
      joinedDate: "2024-02-18",
    },
    {
      id: 24,
      name: "Preeti Goel",
      mobile: "+91 9876543233",
      gymName: "FitZone Pro",
      status: "inactive",
      plan: "Ultimate Plan",
      joinedDate: "2024-01-28",
    },
    {
      id: 25,
      name: "Ashish Jain",
      mobile: "+91 9876543234",
      gymName: "Fitness First",
      status: "inactive",
      plan: "Smart Plan",
      joinedDate: "2024-03-20",
    },
  ]);

  // State variables - Initialize with URL parameters
  const [searchTerm, setSearchTerm] = useState(gymFromUrl);
  const [planFilter, setPlanFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Update filters when URL parameters change
  useEffect(() => {
    if (gymFromUrl) {
      setSearchTerm(gymFromUrl);
    }
  }, [gymFromUrl]);

  const plans = [
    "Smart Plan",
    "Gold Plan",
    "Platinum Plan",
    "Diamond Plan",
    "Pro Plan",
    "Ultimate Plan",
  ];

  // Filtered and sorted data
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = allUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile.includes(searchTerm) ||
        user.gymName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlan = planFilter === "all" || user.plan === planFilter;

      return matchesSearch && matchesPlan;
    });

    // Sort by joined date
    filtered.sort((a, b) => {
      const dateA = new Date(a.joinedDate);
      const dateB = new Date(b.joinedDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [allUsers, searchTerm, planFilter, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset to first page when filters change
  const handleFilterChange = (filterType, value) => {
    setCurrentPage(1);
    if (filterType === "search") setSearchTerm(value);
    if (filterType === "plan") setPlanFilter(value);
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
      <div className="users-header">
        <h2 className="users-title">
          Inactive <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span> Users
          {gymFromUrl && (
            <span
              style={{ fontSize: "14px", color: "#666", marginLeft: "10px" }}
            >
              - {gymFromUrl}
            </span>
          )}
        </h2>
        <div className="users-count">
          Total: {filteredAndSortedUsers.length} users
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="row pb-0">
          <div className="col-lg-3 col-md-6 col-sm-12 ">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, mobile, gym..."
                value={searchTerm}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12 ">
            <select
              className="filter-select"
              value={planFilter}
              onChange={(e) => handleFilterChange("plan", e.target.value)}
            >
              <option value="all">All Plans</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12 ">
            <button
              className="sort-btn"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />}
              Sort Date
            </button>
          </div>

          <div className="col-lg-2 col-md-6 col-sm-12 ">
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
                <th>Name</th>
                <th>Mobile</th>
                <th>Gym Name</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-name">{user.name}</div>
                    </td>
                    <td>{user.mobile}</td>
                    <td>{user.gymName}</td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === "active" ? (
                          <FaUserCheck />
                        ) : (
                          <FaUserTimes />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <span className="plan-badge">{user.plan}</span>
                    </td>
                    <td>{formatDate(user.joinedDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No users found matching your criteria
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
            {Math.min(startIndex + itemsPerPage, filteredAndSortedUsers.length)}{" "}
            of {filteredAndSortedUsers.length} entries
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
