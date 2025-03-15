import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import AIPopup from "./AIPopup";
import ChatPopup from "./ChatPopup";
import UserEventCalendarPopup from "./UserEventCalendarPopup";
import JobPostingPopup from "./JobPostingPopup";
import FAQPage from "./FAQPage";
import VoucherListComponent from "./VoucherListComponent";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

import plusAnimation from "../assets/lottie/wired-lineal-12-layers-hover-slide.json";
import closeAnimation from "../assets/lottie/plus.json";

const PopupManager = () => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);
  const { token } = useContext(ShopContext);

  const isLoggedIn = !!token;

  const toggleTooltip = () => {
    if (!isLoggedIn) return;
    setIsTooltipOpen(!isTooltipOpen);
    setActivePopup(null);
  };

  const togglePopup = (popup) => {
    if (!isLoggedIn) return;
    setActivePopup((prevPopup) => (prevPopup === popup ? null : popup));
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setIsTooltipOpen(false);
      setActivePopup(null);
    }
  }, [isLoggedIn]);

  return (
    <div className="fixed z-50 flex flex-col items-center space-y-2 bottom-6 right-5">
      {/* Popups */}
      <AnimatePresence>
        {activePopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activePopup === "ai" && <AIPopup isOpen onClose={() => setActivePopup(null)} />}
            {activePopup === "chat" && <ChatPopup isOpen onClose={() => setActivePopup(null)} />}
            {activePopup === "event" && <UserEventCalendarPopup isOpen onClose={() => setActivePopup(null)} />}
            {activePopup === "job" && <JobPostingPopup open={true} onClose={() => setActivePopup(null)} />}
            {activePopup === "faq" && <FAQPage isOpen onClose={() => setActivePopup(null)} />}
            {activePopup === "vouchers" && <VoucherListComponent onClose={() => setActivePopup(null)} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip Menu */}
      <AnimatePresence>
        {isLoggedIn && isTooltipOpen && (
          <motion.div
            className="flex flex-col items-center mb-2 space-y-2"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {[
              { key: "ai", img: assets.bot, label: "AI Chat" },
              { key: "chat", img: assets.message, label: "Message" },
              { key: "event", img: assets.calendar, label: "Events" },
              { key: "job", img: assets.jobseeker, label: "Job Postings" },
              { key: "faq", img: assets.question, label: "FAQ" },
              { key: "vouchers", img: assets.voucher, label: "Vouchers" },
            ].map(({ key, img, label }) => (
              <motion.div
                className="relative group"
                key={key}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.05 * key.length }}
              >
                <button
                  className={`flex items-center justify-center w-12 h-12 p-3 rounded-full shadow-lg transition ${
                    !isLoggedIn
                      ? "bg-gray-400 cursor-not-allowed"
                      : activePopup === key
                      ? "bg-green-700 text-white"
                      : "bg-black text-white hover:bg-green-700"
                  }`}
                  onClick={() => togglePopup(key)}
                  disabled={!isLoggedIn}
                >
                  <img className="w-5 h-5 invert brightness-0 contrast-100" src={img} alt={label} />
                </button>
                <span className="absolute px-2 py-1 mr-3 text-xs text-white transition -translate-y-1/2 bg-black rounded opacity-0 right-full top-1/2 group-hover:opacity-100">
                  {label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button with Lottie Animation */}
      <motion.button
        onClick={toggleTooltip}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: isTooltipOpen ? 1.1 : 1, opacity: 1 }}
        whileHover={{ scale: 1.15 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
        className="relative flex items-center justify-center p-3 rounded-full shadow-xl"
        style={{
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          backgroundColor: "rgb(31, 31, 31)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <Lottie animationData={isTooltipOpen ? closeAnimation : plusAnimation} style={{ width: 40, height: 40 }} />
      </motion.button>
    </div>
  );
};

export default PopupManager;