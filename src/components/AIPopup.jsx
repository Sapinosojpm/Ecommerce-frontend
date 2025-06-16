import React, { useState, useEffect, useRef, useContext } from "react";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import { Send, X, Trash2, Code, Copy, Check, Settings, ShoppingCart, Heart, Share2, Sparkles, MessageSquare, Search, Star, Plus, Sun, Moon } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ShopContext } from "../context/ShopContext";
import { WishlistContext } from "../context/WishlistContext";
import { toast } from "react-toastify";

const AIPopup = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [selectedProductForVariation, setSelectedProductForVariation] = useState(null);

  // Get context values
  const { addToCart, getCartCount } = useContext(ShopContext);
  const { wishlist, toggleWishlist } = useContext(WishlistContext);

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
    setSearchResults([]);
    setSelectedProduct(null);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // You can also update a global theme state here if needed
  };

  const handleAddToCart = (product) => {
    if (!product || !product.id) {
      console.error("Invalid product:", product);
      toast.error("Cannot add invalid product to cart");
      return;
    }
    console.log("Adding to cart:", { productId: product.id, product });
    addToCart(product.id, 1);
  };

  const handleToggleWishlist = (product) => {
    toggleWishlist(product.id);
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    console.log("Sending message:", message);
    setResponses((prev) => [
      ...prev,
      { user: message, ai: null, timestamp: new Date(), expanded: false },
    ]);
    setIsLoading(true);

    try {
      console.log("Making API request to:", `${backendUrl}/api/chat`);
      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: message,
          isFirstInteraction: responses.length === 0
        }),
      });

      console.log("Response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const rawResponse = await res.text();
      console.log("Raw response:", rawResponse);

      let data;
      try {
        data = JSON.parse(rawResponse);
        console.log("Parsed response data:", data);
        
        // Update search results if products are found
        if (data.products && Array.isArray(data.products)) {
          setSearchResults(data.products);
          console.log("Products found:", data.products.length);
        } else {
          setSearchResults([]);
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        throw new Error("Invalid response format from server");
      }

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
      console.error("❌ API error:", {
        message: error.message,
        stack: error.stack,
        type: error.name
      });
      
      setResponses((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { 
                ...msg, 
                ai: "I'm having trouble connecting to the AI service. Please try again in a moment.", 
                timestamp: new Date(), 
                expanded: false 
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setMessage("");
    }
  };

  const toggleExpand = (index) => {
    setResponses((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, expanded: !msg.expanded } : msg
      )
    );
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderCodeBlock = (text) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'javascript';
      const code = match[2];
      
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text.slice(lastIndex, match.index)}
          </p>
        );
      }

      // Add code block
      parts.push(
        <div key={`code-${match.index}`} className="relative my-2 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-200 text-sm">
            <span>{language}</span>
            <button
              onClick={() => copyToClipboard(code, match.index)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {copiedIndex === match.index ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem' }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text.slice(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  const WelcomeHeader = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center px-8 z-50">
      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-100">Welcome to AI Shopping Assistant</h2>
        <p className="text-gray-400">Your personal shopping companion powered by AI</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
             onClick={() => setMessage("Show me black joggers")}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <Search className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-gray-100 font-medium">Find Products</h3>
              <p className="text-sm text-gray-400">Search for specific items</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer group"
             onClick={() => setMessage("Recommend me some trending products")}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-gray-100 font-medium">Get Recommendations</h3>
              <p className="text-sm text-gray-400">Ask for personalized suggestions</p>
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        Try asking: "Show me black joggers" or "Find blue jeans under $50"
      </div>
    </div>
  );

  const handleVariationSelect = (product, variationName, option) => {
    setSelectedVariations(prev => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        [variationName]: {
          name: option.name,
          priceAdjustment: option.priceAdjustment || 0
        }
      }
    }));
  };

  const handleAddToCartWithVariations = (product) => {
    if (product.variations && product.variations.length > 0) {
      setSelectedProductForVariation(product);
      setShowVariationModal(true);
    } else {
      handleAddToCart(product);
    }
  };

  const getVariationPrice = (product) => {
    if (!product.variations || !selectedVariations[product.id]) return product.price;
    
    const variationAdjustment = Object.values(selectedVariations[product.id] || {}).reduce(
      (sum, opt) => sum + (opt.priceAdjustment || 0),
      0
    );
    
    return product.price + variationAdjustment;
  };

  const VariationModal = ({ product, onClose, onConfirm }) => {
    if (!product) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-[60]">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <div className={`relative w-[500px] ${
          isDarkMode ? "bg-gray-900" : "bg-white"
        } rounded-xl border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        } p-6 shadow-2xl`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}>Select Variations</h3>
            <button
              onClick={onClose}
              className={`p-2 ${
                isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              } transition-colors rounded-lg hover:bg-gray-800`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {product.variations?.map((variation) => (
              <div key={variation.name} className="space-y-2">
                <label className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}>
                  {variation.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variation.options.map((option) => {
                    const isSelected = selectedVariations[product.id]?.[variation.name]?.name === option.name;
                    return (
                      <button
                        key={option.name}
                        onClick={() => handleVariationSelect(product, variation.name, option)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isSelected
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : isDarkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        disabled={option.quantity <= 0}
                      >
                        {option.name}
                        {/* {option.priceAdjustment > 0 && ` (+$${option.priceAdjustment})`} */}
                        {option.quantity <= 0 && " (Out of Stock)"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode
                  ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(product);
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-sm text-white ${
                isDarkMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              } transition-colors`}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className={`relative w-[1200px] h-[700px] ${
          isDarkMode ? "bg-[#1E1E1E]" : "bg-white"
        } shadow-2xl rounded-2xl border ${
          isDarkMode ? "border-gray-800" : "border-gray-200"
        } p-6 flex flex-col space-y-4 transform transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDarkMode ? "border-gray-800" : "border-gray-200"
        }`}>
          <div className="flex items-center space-x-3">
            <Code className={isDarkMode ? "text-blue-500" : "text-blue-600"} size={24} />
            <span className={`text-xl font-semibold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}>AI Shopping Assistant</span>
            {getCartCount() > 0 && (
              <div className="flex items-center space-x-2 ml-4">
                <ShoppingCart className={isDarkMode ? "text-green-400" : "text-green-600"} size={20} />
                <span className={`text-sm ${
                  isDarkMode ? "text-green-400" : "text-green-600"
                }`}>{getCartCount()} items in cart</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              className={`p-2 ${
                isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              } transition-colors rounded-lg hover:bg-gray-800`}
              onClick={toggleTheme}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`p-2 ${
                isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              } transition-colors rounded-lg hover:bg-gray-800`}
              onClick={clearChat}
              title="Clear Chat"
            >
              <Trash2 size={20} />
            </button>
            {/* <button
              className={`p-2 ${
                isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"
              } transition-colors rounded-lg hover:bg-gray-800`}
              title="Settings"
            >
              <Settings size={20} />
            </button> */}
            <button
              className={`p-2 ${
                isDarkMode ? "text-gray-400 hover:text-red-400" : "text-gray-600 hover:text-red-600"
              } transition-colors rounded-lg hover:bg-gray-800`}
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 space-x-4">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col">
            <div className={`flex-grow p-2 space-y-4 overflow-y-auto ${
              isDarkMode ? "bg-[#1E1E1E]" : "bg-gray-50"
            } rounded-lg max-h-[500px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent`}>
              {responses.length === 0 ? (
                <WelcomeHeader />
              ) : (
                responses.map((msg, index) => (
                  <div key={index} className="flex flex-col space-y-3">
                    {/* User Message */}
                    {msg.user && (
                      <div className="flex justify-end">
                        <div className={`max-w-2xl px-4 py-2 text-sm ${
                          isDarkMode ? "text-gray-100 bg-blue-600" : "text-gray-900 bg-blue-500"
                        } shadow-lg rounded-2xl`}>
                          <p className="whitespace-pre-wrap">{msg.user}</p>
                          <div className={`mt-1 text-xs text-right ${
                            isDarkMode ? "text-blue-200" : "text-blue-100"
                          }`}>
                            {msg.timestamp?.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Response */}
                    {msg.ai && (
                      <div className="flex justify-start">
                        <div className={`max-w-2xl px-4 py-2 text-sm ${
                          isDarkMode ? "text-gray-100 bg-gray-800" : "text-gray-900 bg-gray-100"
                        } border ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        } shadow-lg rounded-2xl`}>
                          <div className="overflow-hidden" style={{ maxHeight: msg.expanded || !msg.ai.includes("🌐 More Info:") ? "none" : "60px" }}>
                            {renderCodeBlock(msg.ai)}
                          </div>
                          
                          {!msg.expanded && msg.ai.includes("🌐 More Info:") && (
                            <button
                              className={`mt-2 text-xs ${
                                isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                              }`}
                              onClick={() => toggleExpand(index)}
                            >
                              Show More
                            </button>
                          )}
                          <div className={`mt-2 text-xs ${
                            isDarkMode ? "text-gray-500" : "text-gray-600"
                          }`}>
                            {msg.timestamp?.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form className={`mt-4 flex items-center overflow-hidden border ${
              isDarkMode ? "border-gray-700" : "border-gray-300"
            } rounded-xl shadow-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`flex-grow p-4 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                } bg-transparent border-none rounded-l-xl outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode ? "placeholder-gray-500" : "placeholder-gray-400"
                }`}
                placeholder={responses.length === 0 ? "Try: 'Show me black joggers' or 'Find blue jeans'" : "Ask about products, sizes, colors, or anything else..."}
                required
              />
              <button
                type="submit"
                className={`flex items-center justify-center p-4 ${
                  isDarkMode ? "text-gray-100" : "text-white"
                } transition ${
                  isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                } rounded-r-xl disabled:opacity-50`}
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

          {/* Search Results Section */}
          <div className={`w-[400px] ${
            isDarkMode ? "bg-gray-800" : "bg-gray-50"
          } rounded-xl border ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          } p-4 flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}>Search Results</h3>
              {searchResults.length > 0 && (
                <span className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>
                  {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
            
            {searchResults.length > 0 ? (
              <div className="space-y-4 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {searchResults.map((product, index) => (
                  <div key={product.id || index} className={`${
                    isDarkMode ? "bg-gray-900" : "bg-white"
                  } rounded-lg p-4 border ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  } hover:border-blue-500 transition-colors`}>
                    <div className="flex space-x-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/96x96/374151/9CA3AF?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs ${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}>
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        } truncate`}>{product.name}</h4>
                        <p className={`text-sm ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        } line-clamp-2 mt-1`}>{product.description}</p>
                        
                        {/* Price and Discount */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${
                              isDarkMode ? "text-blue-400" : "text-blue-600"
                            }`}>${getVariationPrice(product)}</span>
                            {product.discount > 0 && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                {product.discount}% OFF
                              </span>
                            )}
                          </div>
                          {product.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className={`text-sm ${
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }`}>{product.rating}</span>
                              <span className={`text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-600"
                              }`}>({product.totalReviews})</span>
                            </div>
                          )}
                        </div>

                        {/* Category */}
                        <div className="mt-2">
                          <span className={`text-xs ${
                            isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                          } px-2 py-1 rounded-full`}>
                            {product.category}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-3">
                          <button 
                            onClick={() => handleAddToCartWithVariations(product)}
                            className={`flex-1 ${
                              isDarkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                            } text-white py-1.5 px-3 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1`}
                          >
                            <ShoppingCart size={14} />
                            <span>Add to Cart</span>
                          </button>
                          <button 
                            onClick={() => handleToggleWishlist(product)}
                            className={`p-1.5 transition-colors rounded-lg hover:bg-gray-700 ${
                              isInWishlist(product.id) 
                                ? 'text-red-400 hover:text-red-300' 
                                : isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <Heart size={16} className={isInWishlist(product.id) ? 'fill-current' : ''} />
                          </button>
                          <button 
                            onClick={() => setSelectedProduct(product)}
                            className={`p-1.5 ${
                              isDarkMode ? "text-gray-400 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"
                            } transition-colors rounded-lg hover:bg-gray-700`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-gray-500">
                <Search className={`w-12 h-12 ${
                  isDarkMode ? "text-gray-600" : "text-gray-400"
                }`} />
                <p>Search results will appear here</p>
                <p className="text-sm">Try searching for products like:</p>
                <div className="space-y-1 text-sm">
                  <button 
                    onClick={() => setMessage("black joggers")}
                    className={`block ${
                      isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                    } cursor-pointer`}
                  >
                    "black joggers"
                  </button>
                  <button 
                    onClick={() => setMessage("blue jeans")}
                    className={`block ${
                      isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                    } cursor-pointer`}
                  >
                    "blue jeans"
                  </button>
                  <button 
                    onClick={() => setMessage("red dress")}
                    className={`block ${
                      isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"
                    } cursor-pointer`}
                  >
                    "red dress"
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Variation Modal */}
      {showVariationModal && (
        <VariationModal
          product={selectedProductForVariation}
          onClose={() => {
            setShowVariationModal(false);
            setSelectedProductForVariation(null);
          }}
          onConfirm={(product) => {
            addToCart(product.id, 1, selectedVariations[product.id]);
            setSelectedVariations(prev => {
              const newVariations = { ...prev };
              delete newVariations[product.id];
              return newVariations;
            });
          }}
        />
      )}
    </div>
  );
};

export default AIPopup;