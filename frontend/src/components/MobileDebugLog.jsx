import React, { useState, useEffect, useRef } from "react";
import "./MobileDebugLog.css";

const MobileDebugLog = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true); // Default to minimized
  const logContainerRef = useRef(null);

  useEffect(() => {
    // Check if mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    // Only show on mobile or if debug mode is enabled
    if (!isMobile && !window.localStorage.getItem("debugMode")) {
      setIsVisible(false);
      return;
    }

    // Custom logging function
    window.addDebugLog = (type, message, data = null) => {
      const timestamp = new Date().toLocaleTimeString();
      const newLog = {
        id: Date.now() + Math.random(),
        timestamp,
        type,
        message,
        data: data ? JSON.stringify(data, null, 2) : null,
      };

      setLogs((prev) => [...prev, newLog].slice(-50)); // Keep last 50 logs
    };

    // Override console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      window.addDebugLog("info", args.join(" "));
    };

    console.error = (...args) => {
      originalError(...args);
      window.addDebugLog("error", args.join(" "));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      window.addDebugLog("warn", args.join(" "));
    };

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      delete window.addDebugLog;
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logContainerRef.current && !isMinimized) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  const clearLogs = () => {
    setLogs([]);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getLogClassName = (type) => {
    switch (type) {
      case "error":
        return "debug-log-error";
      case "warn":
        return "debug-log-warn";
      case "success":
        return "debug-log-success";
      default:
        return "debug-log-info";
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`mobile-debug-log ${isMinimized ? "minimized" : ""}`}>
      {isMinimized ? (
        <button onClick={toggleMinimize} className="debug-log-open-btn">
          <span className="debug-log-icon">▲</span>
        </button>
      ) : (
        <div className="debug-log-header">
          <span className="debug-log-title">console monitor</span>
          <div className="debug-log-controls">
            <button onClick={clearLogs} className="debug-log-btn">
              Clear
            </button>
            <button onClick={toggleMinimize} className="debug-log-btn">
              ✕
            </button>
          </div>
        </div>
      )}

      {!isMinimized && (
        <div className="debug-log-container" ref={logContainerRef}>
          {logs.length === 0 ? (
            <div className="debug-log-empty">No logs yet...</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`debug-log-entry ${getLogClassName(log.type)}`}
              >
                <span className="debug-log-time">[{log.timestamp}]</span>
                <span className="debug-log-type">
                  [{log.type.toUpperCase()}]
                </span>
                <span className="debug-log-message">{log.message}</span>
                {log.data && <pre className="debug-log-data">{log.data}</pre>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MobileDebugLog;
