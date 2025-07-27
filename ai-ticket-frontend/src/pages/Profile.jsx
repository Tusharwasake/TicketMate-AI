import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/navbar";
import { safeStorage } from "../utils/storage";
import { apiClient } from "../utils/api";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        setSkills(userData.skills || []);
        
        if (location.state?.fromSignup && userData.role === 'moderator') {
          setShowWelcome(true);
        }
      } catch (error) {
        navigate("/login");
      }
    }
  }, [navigate, location]);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = safeStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        navigate("/login");
        return;
      }

      const response = await apiClient.patch("/auth/profile", { skills });

      if (response.user) {
        // Update user data in storage
        const updatedUser = { ...user, skills };
        safeStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess("Profile updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (error) {
      setError(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const skipSetup = () => {
    setShowWelcome(false);
    navigate("/");
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

  // Profile is available for all users, but skills management only for moderators

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Welcome Banner for New Moderators */}
          {showWelcome && (
            <div className="alert alert-info mb-6 shadow-lg">
              <div className="flex-1">
                <svg className="w-6 h-6 mx-2 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                  <h3 className="font-bold">Welcome to TicketMate!</h3>
                  <div className="text-xs">
                    As a moderator, you can add your skills to help users better. Set up your expertise areas below to get started.
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={skipSetup}
                  className="btn btn-sm btn-ghost"
                >
                  Skip for now
                </button>
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="btn btn-sm btn-primary"
                >
                  Set up skills
                </button>
              </div>
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.role === 'moderator' ? 'Moderator Profile' : 'User Profile'}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'moderator' ? 'bg-purple-100 text-purple-800' : 
                  user.role === 'admin' ? 'bg-red-100 text-red-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Moderator Skills Management */}
          {user.role === 'moderator' && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Your Expertise Areas
              </h2>
              <p className="text-gray-600 mb-6">
                Add your skills and areas of expertise to help users get better assistance.
              </p>

              {/* Add Skill Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a new skill
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleSkillKeyPress}
                    placeholder="e.g., JavaScript, Customer Service, Technical Support"
                    className="input input-bordered flex-1"
                    disabled={loading}
                  />
                  <button
                    onClick={addSkill}
                    disabled={!skillInput.trim() || loading}
                    className="btn btn-primary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Current Skills */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Current Skills ({skills.length})
                </label>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(skill)}
                          disabled={loading}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No skills added yet. Add your first skill above!
                  </div>
                )}
              </div>

              {/* Error and Success Messages */}
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

              {/* Save Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => navigate("/")}
                  className="btn btn-ghost"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* User Account Information - Available for all users */}
          <div className="bg-white rounded-lg shadow-lg p-6">
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
                  Member Since
                </label>
                <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}
                </div>
              </div>
              {user.role === 'moderator' && user.skills && user.skills.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Skills
                  </label>
                  <div className="bg-gray-50 px-3 py-2 rounded-lg">
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/tickets")}
                  className="btn btn-outline btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  View Tickets
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="btn btn-outline btn-secondary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="btn btn-outline btn-error"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Admin Panel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
