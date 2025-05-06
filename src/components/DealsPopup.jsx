import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import Lottie from "react-lottie-player";
import dealAnimation from "../assets/lottie/deals.json"; // Ensure this file exists
import { backendUrl } from "../../../admin/src/App";

const DealsPopup = ({ user }) => { 
  const [showPopup, setShowPopup] = useState(false);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const popupRef = useRef(null);

  // Function to check if the user is logging in for the first time
  const isNewUser = () => {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    return isLoggedIn && !sessionStorage.getItem("hasSeenDealPopup");
  };

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/deals`);
        const data = await response.json();

        if (data && data.length > 0) {
          const exclusiveDeal = data.find((deal) => deal.active);
          if (exclusiveDeal) {
            setDeal(exclusiveDeal);
            // Show popup only if user is logged in and hasn't seen it yet
            const hasSeenPopup = sessionStorage.getItem("hasSeenDealPopup");
            const isNew = isNewUser(); // Check if the user is new
            if (!hasSeenPopup || isNew) {
              setShowPopup(true);
              sessionStorage.setItem("hasSeenDealPopup", "true");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setLoading(false); // Stop loading after the fetch
      }
    };

    fetchDeal();
  }, []);

  useEffect(() => {
    if (showPopup && popupRef.current) {
      gsap.fromTo(
        popupRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
      );
    }
  }, [showPopup]);

  const closePopup = () => {
    gsap.to(popupRef.current, {
      scale: 0.5,
      opacity: 0,
      duration: 0.3,
      ease: "power1.inOut",
      onComplete: () => setShowPopup(false),
    });
  };

  return (
    <>
      {loading ? (
        <div>Loading...</div> // Show a loading state while fetching data
      ) : (
        showPopup && deal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            {/* Popup Box */}
            <div
              ref={popupRef}
              className="relative z-10 w-full max-w-md p-8 text-center bg-white shadow-2xl rounded-xl"
            >
              <h2 className="mb-4 text-3xl font-bold text-red-500">
                {deal.title}
              </h2>
              <p className="mb-4 text-lg text-gray-600">{deal.description}</p>
              <p className="mb-4 text-5xl font-semibold text-green-600">
                {deal.discount}% OFF!
              </p>
              <button
                className="px-6 py-2 text-lg text-white transition bg-orange-500 rounded-full hover:bg-orange-400"
                onClick={closePopup}
              >
                Got it!
              </button>

              {/* Lottie Animation - Small, Positioned at Bottom Right, and Slightly Rotated */}
              <div className="absolute left-[-10%] top-[-13%] w-40 h-20 pointer-events-none transform rotate-[-25deg]">
                <Lottie loop play animationData={dealAnimation} />
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
};

export default DealsPopup;
