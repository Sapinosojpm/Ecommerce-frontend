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
  // Extract necessary values from ShopContext
  const { products, currency, cartItems, updateQuantity, navigate, clearCart, userId } =
    useContext(ShopContext);

  // Local state to store cart data
  const [cartData, setCartData] = useState([]);

// scroll effect
  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true, // Enables smooth scrolling
      duration: 1.2, // Adjust smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural easing effect
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
  }, []);

  // Effect to sync cartData with cartItems and products
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        if (cartItems[itemId] > 0) {
          tempData.push({
            _id: itemId,
            quantity: cartItems[itemId], // Store item ID and quantity
          });
        }
      }
      setCartData(tempData); // Update local state
    }
  }, [cartItems, products]);

  // Check if the cart is empty
  const isCartEmpty = cartData.length === 0;
  
  // Check if any product in the cart has 0 available quantity, disabling checkout
  const isCheckoutDisabled = cartData.some((item) => {
    const productData = products.find((product) => product._id === item._id);
    return productData && productData.quantity === 0;
  });

  // Calculate total price including discounts
  const getTotalPrice = () => {
    return cartData.reduce((total, item) => {
      const productData = products.find((product) => product._id === item._id);
      if (!productData) return total; // Skip if product data is missing
      const finalPrice = productData.discount
        ? productData.price * (1 - productData.discount / 100)
        : productData.price;
      return total + finalPrice * item.quantity;
    }, 0);
  };

  // Function to clear the entire cart
  const handleClearCart = async () => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
        toast.error("You need to be logged in to clear the cart.");
        return;
    }

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/cart/clear`, {
            method: "DELETE", // ✅ Backend expects POST
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${savedToken}` // ✅ Ensure token format is correct
            }
        });

        const data = await response.json();

        if (data.success) {
            clearCart(); // ✅ Updates the UI after clearing
            // toast.success("Cart cleared successfully.");
        } else {
            toast.error(data.message || "Failed to clear cart.");
        }
    } catch (error) {
        console.error("Error clearing cart:", error);
        toast.error("Something went wrong. Please try again.");
    }
};



  

  return (
    <div className="border-t pt-[80px] md:pt-[7%] sm:pt-[10%] md:px-[7vw] px-4">
      <div className="text-2x1 mb-3 pt-[40px] ">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      {/* Clear Cart Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleClearCart}
          className={`text-white text-sm font-semibold bg-black py-2 px-4 m-5 ${
            isCartEmpty ? "cursor-not-allowed bg-gray-400" : ""
          }`}
          disabled={isCartEmpty} // Disable button if cart is empty
        >
          Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
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

            if (!productData) return null; // Skip if product is missing

            const finalPrice = productData.discount
              ? productData.price * (1 - productData.discount / 100)
              : productData.price;

            return (
              <div
                key={index}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                {/* Product Info */}
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
                    <div className="flex items-center gap-5 mt-2">
                      <p>
                        {currency}
                        {finalPrice.toLocaleString()}
                      </p>
                      {productData.discount > 0 && (
                        <p className="text-gray-500 line-through">
                          {currency}
                          {productData.price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <p className="font-medium">Available Quantity:</p>
                      <span>{productData.quantity}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Input */}
                <input
                  onChange={(e) =>
                    e.target.value === "" || e.target.value === "0"
                      ? null
                      : updateQuantity(item._id, Number(e.target.value)) // Update quantity
                  }
                  className="px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2"
                  type="number"
                  min={1}
                  max={productData.quantity}
                  defaultValue={item.quantity}
                />
                <img
                  onClick={() => updateQuantity(item._id, 0)} // Remove item from cart
                  className="w-4 mr-4 cursor-pointer sm:w-5"
                  src={assets.bin_icon}
                  alt="Remove item"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Checkout Section */}
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

      {/* Cart Total */}
      {!isCartEmpty && (
        <div className="flex items-center justify-between mt-6">
          {/* <p className="text-lg font-semibold">Total:</p>
          <p className="text-xl font-semibold">
            {currency}
            {getTotalPrice().toLocaleString()}
          </p> */}
        </div>
      )}
    </div>
  );
};

export default Cart;
