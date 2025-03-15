import React, { useContext, useEffect, useState, useLayoutEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../css/Order.css';
import Lenis from 'lenis';
const Orders = () => {
  const { backendUrl, token, currency, region, regions } = useContext(ShopContext);
  const [groupedOrders, setGroupedOrders] = useState([]);

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

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
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
        toast.success('Order canceled successfully!');
        // Remove the canceled order from the local state
        setGroupedOrders((prevOrders) =>
          prevOrders.filter((order) => order.orderId !== orderId)
        );
      } else {
        toast.error(response.data.message || 'Failed to cancel the order.');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error(error.response?.data?.message || 'An error occurred while canceling the order.');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(price);
  };

  useEffect(() => {
    loadOrderData();
  }, [token, region]);

  return (
    <div className="border-t pt-[7%] md:px-[7vw] px-4">
      <div className="text-2xl">
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

      <div>
        {groupedOrders.map((order) => {
          // Calculate the total amount for the entire order including the shipping fee
          const totalAmount = order.items.reduce((total, item) => {
            const itemTotal = (item.price * item.quantity) * (1 - (item.discount || 0) / 100);
            return total + itemTotal;
          }, 0);

          return (
            <div key={order.orderId} className="mb-8">
              <div className="py-4 text-gray-700 border-t border-b">
                <p className="text-lg font-semibold">
                  Order ID: {order.orderId}
                </p>
                <p className="mt-2">
                  Date: <span className="text-gray-400">{new Date(order.date).toDateString()}</span>
                </p>
                <p className="mt-2">
                  Payment Method: <span className="text-gray-400">{order.paymentMethod}</span>
                </p>
                <p className="mt-2">
                  Shipping Fee: <span className="text-gray-400">{formatPrice(order.shippingFee)}</span>
                </p>
                <p className="mt-2">
                  Status: <span className="text-gray-400">{order.status}</span>
                </p>
                <p className="mt-2">
                  Total Amount: <span className="text-gray-400">{formatPrice(order.amount)}</span>
                </p>
              </div>

              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-4 py-4 text-gray-700 border-b md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-6 text-sm">
                    <img className="w-16 sm:w-20" src={item.image[0]} alt={item.name} />
                    <div>
                      <p className="font-medium sm:text-base">{item.name}</p>
                      <div className="flex items-center gap-3 mt-2 text-base text-gray-700">
                        <p className="text-lg">
                          {formatPrice(item.price)}
                        </p>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <p className="mt-2">
                        Discount: <span className="text-green-500">-{item.discount || 0}%</span>
                      </p>
                      <p className="mt-2">
                        Total: <span className="text-gray-400">
                          {formatPrice(
                            (item.price * item.quantity) * (1 - (item.discount || 0) / 100)
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end mt-4">
                {order.status !== 'Delivered' && order.status !== 'Canceled' && order.status !== 'Packing' && order.status !== 'Shipped' && order.status !== 'Out for delivery' && (
                  <button
                    className="px-4 py-2 text-sm font-medium border rounded-sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this order?')) {
                        cancelOrder(order.orderId);
                      }
                    }}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
