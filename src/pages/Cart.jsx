import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    clearCart,
    userId,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [quantityErrors, setQuantityErrors] = useState({});

  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    console.log("cartItems:", cartItems); // Debug
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        const item = cartItems[itemId];
        if (item && item.quantity > 0) {
          tempData.push({
            _id: itemId,
            quantity: item.quantity,
            variations: item.variations || null,
          });
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);
  

  const isCartEmpty = cartData.length === 0;

  const isCheckoutDisabled = cartData.some((item) => {
    const productData = products.find((product) => product._id === item._id);
    return productData && productData.quantity === 0;
  });

  const getTotalPrice = () => {
    return cartData.reduce((total, item) => {
      const productData = products.find((product) => product._id === item._id);
      if (!productData) return total;

      const finalPrice = productData.discount
        ? productData.price * (1 - productData.discount / 100)
        : productData.price;
      return total + finalPrice * item.quantity;
    }, 0);
  };

  const handleClearCart = async () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      toast.error("You need to be logged in to clear the cart.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        clearCart();
      } else {
        toast.error(data.message || "Failed to clear cart.");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Update quantity when input changes
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item from cart
      updateQuantity(itemId, 0);
      return;
    }

    updateQuantity(itemId, newQuantity);
  };

  

  return (
    <div className="border-t pt-[80px] md:pt-[7%] sm:pt-[10%] md:px-[7vw] px-4">
      <div className="text-2xl mb-3 pt-[40px]">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={handleClearCart}
          className={`text-white text-sm font-semibold bg-black py-2 px-4 m-5 ${
            isCartEmpty ? "cursor-not-allowed bg-gray-400" : ""
          }`}
          disabled={isCartEmpty}
        >
          Clear Cart
        </button>
      </div>

      <div>
        {isCartEmpty ? (
          <p className="text-center text-gray-500">
            Your cart is empty.{" "}
            <Link to="/collection" className="text-blue-500 underline">
              Browse products
            </Link>{" "}
            to add some!
          </p>
        ) : (
          cartData.map((item, index) => {
            const productData = products.find(
              (product) => product._id === item._id
            );

            if (!productData) return null;

            const finalPrice = productData.discount
              ? productData.price * (1 - productData.discount / 100)
              : productData.price;

            return (
              <div
                key={index}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                <div className="flex items-start gap-6">
                  <img
                    className="w-16 sm:w-20"
                    src={productData.image[0]}
                    alt={productData.name}
                  />
                  <div>
                    <p className="text-xs font-medium sm:text-lg">
                      {productData.name}
                    </p>
                    <p className="text-xs font-light text-gray-500 sm:text-sm">
                      {productData.description}
                    </p>
                    <div className="flex items-center gap-5 mt-2">
                      {productData.discount > 0 && (
                        <p className="text-gray-500 line-through">
                          {currency}
                          {productData.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {cartItems[item._id]?.variations && (
                      <div className="mt-2 space-y-2">
                        {Object.entries(cartItems[item._id].variations).map(
                          ([variationType, variationData]) => (
                            <div
                              key={variationType}
                              className="pl-3 text-sm border-l-2 border-gray-200"
                            >
                              <div className="flex gap-1">
                                <span className="font-medium capitalize">
                                  {variationType}:
                                </span>
                                <span className="text-gray-700">
                                  {variationData.name}
                                </span>
                              </div>

                              {/* Price breakdown */}
                              <div className="flex gap-1 mt-1 text-sm font-semibold">
                                <span className="text-gray-700">Price:</span>
                                <span>
                                  {currency}
                                  {(
                                    finalPrice +
                                    (variationData.priceAdjustment || 0)
                                  ).toLocaleString()}
                                </span>
                              </div>

                              {/* Available stock */}
                              <div className="flex gap-1 mt-1">
                                <span className="text-gray-600">Stock:</span>
                                <span
                                  className={
                                    variationData.quantity > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {variationData.quantity} available
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <input
                  onChange={(e) =>
                    handleQuantityChange(item._id, Number(e.target.value))
                  }
                  className="px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2"
                  type="number"
                  min={1}
                  max={productData.quantity}
                  defaultValue={item.quantity}
                />

                <img
                  onClick={() => handleQuantityChange(item._id, 0)}
                  className="w-4 mr-4 cursor-pointer sm:w-5"
                  src={assets.bin_icon}
                  alt="Remove item"
                />
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <div className="w-full text-end">
            <button
              onClick={() => navigate("/place-order")}
              className={`${
                isCartEmpty || isCheckoutDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black"
              } text-white text-sm my-8 px-8 py-3`}
              disabled={isCartEmpty || isCheckoutDisabled}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>

      {!isCartEmpty && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xl font-semibold">
            {currency}
            {getTotalPrice().toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default Cart;
