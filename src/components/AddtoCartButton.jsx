import { useState } from "react";
import "../css/AddtoCartButton.css";

const AddToCartButton = ({ text = "Add to Cart", duration = 2000 }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = () => {
    if (!loading && !success) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000); // Reset after 2 seconds
      }, duration);
    }
  };

  return (
    <button
      className={`relative flex items-center justify-center overflow-hidden rounded-lg px-6 py-3 text-white transition-all duration-300 ${
        success
          ? "bg-green-600"
          : loading
          ? "bg-gray-600"
          : "bg-indigo-700 hover:bg-indigo-800"
      }`}
      onClick={handleClick}
      disabled={loading || success}
    >
      {/* Liquid Fill Background */}
      <div
        className={`absolute inset-0 z-0 transition-all duration-[2s] ${
          loading ? "animate-liquid-fill-ltr" : "opacity-0"
        }`}
      ></div>

      {/* Button Text */}
      <span
        className={`relative z-10 block font-medium transition-transform duration-500 ${
          loading || success ? "-translate-y-8 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {text}
      </span>

      {/* Cart Icon */}
      <div
        className={`absolute flex items-center justify-center transition-all z-10 ${
          loading
            ? "animate-cart-fast"
            : success
            ? "opacity-0"
            : "-translate-x-[100px] rotate-[-18deg]"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8"
        >
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.3 11.6a2 2 0 0 0 2 1.4h10.4a2 2 0 0 0 2-1.4L23 6H6"></path>
        </svg>
      </div>

      {/* Checkmark */}
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

export default AddToCartButton;
