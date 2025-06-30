import React, { useState, useRef } from "react";
import { useSpring, animated } from "@react-spring/web";

const AdCard = ({ ad, index }) => {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const scaleEffect = useSpring({
    transform: hovered ? "scale(1.05)" : "scale(1)",
    config: { tension: 200, friction: 15 },
  });

  const shadowEffect = useSpring({
    boxShadow: hovered ? "0 10px 20px rgba(0, 0, 0, 0.2)" : "0 5px 10px rgba(0, 0, 0, 0.1)",
    config: { tension: 200, friction: 15 },
  });

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current && ad.video) {
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleAdClick = () => {
    // Track ad click (optional analytics)
    console.log(`Ad clicked: ${ad._id}`);
    
    // Open ad link
    if (ad.link) {
      window.open(ad.link, '_blank', 'noopener,noreferrer');
    }
  };

  const truncateDescription = (text, maxLength = 50) => {
    if (!text) return "";
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  const getMaxLength = () => {
    if (window.innerWidth < 640) return 30;
    if (window.innerWidth < 1024) return 50;
    if (window.innerWidth < 10280) return 25;
    return 100;
  };

  return (
    <animated.div
      className="relative flex flex-col h-full transition-shadow duration-300 border border-blue-200 rounded-lg shadow-md cursor-pointer bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-xl"
      style={{ ...scaleEffect, ...shadowEffect }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleAdClick}
    >
      {/* Ad Badge */}
      <div className="absolute top-0 z-10 w-24 h-24 overflow-hidden left-1">
        <div className="absolute w-48 p-1 text-xs font-bold text-center text-white uppercase transform -rotate-45 bg-blue-500 shadow-md -left-20 top-4">
          Ad
        </div>
      </div>

      {/* Sponsored Label */}
      <div className="absolute z-10 top-2 right-2">
        <span className="px-2 py-1 text-xs font-medium text-blue-700 border border-blue-200 rounded-full bg-white/80 backdrop-blur-sm">
          Sponsored
        </span>
      </div>

      <div className="block text-gray-800">
        <animated.div
          className="m-5 overflow-hidden bg-white border border-gray-100 rounded-t-lg"
          style={useSpring({ opacity: 1, y: 0, from: { opacity: 0, y: 20 } })}
        >
          <div className="relative w-72 h-72">
            {/* Video (if available) */}
            {ad.video && (
              <video
                ref={videoRef}
                className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-500 ${
                  hovered ? 'opacity-100 z-10' : 'opacity-0'
                }`}
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src={ad.video} type="video/mp4" />
              </video>
            )}
            
            {/* Ad Image */}
            <img
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                hovered && ad.video ? 'opacity-0' : 'opacity-100'
              }`}
              src={ad.imageUrl}
              alt={ad.title || "Advertisement"}
              loading="lazy"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='100' y='100' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='16'%3EAd%3C/text%3E%3C/svg%3E";
              }}
            />

            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              hovered ? 'bg-opacity-10' : 'bg-opacity-0'
            }`} />

            {/* External Link Icon */}
            <div className={`absolute top-3 left-3 transition-opacity duration-300 ${
              hovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <div className="p-2 rounded-full shadow-sm bg-white/90">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </div>
        </animated.div>
      </div>

      {/* Ad Content */}
      <div className="flex-grow">
        <p className="m-5 text-lg font-bold text-gray-700 truncate">
          {ad.title || "Special Offer"}
        </p>
        <p className="m-5 text-lg text-gray-600">
          {truncateDescription(ad.description || "Click to learn more about this amazing offer!", getMaxLength())}
        </p>
      </div>

      {/* Price/CTA Section */}
      <div className="flex items-center justify-between px-4 py-2 mt-auto space-x-2">
        <div className="gap-2 font-semibold text-md">
          {ad.price ? (
            <div>
              {ad.discount ? (
                <>
                  <span className="text-red-600">
                    ${(ad.price * (1 - ad.discount / 100)).toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ${ad.price.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-blue-600">
                  ${ad.price.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <span className="font-medium text-blue-600">
              {ad.cta || "Learn More"}
            </span>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="flex flex-col gap-2 p-4">
        <button
          onClick={handleAdClick}
          className="relative hidden w-full py-3 overflow-hidden text-center text-white transition-all duration-300 bg-blue-500 rounded-lg sm:block group hover:bg-blue-600"
        >
          <span className="absolute transition-all duration-300 ease-in-out -translate-x-1/2 -translate-y-1/2 opacity-100 left-1/2 top-1/2 group-hover:translate-x-full group-hover:opacity-0">
            {ad.cta || "Shop Now"}
          </span>
          <span className="absolute left-0 transition-all duration-300 ease-in-out -translate-x-full -translate-y-1/2 opacity-0 top-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:left-1/2">
            ➜
          </span>
        </button>
      </div>

      {/* Bottom Ad Indicator */}
      <div className="absolute bottom-2 left-2">
        <div className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 rounded-full bg-white/80 backdrop-blur-sm">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Ad</span>
        </div>
      </div>
    </animated.div>
  );
};

export default AdCard;