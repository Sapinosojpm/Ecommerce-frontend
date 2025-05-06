import React, { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChatPopup = ({ isOpen, onClose, embedded = false }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);

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
      toast.error("Failed to send email. Please try again.");
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
              <span className="text-lg font-semibold">Product Inquiry</span>
              <button
                onClick={onClose}
                className="text-xl font-bold text-white hover:text-gray-300"
              >
                X
              </button>
            </div>

            {!formSubmitted ? (
              <form onSubmit={onSubmit} className="p-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  className="w-full p-3 mb-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  className="w-full p-3 mb-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  required
                />
                <textarea
                  name="message"
                  placeholder="Your Message"
                  className="w-full p-3 mb-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
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
              <div className="p-4 text-center text-green-700">
                <p className="font-semibold">Thank you for your message!</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 mt-4 text-white transition-all duration-300 bg-green-700 rounded-full hover:bg-green-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default ChatPopup;
