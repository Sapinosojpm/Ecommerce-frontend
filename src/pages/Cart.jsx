import React, {
  useContext,
  useEffect,
  useState,
  useLayoutEffect,
  useMemo,
} from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
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
    removeFromCart,
    clearCart,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingItem, setDeletingItem] = useState(null);

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
    if (products.length > 0) {
      const tempDataMap = {};

      for (const compositeKey in cartItems) {
        const item = cartItems[compositeKey];

        // Extract base product ID from composite key: "prod123-{\"color\":\"red\"}"
        const baseProductId = compositeKey.split("-")[0];
        const product = products.find((p) => p._id === baseProductId);

        // Normalize variations for consistent key
        let normalizedVariationKey = 'default';
        if (item.variations && Object.keys(item.variations).length > 0) {
          const sortedVariationEntries = Object.entries(item.variations).sort(([a], [b]) => a.localeCompare(b));
          normalizedVariationKey = JSON.stringify(Object.fromEntries(sortedVariationEntries));
        }
        const normalizedKey = `${baseProductId}-${normalizedVariationKey}`;

        if (product && item.quantity > 0) {
          let availableStock = product.quantity;

          if (item.variations && product.variations?.length > 0) {
            // Calculate stock for variations carefully
            const variationQuantities = Object.entries(item.variations).map(
              ([varName, varData]) => {
                const variation = product.variations.find(
                  (v) => v.name === varName
                );
                if (!variation) return 0;

                const option = variation.options.find(
                  (o) => o.name === varData.name
                );
                return option?.quantity || 0;
              }
            );

            availableStock = Math.min(...variationQuantities);
          }

          // If already exists, combine quantities
          if (tempDataMap[normalizedKey]) {
            tempDataMap[normalizedKey].quantity += item.quantity;
          } else {
            tempDataMap[normalizedKey] = {
              _id: normalizedKey,
              quantity: item.quantity,
              variations: item.variations || null,
              productData: product,
              availableStock,
            };
          }
        }
      }

      setCartData(Object.values(tempDataMap));
      setLoading(false);
    }
  }, [cartItems, products]);

  const isCartEmpty = cartData.length === 0;

  const isCheckoutDisabled = useMemo(() => {
    if (loading || isCartEmpty) return true;
    return cartData.some((item) => item.quantity > item.availableStock);
  }, [cartData, loading, isCartEmpty]);

  const calculateCartItemTotal = (item) => {
    const productData = item.productData;
    if (!productData) return 0;

    const capitalValue = productData.capital || 0;
    let markup = 0;
    if (productData.additionalCapital) {
      if (productData.additionalCapital.type === 'percent') {
        markup = capitalValue * (productData.additionalCapital.value / 100);
      } else {
        markup = productData.additionalCapital.value || 0;
      }
    }
    const subtotalBase = capitalValue + markup;
    const vatPercent = productData.vat || 0;
    const vatAmount = subtotalBase * (vatPercent / 100);
    const basePrice = subtotalBase + vatAmount;

    let variationAdjustment = 0;
    if (typeof item.variationAdjustment === 'number') {
      variationAdjustment = item.variationAdjustment;
    } else if (item.variations) {
      variationAdjustment = Object.values(item.variations).reduce(
        (sum, variation) => sum + (variation.priceAdjustment || 0),
        0
      );
    }
    const discountPercent = productData.discount || 0;
    const itemPrice = (basePrice + variationAdjustment) * (1 - discountPercent / 100);
    const itemTotal = Math.round((itemPrice * (item.quantity || 1)) * 100) / 100;
    return itemTotal;
  };

  const getTotalPrice = () => {
    return cartData.reduce((total, item) => {
      return Math.round((total + calculateCartItemTotal(item)) * 100) / 100;
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
        toast.success("Cart cleared successfully");
      } else {
        toast.error(data.message || "Failed to clear cart.");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    setDeletingItem(itemId);
    try {
      const success = await removeFromCart(itemId);
      if (success) {
        setCartData((prev) => prev.filter((item) => item._id !== itemId));
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setDeletingItem(null);
    }
  };

  // In Cart.jsx
const handleQuantityChange = async (itemId, newQuantity) => {
  if (isNaN(newQuantity) || newQuantity < 1) {
    handleDeleteItem(itemId);
    return;
  }

  const cartItem = cartData.find((item) => item._id === itemId);
  if (!cartItem) return;

  // Round to nearest integer
  newQuantity = Math.round(newQuantity);

  if (newQuantity > cartItem.availableStock) {
    toast.error(`Only ${cartItem.availableStock} available in stock`);
    return;
  }

  const success = await updateQuantity(itemId, newQuantity);
  if (!success) {
    // Reset to previous quantity if update fails
    const input = document.querySelector(`input[data-itemid="${itemId}"]`);
    if (input) {
      input.value = cartItem.quantity;
    }
  } else {
    // Update local state immediately for better UX
    setCartData(prev => prev.map(item => 
      item._id === itemId ? {...item, quantity: newQuantity} : item
    ));
  }
};

  if (loading) {
    return (
      <div className="border-t pt-[80px] md:pt-[7%] sm:pt-[10%] md:px-[7vw] px-4">
        <div className="text-2xl mb-3 pt-[40px]">
          <Title text1={"LOADING"} text2={"CART"} />
        </div>
        <div className="py-10 text-center">Loading your cart...</div>
      </div>
    );
  }

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
            const productData = item.productData;
            if (!productData) return null;

            // --- Begin CartTotal-like computation ---
            const capitalValue = productData.capital || 0;
            let markup = 0;
            if (productData.additionalCapital) {
              if (productData.additionalCapital.type === 'percent') {
                markup = capitalValue * (productData.additionalCapital.value / 100);
              } else {
                markup = productData.additionalCapital.value || 0;
              }
            }
            const subtotalBase = capitalValue + markup;
            const vatPercent = productData.vat || 0;
            const vatAmount = subtotalBase * (vatPercent / 100);
            const basePrice = subtotalBase + vatAmount;
            let variationAdjustment = 0;
            if (typeof item.variationAdjustment === 'number') {
              variationAdjustment = item.variationAdjustment;
            } else if (item.variations) {
              variationAdjustment = Object.values(item.variations).reduce(
                (sum, variation) => sum + (variation.priceAdjustment || 0),
                0
              );
            }
            const discountPercent = productData.discount || 0;
            const itemPrice = (basePrice + variationAdjustment) * (1 - discountPercent / 100);
            const itemTotal = Math.round((itemPrice * (item.quantity || 1)) * 100) / 100;
            // --- End CartTotal-like computation ---

            let maxStock = productData.quantity;
            if (item.variations) {
              const stocks = Object.entries(item.variations).map(
                ([variationType, variationData]) => {
                  const variation = productData.variations?.find(
                    (v) => v.name === variationType
                  );
                  const option = variation?.options.find(
                    (o) => o.name === variationData.name
                  );
                  return option?.quantity || 0;
                }
              );
              if (stocks.length > 0) {
                maxStock = Math.min(...stocks);
              }
            }

            return (
              <div
                key={`${item._id}-${index}`}
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
                    {/* Simplified price breakdown: only final price and variation adjustment */}
                   
                    <div className="flex items-center gap-5 mt-2">
                      {productData.discount > 0 && (
                        <p className="text-gray-500 line-through">
                          {currency}
                          {basePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                      )}
                      <p className="text-lg font-semibold">
                        {currency}
                        {itemPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                    </div>

                    {item.variations && (
                      <div className="mt-2 space-y-2">
                        {Object.entries(item.variations).map(
                          ([variationType, variationData]) => {
                            if (variationData && variationData.name) {
                              const variation = productData.variations?.find(
                                (v) => v.name === variationType
                              );
                              const option = variation?.options.find(
                                (o) => o.name === variationData.name
                              );
                              const optionQuantity = option?.quantity || 0;
                              return (
                                <div
                                  key={variationType}
                                  className="pl-3 text-sm border-l-2 border-gray-200"
                                >
                                  <div className="flex gap-1 items-center">
                                    <span className="font-medium capitalize">
                                      {variationType}:
                                    </span>
                                    <span className="text-gray-700">
                                      {variationData.name}
                                      {variationData.priceAdjustment && variationData.priceAdjustment !== 0 ? (
                                        <span className="ml-1 text-xs text-gray-500">
                                          (
                                          {variationData.priceAdjustment > 0 ? "+" : "-"}
                                          {currency}
                                          {Math.abs(variationData.priceAdjustment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                          )
                                        </span>
                                      ) : null}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <span className="text-gray-600">
                                      Stock:
                                    </span>
                                    <span
                                      className={
                                        optionQuantity > 0
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {optionQuantity} available
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }
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
                  max={maxStock}
                  value={item.quantity}
                  data-itemid={item._id}
                />

                <button
                  onClick={() => handleDeleteItem(item._id)}
                  className="w-4 mr-4 sm:w-5"
                  disabled={deletingItem === item._id}
                  aria-label="Remove item"
                >
                  {deletingItem === item._id ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 text-gray-400 animate-spin sm:w-5 sm:h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  ) : (
                    <img
                      src={assets.bin_icon}
                      className="w-4 h-4 cursor-pointer sm:w-5 sm:h-5"
                      alt="Remove item"
                    />
                  )}
                </button>
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
