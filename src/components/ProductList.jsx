import React, { useState, useEffect, useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import ProductItem1 from "./ProductItem1";

const ProductList = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  // Memoize the sorted products to avoid unnecessary recalculations
  const sortedProducts = useMemo(() => {
    if (!products?.length) return [];
    return [...products].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [products]);

  useEffect(() => {
    if (sortedProducts.length > 0) {
      setLatestProducts(sortedProducts.slice(0, 10));
    }
  }, [sortedProducts]);

  // Duplicate products for seamless infinite scroll
  const duplicatedProducts = useMemo(() => {
    return latestProducts.length > 0 ? [...latestProducts, ...latestProducts] : [];
  }, [latestProducts]);

  // Animation variants for better performance
  const containerVariants = {
    animate: {
      x: ["0%", "-100%"],
      transition: {
        ease: "linear",
        repeat: Infinity,
        duration: 12 * (latestProducts.length / 10), // Adjust duration based on item count
      },
    },
  };

  const itemVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  };

  if (latestProducts.length === 0) {
    return (
      <div className="my-10 md:px-[7vw] text-center text-gray-500">
        No products available
      </div>
    );
  }

  return (
    <div className="my-10 md:px-[7vw] overflow-hidden">
    
      <motion.div
        className="flex gap-6 py-4 " // Added padding for better visual
        variants={containerVariants}
        animate="animate"
      >
        {duplicatedProducts.map((item, index) => (
          <motion.div
            key={`${item._id}-${index}`} // Better key using both id and index
            className="relative flex-shrink-0 bg-[#FDFAF6] shadow-lg w-60"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
          >
            {item.discount > 0 && (
              <div className="absolute z-10 px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-md top-2 left-2">
                {`${item.discount}% OFF`} {/* Show discount percentage */}
              </div>
            )}
            <ProductItem1 
              id={item._id} 
              image={item.image} 
              name={item.name} 
              price={item.price}
              discount={item.discount}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProductList;