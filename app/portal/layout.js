"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import axiosInstance, { verifyToken } from "@/lib/axios";

// Create Role Context
const RoleContext = createContext();

// Custom hook to use role context
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

const PortalLayout = ({ children }) => {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Function to verify authentication and fetch role
    const verifyAuth = async () => {
      try {
        // First, check if user exists in localStorage
        const userStr = localStorage.getItem('user');

        if (!userStr) {
          // No user data, redirect to login
          router.push('/');
          return;
        }

        const userData = JSON.parse(userStr);

        // Verify the session with backend using verifyToken
        // This will automatically refresh if token is expired
        const response = await verifyToken();

        if (response && response.status === 200) {
          // Session is valid, set user and role
          setUser(userData);
          setRole(userData.role);
          setLoading(false);
        } else {
          // Session invalid, clear data and redirect to login
          localStorage.removeItem('user');
          router.push('/');
        }
      } catch (error) {
        // Auth failed, clear data and redirect to login
        localStorage.removeItem('user');
        router.push('/');
      }
    };

    verifyAuth();
  }, [router]);

  // Show loading spinner while fetching role
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#111827",
          color: "white",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  // If no role is found, you might want to redirect to login
  if (!role) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#111827",
          color: "white",
        }}
      >
        <div>Unauthorized. Please login.</div>
      </div>
    );
  }

  return (
    <RoleContext.Provider value={{ role, setRole, user }}>
      {children}
    </RoleContext.Provider>
  );
};

export default PortalLayout;
