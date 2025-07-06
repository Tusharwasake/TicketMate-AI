import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { safeStorage } from "../utils/storage";

function CheckAuth({ children, protected: isProtected = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);useEffect(() => {
    const checkAuthentication = () => {
      try {
        // Allow access to the /signup route for testing purposes
        if (window.location.pathname === "/signup") {
          setLoading(false);
          return;
        }

        const token = safeStorage.getItem("token");
        const userStr = safeStorage.getItem("user");        // Check if token exists and is valid format (basic validation)
        const hasValidToken = token && token.length > 0;

        if (userStr) {
          try {
            JSON.parse(userStr); // Just validate that user data is parseable
          } catch (parseError) {
            console.warn("Failed to parse user data:", parseError);
            safeStorage.removeItem("user");
          }        }

        // Authentication check completed - no need to store state

        // If route is protected and user is not authenticated, redirect to login
        if (isProtected && !hasValidToken) {
          navigate("/login", { replace: true });
          return;
        }

        // If user is authenticated and trying to access login, redirect to home
        if (
          !isProtected &&
          hasValidToken &&
          window.location.pathname === "/login"
        ) {
          navigate("/", { replace: true });
          return;
        }
      } catch (error) {
        console.error("Authentication check failed:", error);        // Clear corrupted data
        safeStorage.removeItem("token");
        safeStorage.removeItem("user");

        // Authentication failed - no need to store state

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
