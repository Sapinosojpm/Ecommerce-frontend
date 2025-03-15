import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";

const ProductItem = ({ id, name, price, discount, image, video, description }) => {
  const { currency } = useContext(ShopContext);
  const [productData, setProductData] = useState({
    _id: id,
    name: name,
    price: price,
    discount: discount > 0 ? discount : null,
    quantity: 10,
    image: Array.isArray(image) ? image[0] : image,
    video: video || "", // Fallback if no video is provided
    description: description || "", // Ensure description is passed correctly
  });
  const [hovered, setHovered] = useState(false);

  // Scale and shadow effect for hover
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
        video: video || "", // Ensure video URL is set
        description: description || "", // Ensure description is passed
      }));
    }
  }, [id, name, price, discount, image, video, description]);

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

  return (
    <animated.div
      className="relative flex flex-col h-full transition-shadow duration-300 bg-gray-100 border rounded-lg shadow-md border-gray-150 hover:shadow-xl"
      style={{ ...scaleEffect, ...shadowEffect }} // Apply zoom and shadow effect
    >
      {/* Sale Badge */}
      {productData.discount && (
        <animated.div
          className="absolute px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-md top-2 left-2"
          style={{ zIndex: 10 }} // Set the z-index higher to ensure it's on top
        >
          Sale
        </animated.div>
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
          <animated.div
            className="relative"
            onMouseEnter={() => setHovered(true)} // Only apply hover effect on the image
            onMouseLeave={() => setHovered(false)} // Remove hover effect when mouse leaves
          >
            <div className="relative">
  {/* Show video on hover */}
  {hovered && productData.video ? (
    <video
      className="absolute top-0 left-0 object-cover w-full transition-opacity duration-500 ease-in-out opacity-100 md:h-60 sm:h-60"
      autoPlay
      loop
      muted
    >
      <source src={productData.video} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  ) : null}

  <img
    className={`border lg:p-[30px] md:py-[40px] w-full md:h-60 sm:h-60 object-cover transition-opacity duration-500 ease-in-out ${hovered && productData.video ? 'opacity-0' : 'opacity-100'}`}
    src={productData.image}
    alt={name}
  />
</div>

          </animated.div>
        </animated.div>
      </Link>

      <div className="flex-grow">
        <p className="m-5 text-lg font-bold text-gray-700 truncate">{name}</p>
        {/* Displaying the description */}
        <p className="m-5 text-lg text-gray-600">
          {truncateDescription(productData.description, 50)} {/* Adjust maxLength as needed */}
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

      {/* Button to view details */}
      <Link
  to={`/product/${id}`}
  className="relative block w-full py-5 mt-4 overflow-hidden text-center text-white transition-all duration-300 bg-green-600 rounded-b-lg group hover:bg-green-700"
>
  {/* Text slides right & fades out */}
  <span className="absolute transition-all duration-300 ease-in-out -translate-x-1/2 -translate-y-1/2 opacity-100 left-1/2 top-1/2 group-hover:translate-x-full group-hover:opacity-0">
    View Details
  </span>

  {/* Arrow fades in from left to center */}
  <span className="absolute left-0 transition-all duration-300 ease-in-out -translate-x-full -translate-y-1/2 opacity-0 top-1/2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:left-1/2">
    ➜
  </span>
</Link>





    </animated.div>
  );
};

export default ProductItem;
