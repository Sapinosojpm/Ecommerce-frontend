import React, { useContext, useState, useEffect, useMemo } from "react";

import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [regions, setRegions] = useState([]);

  
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
    setRegion
  } = useContext(ShopContext);


    console.log("Voucher Amount 1:", voucherAmountDiscount); 
  
  console.log("Discount percent:", discountPercent);

   // Fetch regions when the component is mounted
   useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/regions`);
        setRegions(response.data); // Update state with the fetched regions
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

  

  // Fetch user details when the component is mounted
useEffect(() => {
  const fetchUserDetails = async () => {
    if (!token) return; // Prevent API call if token is missing

    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check if any required fields are missing
      const requiredFields = ["firstName", "lastName", "email", "street", "barangay", "city", "province", "postalCode", "phone", "region"];
      const isProfileIncomplete = requiredFields.some((field) => !data[field]);

      if (isProfileIncomplete) {
        toast.error("Please complete your address in your profile before checkout.");
        navigate("/profile"); // Redirect to profile page
        return; // Do not update the form if data is incomplete
      }

      // Set user data only if it's complete
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
        region: data.region || "", // Set user's region
      }));

      setRegion(data.region || ""); // Set the region in context/state
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

  
  
  
  
// Compute total amount after discount and delivery fee
const computedTotal = useMemo(() => {
  const cartAmount = getCartAmount(); // Get the raw cart amount
  console.log("Raw Cart Total:", cartAmount); // Log raw cart amount

  // Calculate the discount amount based on discountPercent
  const discountAmount = (cartAmount * discountPercent) / 100;

  // Apply the discount to the cart amount
  const discountedCartAmount = cartAmount - discountAmount;

  // Apply voucher discount if applicable
  const finalCartAmount = discountedCartAmount ;

  // Add delivery fee to the final cart amount
  const finalAmount = finalCartAmount + delivery_fee;

  console.log("Computed Total:", finalAmount); // Log the computed total value

  return finalAmount;
}, [discountPercent, delivery_fee, cartItems, voucherAmountDiscount]);
  // Voucher validation with debounce
  useEffect(() => {
    const validateVoucher = async () => {
      if (!voucherCode.trim() || !formData.email) return;
  
      try {
        const { data } = await axios.post(
          `${backendUrl}/api/validate`,
          { email: formData.email.toLowerCase(), discountCode: voucherCode.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
  
        // Voucher validation response handling
        if (data.success && data.discountPercent !== undefined) {
          const discountValue = parseFloat(data.discountPercent);
          if (!isNaN(discountValue) && discountValue > 0) {
            // Calculate discountAmount based on the computed total
            setDiscountAmount((getCartAmount() * discountValue) / 100);
            setVoucherCode(voucherCode); // Ensure voucherCode is set here
            toast.success(`Discount applied! ${discountValue}% off`);
          }
        } else {
          toast.error("Invalid discount code.");
        }
      } catch (error) {
        toast.error("Failed to validate discount code.");
      }
    };
  
    const timer = setTimeout(validateVoucher, 500); // Debounce API call
    return () => clearTimeout(timer);
  }, [voucherCode, formData.email, computedTotal, token, backendUrl]);
  
  // Input change handler
  const onChangeHandler = (event) => {
    const { name, value } = event.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]: name === "voucherCode" ? value.trim() : value,
    }));
  
    if (name === "region") {
      setRegion(value); // Update region in context
    }
  };
  
  

  // Order submission handler
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!userId) {
      toast.error("User ID is required.");
      setLoading(false);
      return;
    }

    try {
      let orderItems = Object.keys(cartItems)
        .filter((itemId) => cartItems[itemId] > 0)
        .map((itemId) => {
          const itemInfo = products.find((product) => product._id === itemId);
          return itemInfo ? { ...itemInfo, quantity: cartItems[itemId] } : null;
        })
        .filter(Boolean);

        if (!products.length) {
          toast.error("Products not loaded. Try again.");
          return;
        }
        
        
        

      const orderData = {
        address: formData,
        items: orderItems,
        amount: computedTotal,
        discountAmount,
        voucherCode,
        voucherAmount: voucherAmountDiscount || 0,
        deliveryFee: delivery_fee,
        region: formData.region,
        userId,
        
      };
      console.log("Order Data:", orderData); 
      console.log("amount:", orderData.amount);

      let response;
      switch (method) {
        case "cod":
          response = await axios.post(`${backendUrl}/api/order/place`, orderData, { headers: { token } });
          break;
        case "stripe":
          const { data } = await axios.post(`${backendUrl}/api/order/stripe`, orderData, { headers: { token } });
          if (data.session_url) {
            window.location.href = data.session_url;
          } else {
            toast.error("Failed to retrieve Stripe payment link.");
          }
          return;
        case "gcash":
          const gcashRes = await axios.post(`${backendUrl}/api/payment/gcash`, orderData, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (gcashRes.data?.paymentUrl) {
            localStorage.setItem("pendingOrderId", gcashRes.data.orderId);
            window.location.href = gcashRes.data.paymentUrl;
            toast.info("Redirecting to GCash for payment...");
          } else {
            toast.error("Failed to retrieve GCash payment link.");
          }
          return;
        default:
          break;
      }

      if (response?.data?.success) {
        setCartItems({});
        toast.success("✅ Order placed successfully!");
        navigate("/orders");
      } else {
        toast.error(response?.data?.message || "An error occurred.");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
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
            // Redirect or update UI
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
  type="button"  // Add this line to prevent form submission
  onClick={() => navigate("/profile")}
  className="px-3 py-1 ml-2 text-white transition bg-yellow-600 rounded hover:bg-yellow-700"
>
  Go to Profile
</button>

</div>

    {/* First Name & Last Name */}
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

    {/* Email */}
    <label className="text-sm text-gray-600">Email Address</label>
    <input
      required disabled onChange={onChangeHandler}
      name="email" value={formData.email}
      className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
      type="email" placeholder="Email address"
    />

    {/* Street */}
    <label className="text-sm text-gray-600">Street</label>
    <input
      required disabled onChange={onChangeHandler}
      name="street" value={formData.street}
      className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
      type="text" placeholder="Street"
    />

    {/* Barangay & City */}
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

    {/* Province */}
    <label className="text-sm text-gray-600">Province</label>
    <input
      required disabled onChange={onChangeHandler}
      name="province" value={formData.province}
      className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
      type="text" placeholder="Province"
    />

    {/* Region (Dropdown) */}
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

    {/* Postal Code & Phone */}
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

  {/* Payment Section */}
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
    </div>

    {/* Place Order Button */}
    <button disabled={loading} className="mt-6 py-2 w-full bg-[#17A554] text-white rounded">
      {loading ? "Placing Order..." : "Place Order"}
    </button>
  </div>
</form>


  );
};

export default PlaceOrder;
