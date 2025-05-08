import React, { useContext, useState, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";

const ProductItem = ({ id, name, price, discount, image, video, quantity, description }) => {
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
    transform: hovered ? "scale(1.05)" : "scale(1)",
    config: { tension: 200, friction: 15 },
  });

  const shadowEffect = useSpring({
    boxShadow: hovered ? "0 10px 20px rgba(0, 0, 0, 0.2)" : "0 5px 10px rgba(0, 0, 0, 0.1)",
    config: { tension: 200, friction: 15 },
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

  const finalPrice = productData.discount
    ? price - price * (productData.discount / 100)
    : price;

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
      className="relative flex flex-col h-full transition-shadow duration-300 border rounded-lg shadow-md bg-[FDFAF6#] border-gray-150 hover:shadow-xl"
      style={{ ...scaleEffect, ...shadowEffect }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
     {productData.discount && (
      <div className="absolute top-0 z-10 w-24 h-24 overflow-hidden left-1">
        <div className="absolute w-48 p-1 text-xs font-bold text-center text-white uppercase transform -rotate-45 bg-red-500 shadow-md -left-20 top-4">
          Sale
        </div>
      </div>
    )}


      <Link
        className="block text-gray-800 cursor-pointer"
        to={`/product/${id}`}
        onClick={scrollToTop}
      >
        <animated.div
          className="m-5 overflow-hidden bg-white border rounded-t-lg border-gray-50"
          style={useSpring({ opacity: 1, y: 0, from: { opacity: 0, y: 20 } })}
        >
          <div className="relative aspect-square">
            {productData.video && (
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
                <source src={productData.video} type="video/mp4" />
              </video>
            )}
            
            <img
              className={`w-full h-full object-cover transition-opacity duration-500 ${
                hovered && productData.video ? 'opacity-0' : 'opacity-100'
              }`}
              src={productData.image}
              alt={name}
              loading="lazy"
            />
          </div>
        </animated.div>
      </Link>

      <div className="flex-grow">
        <p className="m-5 text-lg font-bold text-gray-700 truncate">{name}</p>
        <p className="m-5 text-lg text-gray-600">
          {truncateDescription(productData.description, getMaxLength())}
        </p>
      </div>

      <div className="flex items-center justify-between px-4 py-2 mt-auto space-x-2">
        <div className="gap-2 font-semibold text-md">
          {productData.discount ? (
            <div>
              <span className="text-red-600">
                {currency}
                {finalPrice.toLocaleString()}
              </span>
              <span className="ml-2 text-sm text-gray-500 line-through">
                {currency}
                {price.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-black">
              {currency}
              {price.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <Link
          to={`/product/${id}`}
          className="relative block w-full py-3 overflow-hidden text-center text-white transition-all duration-300 bg-[#088395] rounded- group hover:bg-black"
        >
          <span className="absolute transition-all duration-300 ease-in-out -translate-x-1/2 -translate-y-1/2 opacity-100 left-1/2 top-1/2 group-hover:translate-x-full group-hover:opacity-0">
            View Details
          </span>
          <span className="absolute left-0 transition-all duration-300 ease-in-out -translate-x-full -translate-y-1/2 opacity-0 top-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:left-1/2">
            ➜
          </span>
        </Link>

  
      </div>
    </animated.div>
  );
};

export default ProductItem;