import React, { useContext, useState, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";

const ProductItem = ({ id, name, price, discount, image, video, quantity, description, displayPrice }) => {
  const { currency, handleBuyNow } = useContext(ShopContext);
  const [productData, setProductData] = useState({
    _id: id,
    name: name,
    price: price,
    discount: discount > 0 ? discount : null,
    quantity: quantity,
    image: Array.isArray(image) ? image[0] : image,
    video: video || "",
    description: description || "",
  });
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const scaleEffect = useSpring({
    transform: hovered ? "scale(1.02)" : "scale(1)",
    config: { tension: 280, friction: 20 },
  });

  const shadowEffect = useSpring({
    boxShadow: hovered 
      ? "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(8, 131, 149, 0.1)" 
      : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    config: { tension: 280, friction: 20 },
  });

  useEffect(() => {
    if (price) {
      setProductData((prevData) => ({
        ...prevData,
        _id: id,
        name,
        price,
        discount: discount > 0 ? discount : null,
        image: Array.isArray(image) ? image[0] : image,
        video: video || "",
        description: description || "",
      }));
    }
  }, [id, name, price, discount, image, video, description]);

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current && productData.video) {
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

  const mainPrice = typeof displayPrice === 'number' ? displayPrice : (discount ? price - price * (discount / 100) : price);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const truncateDescription = (text, maxLength = 50) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  const onBuyNowClick = () => {
    handleBuyNow(id, 1);
  };

  const getMaxLength = () => {
    if (window.innerWidth < 640) return 30;
    if (window.innerWidth < 1024) return 50;
    if (window.innerWidth < 10280) return 25;
    return 100;
  };

  return (
    <animated.div
      className="group relative flex flex-col h-full transition-all duration-500 bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-[#088395]/20"
      style={{ ...scaleEffect, ...shadowEffect }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sale Badge */}
      {productData.discount && (
        <div className="absolute z-20 top-4 left-4">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            -{productData.discount}% OFF
          </div>
        </div>
      )}

      {/* Product Image/Video Section */}
      <Link
        className="block cursor-pointer"
        to={`/product/${id}`}
        onClick={scrollToTop}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="relative aspect-square">
            {/* Video Overlay */}
            {productData.video && (
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                  hovered ? 'opacity-100 z-10' : 'opacity-0'
                }`}
                muted
                loop
                playsInline
                preload="metadata"
              >
                <source src={productData.video} type="video/mp4" />
              </video>
            )}
            
            {/* Main Product Image */}
            <div className="relative w-full h-full overflow-hidden">
              <img
                className={`w-full h-full object-cover transition-all duration-700 ease-in-out transform ${
                  hovered && productData.video ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
                } group-hover:scale-105`}
                src={productData.image}
                alt={name}
                loading="lazy"
              />
              
              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-500 ${
                hovered ? 'opacity-100' : 'opacity-0'
              }`} />
            </div>

            {/* Play Icon for Video */}
            {productData.video && !hovered && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3 transition-transform duration-300 transform rounded-full shadow-lg bg-white/90 backdrop-blur-sm group-hover:scale-110">
                  <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Product Information */}
      <div className="flex-grow p-6 space-y-4">
        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-[#088395] transition-colors duration-300">
          {name}
        </h3>
        
        {/* Product Description */}
        <p className="text-sm leading-relaxed text-gray-600 line-clamp-2">
          {truncateDescription(productData.description, getMaxLength())}
        </p>

        {/* Price Section */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            {discount ? (
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-[#088395]">
                  {currency}{mainPrice.toLocaleString()}
                </span>
                <span className="text-sm font-medium text-gray-400 line-through">
                  {currency}{price.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                {currency}{mainPrice.toLocaleString()}
              </span>
            )}
          </div>
          
          {/* Stock Indicator */}
          {quantity <= 5 && quantity > 0 && (
            <div className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
              {quantity} left
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <Link
          to={`/product/${id}`}
          className="group/btn relative w-full py-4 overflow-hidden text-center font-semibold text-white transition-all duration-500 bg-gradient-to-r from-[#088395] to-[#0a9bb0] rounded-xl hover:from-[#066b7a] hover:to-[#088395] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-white/20 group-hover/btn:translate-x-full"></div>
          
          <span className="relative flex items-center justify-center space-x-2">
            <span className="transition-all duration-300 group-hover/btn:tracking-wide">
              View Details
            </span>
            <svg 
              className="w-5 h-5 transition-transform duration-300 transform group-hover/btn:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </Link>
      </div>

      {/* Hover Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none ${
        hovered ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#088395]/5 to-transparent"></div>
      </div>
    </animated.div>
  );
};

export default ProductItem;