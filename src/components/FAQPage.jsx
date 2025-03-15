import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../../../admin/src/App";

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
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-3xl outline outline-2 outline-gray-400 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-xl text-gray-600 hover:text-gray-800"
        >
          &times;
        </button>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 bg-white shadow-md"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
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
