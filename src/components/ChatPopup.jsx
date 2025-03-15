import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { assets } from "../assets/assets";

const ChatPopup = ({ isOpen, onClose }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleChat = () => {
    onClose(); // Close the popup when the "X" is clicked
    setFormSubmitted(false); // Reset form when closing
  };

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
      setFormSubmitted(true); // Set formSubmitted to true after success
    } else {
      toast.error("Failed to send email. Please try again.");
    }
  };

  return (
    <div>
      <ToastContainer />
      {isOpen && (
        <div className="fixed bottom-16 right-20 w-80 bg-white shadow-lg rounded-lg z-50 border border-green-700  transition-all duration-300 transform scale-100 hover:scale-105">
          <div className="flex justify-between items-center p-4 bg-green-700 text-white rounded-t-lg">
            <span className="font-semibold text-lg">Contact Form</span>
            <button onClick={toggleChat} className="text-xl font-bold text-white hover:text-gray-300">X</button>
          </div>

          {!formSubmitted ? (
            <form onSubmit={onSubmit} className="p-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="w-full p-3 mb-3 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="w-full p-3 mb-3 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                required
              />
              <textarea
                name="message"
                placeholder="Your Message"
                className="w-full p-3 mb-3 border border-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                required
              ></textarea>
              <button
                type="submit"
                className="w-full p-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-all duration-300"
              >
                Submit Form
              </button>
            </form>
          ) : (
            <div className="p-4 text-center text-green-700">
              <p className="font-semibold">Thank you for your message!</p>
              <button
                onClick={toggleChat}
                className="mt-4 py-2 px-4 bg-green-700 text-white rounded-full hover:bg-green-800 transition-all duration-300"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPopup;
