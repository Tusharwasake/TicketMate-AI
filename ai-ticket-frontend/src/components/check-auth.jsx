import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { safeStorage } from "../utils/storage";

function CheckAuth({ children, protected: isProtected = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = safeStorage.getItem("token");
        const userStr = safeStorage.getItem("user");

        // Check if token exists and is valid format (basic validation)
        const hasValidToken = token && token.length > 0;
        let hasValidUser = false;
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            hasValidUser = !!user;
          } catch (parseError) {
            console.warn("Failed to parse user data:", parseError);
            safeStorage.removeItem("user");
          }
        }

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
        safeStorage.removeItem("token");
        safeStorage.removeItem("user");
        
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
