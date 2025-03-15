import React, { useState, useEffect } from "react";
import axios from "axios";

const backendUrl =import.meta.env.VITE_BACKEND_URL;
const FAQPage = ({ isOpen, onClose }) => {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Fetch FAQs from the backend when the component loads
  useEffect(() => {
    if (isOpen) {
      const fetchFAQs = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/faqs`);
          setFaqs(response.data); // Store fetched FAQs in the state
        } catch (error) {
          console.error("Error fetching FAQs", error);
        }
      };

      fetchFAQs();
    }
  }, [isOpen]); // Fetch FAQs again when the popup opens

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="relative w-11/12 max-w-3xl p-6 bg-white rounded-lg shadow-lg outline outline-2 outline-gray-400">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-xl text-gray-600 top-2 right-2 hover:text-gray-800"
        >
          &times;
        </button>
        <h1 className="mb-8 text-3xl font-bold text-center text-gray-800">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-4 bg-white border border-gray-300 rounded-lg shadow-md"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <h3 className="text-lg font-medium text-gray-800">{faq.question}</h3>
                <span
                  className={`text-xl font-bold transition-transform ${
                    activeIndex === index ? "rotate-180" : "rotate-0"
                  }`}
                >
                  {activeIndex === index ? "-" : "+"}
                </span>
              </div>
              {activeIndex === index && (
                <p className="mt-4 text-gray-600 whitespace-pre-line">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
