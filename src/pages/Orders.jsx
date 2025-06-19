import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiTruck, FiMapPin, FiPlus, FiX, FiRefreshCw } from 'react-icons/fi';

const Orders = () => {
  // ===== Context & State =====
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]); // Renamed for clarity
  const [activeTab, setActiveTab] = useState("all");
  const [loadingTrackingId, setLoadingTrackingId] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [isRefreshingTracking, setIsRefreshingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const navigate = useNavigate();

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
    loadOrderData();
  }, [token]);

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
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col px-6 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          className="object-cover w-16 h-16 rounded"
                          src={item.image?.[0] || '/placeholder-product.jpg'}
                          alt={item.name}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 line-clamp-2">
                            {item.name}
                          </p>
                          <div className="mt-1 text-sm text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            {item.discount > 0 && (
                              <span className="ml-2 text-red-500">
                                -{item.discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 text-right md:mt-0">
                        <p className="font-medium text-gray-800">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
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
                      {/* Show shipping fee and breakdown */}
                      <>
                        <p className="text-sm text-gray-500">
                          Subtotal: {formatPrice(order.shippingFee !== undefined ? order.amount - order.shippingFee : order.amount)}
                        </p>
                        {order.voucherAmount > 0 && (
                          <p className="text-sm text-gray-500">Discount: -{formatPrice(order.voucherAmount)}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          Shipping Fee: {order.shippingFee !== undefined ? formatPrice(order.shippingFee) : 'N/A'}
                        </p>
                      </>
                      <p className="text-sm text-gray-500">Total Payment:</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatPrice(order.amount)}
                      </p>
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              ) : trackingInfo ? (
                <div className="space-y-4">
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
              ) : (
                <div className="py-4 text-center text-gray-500">
                  Loading tracking information...
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
// ===================== Export =====================
export default Orders;