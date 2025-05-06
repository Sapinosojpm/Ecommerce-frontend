import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-toastify';
import "../css/OrderNotification.css"; // Import your CSS file for styling
const OrderNotification = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order) => {
      toast.info(`New order received: #${order.orderNumber}`);
      setNotifications(prev => [...prev, order]);
      
      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n._id !== order._id));
      }, 5000);
    };

    socket.on('newOrderAdmin', handleNewOrder);

    return () => {
      socket.off('newOrderAdmin', handleNewOrder);
    };
  }, [socket]);

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <div key={notification._id} className="order-notification">
          <h4>New Order #{notification.orderNumber}</h4>
          <p>Total: ${notification.totalAmount}</p>
          <p>Items: {notification.items.length}</p>
        </div>
      ))}
    </div>
  );
};

export default OrderNotification;