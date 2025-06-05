import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Title from "./Title";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

// Utility function to calculate discounted price
const calculateDiscountedPrice = (price, discount) => {
  return (price * (1 - discount / 100)).toFixed(2);
};

// Memoized product card component for better performance
const SaleProductCard = React.memo(({ product }) => {
  const discountedPrice = useMemo(
    () => calculateDiscountedPrice(product.price, product.discount),
    [product.price, product.discount]
  );

  const imageUrl = useMemo(
    () => Array.isArray(product.image) ? product.image[0] : product.image,
    [product.image]
  );

  return (
    <Link 
      to={`/product/${product._id}`} 
      className="block h-full rounded-lg group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      aria-label={`View ${product.name} on sale for ₱${discountedPrice}`}
    >
      <div className="relative flex flex-col h-full p-4 transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-xl hover:scale-[1.02] group-focus:shadow-xl group-focus:scale-[1.02]">
        {/* Discount Badge */}
        <div className="absolute z-10 px-3 py-1 text-xs font-bold text-white rounded-full shadow-md bg-gradient-to-r from-red-500 to-red-600 top-3 left-3 sm:text-sm animate-pulse">
          -{product.discount}%
        </div>

        {/* Product Image */}
        <div className="relative flex items-center justify-center w-full h-48 mb-4 overflow-hidden rounded-lg bg-gray-50 sm:h-52 md:h-56">
          <img
            src={imageUrl}
            alt={product.name}
            className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.src = assets.placeholder || '/placeholder-image.jpg';
            }}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col flex-grow">
          {/* Product Name */}
          <div className="min-h-[4rem] mb-3">
            <h3 className="font-semibold text-gray-800 transition-colors duration-200 text-md md:text-lg line-clamp-2 group-hover:text-blue-600">
              {product.name}
            </h3>
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-600 md:text-xl">
                  ₱{discountedPrice}
                </span>
                <span className="text-sm text-gray-500 line-through md:text-base">
                  ₱{product.price.toFixed(2)}
                </span>
              </div>
              <div className="text-xs font-medium text-green-600">
                You save ₱{(product.price - parseFloat(discountedPrice)).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

SaleProductCard.displayName = 'SaleProductCard';

const SaleProductsList = () => {
  const { products, loading } = useContext(ShopContext);
  const [saleProducts, setSaleProducts] = useState([]);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  // Memoize filtered products for better performance
  const filteredSaleProducts = useMemo(() => {
    if (!products?.length) return [];
    return products
      .filter((product) => product.discount > 0)
      .sort((a, b) => b.discount - a.discount); // Sort by highest discount first
  }, [products]);

  useEffect(() => {
    setSaleProducts(filteredSaleProducts);
  }, [filteredSaleProducts]);

  // Handle autoplay pause/resume
  const handleMouseEnter = useCallback(() => {
    setIsAutoplayPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsAutoplayPaused(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="py-8 text-3xl text-start">
          <Title text1="FLASH" text2="DEALS" iconSrc={assets.flashsale} />
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 border-red-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto sm:px-6 lg:px-8">
      {/* Header */}
      <div className="py-8 text-3xl text-start">
        <Title text1="FLASH" text2="DEALS" iconSrc={assets.flashsale} />
      </div>

      {saleProducts.length > 0 ? (
        <div className="relative">
          {/* Products Count */}
          <div className="mb-4 text-sm text-gray-600">
            {saleProducts.length} item{saleProducts.length !== 1 ? 's' : ''} on sale
          </div>

          <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="pb-8"
          >
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                430: { slidesPerView: 2, spaceBetween: 16 },
                640: { slidesPerView: 2, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
                1280: { slidesPerView: 5, spaceBetween: 16 },
              }}
              loop={saleProducts.length > 5}
              autoplay={
                !isAutoplayPaused && {
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              }
              speed={800}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              grabCursor={true}
              className="sale-products-swiper"
              a11y={{
                prevSlideMessage: 'Previous sale product',
                nextSlideMessage: 'Next sale product',
              }}
            >
              {saleProducts.map((product) => (
                <SwiperSlide key={product._id} className="h-auto">
                  <SaleProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            {saleProducts.length > 5 && (
              <>
                <div className="absolute left-0 z-10 p-2 transition-colors duration-200 transform -translate-y-1/2 bg-white rounded-full shadow-lg cursor-pointer swiper-button-prev-custom top-1/2 hover:bg-gray-50">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <div className="absolute right-0 z-10 p-2 transition-colors duration-200 transform -translate-y-1/2 bg-white rounded-full shadow-lg cursor-pointer swiper-button-next-custom top-1/2 hover:bg-gray-50">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 text-6xl">🔥</div>
          <div className="mb-2 text-xl text-gray-500">No flash deals available</div>
          <div className="text-sm text-gray-400">Check back soon for amazing discounts!</div>
        </div>
      )}
    </div>
  );
};

export default SaleProductsList;