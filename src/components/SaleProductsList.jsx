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
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            430: { slidesPerView: 2, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 16 },
            1280: { slidesPerView: 5, spaceBetween: 16 },
          }}
          loop={true}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          speed={800}
          className="pb-8"
        >
          {saleProducts.map((product) => (
            <SwiperSlide key={product._id} className="h-auto">
              <Link to={`/product/${product._id}`} className="block h-full">
                <div className="relative flex flex-col h-full p-4 transition-all duration-300 bg-[#FDFAF6] rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02]">
                  <div className="absolute px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-md top-3 left-3 sm:text-sm">
                    -{product.discount}%
                  </div>
                  <div className="flex items-center justify-center w-full h-48 mb-4 sm:h-52 md:h-56">
                    <img
                      src={
                        Array.isArray(product.image)
                          ? product.image[0]
                          : product.image
                      }
                      alt={product.name}
                      className="object-contain w-full h-full rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col flex-grow mt-auto">
                    <div className="min-h-[4rem]">
                      {" "}
                      {/* Fixed height container for product name */}
                      <h3 className="font-semibold text-md md:text-lg line-clamp-2">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-2">
                      {product.discount > 0 ? (
                        <div className="flex items-center">
                          <span className="font-medium text-red-600">
                            ₱
                            {(
                              product.price *
                              (1 - product.discount / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ₱{product.price.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-600">
                          ₱{product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <div className="text-xl text-center text-gray-500">
          No sale products available
        </div>
      )}
    </div>
  );
};

export default SaleProductsList;