import { createContext, useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Add missing import for socket.io-client
import { io } from "socket.io-client";

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
  // Add missing user state
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  // Add socket state
  const [socket, setSocket] = useState(null);
  
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
   const [products, setProducts] = useState([]);
  // Initialize token from localStorage immediately
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      const savedCart = JSON.parse(localStorage.getItem("cartItems") || "{}");
      return savedCart;
    }
    return {}; // Will be populated by getUserCart
  });

  // Add this to your ShopContext.jsx
  
  const handleBuyNow = async (itemId, quantity, variations = {}) => {
    try {
      const itemInfo = products.find((product) => product._id === itemId);

      if (!itemInfo) {
        toast.error("Product not found");
        return;
      }

      const selectedVariations = {};
      if (variations && Object.keys(variations).length > 0) {
        const activeVariationName = Object.keys(variations)[0];

        if (variations[activeVariationName]) {
          const productVariation = itemInfo.variations.find(
            (v) => v.name === activeVariationName
          );
          if (!productVariation) {
            toast.error(
              `Variation ${activeVariationName} not found for this product`
            );
            return;
          }

          const validOption = productVariation.options.find(
            (o) => o.name === variations[activeVariationName].name
          );
          if (!validOption) {
            toast.error(
              `Invalid option ${variations[activeVariationName].name} for variation ${activeVariationName}`
            );
            return;
          }

          if (validOption.quantity <= 0) {
            toast.error(
              `Option ${validOption.name} for ${activeVariationName} is out of stock`
            );
            return;
          }

          selectedVariations[activeVariationName] = {
            name: validOption.name,
            priceAdjustment: validOption.priceAdjustment || 0,
          };
        }
      }

      const variationAdjustment = Object.values(selectedVariations).reduce(
        (sum, opt) => sum + (opt.priceAdjustment || 0),
        0
      );

      const itemWithVariations = {
        ...itemInfo,
        quantity,
        variations: selectedVariations,
        price: itemInfo.price + variationAdjustment,
        originalPrice: itemInfo.price,
        variationAdjustment,
        weight: itemInfo.weight || 0,
      };

      setBuyNowItem(itemWithVariations);
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

 
  
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      getUserCart(savedToken);
    }
  }, []);

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

  // Initialize socket connection
  useEffect(() => {
    if (backendUrl) {
      const socketInstance = io(backendUrl);
      setSocket(socketInstance);
      
      // Setup socket listeners
      socketInstance.on('productUpdated', (updatedProduct) => {
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product._id === updatedProduct._id ? updatedProduct : product
          )
        );
      });
      
      // Cleanup on component unmount
      return () => {
        socketInstance.disconnect();
      };
    }
  }, [backendUrl]);

  // Add product to cart
const addToCart = async (itemId, quantity, variations = null) => {
  console.log("🧪 Adding to Cart:", { itemId, quantity, variations });
  const itemInfo = products.find((product) => product._id === itemId);

  if (!itemInfo) {
    toast.error("Product not found");
    return;
  }

  // Generate a unique key for this item + variations combination
  const variationKey = variations ? JSON.stringify(variations) : 'default';
  const cartItemKey = `${itemId}-${variationKey}`;

  // Validate variations and check stock
  const selectedVariations = {};
  if (variations && Object.keys(variations).length > 0) {
    for (const [varName, varData] of Object.entries(variations)) {
      if (varData && varData.name) {
        const productVariation = itemInfo.variations.find(v => v.name === varName);
        if (!productVariation) {
          toast.error(`Variation ${varName} not found for this product`);
          return;
        }
        
        const validOption = productVariation.options.find(o => o.name === varData.name);
        if (!validOption) {
          toast.error(`Invalid option ${varData.name} for variation ${varName}`);
          return;
        }
        
        if (validOption.quantity <= 0) {
          toast.error(`Option ${validOption.name} for ${varName} is out of stock`);
          return;
        }
        
        selectedVariations[varName] = {
          name: validOption.name,
          priceAdjustment: validOption.priceAdjustment || 0,
        };
      }
    }
  }

  const variationAdjustment = Object.values(selectedVariations).reduce(
    (sum, opt) => sum + (opt.priceAdjustment || 0),
    0
  );

  // Update cart in local state
  const updatedCart = {
    ...cartItems,
    [cartItemKey]: {
      quantity: quantity,
      variations: selectedVariations,
      variationAdjustment,
      finalPrice: itemInfo.price + variationAdjustment,
      baseProductId: itemId // Keep reference to original product
    },
  };

  setCartItems(updatedCart);

  if (token) {
    try {
      await axios.post(
        `${backendUrl}/api/cart/add`,
        {
          userId: localStorage.getItem("userId"),
          itemId: cartItemKey,
          baseProductId: itemId,
          quantity: quantity,
          variations: selectedVariations,
          variationAdjustment,
          finalPrice: itemInfo.price + variationAdjustment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to update cart in the database:", error);
      toast.error("Failed to update the cart. Please try again.");
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

  // Fixed updateQuantity function with proper error handling and consistent API authentication
  // In ShopContext.jsx
const updateQuantity = async (itemId, newQuantity) => {
  try {
    if (!token) {
      toast.error("You need to be logged in to update cart.");
      return false;
    }

    const baseProductId = cartItems[itemId]?.baseProductId || itemId.split('-')[0];
    
    const response = await axios.put(
      `${backendUrl}/api/cart/update`,
      { 
        userId: localStorage.getItem("userId"),
        itemId,
        baseProductId,
        quantity: newQuantity 
      },
      { headers: { Authorization: `Bearer ${token}` }}
    );

    if (response.data.success) {
      setCartItems(prev => {
        const updatedCart = {...prev};
        if (newQuantity > 0) {
          updatedCart[itemId] = {
            ...updatedCart[itemId],
            quantity: newQuantity,
          };
        } else {
          delete updatedCart[itemId];
        }
        return updatedCart;
      });
      return true;
    } else {
      toast.error(response.data.message || "Failed to update cart.");
      return false;
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    toast.error("Something went wrong. Please try again.");
    return false;
  }
};

  // New removeFromCart function with consistent authentication header
  const removeFromCart = async (itemId) => {
    try {
      const updatedCart = { ...cartItems };
      delete updatedCart[itemId];
      
      // Update local state immediately
      setCartItems(updatedCart);

      // If user is logged in, sync with backend
      if (token) {
        await axios.post(
          `${backendUrl}/api/cart/remove`,
          { itemId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("Item removed from cart");
      return true;
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
      // Revert to previous state on error
      setCartItems(cartItems);
      return false;
    }
  };

  // Get cart count
  const getCartCount = () => {
    if (!cartItems || typeof cartItems !== "object") return 0;

    // If cartItems is an array (legacy case), return its length
    if (Array.isArray(cartItems)) return cartItems.length;

    // For object structure, sum up all quantities
    return Object.values(cartItems).reduce((total, item) => {
      return total + (item?.quantity || 0);
    }, 0);
  };

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

  // Fixed getCartAmount to return the totalWeight properly
  const getCartAmount = () => {
    let totalAmount = 0;
    let totalWeight = 0;

    Object.entries(cartItems).forEach(([itemId, itemData]) => {
      const quantity = itemData.quantity || 0;
      if (quantity <= 0) return;

      const baseProductId = itemId.split('-')[0];
      const itemInfo = productDict[baseProductId];
      if (!itemInfo) return;

      // Base price
      let itemPrice = itemInfo.price || 0;

      // Apply discount if exists
      if (itemInfo.discount) {
        itemPrice = itemPrice * (1 - itemInfo.discount / 100);
      }

      // Add variation adjustments
      let variationAdjustment = 0;
      if (itemData.variations && typeof itemData.variations === "object") {
        variationAdjustment = Object.values(itemData.variations).reduce(
          (sum, variation) => sum + (variation.priceAdjustment || 0),
          0
        );
      }

      const finalItemPrice = itemPrice + variationAdjustment;
      totalAmount += finalItemPrice * quantity;
      totalWeight += (itemInfo.weight || 0) * quantity;

      console.log(
        `🧮 Calculating ${itemInfo.name} x${quantity}:`,
        `Base: ₱${itemPrice}, +Variation: ₱${variationAdjustment}, Subtotal: ₱${finalItemPrice * quantity}`
      );
    });

    // Update weight state
    setWeight(totalWeight);
    console.log("📦 Total Weight:", totalWeight);
    console.log("💰 Total Amount:", totalAmount);

    return { amount: totalAmount, totalWeight };
  };

  // Update this useEffect to handle the new return format from getCartAmount
  useEffect(() => {
    const result = getCartAmount();
    setWeight(result.totalWeight);
  }, [cartItems, productDict]);

  const clearCart = async () => {
    if (!token) {
      toast.error("You need to be logged in to clear the cart.");
      return;
    }

    try {
      const response = await axios.delete(`${backendUrl}/api/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` },
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
  
  // Fetch user cart data with consistent authorization header
  const getUserCart = async (userToken) => {
  try {
    const userId = localStorage.getItem("userId");
    const response = await axios.post(
      `${backendUrl}/api/cart/get`,
      { userId },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    if (response.data.success) {
      const normalizedCart = {};
      // Filter out items with quantity <= 0 and normalize structure
      Object.entries(response.data.cartData || {}).forEach(([key, item]) => {
        if (item.quantity > 0) {
          normalizedCart[key] = {
            quantity: item.quantity,
            variations: item.variations || null,
            variationAdjustment: item.variationAdjustment || 0,
            finalPrice: item.finalPrice || 0,
            baseProductId: item.itemId || key.split('-')[0] // Add base product ID
          };
        }
      });
      setCartItems(normalizedCart);
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Fallback to localStorage if available
    const savedCart = JSON.parse(localStorage.getItem("cartItems") || "{}");
    setCartItems(savedCart);
  }
};
  
  useEffect(() => {
    if (!token) {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
    }
  }, [cartItems, token]);

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
    updateQuantity,
    navigate,
    backendUrl,
    setToken,
    token,
    clearCart,
    cards,
    setCards,
    intros,
    setIntros,
    removeFromCart,
    fetchProduct,
    setMemberCards,
    getCartAmount: () => getCartAmount().amount, // For backward compatibility 
    memberCards,
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
    user,
    setUser,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;