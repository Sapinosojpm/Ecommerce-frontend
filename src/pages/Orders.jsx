import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { toast } from "react-toastify";
import "../css/Order.css";
import Lenis from "lenis";
import { useNavigate } from "react-router-dom";
import { FiRotateCw, FiTruck, FiMapPin, FiPlus, FiX } from 'react-icons/fi';

const Orders = () => {
  const { backendUrl, token, currency, region, regions } =
    useContext(ShopContext);
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [loadingReturnId, setLoadingReturnId] = useState(null);
  const [loadingTrackingId, setLoadingTrackingId] = useState(null);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const [showAddTrackingModal, setShowAddTrackingModal] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: '',
    carrierCode: ''
  });
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  // scroll effect
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

  const loadOrderData = async () => {
    try {
      if (!token) {
        return null;
      }

      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        const groupedData = response.data.orders.map((order) => ({
          orderId: order._id,
          status: order.status,
          payment: order.payment,
          amount: order.amount,
          paymentMethod: order.paymentMethod,
          date: order.date,
          shippingFee: regions[region] || 0,
          tracking: order.tracking,
          items: order.items.map((item) => ({
            ...item,
            shippingFee: regions[region] || 0,
          })),
        }));

        setGroupedOrders(groupedData.reverse());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCarriers = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/order/carriers`,
        { headers: { token } }
      );
      if (response.data.success) {
        setCarriers(response.data.carriers);
      }
    } catch (error) {
      toast.error('Failed to fetch carriers');
      console.error(error);
    }
  };

  const addTracking = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/order/${selectedOrderForTracking.orderId}/tracking`,
        trackingForm,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success('Tracking added successfully');
        loadOrderData();
        setShowAddTrackingModal(false);
      }
    } catch (error) {
      toast.error('Failed to add tracking');
      console.error(error);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/order/cancel/${orderId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order canceled successfully!");
        setGroupedOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderId === orderId ? { ...order, status: "canceled" } : order
          )
        );
      } else {
        toast.error(response.data.message || "Failed to cancel the order.");
      }
    } catch (error) {
      console.error("Error canceling order:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while canceling the order."
      );
    }
  };

  const initiateReturn = async (orderId, itemId) => {
    try {
      setLoadingReturnId(itemId);
      
      const response = await axios.get(
        `${backendUrl}/api/returns/check-eligibility`,
        {
          params: { orderId, itemId },
          headers: { token },
        }
      );
      
      if (response.data.eligible) {
        navigate(`/return-product/${orderId}/${itemId}`, { 
          state: { 
            orderDetails: {
              ...response.data.orderDetails,
              itemDetails: response.data.orderDetails.items.find(item => 
                item._id.toString() === itemId || item.productId.toString() === itemId
              ),
              orderId: orderId
            }
          }
        });
      } else {
        toast.error(
          response.data.message || "This item is not eligible for return"
        );
      }
    } catch (error) {
      console.error("Error checking return eligibility:", error);
      toast.error(
        error.response?.data?.message || 
        "Failed to initiate product return. Please try again."
      );
    } finally {
      setLoadingReturnId(null);
    }
  };

  const payNow = async (orderId) => {
    try {
      setLoadingOrderId(orderId);

      const response = await axios.get(
        `${backendUrl}/api/order/${orderId}/payment`,
        {
          headers: { token },
        }
      );

      setPaymentMethods(response.data.paymentMethods);
      setSelectedOrderId(orderId);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error initiating payment:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Fetch tracking information
  const getTrackingInfo = async (orderId) => {
    try {
      setLoadingTrackingId(orderId);
      const response = await axios.get(
        `${backendUrl}/api/order/${orderId}/tracking`,
        { headers: { token } }
      );

      if (response.data.success) {
        setTrackingInfo(response.data.tracking);
        setShowTrackingModal(true);
      }
    } catch (error) {
      console.error("Error fetching tracking info:", error);
      toast.error("Failed to get tracking information");
    } finally {
      setLoadingTrackingId(null);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(price);
  };

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

  useEffect(() => {
    loadOrderData();
    fetchCarriers();
  }, [token, region]);

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "To Pay" },
    { id: "cod", label: "COD" },
    { id: "packing", label: "To Ship" },
    { id: "shipped", label: "To Receive" },
    { id: "delivered", label: "Completed" },
    { id: "canceled", label: "Cancelled" },
  ];

  const getFilteredOrders = () => {
    if (activeTab === "all") {
      return groupedOrders;
    } else if (activeTab === "pending") {
      return groupedOrders.filter(
        (order) =>
          (!order.payment || order.status?.toLowerCase() === "pending") &&
          order.paymentMethod?.toLowerCase() !== "cod" &&
          order.status?.toLowerCase() !== "canceled"
      );
    } else if (activeTab === "cod") {
      return groupedOrders.filter(
        (order) =>
          order.paymentMethod?.toLowerCase() === "cod" &&
          order.status?.toLowerCase() !== "delivered" &&
          order.status?.toLowerCase() !== "canceled"
      );
    } else if (activeTab === "packing") {
      return groupedOrders.filter(
        (order) => order.status?.toLowerCase() === "packing"
      );
    } else if (activeTab === "shipped") {
      return groupedOrders.filter(
        (order) =>
          order.status?.toLowerCase() === "shipped" ||
          order.status?.toLowerCase() === "out for delivery"
      );
    } else if (activeTab === "returned") {
      return groupedOrders.filter((order) =>
        order.items.some(
          (item) => item.returnStatus && item.returnStatus !== "none"
        )
      );
    } else {
      return groupedOrders.filter(
        (order) => order.status?.toLowerCase() === activeTab
      );
    }
  };

  const filteredOrders = getFilteredOrders();

  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "delivered":
        return "text-green-600 font-medium";
      case "canceled":
      case "returned":
        return "text-red-600 font-medium";
      case "shipped":
      case "out for delivery":
        return "text-blue-600 font-medium";
      case "packing":
        return "text-amber-600 font-medium";
      default:
        return "text-gray-600 font-medium";
    }
  };

  const getReturnStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "rejected":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const needsPayment = (order) => {
    const statusLower = order.status?.toLowerCase() || "";
    const paymentMethod = order.paymentMethod?.toLowerCase() || "";

    return (
      (statusLower === "pending" || !order.payment) &&
      paymentMethod !== "cash on delivery" &&
      paymentMethod !== "cod" &&
      statusLower !== "delivered" &&
      statusLower !== "canceled" &&
      statusLower !== "returned"
    );
  };

  const hasTracking = (order) => {
    return order.tracking && order.tracking.trackingNumber;
  };

  const canAddTracking = (order) => {
    return (
      order.status?.toLowerCase() === "packing" ||
      order.status?.toLowerCase() === "shipped" ||
      order.status?.toLowerCase() === "out for delivery"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-t pt-6 md:px-[7vw] px-4 pb-16">
        <div className="mb-6">
          <Title text1={"MY"} text2={"ORDERS"} />
        </div>

        {/* Order Status Tabs */}
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

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
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
                {/* Order Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order ID: {order.orderId}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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

                {/* Order Items */}
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col px-6 py-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          className="object-cover w-16 h-16 rounded"
                          src={item.image[0]}
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

                          {item.variationDetails &&
                            item.variationDetails.length > 0 && (
                              <div className="mt-1 text-xs text-gray-500">
                                {item.variationDetails.map((variation, idx) => (
                                  <span key={idx} className="mr-2">
                                    {variation.variationName}:{" "}
                                    {variation.optionName}
                                  </span>
                                ))}
                              </div>
                            )}

                          {item.returnStatus &&
                            item.returnStatus !== "none" && (
                              <div className="mt-2">
                                <span
                                  className={`inline-block px-2 py-1 text-xs font-medium border rounded ${getReturnStatusStyle(
                                    item.returnStatus
                                  )}`}
                                >
                                  Return {item.returnStatus}
                                </span>
                              </div>
                            )}
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

                {/* Order Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.paymentMethod?.toLowerCase() ===
                        "cash on delivery" ? (
                          <span className="flex items-center">
                            <span className="inline-block w-2 h-2 mr-2 bg-orange-500 rounded-full"></span>
                            Cash On Delivery
                          </span>
                        ) : (
                          <span>
                            {order.payment
                              ? "Payment Complete"
                              : "Payment Pending"}{" "}
                            • {order.paymentMethod}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Payment:</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatPrice(order.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-3 mt-4">
                    {order.status?.toLowerCase() === "delivered" && (
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex gap-2">
                            <button
                              className="px-4 py-2 text-xs font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                              onClick={() =>
                                navigate(`/product/${item._id}?review=true`)
                              }
                            >
                              Review Product
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Tracking Button - only for admin */}
                    {token && token.role === "admin" && canAddTracking(order) && !hasTracking(order) && (
                      <button
                        onClick={() => {
                          setSelectedOrderForTracking(order);
                          setShowAddTrackingModal(true);
                        }}
                        className="flex items-center px-4 py-2 text-xs font-medium text-white transition-colors bg-green-600 rounded hover:bg-green-700"
                      >
                        <FiPlus className="mr-1" />
                        Add Tracking
                      </button>
                    )}

                    {/* Track Order Button - only if order has tracking */}
                    {hasTracking(order) && (
                      <button
                        onClick={() => getTrackingInfo(order.orderId)}
                        className="flex items-center px-4 py-2 text-xs font-medium text-white transition-colors bg-indigo-600 rounded hover:bg-indigo-700"
                        disabled={loadingTrackingId === order.orderId}
                      >
                        <FiTruck className="mr-1" />
                        {loadingTrackingId === order.orderId ? "Loading..." : "Track Order"}
                      </button>
                    )}

                    {needsPayment(order) && (
                      <button
                        onClick={() => payNow(order.orderId)}
                        className="px-4 py-2 text-xs font-medium text-white transition-colors bg-orange-600 rounded hover:bg-orange-700"
                        disabled={loadingOrderId === order.orderId}
                      >
                        {loadingOrderId === order.orderId
                          ? "Loading..."
                          : "Pay Now"}
                      </button>
                    )}

                    {![
                      "delivered",
                      "canceled",
                      "shipped",
                      "out for delivery",
                    ].includes(order.status.toLowerCase()) && (
                      <button
                        className="px-4 py-2 text-xs font-medium transition-colors border border-gray-300 rounded hover:bg-gray-100"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to cancel this order?"
                            )
                          ) {
                            cancelOrder(order.orderId);
                          }
                        }}
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

      {/* Tracking Modal */}
      {showTrackingModal && trackingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Order Tracking</h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingInfo(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tracking Number:</span>
                  <span className="font-mono">{trackingInfo.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Carrier:</span>
                  <span>{trackingInfo.carrierCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <span className="capitalize font-medium text-blue-600">
                    {trackingInfo.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {trackingInfo.events?.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Tracking History</h4>
                  <div className="relative">
                    <div className="absolute left-4 h-full w-0.5 bg-gray-200 -translate-x-1/2"></div>
                    <div className="space-y-4">
                      {trackingInfo.events.map((event, index) => (
                        <div key={index} className="relative pl-8">
                          <div className="absolute left-4 w-3 h-3 bg-blue-500 rounded-full -translate-x-1/2"></div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">{event.description}</p>
                            <p className="text-sm text-gray-500">
                              <FiMapPin className="inline mr-1" />
                              {event.location}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(event.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No tracking updates available yet
                </div>
              )}

              <div className="mt-6">
                <a
                  href={trackingInfo.trackingUrl || `https://trackingmore.com/tracking.php?nums=${trackingInfo.trackingNumber}&courier=${trackingInfo.carrierCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-2 text-center text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  View Full Tracking Details
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracking Modal */}
      {showAddTrackingModal && selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Tracking Information</h3>
              <button
                onClick={() => {
                  setShowAddTrackingModal(false);
                  setSelectedOrderForTracking(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={trackingForm.carrierCode}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    carrierCode: e.target.value
                  })}
                >
                  <option value="">Select Carrier</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name} ({carrier.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Tracking Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    trackingNumber: e.target.value
                  })}
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddTrackingModal(false);
                    setSelectedOrderForTracking(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTracking}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700"
                  disabled={!trackingForm.carrierCode || !trackingForm.trackingNumber}
                >
                  Add Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;