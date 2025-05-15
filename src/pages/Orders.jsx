import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import { toast } from "react-toastify";
import "../css/Order.css";
import Lenis from "lenis";
import { useNavigate } from "react-router-dom";
import { FiRotateCw } from 'react-icons/fi';

const Orders = () => {
  const { backendUrl, token, currency, region, regions } =
    useContext(ShopContext);
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loadingOrderId, setLoadingOrderId] = useState(null);
const [loadingReturnId, setLoadingReturnId] = useState(null);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentMethods, setPaymentMethods] = useState([]);
const [selectedOrderId, setSelectedOrderId] = useState(null);


  // scroll effect
  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true, // Enables smooth scrolling
      duration: 1.2, // Adjust smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural easing effect
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
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

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/order/cancel/${orderId}`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("Order canceled successfully!");
        // Remove the canceled order from the local state
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
    
    // First check if return is eligible
    const response = await axios.get(
      `${backendUrl}/api/returns/check-eligibility`,
      {
        params: { orderId, itemId },
        headers: { token },
      }
    );
    
    if (response.data.eligible) {
      // Navigate to return form page with item details
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

  // In Orders.jsx, add a payNow function
  const payNow = async (orderId) => {
    try {
      setLoadingOrderId(orderId);

      // Get payment methods available for this order
      const response = await axios.get(
        `${backendUrl}/api/order/${orderId}/payment`,
        {
          headers: { token },
        }
      );

      // Show payment method selection modal
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PHP",
    }).format(price);
  };

  useEffect(() => {
    loadOrderData();
  }, [token, region]);

  // Define tabs for different order statuses
  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "To Pay" },
    { id: "cod", label: "COD" },
    { id: "packing", label: "To Ship" },
    { id: "shipped", label: "To Receive" },
    { id: "delivered", label: "Completed" },
    { id: "canceled", label: "Cancelled" },
    { id: "returned", label: "Returns" },
  ];

  // Filter orders based on active tab
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
}
 else if (activeTab === "cod") {
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

  // Group orders by date
  const groupOrdersByDate = (orders) => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    orders.forEach((order) => {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);

      let groupKey;

      if (orderDate.getTime() === today.getTime()) {
        groupKey = "Today";
      } else if (orderDate.getTime() === yesterday.getTime()) {
        groupKey = "Yesterday";
      } else if (orderDate >= lastWeekStart && orderDate < yesterday) {
        groupKey = "This Week";
      } else if (orderDate >= lastMonthStart && orderDate < lastWeekStart) {
        groupKey = "This Month";
      } else {
        // Format as Month Year for older orders
        groupKey = orderDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(order);
    });

    return groups;
  };

  const ordersGroupedByDate = groupOrdersByDate(filteredOrders);

  // Calculate days since delivery for return eligibility
  const getDaysSinceDelivery = (deliveryDate) => {
    if (!deliveryDate) return null;
    const delivered = new Date(deliveryDate);
    const today = new Date();
    const diffTime = Math.abs(today - delivered);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Check if an item is eligible for return (within 7 days of delivery)
  const isEligibleForReturn = (order) => {
    // If the order isn't delivered yet, it's not eligible for return
    if (order.status?.toLowerCase() !== "delivered") return false;

    // Get the delivery date (you might need to adjust this based on your data structure)
    const deliveryDate = new Date(order.deliveredDate || order.date);
    const daysSinceDelivery = getDaysSinceDelivery(deliveryDate);

    // Returns are only eligible within 7 days of delivery
    return daysSinceDelivery !== null && daysSinceDelivery <= 7;
  };

  // Check if order requires payment (only truly pending orders)
  const needsPayment = (order) => {
    const statusLower = order.status?.toLowerCase() || "";
    const paymentMethod = order.paymentMethod?.toLowerCase() || "";

    // Only show Pay Now for pending orders or orders without payment
    // AND exclude any completed statuses (delivered, canceled, returned)
    return (
      (statusLower === "pending" || !order.payment) &&
      paymentMethod !== "cash on delivery" &&
      paymentMethod !== "cod" &&
      statusLower !== "delivered" &&
      statusLower !== "canceled" &&
      statusLower !== "returned"
    );
  };

  // Status style helper
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

  // Get return status style
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
                    {order.paymentMethod?.toLowerCase() === "COD" && (
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

                          {/* Return Status Badge */}
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
                  <div className="flex justify-end gap-3 mt-4">
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

                            {/* Return Product Button - only if eligible and not already returned */}
                           {isEligibleForReturn(order) &&
  (!item.returnStatus || item.returnStatus === "none") && (
    <button
      className="flex items-center px-4 py-2 text-xs font-medium text-red-600 transition-colors bg-white border border-red-600 rounded hover:bg-red-50"
      onClick={() => initiateReturn(order.orderId, item._id)}
      disabled={loadingReturnId === item._id}
    >
      {loadingReturnId === item._id ? (
        <>
          <svg className="w-3 h-3 mr-1 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        <>
          <FiRotateCw className="mr-1" />
          Return Product
        </>
      )}
    </button>
  )}
                          </div>
                        ))}
                        <button className="px-4 py-2 text-xs font-medium text-blue-600 transition-colors bg-white border border-blue-600 rounded hover:bg-blue-50">
                          Buy Again
                        </button>
                      </div>
                    )}

                    {order.status?.toLowerCase() === "shipped" && (
                      <button className="px-4 py-2 text-xs font-medium text-white transition-colors bg-green-600 rounded hover:bg-green-700">
                        Track Order
                      </button>
                    )}

                    {/* Modified Pay Now button condition using the needsPayment helper */}
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
    </div>
  );
};

export default Orders;
