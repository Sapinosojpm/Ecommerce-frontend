import { useEffect, useState } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AdsDisplay = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideInterval = 5000; // Auto-slide every 5 seconds

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data } = await axios.get(`${backendUrl}/api/ads`);
    setAds(data.filter((ad) => ad.isActive)); // Get all active ads
  };

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1 >= ads.length ? 0 : prev + 1));
      }, slideInterval);

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [ads]);

  return (
    <div className="inline-flex flex-col w-full p-3  bg-white border border-gray-300 rounded-lg shadow-lg max-h-[full]">
      <h2 className="p-3 text-lg font-semibold text-center border-b">Sponsored Ads</h2>

      <div className="relative flex flex-col items-center gap-4">
        {ads.length > 0 ? (
          ads.slice(currentIndex, currentIndex + 1).map((ad) => (
            <a key={ad._id} href={ad.link} target="_blank" rel="noopener noreferrer">
              <img
                src={ad.imageUrl}
                alt="Ad"
                className="w-[550px] h-[550px] object-cover rounded-lg"
              />
            </a>
          ))
        ) : (
          <p className="text-gray-500">No ads available</p>
        )}
      </div>
    </div>
  );
};

export default AdsDisplay;
