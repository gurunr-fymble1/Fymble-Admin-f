"use client";
import React from "react";

const Home = () => {
  const mockData = {
    fittbot: {
      unsubscribedUsers: 150,
      totalUsers: 1250,
    },
    business: {
      totalGyms: 45,
      activeGyms: 40,
      totalUsers: 80,
    },
  };
  return (
    <div className="dashboard-container">
      {/* Fittbot Section */}
      <div className="section-container">
        <h5 className="section-heading">
          <span style={{ color: "#FF5757" }}>Fy</span><span style={{ color: "#fff" }}>mble</span>
        </h5>
        <div className="row g-4">
          {/* Total Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {mockData.fittbot.totalUsers}
                </div>
                <div className="metric-change positive">+15%</div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Unsubscribed Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {mockData.fittbot.unsubscribedUsers}
                </div>
                <div className="metric-change negative">-2%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fymble Business Section */}
      <div className="section-container">
        <h3 className="section-heading">
          {" "}
          <span style={{ color: "#FF5757" }}>Fymble</span> Business
        </h3>
        <div className="row g-4">
          {/* Total Gyms Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {mockData.business.totalGyms}
                </div>
                <div className="metric-change positive">+3%</div>
              </div>
            </div>
          </div>

          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Active Gyms</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {mockData.business.activeGyms}
                </div>
                <div className="metric-change positive">+5%</div>
              </div>
            </div>
          </div>

          {/* Total Users Card */}
          <div className="col-xl-4 col-lg-6 col-md-6">
            <div className="dashboard-card">
              <div className="card-header-custom extra-space">
                <h6 className="card-title">Total Users</h6>
              </div>
              <div className="card-body-custom">
                <div className="metric-number">
                  {mockData.business.totalUsers}
                </div>
                <div className="metric-change positive">+10%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
