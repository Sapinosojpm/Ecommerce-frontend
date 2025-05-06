import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";

const LiveChat = ({ isOpen, onClose, embedded = false }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen && !embedded) return;

    const token = localStorage.getItem('token');
    const newSocket = io(process.env.VITE_BACKEND_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      if (token) {
        newSocket.emit('authenticate', token);
      }
    });

    newSocket.on('admin-status', (status) => {
      setAdminOnline(status === 'online');
    });

    newSocket.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('admin-typing', (typing) => {
      setAdminTyping(typing);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isOpen, embedded]);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected) return;

    const userId = localStorage.getItem('userId'); // Or get from your auth context
    if (!userId) {
      toast.error("You need to be logged in to send messages");
      return;
    }

    const message = {
      sender: userId,
      recipient: 'admin',
      text: newMessage,
      timestamp: new Date().toISOString(),
      isAdmin: false
    };

    socket.emit('chat-message', message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && isConnected) {
      socket.emit('user-typing', e.target.value.length > 0);
    }
  };

  // Handle form submission for product inquiry
  const onSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append("access_key", "7feaae05-6625-41ee-9377-e094cbf9a2cd");

    const object = Object.fromEntries(formData);
    const json = JSON.stringify(object);

    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: json,
    }).then((res) => res.json());

    if (res.success) {
      setFormSubmitted(true);
    } else {
      toast.error("Failed to send inquiry. Please try again.");
    }
  };

  return (
    <div>
      <ToastContainer />

      {/* ✅ Embedded Mode */}
      {embedded ? (
        <div className="p-8 rounded-lg shadow-md bg-gray-20 ">
          <h2 className="mb-4 text-2xl font-bold text-center text-gray-800">
            Product Inquiry
          </h2>

          {!formSubmitted ? (
            <form onSubmit={onSubmit} className="max-w-lg mx-auto">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                cols="40"
                rows="10"
                required
              ></textarea>
              <button
                type="submit"
                className="w-full p-3 text-white transition-all duration-300 bg-black rounded-lg hover:bg-gray-800"
              >
                Submit Form
              </button>
            </form>
          ) : (
            <div className="text-center text-green-700">
              <p className="font-semibold">Thank you for your message!</p>
            </div>
          )}
        </div>
      ) : (
        // ✅ Popup Mode
        isOpen && (
          <div className="fixed z-50 transition-all duration-300 bg-white border border-gray-700 rounded-lg shadow-lg right-12 bottom-16 md:right-24 w-80 hover:scale-105">
            <div className="flex items-center justify-between p-4 text-white bg-gray-700 rounded-t-lg">
              <div className="flex items-center">
                <span className="text-lg font-semibold">Customer Support</span>
                {adminOnline && (
                  <span className="inline-block w-2 h-2 ml-2 bg-green-500 rounded-full"></span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-xl font-bold text-white hover:text-gray-300"
              >
                X
              </button>
            </div>

            <div className="flex flex-col h-96">
              {/* Chat messages */}
              <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    {adminOnline 
                      ? "Send a message to start chatting" 
                      : "Our support team is currently offline. Leave a message and we'll get back to you."}
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-2 flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs p-2 rounded-lg ${
                          msg.isAdmin
                            ? 'bg-gray-200 text-gray-800'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {adminTyping && (
                  <div className="flex justify-start mb-2">
                    <div className="p-2 text-gray-800 bg-gray-200 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-r-lg hover:bg-blue-600 disabled:bg-gray-400"
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default LiveChat;
