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
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

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
    const tempData = [];
    for (const key in cartItems) {
      const item = cartItems[key];
      if (item && item.quantity > 0) {
        tempData.push({
          key, // full key (with variation)
          ...item,
        });
      }
    }
    setCartData(tempData);
  }, [cartItems]);

  const isCartEmpty = cartData.length === 0;

  const isCheckoutDisabled = cartData.some((item) => {
    const product = products.find((p) => p._id === item.itemId);
    return !product || product.quantity === 0;
  });

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

  const handleQuantityChange = (key, newQuantity) => {
    if (newQuantity <= 0) {
      updateQuantity(key, 0);
      return;
    }

    updateQuantity(key, newQuantity);
  };

  const getTotalPrice = () => {
    return cartData.reduce((total, item) => {
      return total + item.finalPrice * item.quantity;
    }, 0);
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
            const product = products.find((p) => p._id === item.itemId);
            if (!product) return null;

            return (
              <div
                key={index}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                <div className="flex items-start gap-6">
                  <img
                    className="w-16 sm:w-20"
                    src={product.image[0]}
                    alt={product.name}
                  />
                  <div>
                    <p className="text-xs font-medium sm:text-lg">
                      {product.name}
                    </p>
                    <p className="text-xs font-light text-gray-500 sm:text-sm">
                      {product.description}
                    </p>

                    <div className="mt-2 space-y-2 text-sm">
                      {item.variations &&
                        Object.entries(item.variations).map(
                          ([type, value]) => (
                            <div
                              key={type}
                              className="pl-2 border-l-2 border-gray-300"
                            >
                              <strong>{type}:</strong> {value}
                            </div>
                          )
                        )}
                      <div>
                        <strong>Price:</strong> {currency}
                        {item.finalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  onChange={(e) =>
                    handleQuantityChange(item.key, Number(e.target.value))
                  }
                  className="px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2"
                  type="number"
                  min={1}
                  defaultValue={item.quantity}
                />

                <img
                  onClick={() => handleQuantityChange(item.key, 0)}
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
