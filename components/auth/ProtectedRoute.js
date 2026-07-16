"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to verify the session with the backend
        const response = await axiosInstance.get('/api/admin/auth/verify');

        if (response.data.status === 200) {
          // Get user from localStorage
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);

            // If admin is required, check if user is admin
            if (requireAdmin && user.user_type !== 'admin') {
              router.push('/');
              return;
            }

            setIsAuthenticated(true);
          } else {
            // No user in localStorage, redirect to login
            router.push('/');
          }
        } else {
          // Session invalid, redirect to login
          localStorage.removeItem('user');
          router.push('/');
        }
      } catch (error) {
        // Auth failed, redirect to login
        localStorage.removeItem('user');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requireAdmin]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#000000'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 87, 87, 0.2)',
          borderTop: '3px solid #ff5757',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
