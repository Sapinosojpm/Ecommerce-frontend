import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiTruck, FiMapPin, FiPlus, FiX, FiRefreshCw } from 'react-icons/fi';
import TrackingMap from '../components/TrackingMap';

const backendUrl = import.meta.env.VITE_BACKEND_URL; // for Vite projects
const token = localStorage.getItem('token');

const Orders = () => {
  // ===== Context & State =====
  const { currency, setCartItems, setVoucherAmountDiscount } = useContext(ShopContext);
  const [orders, setOrders] = useState([]); // Renamed for clarity
  const [activeTab, setActiveTab] = useState("all");
  const [loadingTrackingId, setLoadingTrackingId] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  

  // ===================== Data Fetching =====================
  // Fetch user orders from backend
  const loadOrderData = async () => {
    try {
      if (!token) return;
      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        // Normalize and reverse for most recent first
        setOrders(response.data.orders.map(order => ({
          ...order,
          orderId: order._id,
          date: order.date,
          tracking: order.tracking
        })).reverse());
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch tracking info for a specific order
  const getTrackingInfo = async (orderId) => {
    if (!orderId) {
      toast.error("Order ID is missing for tracking.");
      return;
    }
    try {
      setLoadingTrackingId(orderId);
      setTrackingError(null);
      const response = await axios.get(
        `${backendUrl}/api/tracking/order/${orderId}/status`,
        { headers: { token } }
      );
      if (response.data.success) {
        setTrackingInfo(response.data.tracking);
        setShowTrackingModal(true);
      }
    } catch (error) {
      setTrackingError({
        errorMessage: error.response?.data?.message || "Failed to get tracking information"
      });
      setShowTrackingModal(true);
    } finally {
      setLoadingTrackingId(null);
    }
  };

  // Refresh tracking info for the current order
  const refreshTrackingInfo = async () => {
    if (!trackingInfo?.orderId || isRefreshingTracking) return;
    try {
      setIsRefreshingTracking(true);
      await getTrackingInfo(trackingInfo.orderId);
    } finally {
      setIsRefreshingTracking(false);
    }
  };

  // ===================== Helpers =====================
  // Format price as currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(price);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get filtered orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === "all") return orders;
    if (activeTab === "pending") {
      return orders.filter(
        order => (!order.payment || order.status?.toLowerCase() === "pending") &&
        order.paymentMethod?.toLowerCase() !== "cod" &&
        order.status?.toLowerCase() !== "canceled"
      );
    }
    if (activeTab === "cod") {
      return orders.filter(
        order => order.paymentMethod?.toLowerCase() === "cod" &&
        order.status?.toLowerCase() !== "delivered" &&
        order.status?.toLowerCase() !== "canceled"
      );
    }
    if (activeTab === "packing") {
      return orders.filter(order => order.status?.toLowerCase() === "packing");
    }
    if (activeTab === "shipped") {
      return orders.filter(
        order => order.status?.toLowerCase() === "shipped" ||
        order.status?.toLowerCase() === "out for delivery"
      );
    }
    return orders.filter(order => order.status?.toLowerCase() === activeTab);
  };

  // Get CSS class for order status
  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "delivered": return "text-green-600 font-medium";
      case "canceled": return "text-red-600 font-medium";
      case "shipped":
      case "out for delivery": return "text-blue-600 font-medium";
      case "packing": return "text-amber-600 font-medium";
      default: return "text-gray-600 font-medium";
    }
  };

  // Check if order has tracking info
  const hasTracking = (order) => {
    return order.tracking && order.tracking.trackingNumber;
  };

  // ===================== Effects =====================
  useEffect(() => {
    console.log('Orders component mounted');
    loadOrderData();
  }, [token]);

  // Auto-refresh cart and voucher state if redirected from PlaceOrder
  useEffect(() => {
    if (location.state && location.state.justOrdered) {
      setCartItems({});
      setVoucherAmountDiscount({ code: "", amount: 0, minimumPurchase: 0 });
      // Optionally, you can reload orders here if needed
      loadOrderData();
    }
  }, [location.state, setCartItems, setVoucherAmountDiscount]);

  // Stripe payment verification after redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentSuccess = params.get("paymentSuccess");
    const orderId = params.get("orderId");
    if (paymentSuccess === "true" && orderId) {
      axios.post(
        `${backendUrl}/api/order/verify-stripe`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((res) => {
          if (res.data.success) {
            toast.success("Payment verified and order marked as paid!");
            loadOrderData();
          } else {
            toast.error(res.data.message || "Failed to verify payment.");
          }
        })
        .catch((err) => {
          toast.error(
            err?.response?.data?.message || "Failed to verify payment."
          );
        });
    }
  }, [location.search, backendUrl, token]);

  // ===================== UI Tabs =====================
  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "To Pay" },
    { id: "cod", label: "COD" },
    { id: "packing", label: "To Ship" },
    { id: "shipped", label: "To Receive" },
    { id: "delivered", label: "Completed" },
    { id: "canceled", label: "Cancelled" },
  ];

  const filteredOrders = getFilteredOrders();

  // ===================== Render =====================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-t pt-6 md:px-[7vw] px-4 pb-16">
        {/* ===== Page Title ===== */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">
            <span className="text-blue-600">MY</span> <span className="text-gray-800">ORDERS</span>
          </h1>
        </div>

        {/* ===== Order Status Tabs ===== */}
        <div className="flex mb-6 overflow-x-auto border-b scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-3 px-5 whitespace-nowrap font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Orders List or Empty State ===== */}
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            {/* Empty State Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-lg">No orders found</p>
            <button
              onClick={() => navigate("/collection")}
              className="px-6 py-2 mt-4 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.orderId}
                className="overflow-hidden bg-white rounded-lg shadow-sm"
              >
                {/* ===== Order Header ===== */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order #: {order.orderNumber || order.orderId}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={getStatusStyle(order.status)}>
                      {order.status}
                    </div>
                    {order.paymentMethod?.toLowerCase() === "cod" && (
                      <span className="mt-1 text-xs font-medium text-orange-500">
                        COD
                      </span>
                    )}
                  </div>
                </div>

                {/* ===== Order Items ===== */}
                <div className="px-6 py-4">
                  <div className="mb-2 text-base font-semibold text-blue-700">Order Items</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-200 rounded-lg bg-blue-50">
                      <thead className="sticky top-0 z-10 bg-blue-100">
                        <tr className="text-blue-900">
                          <th className="px-2 py-1 text-left">Image</th>
                          <th className="px-2 py-1 text-left">Product</th>
                          <th className="px-2 py-1 text-left">Variation(s)</th>
                          <th className="px-2 py-1 text-right">Base Price</th>
                          <th className="px-2 py-1 text-right">VAT</th>
                          <th className="px-2 py-1 text-right">Variation Adj.</th>
                          <th className="px-2 py-1 text-right">Subtotal</th>
                          <th className="px-2 py-1 text-right">Discount</th>
                          <th className="px-2 py-1 text-right">Final Price</th>
                          <th className="px-2 py-1 text-right">Qty</th>
                          <th className="px-2 py-1 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => {
                          // Robustly get variation details
                          let variationDetails = Array.isArray(item.variationDetails)
                            ? item.variationDetails
                            : (item.variations && typeof item.variations === 'object'
                                ? Object.entries(item.variations).map(([variationName, v]) => ({
                                    variationName,
                                    optionName: v.name,
                                    priceAdjustment: v.priceAdjustment || 0,
                                  }))
                                : []);
                          const capitalValue = item.capital || 0;
                          let markup = 0;
                          if (item.additionalCapital) {
                            if (item.additionalCapital.type === 'percent') {
                              markup = capitalValue * (item.additionalCapital.value / 100);
                            } else {
                              markup = item.additionalCapital.value || 0;
                            }
                          }
                          const subtotal = capitalValue + markup;
                          const vatPercent = item.vat || 0;
                          const vatAmount = subtotal * (vatPercent / 100);
                          const basePrice = subtotal + vatAmount;
                          const variationAdjustment = item.variationAdjustment || 0;
                          const discountPercent = item.discount || 0;
                          // New logic: discounted price = (basePrice * (1 - discount%)) + variationAdjustment
                          const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                          const priceWithVariation = basePrice + variationAdjustment;
                          const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
                          const discountAmount = discountPercent > 0 ? (basePrice * (discountPercent / 100)) : 0;
                          const quantity = item.quantity || 1;
                          const itemTotal = Math.round((finalPrice * quantity) * 100) / 100;
                          // Debug logs for each item
                          console.log('ORDER ITEM DEBUG:', {
                            name: item.name,
                            capitalValue,
                            markup,
                            subtotal,
                            vatPercent,
                            vatAmount,
                            basePrice,
                            variationAdjustment,
                            discountPercent,
                            discountAmount,
                            finalPrice,
                            quantity,
                            itemTotal
                          });
                          return (
                            <tr key={index} className="border-t border-gray-200">
                              <td className="px-2 py-1">
                                <img
                                  src={item.image?.[0] || '/placeholder-product.jpg'}
                                  alt={item.name}
                                  className="object-cover w-12 h-12 rounded"
                                />
                              </td>
                              <td className="px-2 py-1 font-medium text-gray-800">{item.name}</td>
                              <td className="px-2 py-1 text-green-700">
                                {variationDetails.length > 0 ? (
                                  variationDetails.map((v, idx) => (
                                    <div key={idx}>
                                      <span className="font-semibold">{v.variationName}</span>: {v.optionName}
                                    </div>
                                  ))
                                ) : (
                                  <span className="italic text-gray-400">None</span>
                                )}
                              </td>
                              <td className="px-2 py-1 text-right">{formatPrice(subtotal)}</td>
                              <td className="px-2 py-1 text-right">{formatPrice(vatAmount)}</td>
                              <td className="px-2 py-1 text-right">{formatPrice(variationAdjustment)}</td>
                              <td className="px-2 py-1 text-right">{formatPrice(basePrice)}</td>
                              <td className="px-2 py-1 text-right text-red-600">-{formatPrice(discountAmount)}</td>
                              <td className="px-2 py-1 font-semibold text-right text-blue-900">{formatPrice(finalPrice)}</td>
                              <td className="px-2 py-1 text-right">{quantity}</td>
                              <td className="px-2 py-1 font-bold text-right text-green-700">{formatPrice(itemTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ===== Order Summary ===== */}
                <div className="px-6 pb-4">
                  <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="mb-2 text-base font-semibold text-blue-700">Order Summary</div>
                    {(() => {
                      const subtotal = order.items.reduce((sum, item) => {
                        const capitalValue = item.capital || 0;
                        let markup = 0;
                        if (item.additionalCapital) {
                          if (item.additionalCapital.type === 'percent') {
                            markup = capitalValue * (item.additionalCapital.value / 100);
                          } else {
                            markup = item.additionalCapital.value || 0;
                          }
                        }
                        const subtotalBase = capitalValue + markup;
                        const vatPercent = item.vat || 0;
                        const vatAmount = subtotalBase * (vatPercent / 100);
                        const basePrice = subtotalBase + vatAmount;
                        const variationAdjustment = item.variationAdjustment || 0;
                        const discountPercent = item.discount || 0;
                        const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                        const priceWithVariation = basePrice + variationAdjustment;
                        const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
                        const quantity = item.quantity || 1;
                        const itemTotal = Math.round((finalPrice * quantity) * 100) / 100;
                        return Math.round((sum + itemTotal) * 100) / 100;
                      }, 0);
                      const discount = order.discountAmount || 0;
                      const voucher = order.voucherAmount || 0;
                      const shipping = order.shippingFee || 0;
                      const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
                      // Debug logs for summary
                      console.log('ORDER SUMMARY DEBUG:', { subtotal, discount, voucher, shipping, total });
                      return (
                        <div className="flex flex-col gap-1 text-sm text-gray-700">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">{formatPrice(subtotal)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span className="text-red-600">-{formatPrice(discount)}</span>
                            </div>
                          )}
                          {voucher > 0 && (
                            <div className="flex justify-between">
                              <span>Voucher:</span>
                              <span className="text-red-600">-{formatPrice(voucher)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Shipping Fee:</span>
                            <span>{order.shippingFee !== undefined ? formatPrice(order.shippingFee) : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between pt-2 mt-2 text-lg font-bold text-blue-900 border-t border-blue-200">
                            <span>Total Payment:</span>
                            <span>{formatPrice(total)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* ===== Order Footer ===== */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.paymentMethod?.toLowerCase() === "cod" ? (
                          <span className="flex items-center">
                            <span className="inline-block w-2 h-2 mr-2 bg-orange-500 rounded-full"></span>
                            Cash On Delivery
                          </span>
                        ) : (
                          <span>
                            {order.payment ? "Payment Complete" : "Payment Pending"} • {order.paymentMethod}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      {/* Calculate subtotal as sum of all item totals, rounding after each step */}
                      {(() => {
                        const subtotal = order.items.reduce((sum, item) => {
                          const capitalValue = item.capital || 0;
                          let markup = 0;
                          if (item.additionalCapital) {
                            if (item.additionalCapital.type === 'percent') {
                              markup = capitalValue * (item.additionalCapital.value / 100);
                            } else {
                              markup = item.additionalCapital.value || 0;
                            }
                          }
                          const subtotalBase = capitalValue + markup;
                          const vatPercent = item.vat || 0;
                          const vatAmount = subtotalBase * (vatPercent / 100);
                          const basePrice = subtotalBase + vatAmount;
                          const variationAdjustment = item.variationAdjustment || 0;
                          const discountPercent = item.discount || 0;
                          const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                          const priceWithVariation = basePrice + variationAdjustment;
                          const finalPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
                          const quantity = item.quantity || 1;
                          const itemTotal = Math.round((finalPrice * quantity) * 100) / 100;
                          return Math.round((sum + itemTotal) * 100) / 100;
                        }, 0);
                        const discount = order.discountAmount || 0;
                        const voucher = order.voucherAmount || 0;
                        const shipping = order.shippingFee || 0;
                        const total = Math.round((subtotal - discount - voucher + shipping) * 100) / 100;
                        return (
                          <>
                            <p className="text-sm text-gray-500">
                              Subtotal: {formatPrice(subtotal)}
                            </p>
                            {discount > 0 && (
                              <p className="text-sm text-gray-500">Discount: -{formatPrice(discount)}</p>
                            )}
                            {voucher > 0 && (
                              <p className="text-sm text-gray-500">Voucher: -{formatPrice(voucher)}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              Shipping Fee: {order.shippingFee !== undefined ? formatPrice(order.shippingFee) : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">Total Payment:</p>
                            <p className="text-lg font-semibold text-blue-600">
                              {formatPrice(total)}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  {/* ===== Action Buttons ===== */}
                  <div className="flex flex-wrap justify-end gap-3 mt-4">
                    {/* Track Order Button */}
                    {hasTracking(order) && order.orderId && (
                      <button
                        onClick={() => getTrackingInfo(order.orderId)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-white transition-colors bg-indigo-600 rounded hover:bg-indigo-700"
                        disabled={loadingTrackingId === order.orderId}
                      >
                        <FiTruck className="mr-1" />
                        {loadingTrackingId === order.orderId ? "Loading..." : "Track Order"}
                      </button>
                    )}
                    {/* Pay Now Button for unpaid, non-COD orders */}
                    {/* Pay Now Button for unpaid, non-COD orders */}
{(!order.payment && 
  order.paymentMethod?.toLowerCase() !== "cod" && 
  order.status && 
  !['canceled', 'payment failed'].includes(order.status.toLowerCase())) && (
  <button
    onClick={() => handlePayNow(order)}
    className="flex items-center px-4 py-2 text-xs font-medium text-white transition-colors bg-green-600 rounded hover:bg-green-700"
  >
    Pay Now
  </button>
)}
                    {/* Cancel Order Button for eligible orders */}
                    {order.status && order.status.trim().toLowerCase() === "order placed" && !order.payment && (
                      <button
                        onClick={() => handleCancelOrder(order.orderId)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-white transition-colors bg-red-600 rounded hover:bg-red-700"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================== Tracking Modal ===================== */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Tracking Information</h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {/* ===== Tracking Error ===== */}
              {trackingError ? (
                <div className="p-4 mb-6 rounded-lg bg-red-50">
                  <h4 className="mb-2 text-lg font-medium text-red-700">Tracking Error</h4>
                  <p className="text-sm text-red-600">{trackingError.errorMessage}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ===== Map View ===== */}
                  <TrackingMap trackingInfo={trackingInfo} isVisible={!trackingError} />

                  {/* ===== Tracking Details ===== */}
                  <div className="p-4 mb-4 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tracking Number:</span>
                      <span className="font-mono">{trackingInfo.tracking_number}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Carrier:</span>
                      <span>{trackingInfo.courier_code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={`capitalize ${
                        trackingInfo.status === 'delivered' ? 'text-green-600' :
                        trackingInfo.status === 'exception' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {trackingInfo.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* ===== Tracking History ===== */}
                  {trackingInfo.origin_info?.trackinfo?.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="font-medium">Tracking History</h4>
                      <div className="relative">
                        <div className="absolute left-4 h-full w-0.5 bg-gray-200 -translate-x-1/2"></div>
                        <div className="space-y-4">
                          {trackingInfo.origin_info.trackinfo.map((event, index) => (
                            <div key={index} className="relative pl-8">
                              <div className={`absolute left-4 w-3 h-3 rounded-full -translate-x-1/2 ${
                                index === 0 ? 'bg-green-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="p-3 rounded-lg bg-gray-50">
                                <p className="font-medium">{event.tracking_detail}</p>
                                {event.location && (
                                  <p className="text-sm text-gray-500">
                                    <FiMapPin className="inline mr-1" />
                                    {event.location}
                                  </p>
                                )}
                                <p className="mt-1 text-xs text-gray-400">
                                  {(
                                    event.checkpoint_date && !isNaN(new Date(event.checkpoint_date))
                                  ) ? (
                                    new Date(event.checkpoint_date).toLocaleString()
                                  ) : (
                                    "No date available"
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      No tracking updates available yet
                    </div>
                  )}
                </div>
              )}

              {/* ===== Modal Actions ===== */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingError(null);
                  }}
                  className="flex-1 px-4 py-2 text-center text-white bg-gray-600 rounded hover:bg-gray-700"
                >
                  Close
                </button>
                {trackingInfo && (
                  <>
                    <a
                      href={`https://trackingmore.com/tracking.php?nums=${trackingInfo.tracking_number}&courier=${trackingInfo.courier_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      View Full Details
                    </a>
                    <button
                      onClick={refreshTrackingInfo}
                      disabled={isRefreshingTracking}
                      className="flex items-center justify-center px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiRefreshCw className={`mr-1 ${isRefreshingTracking ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Handler for Pay Now button
// Handler for Pay Now button
const handlePayNow = async (order) => {
  try {
    if (!order.orderId) {
      toast.error("Order ID is missing");
      return;
    }

    // For Paymongo payments (GCash, GrabPay, Card)
    if (['gcash', 'grab_pay', 'card'].includes(order.paymentMethod?.toLowerCase())) {
      const { data } = await axios.post(
        `${backendUrl}/api/payment/paymongo/retry`,
        { orderId: order.orderId },
        { headers: { token } }
      );

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.error(data.message || "Failed to get payment link");
      }
      return;
    }

    // For Stripe payments (keep existing logic)
    const { data } = await axios.post(
      `${backendUrl}/api/order/${order.orderId}/stripe-checkout`,
      {},
      { headers: { token } }
    );
    
    if (data.session_url) {
      window.location.href = data.session_url;
    } else {
      toast.error("Failed to get payment link");
    }
  } catch (error) {
    console.error('Error in handlePayNow:', error);
    toast.error(error?.response?.data?.message || "Failed to get payment link");
  }
};

// Cancel Order handler
const handleCancelOrder = async (orderId) => {
  if (!window.confirm("Are you sure you want to cancel this order?")) return;
  try {
    await axios.put(
      `${backendUrl}/api/order/cancel/${orderId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    toast.success("Order canceled successfully.");
    setActiveTab("canceled");
    loadOrderData(); // Refresh orders
  } catch (error) {
    toast.error(error?.response?.data?.message || "Failed to cancel order.");
  }
};

// ===================== Export =====================
export default Orders;