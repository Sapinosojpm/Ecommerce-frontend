import React, { useContext, useState, useEffect, useMemo } from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useSocket } from '../context/SocketContext';

// Helper to upload a file to S3 and return the URL, with progress and error handling
async function uploadToS3(file, token, backendUrl, setProgress) {
  try {
    const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ fileType: file.type }),
    });
    if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
    const { uploadUrl, fileUrl } = await presignRes.json();
    // Use XMLHttpRequest for progress
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => {
        if (setProgress && e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Failed to upload file to S3'));
        }
      };
      xhr.onerror = () => reject(new Error('Failed to upload file to S3'));
      xhr.send(file);
    });
    return fileUrl;
  } catch (err) {
    throw err;
  }
}

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
    return <div className="py-20 text-lg font-semibold text-center">Loading products... Please wait.</div>;
  }
  // Only show cart empty message if neither buyNowItem nor cart items exist
  if (!buyNowItem && (!cartItems || Object.keys(cartItems).length === 0)) {
    return <div className="py-20 text-lg font-semibold text-center">Your cart is empty. Please add items before placing an order.</div>;
  }

  const [method, setMethod] = useState("cod");
  const [paymentMethod, setPaymentMethod] = useState("gcash"); // default to gcash
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [regions, setRegions] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const computedTotal = useMemo(() => {
    let subtotal = 0;
    if (buyNowItem) {
      let basePrice = buyNowItem.price || 0;
      let discountAmount = buyNowItem.discount ? (basePrice * (buyNowItem.discount / 100)) : 0;
      let variationAdjustment = buyNowItem.variationAdjustment || 0;
      let finalPrice = Math.round(((basePrice - discountAmount) + variationAdjustment) * 100) / 100;
      subtotal = Math.round((finalPrice * (buyNowItem.quantity || 1)) * 100) / 100;
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
          return Math.round((sum + itemTotal) * 100) / 100;
        }, 0);
    }
    const discount = discountAmount || 0;
    const voucher = voucherAmountDiscount?.amount || 0;
    const shipping = delivery_fee || 0;
    const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
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
            // Use computedTotal as the base for discount calculation
            setDiscountAmount((computedTotal * discountValue) / 100);
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

  // Validate cart items
  const unmatchedItems = Object.keys(cartItems)
    .filter((itemId) => cartItems[itemId]?.quantity > 0)
    .filter((itemId) => {
      const baseProductId = itemId.split('-')[0];
      return !products.find((product) => product._id === baseProductId);
    });
  
  if (unmatchedItems.length > 0) {
    toast.error("Some cart items could not be matched to products. Please refresh the page or try again later.");
    return;
  }

  // Validate item prices
  const invalidItems = orderItems.filter(
    (item) => !item.price || item.price <= 0 || isNaN(item.price)
  );
  
  if (invalidItems.length > 0) {
    toast.error("Cannot place order: One or more items have zero or missing price.");
    return;
  }

  setLoading(true);

  if (!userId) {
    toast.error("User ID is required.");
    setLoading(false);
    return;
  }

  try {
    // Use computedTotal for the actual price
    if (!computedTotal || computedTotal === 0) {
      toast.error("Your cart subtotal is zero. Please add items to your cart before placing an order.");
      setLoading(false);
      return;
    }

    // Prepare order data
    const orderData = {
      address: formData,
      items: orderItems,
      amount: Math.round(computedTotal * 100) / 100,
      discountAmount: getDiscountAmount(),
      voucherCode: voucherAmountDiscount?.code,
      voucherAmount: voucherAmountDiscount?.amount || 0,
      shippingFee: delivery_fee || 0,
      region: formData.region,
      userId,
      paymentMethod: method,
      variationAdjustment: buyNowItem?.variationAdjustment || 0,
      date: new Date().toISOString(),
      customerName: `${formData.firstName} ${formData.lastName}`,
      ...(buyNowItem ? { fromCart: false } : {})
    };

    let response;

    // Handle different payment methods
    if (method === "receipt") {
      setIsUploadingReceipt(true);
      setUploadProgress(0);
      let s3Url = null;
      
      if (receiptFile) {
        try {
          s3Url = await uploadToS3(receiptFile, token, backendUrl, setUploadProgress);
          toast.success('Receipt uploaded to S3!');
        } catch (err) {
          toast.error('Failed to upload receipt to S3: ' + err.message);
          setLoading(false);
          setIsUploadingReceipt(false);
          return;
        }
      }
      
      try {
        response = await axios.post(`${backendUrl}/api/order/upload-receipt`, {
          orderData: {
            ...orderData,
            paymentMethod: "receipt_upload"
          },
          receiptUrl: s3Url
        }, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
      } catch (err) {
        toast.error('Failed to save receipt to backend: ' + (err.response?.data?.message || err.message));
        setLoading(false);
        setIsUploadingReceipt(false);
        return;
      }
    } 
    else if (method === "paymongo") {
      try {
        const paymongoRes = await axios.post(
          `${backendUrl}/api/payment/paymongo`,
          {
            ...orderData,
            paymentMethod: paymentMethod // Add the specific payment method
          },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        if (paymongoRes.data?.success) {
          if (paymongoRes.data.paymentUrl) {
            // Store order details before redirect
            localStorage.setItem("pendingOrderId", paymongoRes.data.orderId);
            localStorage.setItem("pendingOrderAmount", orderData.amount);
            localStorage.setItem("paymentIntentId", paymongoRes.data.paymentIntentId);
            localStorage.setItem("clientKey", paymongoRes.data.clientKey);
            
            // Show loading toast
            toast.info("Redirecting to payment gateway...");
            
            // Redirect to payment URL
            window.location.href = paymongoRes.data.paymentUrl;
            return;
          } else {
            throw new Error("No payment URL received");
          }
        } else {
          throw new Error(paymongoRes.data?.message || "Payment initialization failed");
        }
      } catch (error) {
        console.error("Payment error:", error);
        toast.error(error.response?.data?.message || error.message || "Failed to process payment");
        setLoading(false);
        return;
      }
    }
    else if (method === "cod") {
      response = await axios.post(
        `${backendUrl}/api/order/place`, 
        orderData, 
        { headers: { token } }
      );
    }

    // Handle successful order placement
    if (response?.data?.success) {
      setOrderId(response.data.orderId || response.data.order._id);
      setVoucherAmountDiscount({ code: "", amount: 0, minimumPurchase: 0 });
      
      if (!buyNowItem) {
        setCartItems({});
      }
      
      setBuyNowItem(null);
      localStorage.removeItem("buyNowItem");
      
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
    setUploadProgress(0);
  }
};
  
  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");
      const paymentIntentId = params.get("payment_intent_id");
    
      if (orderId && paymentIntentId) {
        try {
          const response = await axios.get(
            `${backendUrl}/api/payment/verify?orderId=${orderId}&payment_intent_id=${paymentIntentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data.success) {
            toast.success("Payment successful!");
            // Clear cart and navigate to orders
            setCartItems({});
            setBuyNowItem(null);
            localStorage.removeItem("buyNowItem");
            localStorage.removeItem("pendingOrderId");
            navigate("/orders", { state: { justOrdered: true } });
          } else {
            toast.error(response.data.message || "Payment verification failed");
            navigate("/cart");
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error(error.response?.data?.message || "Payment verification failed");
          navigate("/cart");
        }
      }
    };

    verifyPayment();
  }, [backendUrl, token, navigate, setCartItems, setBuyNowItem]);

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
        

        <div className="flex flex-col gap-4">
          {/* Paymongo modern UI */}
         {/* Paymongo modern UI */}
  <div className={`border rounded-lg p-4 ${method === "paymongo" ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}>
    <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => setMethod("paymongo")}> 
      <input
        type="radio"
        checked={method === "paymongo"}
        onChange={() => setMethod("paymongo")}
        className="text-blue-500 focus:ring-blue-500"
      />
      <span className="font-medium">Online Payment (GCash, GrabPay, Card)</span>
    </div>
    {method === "paymongo" && (
      <div className="mt-2 space-y-2 ml-7">
        <div className="flex flex-col gap-2">
          <label className="mb-1 font-semibold">Choose payment method:</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="gcash"
                checked={paymentMethod === "gcash"}
                onChange={() => setPaymentMethod("gcash")}
                className="accent-blue-500"
              />
              <div className="flex items-center gap-2">
                <img src={assets.gcash_icon} alt="GCash" className="w-6 h-6" />
                <span>GCash</span>
              </div>
            </label>
            <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="grab_pay"
                checked={paymentMethod === "grab_pay"}
                onChange={() => setPaymentMethod("grab_pay")}
                className="accent-blue-500"
              />
              <div className="flex items-center gap-2">
                <img src={assets.grabpay_icon} alt="GrabPay" className="w-6 h-6" />
                <span>GrabPay</span>
              </div>
            </label>
            <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="card"
                checked={paymentMethod === "card"}
                onChange={() => setPaymentMethod("card")}
                className="accent-blue-500"
              />
              <div className="flex items-center gap-2">
                <img src={assets.card_icon} alt="Card" className="w-6 h-6" />
                <span>Card</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    )}
  </div>

          {/* Cash on Delivery */}
          <div 
            onClick={() => setMethod("cod")}
            className={`flex items-center gap-3 p-2 px-3 border rounded cursor-pointer ${
              method === "cod" ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border ${
              method === "cod" ? "bg-green-500 border-green-500" : "border-gray-400"
            }`}></div>
            <span>Cash on Delivery</span>
          </div>

          {/* Upload Receipt */}
          <div 
            onClick={() => setMethod("receipt")}
            className={`flex items-center gap-3 p-2 px-3 border rounded cursor-pointer ${
              method === "receipt" ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border ${
              method === "receipt" ? "bg-green-500 border-green-500" : "border-gray-400"
            }`}></div>
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
          className="w-full py-2 mt-6 text-white bg-black rounded hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isUploadingReceipt ? "Uploading Receipt..." : 
           loading ? "Placing Order..." : "Place Order"}
        </button>

        {isUploadingReceipt && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </div>
    </form>
  );
};

export default PlaceOrder;