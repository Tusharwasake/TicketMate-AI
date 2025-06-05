import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { safeStorage } from "../utils/storage";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');

      if (token && userParam) {
        try {
          // Store the token and user data
          safeStorage.setItem("token", token);
          safeStorage.setItem("user", userParam);

          // Redirect to home page
          navigate("/", { replace: true });
        } catch (error) {
          console.error("Error handling OAuth callback:", error);
          navigate("/login", { replace: true });
        }
      } else {
        // No token received, redirect to login
        navigate("/login", { replace: true });
      }
    };

    handleOAuthCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication
        </h2>
        <p className="text-gray-600">
          Please wait while we sign you in...
        </p>
      </div>
    </div>
  );
}
