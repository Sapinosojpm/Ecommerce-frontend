import React, { useEffect, useState } from "react";
import LiveSellingUser from "./LiveSellingUser";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const LiveStreamPopup = () => {
  const [isLive, setIsLive] = useState(false);
  const [popupState, setPopupState] = useState("closed");
  const [userName, setUserName] = useState("Viewer"); // Default to 'Viewer'

  // Fetch user profile when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${backendUrl}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserName(`${data.firstName} ${data.lastName}`.trim() || "Viewer");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/livestream/status`
        );
        if (response.ok) {
          const data = await response.json();
          setIsLive(data.isLive || false);
        }
      } catch (error) {
        console.error("Failed to check live status:", error);
        setIsLive(false);
      }
    };

    checkLiveStatus();
    const interval = setInterval(checkLiveStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isLive) return null;

  const handleClose = () => {
    setPopupState("closed");
  };

  return (
    <>
      {popupState === "closed" ? (
        <div className="live-stream-popup-button fixed bottom-8 right-24 z-[9999]">
          <button
            onClick={() => setPopupState("minimized")}
            className="flex items-center px-4 py-2 text-sm text-white bg-red-600 rounded-full shadow-xl hover:bg-red-700"
          >
            <span className="w-3 h-3 mr-2 bg-white rounded-full animate-ping"></span>
            LIVE Stream
          </button>
        </div>
      ) : (
        <LiveStreamPopupComponent
        isExpanded={popupState === "expanded"}
        onClose={handleClose}
        userName={userName}
      />
      
      )}
    </>
  );
};

const LiveStreamPopupComponent = ({ isExpanded, onClose, userName }) => {
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 ${
        isExpanded ? "live-stream-popup-expanded" : ""
      }`}
    >
      <div className="relative w-full h-full overflow-hidden max-w-screen-2xl max-h-screen-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute z-50 p-2 text-white bg-black bg-opacity-50 rounded-full top-4 right-4 hover:bg-opacity-80"
          title="Close"
          aria-label="Close Live Stream Popup"
        >
          ✕
        </button>

        {/* Full video */}
        <div className="w-full h-full">
          <LiveSellingUser userName={userName} />
        </div>
      </div>
    </div>
  );
};


export default LiveStreamPopup;
