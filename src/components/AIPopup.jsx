import React, { useState, useEffect, useRef } from "react";
import { backendUrl } from "../../../admin/src/App";
import { Send, X } from "lucide-react";

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
      { user: message, ai: null, timestamp: new Date() },
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
              }
            : msg
        )
      );
    } catch (error) {
      console.error("❌ API error:", error);
      setResponses((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, ai: "Error connecting to AI", timestamp: new Date() }
            : msg
        )
      );
    }

    setMessage("");
    setIsLoading(false);
  };

  return (
    <div
      className={`shadow-2xl fixed bottom-40 right-20 w-[380px] bg-white shadow-xl rounded-2xl border border-gray-300 p-4 flex flex-col space-y-4 z-50 transition-all duration-300 transform ${
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5 pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b">
        <span className="text-lg font-semibold text-gray-900">AI Assistant</span>
        <div className="flex space-x-3">
          <button className="text-gray-600 hover:text-blue-500 transition" onClick={clearChat}>
            Clear
          </button>
          <button className="text-gray-600 hover:text-red-500 transition" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto space-y-2 max-h-64 p-2 bg-gray-50 rounded-lg shadow-inner">
        {responses.map((msg, index) => (
          <div key={index} className="flex flex-col space-y-2">
            {msg.user && (
              <div className="flex justify-end">
                <div className="bg-green-500 text-white px-4 py-2 rounded-xl max-w-xs text-sm shadow-md">
                  {msg.user}
                  <div className="text-xs text-gray-200 text-right">{msg.timestamp?.toLocaleTimeString()}</div>
                </div>
              </div>
            )}
            {msg.ai && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-xl max-w-xs text-sm shadow-md text-gray-900">
                  {msg.ai}
                  <div className="text-xs text-gray-500">{msg.timestamp?.toLocaleTimeString()}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form className="flex items-center border rounded-full overflow-hidden shadow-md" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-grow p-3 outline-none text-gray-800 border-none bg-white rounded-l-full"
          placeholder="Ask something..."
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white p-3 flex items-center justify-center hover:bg-green-600 transition rounded-r-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  );
};

export default AIPopup;
