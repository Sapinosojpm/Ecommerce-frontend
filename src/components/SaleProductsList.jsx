import React, { useState, useEffect, useContext } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import "swiper/css";
import "swiper/css/autoplay";
import Title from "./Title";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";

const SaleProductsList = () => {
  const { products } = useContext(ShopContext);
  const [saleProducts, setSaleProducts] = useState([]);

  useEffect(() => {
    if (products?.length > 0) {
      const filteredSaleProducts = products.filter((product) => product.discount > 0);
      setSaleProducts(filteredSaleProducts);
    }
  }, [products]);

  return (
    <div className="container px-4 mx-auto sm:px-6 lg:px-8">
      <div className="py-8 text-3xl text-start">
        <Title text1="FLASH" text2="DEALS" iconSrc={assets.flashsale} />
      </div>

      {saleProducts.length > 0 ? (
        <Swiper
          modules={[Autoplay]}
          spaceBetween={12}
          slidesPerView={1}
          breakpoints={{
            430: { slidesPerView: 2, spaceBetween: 15 },
            640: { slidesPerView: 2, spaceBetween: 18 },
            768: { slidesPerView: 3, spaceBetween: 18 },
            1024: { slidesPerView: 4, spaceBetween: 12 },
            1280: { slidesPerView: 5, spaceBetween: 12 },
          }}
          loop={true}
          autoplay={{
            delay: 3000, // Mas mahaba para smooth ang transition
            disableOnInteraction: false,
          }}
          speed={1200} // Mas mabagal para smooth ang lipat
          className="pb-8"
        >
          {saleProducts.map((product) => (
            <SwiperSlide key={product._id} className="flex justify-center">
              <Link to={`/product/${product._id}`} className="block w-full">
                <div className="relative flex flex-col items-center w-full p-4 transition-transform transform bg-white rounded-lg shadow-lg sm:w-56 md:w-60 lg:w-64 xl:w-72 h-80 hover:scale-105">
                  <div className="absolute px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-md top-2 left-2 sm:text-sm">
                    -{product.discount}%
                  </div>
                  <div className="flex items-center justify-center w-full h-40 sm:h-48 md:h-52 lg:h-56 xl:h-60">
                    <img 
                      src={Array.isArray(product.image) ? product.image[0] : product.image} 
                      alt={product.name} 
                      className="object-contain w-full h-full rounded-lg"
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <h3 className="font-semibold text-md md:text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600 md:text-base">
                      ₱{product.price}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-xl text-center text-gray-500">No sale products available</div>
      )}
    </div>
  );
};

export default SaleProductsList;
