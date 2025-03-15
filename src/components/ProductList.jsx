import { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { motion } from "framer-motion";
import ProductItem1 from "./ProductItem1";

const ProductList = () => {
  const { products } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    if (products?.length > 0) {
      const sortedProducts = [...products].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLatestProducts(sortedProducts.slice(0, 10));
    }
  }, [products]);

  return (
    <div className="overflow-hidden my-10 md:px-[7vw]">
      {latestProducts.length > 0 && (
        <motion.div
          className="flex gap-6"
          animate={{ x: ["0%", "-100%"] }} // Galaw mula kanan pakaliwa
          transition={{
            ease: "linear",
            repeat: Infinity, // Infinite loop
            duration: 12, // Bilis ng pag-scroll
          }}
        >
          {[...latestProducts, ...latestProducts].map((item, index) => (
            <motion.div
              key={index}
              className="relative flex-shrink-0 w-60"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {item.discount > 0 && (
                <div className="absolute z-10 px-3 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-md top-2 left-2">
                  Sale
                </div>
              )}
              <ProductItem1 id={item._id} image={item.image} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ProductList;
