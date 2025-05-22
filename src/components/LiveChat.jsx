import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { io } from "socket.io-client";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
const backend = import.meta.env.VITE_BACKEND_URL;
const LiveChatPopup = ({ isOpen, onClose }) => {
  const { token, user } = React.useContext(ShopContext);
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!socket || !user) return;

    // Listen for admin messages
    socket.on("admin-message", (newMessage) => {
      setConversation((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.off("admin-message");
    };
  }, [socket, user]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      setIsLoading(true);
      const res = await axios.post(`${backend}/api/chat/initiate`, {
        initialMessage: message,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAdminId(res.data.recipient);
      setConversation((prev) => [...prev, res.data]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConversation = async () => {
    if (!adminId) return;
    try {
      const res = await axios.get(`${backend}/api/chat/conversation/${adminId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConversation(res.data);
    } catch (err) {
      console.error("Error fetching conversation:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-50 w-full max-w-md p-4 bg-white rounded-lg shadow-xl bottom-20 right-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Chat Support</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
          <img src={assets.close_icon} alt="Close" className="w-5 h-5" />
        </button>
      </div>

      <div className="h-64 mb-4 overflow-y-auto">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <img src={assets.message} alt="Chat" className="w-16 h-16 mb-2 opacity-30" />
            <p>Start a conversation with our support team</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.isAdminMessage ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg ${msg.isAdminMessage ? "bg-gray-100" : "bg-blue-500 text-white"}`}
                >
                  <p>{msg.message}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </form>
    </motion.div>
  );
};

export default LiveChatPopup;