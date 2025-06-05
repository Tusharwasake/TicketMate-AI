import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CheckAuth({ children, protected: isProtected = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        // Check if token exists and is valid format (basic validation)
        const hasValidToken = token && token.length > 0;
        const hasValidUser = user && JSON.parse(user);

        setIsAuthenticated(hasValidToken && hasValidUser);

        // If route is protected and user is not authenticated, redirect to login
        if (isProtected && !hasValidToken) {
          navigate("/login", { replace: true });
          return;
        }

        // If user is authenticated and trying to access login/signup, redirect to home
        if (
          !isProtected &&
          hasValidToken &&
          (window.location.pathname === "/login" ||
            window.location.pathname === "/signup")
        ) {
          navigate("/", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);

        if (isProtected) {
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, [navigate, isProtected]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return children;
}

export default CheckAuth;
