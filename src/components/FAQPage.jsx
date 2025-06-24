import React, { useState, useEffect } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
      <div className="relative w-11/12 max-w-2xl p-0 animate-fadeIn">
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 px-8 pt-8 pb-8">
          {/* Floating Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 bg-gray-100 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 z-10"
            aria-label="Close"
          >
            <span className="text-2xl">&times;</span>
          </button>
          <h1 className="mb-8 text-3xl font-bold text-center text-gray-800 tracking-tight">
            Frequently Asked Questions
          </h1>
          <div className="space-y-5">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                  <span
                    className={`text-2xl font-bold transition-transform ${
                      activeIndex === index ? "rotate-180 text-blue-600" : "rotate-0 text-gray-400"
                    }`}
                  >
                    {activeIndex === index ? "-" : "+"}
                  </span>
                </div>
                {activeIndex === index && (
                  <p className="mt-4 text-gray-700 whitespace-pre-line transition-all duration-200">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
          .animate-fadeIn { animation: fadeIn 0.5s ease; }
        `}</style>
      </div>
    </div>
  );
};

export default FAQPage;
