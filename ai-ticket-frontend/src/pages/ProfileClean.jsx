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
        console.error("Error parsing user data:", error);
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
      console.error("Profile update error:", error);
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

  // Only show profile management for moderators
  if (user.role !== 'moderator') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h1>
            <p className="text-gray-600 mb-4">Profile management is only available for moderators.</p>
            <button 
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </>
    );
  }

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
                <h1 className="text-2xl font-bold text-gray-800">Moderator Profile</h1>
                <p className="text-gray-600">{user.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Skills Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
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
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
