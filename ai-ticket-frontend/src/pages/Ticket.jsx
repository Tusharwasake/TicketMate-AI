import { useEffect, useState, useCallback } from "react";

import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "../components/navbar";
import { safeStorage } from "../utils/storage";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const token = safeStorage.getItem("token");
  const currentUser = JSON.parse(safeStorage.getItem("user") || "{}");

  // Check if user can moderate (admin, moderator, or assigned to this ticket)
  const canModerate =
    currentUser.role === "admin" ||
    currentUser.role === "moderator" ||
    (ticket &&
      ticket.assignedTo &&
      (ticket.assignedTo._id === currentUser._id ||
        ticket.assignedTo === currentUser._id));

  // Check if user can reply (moderators or ticket creator)
  const canReply =
    canModerate ||
    (ticket &&
      ticket.createdBy &&
      (ticket.createdBy._id === currentUser._id ||
        ticket.createdBy === currentUser._id));
  const fetchTicket = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }        );

        if (!res.ok) {
          if (res.status === 401) {
            safeStorage.removeItem("token");
            safeStorage.removeItem("user");
            navigate("/login");
            return;
          }
          if (res.status === 404) {
            setError("Ticket not found");
            return;
          }
          if (res.status === 403) {
            setError("You don't have permission to view this ticket");
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched ticket data:", data);

        // Handle different response structures
        if (data.ticket) {
          setTicket(data.ticket);
          setReplies(data.ticket.replies || []);
        } else if (data.data) {
          setTicket(data.data);
          setReplies(data.data.replies || []);
        } else if (data._id || data.id) {
          setTicket(data);
          setReplies(data.replies || []);
        } else {
          setError("Invalid ticket data received");
        }
      } catch (err) {
        console.error("Fetch ticket error:", err);
        setError("Failed to load ticket details. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, token, navigate]
  );
  const submitReply = async () => {
    if (!replyText.trim()) {
      setError("Please enter a reply message");
      return;
    }

    setSubmittingReply(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: replyText.trim(),
            ...(replyStatus && { status: replyStatus }),
          }),
        }      );

      if (!res.ok) {
        if (res.status === 401) {
          safeStorage.removeItem("token");
          safeStorage.removeItem("user");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Reply submitted:", data);

      // Clear the reply form and refresh ticket
      setReplyText("");
      setReplyStatus("");
      setShowReplyBox(false);
      await fetchTicket(true);
    } catch (err) {
      console.error("Submit reply error:", err);
      setError("Failed to submit reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };
  const resolveTicket = async () => {
    setResolvingTicket(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}/resolve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "resolved",
          }),
        }
      );      if (!res.ok) {
        if (res.status === 401) {
          safeStorage.removeItem("token");
          safeStorage.removeItem("user");
          navigate("/login");
          return;
        }
        if (res.status === 403) {
          setError("You don't have permission to resolve this ticket");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Ticket resolved:", data);

      // Refresh ticket to show new status
      await fetchTicket(true);
    } catch (err) {
      console.error("Resolve ticket error:", err);
      setError("Failed to resolve ticket. Please try again.");
    } finally {
      setResolvingTicket(false);
    }
  };
  const assignToSelf = async () => {
    setAssigningTicket(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedTo: currentUser._id,
          }),
        }
      );      if (!res.ok) {
        if (res.status === 401) {
          safeStorage.removeItem("token");
          safeStorage.removeItem("user");
          navigate("/login");
          return;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Ticket assigned:", data);

      // Refresh ticket to show assignment
      await fetchTicket(true);
    } catch (err) {
      console.error("Assign ticket error:", err);
      setError("Failed to assign ticket. Please try again.");
    } finally {
      setAssigningTicket(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (id) {
      fetchTicket();
    } else {
      setError("Invalid ticket ID");
      setLoading(false);
    }
  }, [id, token, navigate, fetchTicket]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleRefresh = () => {
    fetchTicket(true);
  };
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "todo":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
      case "in progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "todo":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        );
      case "open":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "in-progress":
      case "in progress":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "resolved":
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "closed":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      if (diffHours > 0)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffMinutes > 0)
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      return "Just now";
    } catch {
      return "Unknown";
    }
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email.split("@")[0].charAt(0).toUpperCase();
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading ticket details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !ticket) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <svg
                className="w-12 h-12 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Error Loading Ticket
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGoBack}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Back to Tickets
              </button>
              <button
                onClick={handleRefresh}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ticket Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The requested ticket could not be found.
            </p>
            <button
              onClick={handleGoBack}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="mb-4 sm:mb-0">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 mb-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="text-sm font-medium">Back to Tickets</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Ticket Details
              </h1>
              <p className="text-gray-600 mt-1">
                #{(ticket._id || ticket.id)?.slice(-8)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {refreshing ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium text-gray-900">
                  Refresh
                </span>
              </button>

              {/* Moderator Actions */}
              {canModerate && (
                <>
                  {!ticket.assignedTo && (
                    <button
                      onClick={assignToSelf}
                      disabled={assigningTicket}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      {assigningTicket ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                      <span className="text-sm font-medium">Assign to Me</span>
                    </button>
                  )}{" "}
                  <div className="flex gap-2">
                    <select
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                    >
                      <option value="">Change status...</option>
                      <option value="TODO">📋 TODO</option>
                      <option value="open">🔓 Open</option>
                      <option value="in-progress">⚙️ In Progress</option>
                      <option value="resolved">✅ Resolved</option>
                      <option value="closed">🔒 Closed</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                    <button
                      onClick={async () => {
                        if (replyStatus) {
                          setResolvingTicket(true);
                          setError("");

                          try {
                            const res = await fetch(
                              `${
                                import.meta.env.VITE_SERVER_URL
                              }/tickets/${id}/resolve`,
                              {
                                method: "PATCH",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  status: replyStatus,
                                }),
                              }
                            );

                            if (!res.ok) {
                              if (res.status === 401) {
                                safeStorage.removeItem("token");
                                safeStorage.removeItem("user");
                                navigate("/login");
                                return;
                              }
                              if (res.status === 403) {
                                setError(
                                  "You don't have permission to update this ticket"
                                );
                                return;
                              }
                              throw new Error(
                                `HTTP error! status: ${res.status}`
                              );
                            }

                            const data = await res.json();
                            console.log("Ticket status updated:", data);

                            // Clear selection and refresh ticket
                            setReplyStatus("");
                            await fetchTicket(true);
                          } catch (err) {
                            console.error("Update status error:", err);
                            setError(
                              "Failed to update ticket status. Please try again."
                            );
                          } finally {
                            setResolvingTicket(false);
                          }
                        }
                      }}
                      disabled={resolvingTicket || !replyStatus}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      {resolvingTicket ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          <span className="text-xs">Update</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-800 text-sm font-medium">{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex-1">
                    {ticket.title}
                  </h2>
                </div>

                {/* Status and Priority */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div
                    className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(
                      ticket.status
                    )}`}
                  >
                    {getStatusIcon(ticket.status)}
                    <span>{ticket.status || "Open"}</span>
                  </div>

                  {ticket.priority && (
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border bg-orange-100 text-orange-800 border-orange-200`}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                      {ticket.priority} Priority
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>
                </div>
              </div>{" "}
              {/* AI Analysis Notes */}
              {ticket.helpfulNotes && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-blue-300 p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI Analysis Notes
                  </h3>
                  <div className="prose max-w-none text-gray-900">
                    <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
                  </div>
                </div>
              )}
              {/* AI-Suggested Replies */}
              {canModerate &&
                ticket.replyCanbeGiven &&
                ticket.replyCanbeGiven.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border-2 border-green-300 p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <svg
                        className="w-6 h-6 mr-2 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      AI-Suggested Replies
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Click on a suggestion to use it as your reply.
                    </p>
                    <div className="space-y-3 mb-4">
                      {ticket.replyCanbeGiven.map((reply, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setReplyText(reply);
                            setShowReplyBox(true);
                            // Scroll to reply box
                            setTimeout(() => {
                              document.querySelector("textarea")?.focus();
                            }, 100);
                          }}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-800 mr-3 mt-1">
                              {index + 1}
                            </div>
                            <p className="text-gray-800">{reply}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              {/* Replies Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Replies ({replies.length})
                  </h3>

                  {canReply && !showReplyBox && (
                    <button
                      onClick={() => setShowReplyBox(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <span className="text-sm font-medium">Add Reply</span>
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {showReplyBox && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Write your reply
                    </label>{" "}
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      rows="4"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-none"
                    />
                    {/* Status Update (for moderators/admins only) */}
                    {canModerate && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Update Status (Optional)
                        </label>{" "}
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                        >
                          <option value="">Keep current status</option>
                          <option value="TODO">TODO</option>
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={submitReply}
                        disabled={submittingReply || !replyText.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        {submittingReply ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        )}{" "}
                        <span className="text-sm font-medium">
                          {submittingReply
                            ? "Sending..."
                            : replyStatus
                            ? "Send Reply & Update Status"
                            : "Send Reply"}
                        </span>
                      </button>{" "}
                      <button
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyText("");
                          setReplyStatus("");
                          setError("");
                        }}
                        disabled={submittingReply}
                        className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Replies List */}
                <div className="space-y-4">
                  {replies.length > 0 ? (
                    replies.map((reply, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {getInitials(
                              reply.author?.email || reply.author || "M"
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {reply.author?.email ||
                                  reply.author ||
                                  "Moderator"}
                              </span>
                              {(reply.author?.role === "admin" ||
                                reply.author?.role === "moderator") && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                  {reply.author?.role || "Moderator"}
                                </span>
                              )}
                              <span className="text-sm text-gray-500">
                                {formatRelativeTime(reply.createdAt)}
                              </span>
                            </div>
                            <div className="text-gray-900">
                              <ReactMarkdown>{reply.message}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg
                        className="w-12 h-12 text-gray-300 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <p className="text-gray-500">No replies yet</p>{" "}
                      {canReply && (
                        <p className="text-sm text-gray-400 mt-1">
                          Be the first to reply to this ticket
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Ticket Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ticket Information
                </h3>

                {ticket.createdBy && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Created By
                    </label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(
                          ticket.createdBy?.email || ticket.createdBy
                        )}
                      </div>
                      <span className="text-sm text-gray-900">
                        {ticket.createdBy?.email || ticket.createdBy}
                      </span>
                    </div>
                  </div>
                )}

                {ticket.assignedTo && (
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <div className="mt-1 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {getInitials(
                          ticket.assignedTo?.email || ticket.assignedTo
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-900">
                          {ticket.assignedTo?.email || ticket.assignedTo}
                        </div>
                        {ticket.assignedTo?.role && (
                          <div className="text-xs text-gray-500">
                            {ticket.assignedTo.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Ticket ID */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    Ticket ID
                  </label>
                  <div className="mt-1 text-xs text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                    {ticket._id || ticket.id}
                  </div>
                </div>
              </div>
              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Timeline
                </h3>
                <div className="space-y-4">
                  {ticket.createdAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Created
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(ticket.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {ticket.assignedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Assigned
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(ticket.assignedAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(ticket.assignedAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {ticket.updatedAt &&
                    ticket.updatedAt !== ticket.createdAt && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Last Updated
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(ticket.updatedAt)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(ticket.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}

                  {ticket.resolvedAt && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Resolved
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRelativeTime(ticket.resolvedAt)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(ticket.resolvedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>{" "}
              </div>
              {/* Additional Information */}
              {(ticket.relatedSkills?.length > 0 ||
                ticket.tags?.length > 0) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Additional Information
                  </h3>
                  {/* Related Skills */}
                  {ticket.relatedSkills?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Related Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.relatedSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Tags */}
                  {ticket.tags?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ticket.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>{" "}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Panel */}
              {(canModerate || canReply) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {canModerate ? "Moderator Actions" : "Actions"}
                  </h3>

                  <div className="space-y-3">
                    {canModerate && !ticket.assignedTo && (
                      <button
                        onClick={assignToSelf}
                        disabled={assigningTicket}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        {assigningTicket ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                        <span className="text-sm font-medium">
                          Assign to Me
                        </span>
                      </button>
                    )}
                    {canReply && !showReplyBox && (
                      <button
                        onClick={() => setShowReplyBox(true)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                        <span className="text-sm font-medium">Add Reply</span>{" "}
                      </button>
                    )}{" "}
                    {canModerate && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Update Status
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={replyStatus}
                            onChange={(e) => setReplyStatus(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-900 bg-white"
                          >
                            <option value="">Select new status...</option>
                            <option value="TODO">📋 TODO</option>
                            <option value="open">🔓 Open</option>
                            <option value="in-progress">⚙️ In Progress</option>
                            <option value="resolved">✅ Resolved</option>
                            <option value="closed">🔒 Closed</option>
                            <option value="cancelled">❌ Cancelled</option>
                          </select>
                          <button
                            onClick={async () => {
                              if (replyStatus) {
                                setResolvingTicket(true);
                                setError("");

                                try {
                                  const res = await fetch(
                                    `${
                                      import.meta.env.VITE_SERVER_URL
                                    }/tickets/${id}/resolve`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        status: replyStatus,
                                      }),
                                    }
                                  );

                                  if (!res.ok) {
                                    if (res.status === 401) {
                                      safeStorage.removeItem("token");
                                      safeStorage.removeItem("user");
                                      navigate("/login");
                                      return;
                                    }
                                    if (res.status === 403) {
                                      setError(
                                        "You don't have permission to update this ticket"
                                      );
                                      return;
                                    }
                                    throw new Error(
                                      `HTTP error! status: ${res.status}`
                                    );
                                  }

                                  const data = await res.json();
                                  console.log("Ticket status updated:", data);

                                  // Clear selection and refresh ticket
                                  setReplyStatus("");
                                  await fetchTicket(true);
                                } catch (err) {
                                  console.error("Update status error:", err);
                                  setError(
                                    "Failed to update ticket status. Please try again."
                                  );
                                } finally {
                                  setResolvingTicket(false);
                                }
                              }
                            }}
                            disabled={resolvingTicket || !replyStatus}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resolvingTicket ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                        {replyStatus && (
                          <p className="text-sm text-gray-600">
                            Change status to:{" "}
                            <span className="font-semibold">{replyStatus}</span>
                          </p>
                        )}
                      </div>
                    )}
                    {(ticket.status === "resolved" ||
                      ticket.status === "closed") && (
                      <div className="text-center py-4">
                        <svg
                          className="w-8 h-8 text-green-500 mx-auto mb-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <p className="text-sm text-gray-600">
                          This ticket has been resolved
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
