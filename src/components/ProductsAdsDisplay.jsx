import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "const backendUrl = import.meta.env.VITE_BACKEND_URL;";

const ProductsAdsDisplayHome = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const slideInterval = 5000; // Auto-slide every 5 seconds

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/ads`);
      const activeAds = data.filter((ad) => ad.isActive);
      setAds(activeAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, slideInterval);

      return () => clearInterval(interval);
    }
  }, [ads]);

  return (
    <div className="relative flex flex-col items-center w-full max-w-lg p-4 bg-white border border-gray-300 rounded-lg shadow-lg">
      <h2 className="p-3 text-lg font-semibold text-center border-b">Sponsored Ads</h2>

      <div className="relative w-full h-[36rem] flex items-center justify-center">
        {loading ? (
          <p className="text-gray-500">Loading ads...</p>
        ) : ads.length > 0 ? (
          <a
            href={ads[currentIndex].link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full"
          >
            <img
              src={ads[currentIndex].imageUrl}
              alt="Ad"
              className="object-cover w-full h-full transition-all rounded-lg shadow-md hover:opacity-90"
              loading="lazy"
            />
          </a>
        ) : (
          <p className="text-gray-500">No ads available</p>
        )}
      </div>
    </div>
  );
};

export default ProductsAdsDisplayHome;


// 24/36 ratio of ads