import React, { useState, useEffect, useRef } from "react";
import { backendUrl } from "../../../admin/src/App";
import { Send, X, Trash2 } from "lucide-react";

const AIPopup = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const clearChat = () => {
    setResponses([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    setResponses((prev) => [
      ...prev,
      { user: message, ai: null, timestamp: new Date(), expanded: false },
    ]);
    setIsLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message }),
      });

      const rawResponse = await res.text();
      const data = JSON.parse(rawResponse);

      setResponses((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? {
                ...msg,
                ai: data?.response || "No AI response",
                timestamp: new Date(),
                expanded: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error("❌ API error:", error);
      setResponses((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, ai: "Error connecting to AI", timestamp: new Date(), expanded: false }
            : msg
        )
      );
    }

    setMessage("");
    setIsLoading(false);
  };

  const toggleExpand = (index) => {
    setResponses((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, expanded: !msg.expanded } : msg
      )
    );
  };

  return (
    <div
      className={`fixed bottom-20 md:right-20 sm:right-0 w-[400px] bg-white shadow-2xl rounded-3xl border border-gray-200 p-4 flex flex-col space-y-4 z-50 transition-all duration-300 transform ${
        isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-5 pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <span className="text-lg font-semibold text-gray-900">AI Assistant</span>
        <div className="flex space-x-3">
          <button
            className="text-gray-500 transition hover:text-blue-500"
            onClick={clearChat}
            title="Clear Chat"
          >
            <Trash2 size={20} />
          </button>
          <button
            className="text-gray-500 transition hover:text-red-500"
            onClick={onClose}
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow p-2 space-y-3 overflow-y-auto bg-gray-100 rounded-lg shadow-inner max-h-72 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {responses.map((msg, index) => (
          <div key={index} className="flex flex-col space-y-2">
            {/* User Message */}
            {msg.user && (
              <div className="flex justify-end">
                <div className="max-w-xs px-4 py-2 text-sm text-white bg-gray-500 shadow-md rounded-2xl">
                  <p className="whitespace-pre-wrap">{msg.user}</p>
                  <div className="mt-1 text-xs text-right text-gray-200">
                    {msg.timestamp?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

            {/* AI Response */}
            {msg.ai && (
              <div className="flex justify-start">
                <div className="max-w-xs px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 shadow-md rounded-2xl">
                  <p className="overflow-hidden whitespace-pre-wrap" style={{ maxHeight: msg.expanded || !msg.ai.includes("🌐 More Info:") ? "none" : "60px" }}>
                    {msg.ai}
                  </p>
                  {!msg.expanded && msg.ai.includes("🌐 More Info:") && (
                    <button
                      className="mt-1 text-xs text-blue-500"
                      onClick={() => toggleExpand(index)}
                    >
                      More
                    </button>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {msg.timestamp?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form className="flex items-center overflow-hidden border border-gray-300 rounded-full shadow-md" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-3 text-gray-800 bg-white border-none rounded-l-full outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="Type your question..."
          required
        />
        <button
          type="submit"
          className="flex items-center justify-center p-3 text-white transition bg-black rounded-r-full hover:bg-gray-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
};

export default AIPopup;