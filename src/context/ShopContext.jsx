import { createContext, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "₱ ";

  const [regions, setRegions] = useState({}); // Initially empty
  const [region, setRegion] = useState("Luzon"); // Default region
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [discountPercent, setDiscountPercent] = useState(0); // Initialize discountPercent
  const [discountCode, setDiscountCode] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState(""); // Store YouTube URL
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [weight, setWeight] = useState(0);
  // get cards
  const [cards, setCards] = useState([]); // Add state for cards
  const [memberCards, setMemberCards] = useState([]); // ✅ Ensure it's an array
  const [intros, setIntros] = useState([]); // Add state for cards
  const [feePerKilo, setFeePerKilo] = useState(""); // Default value
  const [voucher1, setVoucher1] = useState(null);

  const [voucherAmountDiscount, setVoucherAmountDiscount] = useState({
    code: "",
    amount: 0,
    minimumPurchase: 0,
  });
  const [buyNowItem, setBuyNowItem] = useState(null);

  // Add this to your ShopContext.jsx
  // Update the handleBuyNow function
  // In ShopContext.jsx, update the handleBuyNow function
  const handleBuyNow = async (itemId, quantity, variations = {}) => {
    try {
      const itemInfo = products.find((product) => product._id === itemId);

      if (!itemInfo) {
        toast.error("Product not found");
        return;
      }

      // Calculate variation adjustment
      const variationAdjustment = Object.values(variations).reduce(
        (sum, opt) => sum + (opt.priceAdjustment || 0),
        0
      );

      const itemWithVariations = {
        ...itemInfo,
        quantity,
        variations,
        price: itemInfo.price + variationAdjustment,
        originalPrice: itemInfo.price,
        variationAdjustment,
        weight: itemInfo.weight || 0,
      };

      // Clear any existing cart items
      // setCartItems({});

      // Set the buy now item
      setBuyNowItem(itemWithVariations);

      // Navigate to place order
      navigate("/place-order");
    } catch (error) {
      console.error("Error in handleBuyNow:", error);
      toast.error("Failed to process Buy Now");
    }
  };

  useEffect(() => {
    if (buyNowItem) {
      console.log("✅ Buy Now Item Set:", buyNowItem);
    }
  }, [buyNowItem]);

  useEffect(() => {
    const fetchFeePerKilo = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/weight/fee-per-kilo`
        );
        if (response.data.success) {
          setFeePerKilo(response.data.fee);
        }
      } catch (error) {
        console.error("Error fetching fee per kilo:", error);
      }
    };
    fetchFeePerKilo();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/regions`);
      console.log("📦 API Response:", response.data);

      if (Array.isArray(response.data)) {
        const regionData = response.data.reduce((acc, region) => {
          acc[region.name] = region.fee;
          return acc;
        }, {});

        console.log("🗺 Processed Region Data:", regionData);
        setRegions(regionData);
      } else {
        toast.error("Failed to fetch region data.");
      }
    } catch (error) {
      console.error("❌ Error fetching regions:", error);
      toast.error("Error loading region data.");
    }
  };

  // Fetch regions on mount
  useEffect(() => {
    fetchRegions();
  }, []);

  // const [cartItems, setCartItems] = useState(() => {
  //   const savedCart = JSON.parse(localStorage.getItem("cartItems"));
  //   return savedCart || {};
  // });

  const applyVoucher = (discountPercent, voucherData = {}) => {
    setVoucherDiscount(discountPercent);
    setVoucherAmountDiscount({
      code: voucherData.code || "",
      amount: voucherData.amount || 0,
      minimumPurchase: voucherData.minimumPurchase || 0,
    });
  };

  const getTotalAmount = () => {
    if (buyNowItem) {
      // Calculate total for buyNowItem
      const itemTotal = buyNowItem.price * buyNowItem.quantity;
      const discountAmount = ((buyNowItem.discount || 0) / 100) * itemTotal;
      const voucherAmount = voucherAmountDiscount.amount || 0;

      // Calculate weight fee for buyNowItem
      const itemWeight = buyNowItem.weight || 0;
      const weightFee = itemWeight * feePerKilo * buyNowItem.quantity;
      const baseFee = regions[region] || 0;
      const shippingFee = baseFee + weightFee;

      console.log("🛒 Buy Now Calculation:", {
        itemTotal,
        discountAmount,
        voucherAmount,
        itemWeight,
        weightFee,
        baseFee,
        shippingFee,
        finalTotal: itemTotal - discountAmount - voucherAmount + shippingFee,
      });

      return itemTotal - discountAmount - voucherAmount + shippingFee;
    }

    // Original cart calculation
    const cartAmount = Number(getCartAmount()) || 0;
    const discountAmount = Number(getDiscountAmount()) || 0;
    const voucherAmount = ((Number(voucherDiscount) || 0) / 100) * cartAmount;
    const voucherAmount1 = Number(voucherAmountDiscount.amount) || 0;
    const shippingFee = Number(delivery_fee) || 0;

    // Calculate final total with all discounts
    const finalTotal =
      cartAmount -
      discountAmount -
      voucherAmount -
      voucherAmount1 +
      shippingFee;

    console.log("🛒 Final Calculation:", {
      cartAmount,
      discountAmount,
      voucherAmount,
      voucherAmount1,
      shippingFee,
      finalTotal,
    });

    return finalTotal;
  };

  const applyDiscount = (discountPercent) => {
    console.log("🔄 Applying Discount:", discountPercent);
    setDiscountPercent(discountPercent);
  };

  useEffect(() => {
    console.log("🔄 Voucher Amount Discount Updated:", voucherAmountDiscount);
  }, [voucherAmountDiscount]);

  const getDiscountAmount = () => {
    const cartAmount = getCartAmount();
    const discount = (cartAmount * discountPercent) / 100;

    console.log("🎟 Discount Applied:", discount);
    return discount || 0;
  };

  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState(() => {
    // Only use localStorage cart if user is not logged in
    if (!token) {
      const savedCart = JSON.parse(localStorage.getItem("cartItems"));
      return savedCart || {};
    }
    return {}; // Start with empty cart if logged in (will be populated by API)
  });

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  const delivery_fee = useMemo(() => {
    const baseFee = regions[region] || 0;

    if (buyNowItem) {
      // Calculate weight fee for buyNowItem
      const weightFee =
        (buyNowItem.weight || 0) * (feePerKilo || 0) * buyNowItem.quantity;
      return baseFee + weightFee;
    }

    // Regular cart calculation
    const weightFee = weight * (feePerKilo || 0);
    return baseFee + weightFee;
  }, [region, regions, weight, feePerKilo, buyNowItem]);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    console.log("🔄 Discount Percent Updated:", discountPercent);
  }, [discountPercent]);

  useEffect(() => {
    console.log("📦 Total Cart Weight Updated:", weight);
  }, [weight]);

  // Add product to cart
  const addToCart = async (itemId, quantity, variations = null) => {
    console.log("🧪 Adding to Cart:", { itemId, quantity, variations });
    const itemInfo = products.find((product) => product._id === itemId);
  
    if (!itemInfo) {
      toast.error("Product not found");
      return;
    }
  
    // Validate variations
    const selectedVariations = {};
    if (variations) {
      for (const [variationName, option] of Object.entries(variations)) {
        const productVariation = itemInfo.variations.find(v => v.name === variationName);
        if (!productVariation) {
          toast.error(`Variation ${variationName} not found for this product`);
          return;
        }
        
        const validOption = productVariation.options.find(o => o.name === option.name);
        if (!validOption) {
          toast.error(`Invalid option ${option.name} for variation ${variationName}`);
          return;
        }
        
        selectedVariations[variationName] = {
          name: option.name,
          priceAdjustment: option.priceAdjustment || 0,
          quantity: option.quantity || 0,
        };
      }
    }
  
    // Calculate variation adjustment
    const variationAdjustment = Object.values(selectedVariations).reduce(
      (sum, opt) => sum + (opt.priceAdjustment || 0),
      0
    );
  
    // Update cart in local state
    const updatedCart = {
      ...cartItems,
      [itemId]: {
        quantity,
        variations: selectedVariations,
        variationAdjustment,
        finalPrice: itemInfo.price + variationAdjustment
      },
    };
  
    setCartItems(updatedCart);

    // If user is logged in (token available), update cart in the backend
    if (token) {
      try {
        // Send complete item data to backend
        await axios.post(
          `${backendUrl}/api/cart/add`,
          {
            userId: localStorage.getItem("userId"),
            itemId,
            quantity,
            variations,
            variationAdjustment,
            finalPrice: itemInfo.price + variationAdjustment,
          },
          { headers: { token } }
        );
        toast.success("Item added to cart");
      } catch (error) {
        console.error("Failed to update cart in the database:", error);
        toast.error("Failed to update the cart. Please try again.");
        // Revert local state if API call fails
        setCartItems(cartItems);
      }
    }
  };
  useEffect(() => {
  if (!token && localStorage.getItem("token")) {
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
    getUserCart(savedToken);
  }
}, [token]);
console.log("Using backend URL:", backendUrl); // Add this to verify the URL
  // New buyNow function
  const buyNow = async (productId, quantity, variations = null) => {
    console.log("Buy now :", { itemId, quantity, variations });
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Create temporary cart with just this item
    const tempCart = {
      [productId]: {
        quantity,
        variations,
      },
    };

    setCartItems(tempCart);
    localStorage.setItem("cartItems", JSON.stringify(tempCart));

    if (token) {
      try {
        // Clear existing cart
        await axios.post(
          `${backendUrl}/api/cart/clear`,
          {},
          { headers: { token } }
        );

        // Add the single item
        await axios.post(
          `${backendUrl}/api/cart/update`,
          {
            itemId: productId,
            quantity,
            variations,
          },
          { headers: { token } }
        );
      } catch (error) {
        console.error("Error updating cart:", error);
        toast.error("Failed to update cart for checkout");
      }
    }

    navigate("/place-order");
  };

  // Fetch cards data
  const getCardsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/card/list`);
      if (response.data.success) {
        setCards(response.data.cards); // Assuming response contains a "cards" array
      } else {
        toast.error(response.data.message || "Failed to fetch cards.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load cards. Please try again.");
    }
  };

  // Fetch products and cards on component mount
  useEffect(() => {
    getCardsData(); // Fetch the cards data
  }, []);

  // Fetch cards data
  const getIntrosData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/intro/list`);
      if (response.data.success) {
        setIntros(response.data.intros); // Assuming response contains a "cards" array
      } else {
        toast.error(response.data.message || "Failed to fetch cards.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load intros. Please try again.");
    }
  };

  // Fetch products and cards on component mount
  useEffect(() => {
    getIntrosData(); // Fetch the cards data
  }, []);

  // Fetch memberCards data
  const getMemberCardsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/memberCard/list`);
      console.log("Fetched Member Cards:", response.data); // Debugging Log

      if (response.data.success && Array.isArray(response.data.memberCards)) {
        setMemberCards(response.data.memberCards);
      } else {
        console.warn("Unexpected API response:", response.data);
        setMemberCards([]); // ✅ Prevent undefined issues
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
      setMemberCards([]); // ✅ Prevent undefined issues
    }
  };

  useEffect(() => {
    getMemberCardsData(); // Fetch data on mount
    console.log("Member Cards Data1:", memberCards); // Debugging Log
  }, []);

  // Update cart quantity
  const updateQuantity = async (itemId, quantity) => {
    if (quantity < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }

    const updatedCart = {
      ...cartItems,
      [itemId]: {
        ...cartItems[itemId], // Keep existing properties (e.g., variations)
        quantity: quantity, // Update only the quantity
      },
    };

    setCartItems(updatedCart);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/update`,
          { itemId, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.error(error);
        toast.error("Failed to update cart quantity.");
        // Revert on error
        setCartItems(cartItems);
      }
    }
  };

  // Get cart count
  // In your ShopContext.js or wherever getCartCount is defined
  const getCartCount = () => {
    if (!cartItems || typeof cartItems !== "object") return 0;

    // If cartItems is an array (legacy case), return its length
    if (Array.isArray(cartItems)) return cartItems.length;

    // For object structure, sum up all quantities
    return Object.values(cartItems).reduce((total, item) => {
      return total + (item?.quantity || 0);
    }, 0);
  };

  // // Get wishlist count
  // const getWishlistCount = () => wishlist.length;

  // Optimize product lookup
  const productDict = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product._id] = product;
      return acc;
    }, {});
  }, [products]);

  useEffect(() => {
    console.log("📦 Updated Total Weight:", weight);
  }, [weight]);

  useEffect(() => {
    const { totalWeight } = getCartAmount(); // Kunin lang ang weight
    setWeight(totalWeight); // ✅ Set weight after render
    console.log("🛒 Updated Cart Items:", cartItems);
  }, [cartItems]); // Tumakbo kapag nagbago ang cartItems

  // Get cart total amount, including delivery fee and discount
  // Updated getCartAmount to include variations
  const getCartAmount = () => {
    let totalAmount = 0;
    let totalWeight = 0;

    Object.entries(cartItems).forEach(([itemId, itemData]) => {
      const quantity = itemData.quantity || 0;
      if (quantity <= 0) return;

      const itemInfo = productDict[itemId];
      if (!itemInfo) return;

      // Base price
      let itemPrice = itemInfo.price || 0;

      // 🧩 Check for variation or variations (in case one uses `variation`, another uses `variations`)
      let variationLabel = "";
      let variationAdjustment = 0;

      if (itemData.variation && itemData.variation.priceAdjustment) {
        variationAdjustment = itemData.variation.priceAdjustment;
        variationLabel = itemData.variation.label || "";
      } else if (
        itemData.variations &&
        typeof itemData.variations === "object"
      ) {
        // Support multiple variations (e.g., size + color)
        Object.values(itemData.variations).forEach((variation) => {
          if (variation && variation.priceAdjustment) {
            variationAdjustment += variation.priceAdjustment;
          }
        });
      }

      itemPrice += variationAdjustment;

      // Discount
      const itemDiscount = itemInfo.discount || 0;
      const discountedPrice = itemPrice - itemPrice * (itemDiscount / 100);

      totalAmount += discountedPrice * quantity;
      totalWeight += (itemInfo.weight || 0) * quantity;

      console.log(
        `🧮 Calculating ${itemInfo.name} x${quantity} (${variationLabel}):`
      );
      console.log(
        `   Base: ₱${
          itemInfo.price
        }, +Variation: ₱${variationAdjustment}, Discount: ${itemDiscount}%, Subtotal: ₱${
          discountedPrice * quantity
        }`
      );
    });

    // Update weight state
    setWeight(totalWeight);
    console.log("📦 Total Weight:", totalWeight);
    console.log("💰 Total Amount:", totalAmount);

    return totalAmount;
  };

  useEffect(() => {
    const { totalWeight } = getCartAmount();
    setWeight(totalWeight);
  }, [cartItems, productDict]);

  const clearCart = async () => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      toast.error("You need to be logged in to clear the cart.");
      return;
    }

    try {
      const response = await axios.delete(`${backendUrl}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${savedToken}` }, // ✅ Ensure Bearer token format
      });

      if (response.data.success) {
        setCartItems({});
        localStorage.removeItem("cartItems");
        toast.info("Cart has been cleared.");
      } else {
        toast.error(response.data.message || "Failed to clear cart.");
      }
    } catch (error) {
      console.error(
        "Error clearing cart:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  // Fetch products data
  // ShopContext.jsx
  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message || "Failed to fetch products.");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Unable to load products. Please try again.");
    }
  };

  const fetchProduct = async (productId) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product/${productId}`
      );
      if (response.data.success) {
        return response.data.product;
      }
      throw new Error(response.data.message || "Failed to fetch product");
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  };
  // Fetch user cart data
  const getUserCart = async (userToken) => {
    try {
      const userId = localStorage.getItem("userId"); // or however you store it
  
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        { userId }, // 💡 Send userId in body
        { headers: { token: userToken } }
      );
  
      if (response.data.success) {
        setCartItems(response.data.cartData || {});
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load cart data.");
    }
  };
  

  // Initial data loading
  useEffect(() => {
    getProductsData();
  }, []);

  // Check token and load user cart
  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      const savedToken = localStorage.getItem("token");
      setToken(savedToken);
      getUserCart(savedToken);
    }
  }, [token]);

  // Context value
  const contextValue = {
    products,
    currency,
    regions,
    region,
    setRegion,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    buyNow,
    setCartItems,
    getCartCount,
    // getWishlistCount,
    updateQuantity,
    navigate,
    backendUrl,
    setToken,
    token,
    clearCart, // Include the clearCart function here
    cards, // Provide the cards data in context
    setCards,
    intros,
    setIntros,
    fetchProduct,
    setMemberCards,
    getCartAmount, // ✅ Use memoized total
    memberCards, // Provide the cards data in context
    youtubeUrl,
    setYoutubeUrl,
    discountCode,
    discountPercent,
    getDiscountAmount,
    getTotalAmount,
    role,
    setRole,
    applyDiscount,
    applyVoucher,
    voucherAmountDiscount,
    setVoucherAmountDiscount,
    buyNowItem,
    setBuyNowItem,
    handleBuyNow,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
