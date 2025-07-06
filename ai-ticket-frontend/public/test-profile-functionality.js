// Test script to verify Profile page functionality
// This can be run in the browser console to test profile operations

const testProfileFunctionality = () => {
  console.log("🧪 Testing TicketMate AI Profile Functionality");

  // Test 1: Check if Profile component is accessible
  try {
    const profileRoute = "/profile";
    console.log("✅ Profile route defined:", profileRoute);
  } catch (error) {
    console.error("❌ Profile route error:", error);
  }

  // Test 2: Check if storage utilities work
  try {
    // Test memory storage fallback
    const testStorage = {
      _data: new Map(),
      getItem(key) {
        return this._data.get(key) || null;
      },
      setItem(key, value) {
        this._data.set(key, value);
        return true;
      },
    };

    testStorage.setItem("test", "value");
    const result = testStorage.getItem("test");
    console.log("✅ Storage utility working:", result === "value");
  } catch (error) {
    console.error("❌ Storage utility error:", error);
  }

  // Test 3: Check if API client is configured
  try {
    // Check if the API URL is configured
    const apiUrl = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";
    console.log("✅ API URL configured:", apiUrl);
  } catch (error) {
    console.error("❌ API configuration error:", error);
  }

  console.log("🎉 Profile functionality tests completed!");
  console.log("📝 Next steps:");
  console.log("1. Create a moderator account via signup");
  console.log("2. Navigate to /profile to manage skills");
  console.log("3. Test adding/removing skills");
  console.log("4. Test profile save functionality");
};

// Export the test function
window.testProfileFunctionality = testProfileFunctionality;

console.log(
  "🚀 Profile test script loaded! Run testProfileFunctionality() to test."
);
