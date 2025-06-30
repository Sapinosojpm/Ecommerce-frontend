import React, { useContext, useState, useEffect, useMemo } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from '../context/SocketContext';

const PlaceOrder = () => {
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmountValue,
    getTotalAmount,
    products,
    delivery_fee,
    discountPercent,
    voucherAmountDiscount,
    setRegion,
    buyNowItem,
    setBuyNowItem,
    getDiscountAmount,
    setVoucherAmountDiscount,
  } = useContext(ShopContext);

  const socket = useSocket();

  // Early returns BEFORE any other hooks
  if (!products || products.length === 0) {
    return <div className="text-center py-20 text-lg font-semibold">Loading products... Please wait.</div>;
  }
  // Only show cart empty message if neither buyNowItem nor cart items exist
  if (!buyNowItem && (!cartItems || Object.keys(cartItems).length === 0)) {
    return <div className="text-center py-20 text-lg font-semibold">Your cart is empty. Please add items before placing an order.</div>;
  }

  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Debug: Log cartItems and products
  console.log('DEBUG: cartItems in PlaceOrder', cartItems);
  console.log('DEBUG: products in PlaceOrder', products);

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
    ? [{
        ...buyNowItem,
        productId: buyNowItem._id,
        price: buyNowItem.price,
        variationAdjustment: buyNowItem.variationDetails && Array.isArray(buyNowItem.variationDetails)
          ? buyNowItem.variationDetails.reduce((sum, v) => sum + (v.priceAdjustment || 0), 0)
          : 0,
        quantity: buyNowItem.quantity,
        variationDetails: buyNowItem.variationDetails || [],
        // Calculate finalPrice for buyNowItem
        finalPrice: (() => {
          const capitalValue = buyNowItem.capital || 0;
          let markup = 0;
          if (buyNowItem.additionalCapital) {
            if (buyNowItem.additionalCapital.type === 'percent') {
              markup = capitalValue * (buyNowItem.additionalCapital.value / 100);
            } else {
              markup = buyNowItem.additionalCapital.value || 0;
            }
          }
          const subtotalBase = capitalValue + markup;
          const vatPercent = buyNowItem.vat || 0;
          const vatAmount = subtotalBase * (vatPercent / 100);
          const basePrice = subtotalBase + vatAmount;
          const discountPercent = buyNowItem.discount || 0;
          const variationAdjustment = buyNowItem.variationAdjustment || 0;
          const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
          const priceWithVariation = basePrice + variationAdjustment;
          const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
          return Math.round(finalPrice * 100) / 100;
        })()
      }]
    : Object.keys(cartItems)
        .filter((itemId) => cartItems[itemId]?.quantity > 0)
        .map((itemId) => {
          const baseProductId = itemId.split('-')[0];
          const itemInfo = products.find((product) => product._id === baseProductId);
          if (!itemInfo) return null;
          const cartItem = cartItems[itemId];
          const selectedVariations = cartItem.variations || {};
          const variationAdjustment = Object.values(selectedVariations).reduce(
            (sum, v) => sum + (v.priceAdjustment || 0),
            0
          );
          // Calculate finalPrice for each cart item
          const capitalValue = itemInfo.capital || 0;
          let markup = 0;
          if (itemInfo.additionalCapital) {
            if (itemInfo.additionalCapital.type === 'percent') {
              markup = capitalValue * (itemInfo.additionalCapital.value / 100);
            } else {
              markup = itemInfo.additionalCapital.value || 0;
            }
          }
          const subtotalBase = capitalValue + markup;
          const vatPercent = itemInfo.vat || 0;
          const vatAmount = subtotalBase * (vatPercent / 100);
          const basePrice = subtotalBase + vatAmount;
          const discountPercent = itemInfo.discount || 0;
          const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
          const priceWithVariation = basePrice + variationAdjustment;
          const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
          return {
            ...itemInfo,
            productId: itemInfo._id,
            _id: itemInfo._id,
            price: itemInfo.price,
            variationAdjustment,
            quantity: cartItem.quantity,
            variationDetails: Object.entries(selectedVariations).map(([variationName, option]) => ({
              variationName,
              optionName: option.name,
              priceAdjustment: option.priceAdjustment || 0
            })),
            finalPrice: Math.round(finalPrice * 100) / 100
          };
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
  let subtotal = 0;
  if (buyNowItem) {
    let basePrice = buyNowItem.price || 0;
    let discountAmount = buyNowItem.discount ? (basePrice * (buyNowItem.discount / 100)) : 0;
    let variationAdjustment = buyNowItem.variationAdjustment || 0;
    let finalPrice = Math.round(((basePrice - discountAmount) + variationAdjustment) * 100) / 100;
    subtotal = Math.round((finalPrice * (buyNowItem.quantity || 1)) * 100) / 100;
    // Debug log for buyNowItem
    console.log('PLACEORDER BUY NOW DEBUG:', { basePrice, discount: buyNowItem.discount, discountAmount, variationAdjustment, finalPrice, quantity: buyNowItem.quantity, subtotal });
  } else {
    subtotal = Object.keys(cartItems)
      .filter((itemId) => cartItems[itemId]?.quantity > 0)
      .reduce((sum, itemId) => {
        const itemInfo = products.find((product) => product._id === itemId);
        if (!itemInfo) return sum;
        let basePrice = itemInfo.price || 0;
        let discountAmount = itemInfo.discount ? (basePrice * (itemInfo.discount / 100)) : 0;
        let cartItem = cartItems[itemId];
        let selectedVariations = cartItem.variations || {};
        let variationAdjustment = Object.values(selectedVariations).reduce(
          (s, v) => s + (v.priceAdjustment || 0),
          0
        );
        let finalPrice = Math.round(((basePrice - discountAmount) + variationAdjustment) * 100) / 100;
        let itemTotal = Math.round((finalPrice * (cartItem.quantity || 1)) * 100) / 100;
        // Debug log for each cart item
        console.log('PLACEORDER CART ITEM DEBUG:', { name: itemInfo.name, basePrice, discount: itemInfo.discount, discountAmount, variationAdjustment, finalPrice, quantity: cartItem.quantity, itemTotal });
        return Math.round((sum + itemTotal) * 100) / 100;
      }, 0);
  }
  const discount = discountAmount || 0;
  const voucher = voucherAmountDiscount?.amount || 0;
  const shipping = delivery_fee || 0;
  const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
  // Debug logs for calculation
  console.log('==== FRONTEND ORDER DEBUG (STANDARDIZED) ====');
  console.log('Subtotal:', subtotal);
  console.log('Discount:', discount);
  console.log('Voucher:', voucher);
  console.log('Shipping Fee:', shipping);
  console.log('Final Calculated Total:', total);
  console.log('=============================================');
  return total;
}, [buyNowItem, cartItems, products, discountAmount, voucherAmountDiscount, delivery_fee]);
  
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
            setDiscountAmount((getCartAmountValue() * discountValue) / 100);
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

// In PlaceOrder.jsx - update the onSubmitHandler function
const onSubmitHandler = async (event) => {
  event.preventDefault();
  
  if (method === "receipt" && !receiptFile) {
    toast.error("Please upload your payment receipt");
    return;
  }

  // === NEW VALIDATION: Prevent unmatched cart items ===
  const unmatchedItems = Object.keys(cartItems)
    .filter((itemId) => cartItems[itemId]?.quantity > 0)
    .filter((itemId) => {
      const baseProductId = itemId.split('-')[0];
      return !products.find((product) => product._id === baseProductId);
    });
  if (unmatchedItems.length > 0) {
    toast.error("Some cart items could not be matched to products. Please refresh the page or try again later.");
    console.error("Unmatched cart items:", unmatchedItems);
    return;
  }

  // === NEW VALIDATION: Prevent zero/missing price items ===
  const invalidItems = orderItems.filter(
    (item) => !item.price || item.price <= 0 || isNaN(item.price)
  );
  if (invalidItems.length > 0) {
    toast.error(
      `Cannot place order: One or more items have zero or missing price. Please remove these items from your cart and try again.`
    );
    console.error("Invalid cart items detected:", invalidItems);
    return;
  }

  setLoading(true);

  if (!userId) {
    toast.error("User ID is required.");
    setLoading(false);
    return;
  }

  try {
    // --- Use context for all calculations ---
    const subtotal = getCartAmountValue();
    if (!subtotal || subtotal === 0) {
      toast.error("Your cart subtotal is zero. Please add items to your cart before placing an order.");
      setLoading(false);
      return;
    }
    const discount = getDiscountAmount();
    const shipping = delivery_fee || 0;
    const originalVoucher = voucherAmountDiscount?.amount || 0;
    
    // NEW: Calculate maximum allowed voucher amount
    const maxVoucher = Math.max(0, subtotal - discount + shipping);
    let appliedVoucher = originalVoucher;
    if (appliedVoucher > maxVoucher) {
      appliedVoucher = maxVoucher;
      toast.warn("Voucher amount was reduced to avoid zero or negative order total.");
    }
    
    // Get the final total directly from context (CartTotal)
    const finalTotal = Math.max(0, subtotal - discount - appliedVoucher + shipping);

    // --- Debug logs ---
    console.log('==== DEBUG ORDER SUBMISSION (CONTEXT) ====');
    console.log('Subtotal (context):', subtotal);
    console.log('Discount (context):', discount);
    console.log('Voucher (original):', originalVoucher);
    console.log('Voucher (applied/capped):', appliedVoucher);
    console.log('Shipping (context):', shipping);
    console.log('Final Total (from CartTotal/context):', finalTotal);
    console.log('Order Items:', orderItems);

    if (finalTotal <= 0) {
      toast.error("Order total must be greater than zero after applying all discounts and vouchers.");
      setLoading(false);
      return;
    }

    // Prepare orderData
    const orderData = {
      address: formData,
      items: orderItems,
      amount: Math.round(finalTotal * 100) / 100,
      discountAmount: discount,
      voucherCode: voucherAmountDiscount?.code,
      voucherAmount: appliedVoucher,
      shippingFee: shipping,
      region: formData.region,
      userId,
      paymentMethod: method,
      variationAdjustment: buyNowItem?.variationAdjustment || 0,
      ...(buyNowItem ? { fromCart: false } : {})
    };

    console.log('OrderData sent to backend:', orderData);
    console.log('===============================');

    let response;

    if (method === "receipt") {
      setIsUploadingReceipt(true);
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("orderData", JSON.stringify({
        ...orderData,
        paymentMethod: "receipt_upload"
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
      setVoucherAmountDiscount({ code: "", amount: 0, minimumPurchase: 0 });
      // Only clear cart if it's not a Buy Now order
      if (!buyNowItem) {
        setCartItems({});
      }
      setBuyNowItem(null);
      localStorage.removeItem("buyNowItem");
      // Only redirect for COD or receipt upload
      if (method === "cod" || method === "receipt") {
        setTimeout(() => {
          toast.success("✅ Order placed successfully!");
          navigate("/orders", { state: { justOrdered: true } });
          socket.emit('joinOrderRoom', response.data.orderId || response.data.order._id);
        }, 100);
      }
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
      fetch(`${backendUrl}/api/payment/gcash/verify?orderId=${orderId}&payment_intent_id=${paymentIntentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            alert("✅ Payment Successful!");
          } else {
            // Show more detailed error info if available
            let msg = `❌ Payment Failed!`;
            if (data.paymentStatus) {
              msg += `\nStatus: ${data.paymentStatus}`;
            }
            if (data.message) {
              msg += `\nMessage: ${data.message}`;
            }
            if (data.paymongoResponse) {
              msg += `\nPayMongo Response: ` + JSON.stringify(data.paymongoResponse, null, 2);
            }
            alert(msg);
          }
        })
        .catch(err => {
          alert("Verification Error: " + err.message);
          console.error("Verification Error:", err);
        });
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
        <CartTotal items={orderItems} />

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