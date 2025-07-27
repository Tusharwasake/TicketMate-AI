import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { safeStorage } from "../utils/storage";

function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = safeStorage.getItem("token");
    const userStr = safeStorage.getItem("user");
    
    if (!token) {
      navigate("/login");
      return;
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      }
    }
  }, [navigate]);

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to clear all local data? This will log you out.")) {
      safeStorage.removeItem("token");
      safeStorage.removeItem("user");
      localStorage.clear();
      sessionStorage.clear();
      setSuccess("All local data cleared successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  const exportData = () => {
    try {
      const data = {
        user: user,
        timestamp: new Date().toISOString(),
        version: "1.0"
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticketmate-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      setSuccess("Data exported successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Failed to export data");
      setTimeout(() => setError(""), 3000);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Page Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-600">Manage your account preferences and data</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
                  {user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Role
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600 capitalize">
                  {user.role}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.role === 'moderator' && (
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center space-x-3 p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-medium text-gray-800">Manage Profile</div>
                    <div className="text-sm text-gray-600">Update your skills and expertise</div>
                  </div>
                </button>
              )}
              
              <button
                onClick={() => navigate("/tickets")}
                className="flex items-center space-x-3 p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                <div className="text-left">
                  <div className="font-medium text-gray-800">View Tickets</div>
                  <div className="text-sm text-gray-600">Manage your support tickets</div>
                </div>
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Data Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">Export Data</h3>
                  <p className="text-sm text-gray-600">Download your account data as JSON</p>
                </div>
                <button
                  onClick={exportData}
                  disabled={loading}
                  className="btn btn-outline btn-primary"
                >
                  Export
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">Clear Local Data</h3>
                  <p className="text-sm text-gray-600">Remove all cached data (will log you out)</p>
                </div>
                <button
                  onClick={clearAllData}
                  disabled={loading}
                  className="btn btn-outline btn-error"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="alert alert-error mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Back Button */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/")}
              className="btn btn-ghost"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsPage;
