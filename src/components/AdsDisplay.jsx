import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdsDisplay = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const slideInterval = 4000; // Auto-slide every 4 seconds
  const adsPerPage = 1;// Show 3 ads at a time

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get(`${backendUrl}/api/ads`);
      const activeAds = data.filter((ad) => ad.isActive);
      setAds(activeAds);
      setError(null);
    } catch (err) {
      setError("Failed to load ads");
      console.error("Error fetching ads:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-slide functionality
  useEffect(() => {
    if (ads.length > adsPerPage && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex >= ads.length - adsPerPage + 1 ? 0 : nextIndex;
        });
      }, slideInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length, isPaused]);

  const handlePause = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 3000); // Resume after 3 seconds
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex >= ads.length - adsPerPage + 1 ? 0 : nextIndex;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const prevIndex = prev - 1;
      return prevIndex < 0 ? ads.length - adsPerPage : prevIndex;
    });
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 2000);
  };

  // Handle ad click tracking
  const handleAdClick = (ad) => {
    // Optional: Track ad clicks
    console.log(`Ad clicked: ${ad._id}`);
    // You can send analytics data here
  };

  if (isLoading) {
    return (
      <div className="w-full p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="animate-pulse">
          <div className="h-6 mb-4 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="text-center text-red-500">
          <p className="mb-2">{error}</p>
          <button 
            onClick={fetchAds}
            className="px-3 py-1 text-sm transition-colors bg-red-100 rounded-md hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="w-full p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
        <h2 className="pb-3 mb-4 text-lg font-semibold text-center text-gray-800 border-b border-gray-100">
          Sponsored
        </h2>
        <p className="py-8 text-center text-gray-500">No ads available</p>
      </div>
    );
  }

  const visibleAds = ads.slice(currentIndex, currentIndex + adsPerPage);
  const showControls = ads.length > adsPerPage;

  return (
    <div 
      className="w-full overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl"
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Sponsored
          </h2>
          {showControls && (
            <div className="flex items-center gap-1">
              <button
                onClick={prevSlide}
                className="p-1 transition-colors rounded-full hover:bg-white/60"
                title="Previous ads"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="p-1 transition-colors rounded-full hover:bg-white/60"
                title="Next ads"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ads Container */}
      <div className="p-4">
        <div className="space-y-4">
          {visibleAds.map((ad, index) => (
            <div
              key={`${ad._id}-${currentIndex}-${index}`}
              className="relative overflow-hidden transition-all duration-300 border border-gray-100 rounded-lg group hover:border-gray-200 hover:shadow-md"
            >
              <a
                href={ad.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAdClick(ad)}
                className="relative block"
              >
                {/* Ad Image */}
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title || "Advertisement"}
                    className="object-cover w-full h-40 transition-transform duration-300 sm:h-36 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='100' y='75' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='14'%3EAd Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  
                  {/* Overlay with fade effect */}
                  <div className="absolute inset-0 transition-colors duration-300 bg-black/0 group-hover:bg-black/10"></div>
                  
                  {/* "Ad" label */}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 text-xs font-medium text-white rounded-full bg-black/60 backdrop-blur-sm">
                      Ad
                    </span>
                  </div>

                  {/* External link icon */}
                  <div className="absolute transition-opacity duration-300 opacity-0 top-2 right-2 group-hover:opacity-100">
                    <div className="p-1 rounded-full shadow-sm bg-white/90">
                      <svg className="w-3 h-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Ad Content (if title or description exists) */}
                {(ad.title || ad.description) && (
                  <div className="p-3 bg-white">
                    {ad.title && (
                      <h3 className="mb-1 text-sm font-medium text-gray-900 line-clamp-1">
                        {ad.title}
                      </h3>
                    )}
                    {ad.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {ad.description}
                      </p>
                    )}
                  </div>
                )}
              </a>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {showControls && (
          <div className="flex justify-center gap-1 mt-4">
            {Array.from({ length: Math.ceil(ads.length / adsPerPage) }).map((_, index) => {
              const slideStart = index * adsPerPage;
              const isActive = currentIndex >= slideStart && currentIndex < slideStart + adsPerPage;
              
              return (
                <button
                  key={index}
                  onClick={() => goToSlide(slideStart)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-500 w-4' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Go to ads ${slideStart + 1}-${Math.min(slideStart + adsPerPage, ads.length)}`}
                />
              );
            })}
          </div>
        )}

        {/* Progress bar (for current slide timing) */}
        {showControls && !isPaused && (
          <div className="h-1 mt-3 overflow-hidden bg-gray-200 rounded-full">
            <div 
              className="h-full transition-all duration-100 ease-linear bg-blue-500 rounded-full"
              style={{
                animation: `progress ${slideInterval}ms linear infinite`
              }}
            />
          </div>
        )}
      </div>

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
};

export default AdsDisplay;