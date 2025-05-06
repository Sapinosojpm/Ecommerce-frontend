import React, { useContext, useState, useEffect, useMemo } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from '../context/SocketContext';

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const socket = useSocket();
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    getTotalAmount,
    products,
    delivery_fee,
    discountPercent,
    voucherAmountDiscount,
    setRegion,
    buyNowItem,
    setBuyNowItem,
  } = useContext(ShopContext);

  console.log("Voucher Amount 1:", voucherAmountDiscount); 
  console.log("Discount percent:", discountPercent);

   // Add this useEffect to listen for order updates
   useEffect(() => {
    if (!socket || !orderId) return;
  
    const handleOrderUpdate = (updatedOrder) => {
      if (updatedOrder._id === orderId) {
        // Handle order update logic here
        console.log("Order updated:", updatedOrder);
      }
    };
  
    socket.on('orderStatusUpdate', handleOrderUpdate);
  
    return () => {
      socket.off('orderStatusUpdate', handleOrderUpdate);
    };
  }, [socket, orderId]);



  useEffect(() => {
    if (buyNowItem) {
      console.log("Buy Now Item in PlaceOrder:", buyNowItem);
    } else {
      console.log("No product selected.");
    }
  }, [buyNowItem]);
  

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/regions`);
        setRegions(response.data);
      } catch (error) {
        toast.error("Failed to load regions.");
      }
    };
    fetchRegions();
  }, [backendUrl]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    barangay: "",
    province: "",
    postalCode: "",
    phone: "",
    region: "Luzon",
  });

  const orderItems = buyNowItem
    ? [buyNowItem]
    : Object.keys(cartItems)
        .filter((itemId) => cartItems[itemId] > 0)
        .map((itemId) => {
          const itemInfo = products.find((product) => product._id === itemId);
          return itemInfo ? { ...itemInfo, quantity: cartItems[itemId] } : null;
        })
        .filter(Boolean);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const { data } = await axios.get(`${backendUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const requiredFields = ["firstName", "lastName", "email", "street", "barangay", "city", "province", "postalCode", "phone", "region"];
        const isProfileIncomplete = requiredFields.some((field) => !data[field]);

        if (isProfileIncomplete) {
          toast.error("Please complete your address in your profile before checkout.");
          navigate("/profile");
          return;
        }

        setUserId(data._id);
        setFormData((prev) => ({
          ...prev,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          street: data.street || "",
          barangay: data.barangay || "",
          city: data.city || "",
          province: data.province || "",
          postalCode: data.postalCode || "",
          phone: data.phone || "",
          region: data.region || "",
        }));

        setRegion(data.region || "");
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error("Unauthorized: Please log in.");
          localStorage.setItem("redirectAfterLogin", location.pathname);
          navigate("/login");
        } else {
          toast.error("Failed to fetch user details. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [token, backendUrl, navigate, setRegion]);

  
  // In PlaceOrder.jsx, update the computedTotal calculation
const computedTotal = useMemo(() => {
  if (buyNowItem) {
    console.log("🛒 Buy Now Item Details:", {
      basePrice: buyNowItem.originalPrice,
      variation: buyNowItem.variationAdjustment,
      quantity: buyNowItem.quantity,
      discount: buyNowItem.discount || 0,
      feePerKilo: buyNowItem.feePerKilo,
    });
    console.log("🛒 Buy Now Item:", buyNowItem);
    const basePrice = buyNowItem.finalPrice;

    const discountedPrice = basePrice - (basePrice * (buyNowItem.discount || 0)) / 100;
    const totalAmount = discountedPrice * buyNowItem.quantity;
    
    console.log("💰 Base Price with Variations:", basePrice);
    console.log("💸 Discounted Price:", discountedPrice);
    console.log("📦 Quantity:", buyNowItem.quantity);
    console.log("🚚 Delivery Fee:", delivery_fee);
    
    return totalAmount + delivery_fee;
  }

  const cartAmount = getCartAmount();
  const discountAmount = (cartAmount * discountPercent) / 100;
  const discountedCartAmount = cartAmount - discountAmount;
  const finalAmount = discountedCartAmount + delivery_fee - (voucherAmountDiscount?.amount || 0);

  console.log("🛍️ Cart Amount:", cartAmount);
  console.log("🎟️ Discount:", discountPercent);
  console.log("🏁 Final Amount (Cart):", finalAmount);
  return finalAmount;
}, [buyNowItem, discountPercent, delivery_fee, cartItems, voucherAmountDiscount]);
  
  useEffect(() => {
    return () => {
      setBuyNowItem(null);
    };
  }, []);

  useEffect(() => {
    const validateVoucher = async () => {
      if (!voucherCode.trim() || !formData.email) return;
  
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/validate`,
          { email: formData.email.toLowerCase(), discountCode: voucherCode.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        if (data.success && data.discountPercent !== undefined) {
          const discountValue = parseFloat(data.discountPercent);
          if (!isNaN(discountValue)) {
            setDiscountAmount((getCartAmount() * discountValue) / 100);
            setVoucherCode(voucherCode);
            toast.success(`Discount applied! ${discountValue}% off`);
          }
        } else {
          toast.error("Invalid discount code.");
        }
      } catch (error) {
        toast.error("Failed to validate discount code.");
      }
    };
  
    const timer = setTimeout(validateVoucher, 500);
    return () => clearTimeout(timer);
  }, [voucherCode, formData.email, computedTotal, token, backendUrl]);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]: name === "voucherCode" ? value.trim() : value,
    }));
  
    if (name === "region") {
      setRegion(value);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    
    if (method === "receipt" && !receiptFile) {
      toast.error("Please upload your payment receipt");
      return;
    }

    setLoading(true);
  
    if (!userId) {
      toast.error("User ID is required.");
      setLoading(false);
      return;
    }
  
    try {
      const orderItems = buyNowItem
  ? [buyNowItem]
  : Object.keys(cartItems)
      .filter((itemId) => cartItems[itemId]?.quantity > 0)
      .map((itemId) => {
        const itemInfo = products.find((product) => product._id === itemId);
        return itemInfo 
          ? { 
              ...itemInfo, 
              quantity: cartItems[itemId].quantity,
              variations: cartItems[itemId].variations // Include variations
            } 
          : null;
      })
      .filter(Boolean);
  
      if (!products.length) {
        toast.error("Products not loaded. Try again.");
        console.error("❌ Products are empty:", products);
        return;
      }
    
  
      const orderData = {
        address: formData,
        items: buyNowItem 
    ? [{
        ...buyNowItem,
        productId: buyNowItem._id,
        name: buyNowItem.name,
        price: buyNowItem.price,
        quantity: buyNowItem.quantity,
        variationDetails: buyNowItem.variations 
          ? Object.entries(buyNowItem.variations).map(([variationName, option]) => ({
              variationName,
              optionName: option.name,
              priceAdjustment: option.priceAdjustment || 0
            }))
          : []
      }]
      : Object.keys(cartItems)
      .filter(itemId => cartItems[itemId]?.quantity > 0)
      .map(itemId => {
        const product = products.find(p => p._id === itemId);
        if (!product) return null;
        
        const cartItem = cartItems[itemId];
        
        // Ensure we're only using selected variations
        const selectedVariations = cartItem.variations || {};
        
        return {
          ...product,
          productId: product._id,
          quantity: cartItem.quantity,
          variationDetails: Object.entries(selectedVariations).map(([variationName, option]) => ({
            variationName,
            optionName: option.name,
            priceAdjustment: option.priceAdjustment || 0
          }))
        };
      })
      .filter(Boolean),
        amount: computedTotal,
        discountAmount,
        voucherCode: voucherAmountDiscount?.code,
        voucherAmount: voucherAmountDiscount?.amount || 0,
        deliveryFee: delivery_fee,
        region: formData.region,
        userId,
        paymentMethod: method,
        variationAdjustment: buyNowItem?.variationAdjustment || 0,
      };
      

      let response;

      if (method === "receipt") {
        setIsUploadingReceipt(true);
        const formData = new FormData();
        formData.append("receipt", receiptFile);
        // Stringify the orderData to match backend expectation
        formData.append("orderData", JSON.stringify({
          ...orderData,
          paymentMethod: "receipt_upload" // Match backend expectation
        }));
      
        response = await axios.post(`${backendUrl}/api/order/upload-receipt`, formData, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      } else {
        // Handle other payment methods
        switch (method) {
          case "cod":
            response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { token } });
            break;
          case "stripe":
            const { data } = await axios.post(`${backendUrl}/api/order/stripe`, orderData, { headers: { token } });
            if (data.session_url) {
              window.location.href = data.session_url;
              return;
            } else {
              toast.error("Failed to retrieve Stripe payment link.");
              return;
            }
          case "gcash":
            const gcashRes = await axios.post(`${backendUrl}/api/payment/gcash`, orderData, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (gcashRes.data?.paymentUrl) {
              localStorage.setItem("pendingOrderId", gcashRes.data.orderId);
              window.location.href = gcashRes.data.paymentUrl;
              toast.info("Redirecting to GCash for payment...");
              return;
            } else {
              toast.error("Failed to retrieve GCash payment link.");
              return;
            }
          default:
            break;
        }
      }
  
      if (response?.data?.success) {
        setOrderId(response.data.orderId || response.data.order._id);
        setCartItems({});
        setBuyNowItem(null);
        
        // Wait a moment before navigating to ensure state updates
        setTimeout(() => {
          toast.success("✅ Order placed successfully!");
          navigate("/orders");
          socket.emit('joinOrderRoom', response.data.orderId || response.data.order._id);
        }, 100);
      } else {
        toast.error(response?.data?.message || "Order placed but with unexpected response");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setIsUploadingReceipt(false);
    }
  };
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("orderId");
    const paymentIntentId = params.get("payment_intent_id");
  
    if (orderId && paymentIntentId) {
      fetch(`${backendUrl}/api/orders/verify-gcash-payment?orderId=${orderId}&payment_intent_id=${paymentIntentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("✅ Payment Successful!");
          } else {
            alert("❌ Payment Failed!");
          }
        })
        .catch(err => console.error("Verification Error:", err));
    }
  }, []);

  return (
    <form onSubmit={onSubmitHandler} className="md:px-[7vw] flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t px-4">
      <div className="flex flex-col pt-[40px] gap-2 w-full sm:max-w-[480px]">
        <Title text1={"DELIVERY"} text2={"INFORMATION"} />

        <div className="flex items-center justify-between p-3 text-sm text-yellow-800 bg-yellow-100 rounded-md">
          <span>⚠️ If your details are incorrect, please update them in your profile before proceeding.</span>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="px-3 py-1 ml-2 text-white transition bg-yellow-600 rounded hover:bg-yellow-700"
          >
            Go to Profile
          </button>
        </div>

        <div className="flex gap-3">
          <div className="w-full">
            <label className="text-sm text-gray-600">First Name</label>
            <input
              required disabled onChange={onChangeHandler}
              name="firstName" value={formData.firstName}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text" placeholder="First Name"
            />
          </div>
          <div className="w-full">
            <label className="text-sm text-gray-600">Last Name</label>
            <input
              required disabled onChange={onChangeHandler}
              name="lastName" value={formData.lastName}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text" placeholder="Last Name"
            />
          </div>
        </div>

        <label className="text-sm text-gray-600">Email Address</label>
        <input
          required disabled onChange={onChangeHandler}
          name="email" value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email" placeholder="Email address"
        />

        <label className="text-sm text-gray-600">Street</label>
        <input
          required disabled onChange={onChangeHandler}
          name="street" value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text" placeholder="Street"
        />

        <div className="flex gap-3">
          <div className="w-full">
            <label className="text-sm text-gray-600">Barangay</label>
            <input
              required disabled onChange={onChangeHandler}
              name="barangay" value={formData.barangay}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text" placeholder="Barangay"
            />
          </div>
          <div className="w-full">
            <label className="text-sm text-gray-600">City</label>
            <input
              required disabled onChange={onChangeHandler}
              name="city" value={formData.city}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text" placeholder="City"
            />
          </div>
        </div>

        <label className="text-sm text-gray-600">Province</label>
        <input
          required disabled onChange={onChangeHandler}
          name="province" value={formData.province}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text" placeholder="Province"
        />

        <label className="text-sm text-gray-600">Region</label>
        <select
          required name="region" value={formData.region}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full bg-gray-100 text-gray-500 cursor-not-allowed"
          disabled
        >
          {regions.length > 0 ? (
            regions.sort((a, b) => a.name.localeCompare(b.name))
              .map((region) => (
                <option key={region._id} value={region.name}>
                  {region.name}
                </option>
              ))
          ) : (
            <option value="">Loading regions...</option>
          )}
        </select>

        <div className="flex gap-3">
          <div className="w-full">
            <label className="text-sm text-gray-600">Postal Code</label>
            <input
              required disabled onChange={onChangeHandler}
              name="postalCode" value={formData.postalCode}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="number" placeholder="Postal Code"
            />
          </div>
          <div className="w-full">
            <label className="text-sm text-gray-600">Phone</label>
            <input
              required disabled onChange={onChangeHandler}
              name="phone" value={formData.phone}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="number" placeholder="Phone"
            />
          </div>
        </div>
      </div>

      <div className="pt-[40px]">
        <CartTotal additionalFee={delivery_fee} discount={discountAmount} total={computedTotal} />

        <Title text1={"PAYMENT"} text2={"METHOD"} />
        <div className="flex flex-col gap-3 lg:flex-row">
          <div onClick={() => setMethod("stripe")} className="flex items-center gap-3 p-2 px-3 border cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "stripe" ? "bg-green-400" : ""}`}></p>
            <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
          </div>
          <div onClick={() => setMethod("gcash")} className="flex items-center gap-3 p-2 px-3 border cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "gcash" ? "bg-green-400" : ""}`}></p>
            <img className="h-5 mx-4" src={assets.gcash} alt="GCash" />
          </div>
          <div onClick={() => setMethod("cod")} className="flex items-center gap-3 p-2 px-3 border cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "cod" ? "bg-green-400" : ""}`}></p>
            <span>Cash on Delivery</span>
          </div>
          <div onClick={() => setMethod("receipt")} className="flex items-center gap-3 p-2 px-3 border cursor-pointer">
            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "receipt" ? "bg-green-400" : ""}`}></p>
            <span>Upload Receipt</span>
          </div>
        </div>

        {method === "receipt" && (
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Payment Receipt</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                id="receipt"
                accept="image/*,.pdf"
                onChange={(e) => setReceiptFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Upload screenshot or photo of your payment receipt</p>
          </div>
        )}

        <button 
          disabled={loading || isUploadingReceipt} 
          className="mt-6 py-2 w-full bg-[#17A554] text-white bg-black rounded"
        >
          {isUploadingReceipt ? "Uploading Receipt..." : 
           loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </form>
  );
};

export default PlaceOrder;