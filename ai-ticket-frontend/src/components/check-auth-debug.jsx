import React from "react";

function CheckAuthDebug({ children, protected: isProtected = false }) {
  console.log(
    "CheckAuthDebug - IsProtected:",
    isProtected,
    "Path:",
    window.location.pathname
  );

  // Temporarily bypass all authentication checks to see if pages render
  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          background: "red",
          color: "white",
          padding: "5px",
          zIndex: 9999,
          fontSize: "12px",
        }}
      >
        DEBUG MODE - Protected: {isProtected.toString()} - Path:{" "}
        {window.location.pathname}
      </div>
      <div style={{ marginTop: "30px" }}>{children}</div>
    </div>
  );
}

export default CheckAuthDebug;
