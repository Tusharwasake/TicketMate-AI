import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CheckAuth from "./components/check-auth.jsx";
import OAuthCallback from "./components/oauth-callback.jsx";
import Tickets from "./pages/Tickets.jsx";
import TicketDetailsPage from "./pages/Ticket.jsx";
import LoginPage from "./pages/Login.jsx";
import SignupPage from "./pages/Signup.jsx";
import AdminPanel from "./pages/Admin.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
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
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route
          path="/admin"
          element={
            <CheckAuth protected={true}>
              <AdminPanel />
            </CheckAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
