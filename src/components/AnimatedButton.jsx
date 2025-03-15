import { useState } from "react";
import "../css/AnimatedButton.css";

const AnimatedButton = ({ text, onClick, successText, duration = 2000, icon }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = () => {
    if (!loading && !success) {
      setLoading(true);
      onClick(); // Call the provided function
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000); // Reset after 2 seconds
      }, duration);
    }
  };

  return (
    <button
      className={`button-container relative rounded-lg px-6 py-3 text-white transition-all duration-300 ${
        success ? "bg-green-600" : loading ? "bg-gray-600" : "bg-green-700 hover:bg-green-800"
      }`}
      onClick={handleClick}
      disabled={loading || success}
    >
      {/* Liquid Fill Background */}
      <div className={`absolute inset-0 z-0 ${loading ? "animate-liquid-fill-ltr" : "opacity-0"}`}></div>

      {/* Button Text */}
      <span className={`button-text relative z-10 block font-medium ${loading || success ? "opacity-0" : "opacity-100"}`}>
        {success ? successText : text}
      </span>

      {/* Cart Icon (Only Show When Loading) */}
      {loading && (
        <div className="absolute z-10 flex items-center justify-center animate-cart-fast">
          {icon}
        </div>
      )}

      {/* Success Checkmark (Only Show on Success) */}
      {success && (
        <div className="absolute z-10 flex items-center justify-center animate-check-bounce">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
      )}
    </button>
  );
};

export default AnimatedButton;
