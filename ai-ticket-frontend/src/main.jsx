import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import CheckAuth from "./components/check-auth.jsx";
import HomePage from "./pages/Home.jsx";
import Tickets from "./pages/Tickets.jsx";
import TicketDetailsPage from "./pages/Ticket.jsx";
import LoginPage from "./pages/Login.jsx";
import SignupPage from "./pages/Signup.jsx";
import AdminPanel from "./pages/Admin.jsx";
import AboutPage from "./pages/About.jsx";
import ProfilePage from "./pages/Profile.jsx";
import SettingsPage from "./pages/Settings.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <CheckAuth protected={false}>
                <HomePage />
              </CheckAuth>
            }
          />
          <Route
            path="/tickets"
            element={
              <CheckAuth protected={true}>
                <Tickets />
              </CheckAuth>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <CheckAuth protected={true}>
                <TicketDetailsPage />
              </CheckAuth>
            }
          />
          <Route
            path="/login"
            element={
              <CheckAuth protected={false}>
                <LoginPage />
              </CheckAuth>
            }
          />
          <Route
            path="/signup"
            element={
              <CheckAuth protected={false}>
                <SignupPage />
              </CheckAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <CheckAuth protected={true}>
                <AdminPanel />
              </CheckAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <CheckAuth protected={true}>
                <ProfilePage />
              </CheckAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <CheckAuth protected={true}>
                <SettingsPage />
              </CheckAuth>
            }
          />
          <Route
            path="/about"
            element={
              <CheckAuth protected={false}>
                <AboutPage />
              </CheckAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
