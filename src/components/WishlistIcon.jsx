import { useEffect, useState } from "react";
import { FaHeart } from "react-icons/fa";
import "../css/WishlistIcon.css";

const WishlistIcon = ({ productId, isWishlisted, onToggle }) => {
  const [saved, setSaved] = useState(isWishlisted);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setSaved(isWishlisted);
  }, [isWishlisted]);

  const handleClick = () => {
    if (!animating && !saved) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600); // Reset animation after it completes
    }
    onToggle(productId);
  };

  return (
    <div
      className="relative flex items-center justify-center transition-all cursor-pointer"
      onClick={handleClick}
    >
      <div className={`heart-container ${animating ? "animate-bounce" : ""}`}>
        {/* Heart Icon Outline */}
        <FaHeart
          className={`absolute w-8 h-8 transition-transform duration-300 ${
            saved ? "text-red-500" : "text-gray-500 "
          }`}
        />

        {/* Animated Heart Fill */}
        {saved && (
          <svg className="heart-fill" viewBox="0 0 24 24">
            <defs>
              <clipPath id={`heartClip-${productId}`}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
              </clipPath>
            </defs>
            <rect
              className="heart-wave"
              width="100%"
              height="100%"
              clipPath={`url(#heartClip-${productId})`}
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export default WishlistIcon;
