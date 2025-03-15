import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import RelatedProducts from "../components/RelatedProducts";
import { WishlistContext } from "../context/WishlistContext";
import { FaShoppingCart } from "react-icons/fa";
import AnimatedButton from "../components/AnimatedButton";
import WishlistIcon from "../components/WishlistIcon";
import Lenis from "@studio-freight/lenis";
import { Lens } from "../components/Lens"; // Import Lens component

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart, fetchProduct } = useContext(ShopContext);
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [hovering, setHovering] = useState(false); // Lens hover state

  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smooth: true,
      lerp: 0.1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (productData) {
      setIsWishlisted(wishlist.some((item) => item._id === productData._id));
    }
  }, [wishlist, productData]);

  const fetchProductData = async () => {
    const foundProduct = products.find((item) => item._id === productId);
    if (foundProduct) {
      setProductData(foundProduct);
      setImage(foundProduct.image[0]);
    } else {
      const data = await fetchProduct(productId);
      if (data) {
        setProductData(data);
        setImage(data.image[0]);
      }
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  useEffect(() => {
    setUserRole(localStorage.getItem("role") || null);
  }, []);

  if (!productData) {
    return <div className="mt-10 text-xl text-center">Loading...</div>;
  }

  return (
    <div className="container px-4 py-12 mx-auto my-20 product-page">
      <div className="flex flex-col gap-12 sm:flex-row">
        {/* Product Images */}
        <div className="flex flex-col gap-4 sm:flex-row sm:w-1/2">
          <div className="flex gap-4 overflow-x-auto sm:flex-col sm:w-1/4">
            {productData.image.map((item, index) => (
              <motion.img
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="object-cover w-24 h-24 border border-gray-200 rounded-lg cursor-pointer sm:w-32 sm:h-32"
                alt={`Product Image ${index + 1}`}
              />
            ))}
          </div>

          <div className="z-50 flex items-center justify-center w-full cursor-pointer sm:w-3/4">
            {/* Apply Lens (Zoom Effect) on Main Image */}
            <Lens zoomFactor={2} lensSize={150} hovering={hovering} setHovering={setHovering}>
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src={image}
                alt="Main Product Image"
                className="object-contain w-full h-auto"
              />
            </Lens>
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 mt-8 sm:w-1/2 sm:mt-0">
          <h1 className="mb-3 text-2xl font-semibold text-gray-900">{productData.name}</h1>

          <div className="mb-5 text-xl font-medium text-gray-800">
            {productData.discount && productData.discount > 0 ? (
              <>
                <span className="ml-2 text-gray-500 line-through">
                  {currency}
                  {productData.price.toLocaleString()}
                </span>
                <span className="ml-2 text-lg font-semibold text-green-600">
                  {currency}
                  {(productData.price * (1 - productData.discount / 100)).toFixed(2)}
                </span>
                <span className="ml-2 text-sm text-red-500">{`${productData.discount}% off`}</span>
              </>
            ) : (
              <span>
                {currency}
                {productData.price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Quantity and Stock */}
          <div className="flex items-center gap-4 mb-4">
            <p className="text-lg font-medium">Available Quantity: </p>
            <span>{productData.quantity}</span>
          </div>

          {userRole === "user" && (
            <>
              {productData.quantity === 0 ? (
                <div className="inline-block px-4 py-2 text-lg font-semibold text-red-600 bg-red-100 border border-red-400 rounded-lg">
                  Out of Stock
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-5">
                    <label htmlFor="quantity" className="text-lg font-medium">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                      className={twMerge("w-24 px-4 py-2 text-center border rounded-lg shadow-sm")}
                      min="1"
                      max={productData.quantity}
                    />
                  </div>

                  <div className="flex gap-4">
                    <AnimatedButton
                      text="ADD TO CART"
                      successText="Added!"
                      onClick={() => {
                        addToCart(productData._id, quantity);
                        toast.success("Product added to cart successfully!");
                      }}
                      icon={<FaShoppingCart className="w-6 h-6 text-white" />}
                      disabled={productData.quantity === 0}
                    />

                    <WishlistIcon
                      productId={productData._id}
                      isWishlisted={isWishlisted}
                      onToggle={() => {
                        toggleWishlist(productData._id);
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
          <hr className="my-8" />
        </div>
      </div>

      {/* Product Description */}
      <div className="mt-12 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
        <div className="pb-4 border-b">
          <b className="text-lg">Description</b>
        </div>
        <div className="mt-6 text-sm text-gray-600">
          <p>{productData.description}</p>
        </div>
      </div>

      {/* Related Products */}
      {productData && <RelatedProducts category={productData.category} excludeId={productData._id} />}
    </div>
  );
};

export default Product;
