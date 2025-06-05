import { useState, useEffect, useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import AdCard from "./AdCard";
import axios from "axios";

const LatestCollection = () => {
  const { products, currency } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);
  const [maxDisplay, setMaxDisplay] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ads, setAds] = useState([]);

  // Fetch display settings and ads
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [settingsResponse, adsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/latest-products`),
          axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/ads`),
        ]);
        setMaxDisplay(settingsResponse.data.maxDisplay);
        setAds(adsResponse.data.filter((ad) => ad.isActive));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
        setMaxDisplay(10);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Function to integrate ads with products
  const integrateAdsWithProducts = (products, ads) => {
    if (!ads.length)
      return products.map((product) => ({ type: "product", data: product }));

    const integrated = [];
    const adPositions = [5]; // Adjusted positions for smaller collections
    let adIndex = 0;

    products.forEach((product, index) => {
      integrated.push({ type: "product", data: product });

      if (adPositions.includes(index + 1) && ads[adIndex]) {
        integrated.push({
          type: "ad",
          data: ads[adIndex],
          id: `ad-${ads[adIndex]._id}-${index}`,
        });
        adIndex = (adIndex + 1) % ads.length;
      }
    });

    return integrated;
  };

  // Memoize sorted products
  const sortedProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return [...products].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });
  }, [products]);

  // Update latest products when sorted products or maxDisplay changes
  useEffect(() => {
    if (sortedProducts.length > 0) {
      const latest = sortedProducts.slice(0, maxDisplay);
      setLatestProducts(integrateAdsWithProducts(latest, ads));
    }
  }, [sortedProducts, maxDisplay, ads]);

  if (error) {
    return (
      <div className="my-10 md:px-[7vw] px-4 md:mx-[6%] text-center text-red-500">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="my-10 md:px-[7vw] px-4 md:mx-[6%]">
        <div className="py-8 text-4xl text-center">
          <Title text1={"LATEST"} text2={"PRODUCTS"} />
          <p className="">
            "Just dropped! Explore our newest arrivals — fresh, innovative, and
            made to impress. Be the first to try the latest products everyone
            will be talking about."
          </p>
        </div>
        <div className="grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6">
          {[...Array(maxDisplay)].map((_, index) => (
            <div
              key={index}
              className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (latestProducts.length === 0) {
    return (
      <div className="my-10 md:px-[7vw] px-4 md:mx-[6%]">
        <div className="py-8 text-4xl text-center">
          <Title text1={"LATEST"} text2={"PRODUCTS"} />
          <p></p>
        </div>
        <p className="text-center text-gray-500">
          No latest products available
        </p>
      </div>
    );
  }

  return (
    <div className="my-10 md:px-[7vw] px-4 md:mx-[6%]">
      <div className="py-8 text-4xl text-center">
        <Title text1={"LATEST"} text2={"PRODUCTS"} />
      </div>

      <div className="grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6">
        {latestProducts.map((item) =>
          item.type === "product" ? (
            <ProductItem
              key={item.data._id}
              id={item.data._id}
              image={item.data.image}
              name={item.data.name}
              price={item.data.price}
              quantity={item.data.quantity}
              discount={item.data.discount}
              currency={currency}
              video={item.data.video}
              description={item.data.description}
              createdAt={item.data.createdAt}
            />
          ) : (
            <AdCard key={item.id} ad={item.data} />
          )
        )}
      </div>
    </div>
  );
};

export default LatestCollection;
