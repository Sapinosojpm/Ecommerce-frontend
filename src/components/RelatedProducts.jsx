import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";

const RelatedProducts = ({ category, excludeId }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    console.log("🚀 Products in ShopContext:", products);
    console.log("📌 Category prop:", category);
    console.log("❌ Exclude Product ID:", excludeId);

    if (!category || products.length === 0) {
      console.warn("⚠️ Missing category or products are empty");
      return;
    }

    // Filter products by category and exclude the current product
    const filteredProducts = products.filter(
      (item) => item.category === category && item._id !== excludeId
    );
    console.log("✅ Filtered Related Products:", filteredProducts);

    setRelated(filteredProducts.slice(0, 5));
  }, [products, category, excludeId]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="my-24 md:px-[7vw]">
      <div className="py-2 text-3xl text-center">
        <Title text1={"RELATED"} text2={"PRODUCTS"} />
      </div>

      <div className="grid gap-4 grid-cols sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-6">
        {related.length > 0 ? (
          related.map((item) => (
            <div key={item._id} onClick={scrollToTop}>
              <ProductItem
                id={item._id}
                name={item.name}
                price={item.price}
                image={item.image}
                discount={item.discount}
                description={item.description}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No related products found.
          </p>
        )}
      </div>
    </div>
  );
};

export default RelatedProducts;
