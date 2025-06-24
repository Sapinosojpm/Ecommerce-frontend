import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiX } from "react-icons/fi";

const ChatPopup = ({ isOpen, onClose, embedded = false }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
      setTimeout(() => setShowSuccess(true), 200);
    } else {
      toast.error("Failed to send email. Please try again.");
    }
  };

  const handleSendAnother = () => {
    setFormSubmitted(false);
    setShowSuccess(false);
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
                className="w-full p-3 text-white transition-all duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
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
          <div className="fixed z-50 right-8 bottom-16 md:right-24 w-[400px] max-w-full transition-all duration-300">
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 p-0 overflow-hidden animate-fadeIn">
              {/* Floating Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 text-gray-400 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
              <div className="px-8 pt-8 pb-8">
                <h2 className="mb-7 text-2xl font-bold text-center text-gray-800 tracking-tight">Product Inquiry</h2>
                {!formSubmitted ? (
                  <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Your Email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Your Message</label>
                      <textarea
                        name="message"
                        placeholder="Type your message..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        rows={4}
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full p-3 text-white font-semibold transition-all duration-300 bg-blue-600 rounded-lg hover:bg-blue-700 shadow"
                    >
                      Submit Inquiry
                    </button>
                  </form>
                ) : (
                  <div className={`flex flex-col items-center justify-center py-12 px-2 rounded-2xl transition-all duration-300 ${showSuccess ? 'bg-green-50 animate-fadeIn' : ''}`}>
                    <svg className={`mb-4 w-16 h-16 text-green-500 ${showSuccess ? 'animate-checkmark' : ''}`} viewBox="0 0 52 52"><circle className="text-green-100" cx="26" cy="26" r="25" fill="currentColor" /><path fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M14 27l7 7 17-17"/></svg>
                    <p className="mb-2 text-xl font-semibold text-green-700">Thank you!</p>
                    <p className="mb-4 text-gray-700">Your inquiry has been sent.</p>
                    <button onClick={handleSendAnother} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">Send another inquiry</button>
                  </div>
                )}
              </div>
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
              .animate-fadeIn { animation: fadeIn 0.5s ease; }
              @keyframes checkmark { 0% { stroke-dashoffset: 48; opacity: 0; } 40% { opacity: 1; } 100% { stroke-dashoffset: 0; opacity: 1; } }
              .animate-checkmark path { stroke-dasharray: 48; stroke-dashoffset: 48; animation: checkmark 0.7s 0.1s cubic-bezier(.65,.05,.36,1) forwards; }
            `}</style>
          </div>
        )
      )}
    </div>
  );
};

export default ChatPopup;
