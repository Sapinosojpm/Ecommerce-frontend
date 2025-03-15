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
  const [discountCode, setDiscountCode] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState(""); // Store YouTube URL
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [weight, setWeight] = useState(0);
  // get cards
  const [cards, setCards] = useState([]); // Add state for cards
  const [memberCards, setMemberCards] = useState([]); // ✅ Ensure it's an array
  const [intros, setIntros] = useState([]); // Add state for cards
  const [feePerKilo, setFeePerKilo] = useState(""); // Default value
  const [voucher1, setVoucher1] = useState(null);
  const [voucherAmountDiscount, setVoucherAmountDiscount] = useState(0);

  useEffect(() => {
    const fetchFeePerKilo = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/weight/fee-per-kilo`);
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

  

  const [cartItems, setCartItems] = useState(() => {
    const savedCart = JSON.parse(localStorage.getItem("cartItems"));
    return savedCart || {};
  });
  


const applyVoucher = (discountPercent,amount=0) => {
  setVoucherDiscount(discountPercent);
  setVoucherAmountDiscount(amount); // Fixed amount
};


const getTotalAmount = () => {
  const cartAmount = getCartAmount(); // Total cart amount (now a number)
  const discountAmount = getDiscountAmount(); // Discount amount  
  const voucherAmount = ((voucherDiscount || 0) / 100) * cartAmount; // Percentage-based voucher  
  const voucherAmount1 = voucherAmountDiscount || 0; // ✅ Fixed amount discount  
  const shippingFee = delivery_fee || 0; // ✅ Shipping fee  

  // ✅ Make sure to subtract both discount types
  const finalTotal = cartAmount - discountAmount - voucherAmount - voucherAmount1 + shippingFee;

  console.log("🛒 Cart Amount:", cartAmount);
  console.log("🎟 Discount Amount:", discountAmount);
  console.log("💰 Voucher Discount (Percentage):", voucherAmount);
  console.log("💰 Voucher Discount (Fixed):", voucherAmount1);
  console.log("🚚 Shipping Fee:", shippingFee);
  console.log("💳 Final Total:", finalTotal);

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



  const fetchProduct = async (productId) => {
    try {
      const response = await fetch(`${backendUrl}/api/product/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return await response.json();
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  };
  


  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);
  

  const delivery_fee = useMemo(() => {
    const baseFee = regions[region] || 0;
    const weightFee = weight * feePerKilo;
    return baseFee + weightFee;
  }, [region, regions, weight, feePerKilo]);
  



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
  const addToCart = async (itemId, quantity) => {
    if (quantity < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }

    const updatedCart = { ...cartItems, [itemId]: quantity };
    if (quantity === 0) delete updatedCart[itemId];

    setCartItems(updatedCart);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/update`,
          { itemId, quantity },
          { headers: { token } }
        );
      } catch (error) {
        console.error("Failed to update cart in the database:", error);
        toast.error("Failed to update the cart. Please try again.");
      }
    }
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

    const updatedCart = { ...cartItems, [itemId]: quantity };
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
      }
    }
  };

  // Get cart count
  const getCartCount = () => {
    return Object.values(cartItems).reduce((totalCount, quantity) => totalCount + quantity, 0);
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
  }, [cartItems]); // Tumakbo kapag nagbago ang cartItems
  

// Get cart total amount, including delivery fee and discount
const getCartAmount = () => {
  let totalAmount = 0;
  let totalWeight = 0; // Track total weight  

  Object.entries(cartItems).forEach(([itemId, quantity]) => {
    if (quantity <= 0) return; // Ignore zero or negative quantities

    const itemInfo = productDict[itemId];
    if (!itemInfo) return; // Skip if product data is missing

    const basePrice = itemInfo.price || 0;
    const itemDiscount = itemInfo.discount || 0; // ✅ Get discount percentage
    const discountedPrice = basePrice - (basePrice * (itemDiscount / 100)); // ✅ Apply discount
    
    totalAmount += discountedPrice * quantity;
    totalWeight += (itemInfo.weight || 0) * quantity; // ✅ Add weight calculation
  });

  console.log("🛒 Calculated Total Weight:", totalWeight); // Log immediately
  setWeight(totalWeight); // ✅ Update state with total weight  

  return totalAmount; // Return only the totalAmount as a number
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
    console.error("Error clearing cart:", error.response?.data || error.message);
    toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
  }
};







  // Fetch products data
  const getProductsData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`);
      console.log("📦 Product Fetch Response:", response.data); // Log response
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message || "Failed to fetch products.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load products. Please try again.");
    }
  };

  // Fetch user cart data
  const getUserCart = async (userToken) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
        {},
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
    getCartAmount,// ✅ Use memoized total
    memberCards, // Provide the cards data in context
    youtubeUrl, setYoutubeUrl,
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

  };

  return (

    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
