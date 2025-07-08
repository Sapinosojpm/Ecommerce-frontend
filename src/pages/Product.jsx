import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import RelatedProducts from "../components/RelatedProducts";
import { WishlistContext } from "../context/WishlistContext";
import { FaShoppingCart } from "react-icons/fa";
import AnimatedButton from "../components/AnimatedButton";
import WishlistIcon from "../components/WishlistIcon";
import Lenis from "@studio-freight/lenis";
import { Lens } from "../components/Lens";
import Review from "../components/ProductReview";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Product = () => {
  const socket = useSocket();
  const { productId } = useParams();
  const { products, currency, addToCart, fetchProduct, handleBuyNow } =
    useContext(ShopContext);
  const { wishlist, toggleWishlist } = useContext(WishlistContext);
  const [productData, setProductData] = useState(null);
  const [image, setImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [userRole, setUserRole] = useState(
    (localStorage.getItem("role") || "").toLowerCase() || null
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [finalPrice, setFinalPrice] = useState(0);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [activeVariationName, setActiveVariationName] = useState(null);
  const [ads, setAds] = useState([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);

  const { search } = useLocation();
  const showReviewForm = new URLSearchParams(search).get("review") === "true";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch ads data
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/ads`);
        setAds(response.data.filter(ad => ad.isActive));
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setIsLoadingAds(false);
      }
    };
    
    fetchAds();
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshProductData, 30000);
    return () => clearInterval(interval);
  }, [productId]);

  useEffect(() => {
    if (!socket || !productId) return;

    socket.emit("joinProductRoom", productId);

    const handleProductUpdate = (updatedProduct) => {
      if (updatedProduct._id === productId) {
        setProductData(updatedProduct);

        const newSelections = {};
        let hasValidSelections = false;

        updatedProduct.variations?.forEach((variation) => {
          const currentSelection = selectedVariations[variation.name];
          if (currentSelection) {
            const matchingOption = variation.options.find(
              (opt) => opt.name === currentSelection.name
            );
            if (matchingOption) {
              newSelections[variation.name] = matchingOption;
              hasValidSelections = true;
            }
          }
        });

        if (hasValidSelections) {
          setSelectedVariations(newSelections);
        } else if (updatedProduct.variations?.length > 0) {
          const initialSelections = {};
          updatedProduct.variations.forEach((variation) => {
            if (variation.options.length > 0) {
              initialSelections[variation.name] = variation.options[0];
            }
          });
          setSelectedVariations(initialSelections);
        }

        updateAvailableQuantity(hasValidSelections ? newSelections : {});
        calculatePrice(hasValidSelections ? newSelections : {});

        toast.info("Product inventory has been updated!");
      }
    };

    socket.on("productUpdated", handleProductUpdate);
    socket.on("newOrder", handleProductUpdate);

    return () => {
      socket.off("productUpdated", handleProductUpdate);
      socket.off("newOrder", handleProductUpdate);
    };
  }, [socket, productId, selectedVariations]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/product-reviews/${productId}`
      );
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (review) => {
    const userId = localStorage.getItem("userId");
    const reviewData = { ...review, userId };

    try {
      const response = await fetch(`${backendUrl}/api/product-reviews/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        fetchReviews();
      } else {
        toast.error("Failed to submit review.");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smooth: true,
      lerp: 0.1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (productData) {
      setIsWishlisted(wishlist.some((item) => item._id === productData._id));
    }
  }, [wishlist, productData]);

  const calculatePrice = (selections) => {
    if (!productData) return;

    let calculatedPrice = productData.price;

    // Only add the price adjustment for the active variation
    if (activeVariationName && selections[activeVariationName]) {
      calculatedPrice += selections[activeVariationName].priceAdjustment || 0;
    }

    if (productData.discount > 0) {
      calculatedPrice = calculatedPrice * (1 - productData.discount / 100);
    }

    setFinalPrice(calculatedPrice);
  };

  const handleVariationChange = (variationName, option) => {
    // Only allow one option per variation type
    setSelectedVariations(prev => ({
      ...prev,
      [variationName]: option
    }));
    const newSelections = {
      ...selectedVariations,
      [variationName]: option,
    };
    calculatePrice(newSelections);
    updateAvailableQuantity(newSelections);
  };

  const updateAvailableQuantity = (selections) => {
    if (!productData) return 0;

    if (!productData.variations || productData.variations.length === 0) {
      const qty = productData.quantity || 0;
      setAvailableQuantity(qty);
      return qty;
    }

    let minQuantity = Infinity;
    Object.entries(selections).forEach(([variationName, selectedOption]) => {
      const variation = productData.variations.find(
        (v) => v.name === variationName
      );
      if (variation) {
        const option = variation.options.find(
          (opt) => opt.name === selectedOption.name
        );
        if (option && option.quantity < minQuantity) {
          minQuantity = option.quantity;
        }
      }
    });

    const finalQty = minQuantity === Infinity ? 0 : minQuantity;
    setAvailableQuantity(finalQty);
    return finalQty;
  };

  const refreshProductData = async () => {
    const data = await fetchProduct(productId);
    if (data) {
      setProductData(data);
      const initialSelections = {};
      if (data.variations?.length > 0) {
        data.variations.forEach((variation) => {
          if (variation.options.length > 0) {
            initialSelections[variation.name] = variation.options[0];
          }
        });
        setActiveVariationName(data.variations[0].name);
      }
      setSelectedVariations(initialSelections);
      updateAvailableQuantity(initialSelections);
    }
  };

  const fetchProductData = async () => {
    const foundProduct = products.find((item) => item._id === productId);
    if (foundProduct) {
      setProductData(foundProduct);
      setImage(foundProduct.image[0]);
      if (foundProduct.variations?.length > 0) {
        const initialSelections = {};
        foundProduct.variations.forEach((variation) => {
          if (variation.options.length > 0) {
            const firstInStockOption =
              variation.options.find((opt) => opt.quantity > 0) ||
              variation.options[0];
            initialSelections[variation.name] = firstInStockOption;
          }
        });
        setSelectedVariations(initialSelections);
        setActiveVariationName(foundProduct.variations[0].name);
        calculatePrice(initialSelections);
        updateAvailableQuantity(initialSelections);
      } else {
        setFinalPrice(foundProduct.price);
        setAvailableQuantity(foundProduct.quantity || 0);
      }
    } else {
      const data = await fetchProduct(productId);
      if (data) {
        setProductData(data);
        setImage(data.image[0]);
        if (data.variations?.length > 0) {
          const initialSelections = {};
          data.variations.forEach((variation) => {
            if (variation.options.length > 0) {
              const firstInStockOption =
                variation.options.find((opt) => opt.quantity > 0) ||
                variation.options[0];
              initialSelections[variation.name] = firstInStockOption;
            }
          });
          setSelectedVariations(initialSelections);
          setActiveVariationName(data.variations[0].name);
          calculatePrice(initialSelections);
          updateAvailableQuantity(initialSelections);
        } else {
          setFinalPrice(data.price);
          setAvailableQuantity(data.quantity || 0);
        }
      }
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  useEffect(() => {
    if (Object.keys(selectedVariations).length > 0) {
      localStorage.setItem(
        `product_${productId}_selections`,
        JSON.stringify(selectedVariations)
      );
    }
  }, [selectedVariations, productId]);

  useEffect(() => {
    setUserRole((localStorage.getItem("role") || "").toLowerCase() || null);
  }, []);

  useEffect(() => {
    if (productData) {
      setImage(productData.image[0]);
      if (productData.variations?.length > 0) {
        // Only select the first variation group and its first in-stock option by default
        const firstVariation = productData.variations[0];
        const firstOption = firstVariation.options.find(opt => opt.quantity > 0) || firstVariation.options[0];
        const initialSelections = { [firstVariation.name]: firstOption };
        setSelectedVariations(initialSelections);
        setActiveVariationName(firstVariation.name);
        calculatePrice(initialSelections);
        updateAvailableQuantity(initialSelections);
      } else {
        setFinalPrice(productData.price);
        setAvailableQuantity(productData.quantity || 0);
      }
    }
  }, [productData]);

  if (!productData) {
    return <div className="mt-10 text-xl text-center">Loading...</div>;
  }

  const selectedVariationQuantity = Object.entries(selectedVariations).reduce(
    (acc, [variationName, selectedOption]) => {
      const variation = productData.variations.find(
        (v) => v.name === variationName
      );
      if (variation) {
        const selectedOptionData = variation.options.find(
          (opt) => opt.name === selectedOption.name
        );
        if (selectedOptionData) {
          acc += selectedOptionData.quantity || 0;
        }
      }
      return acc;
    },
    0
  );

  const getDefaultVariations = () => {
    if (!productData?.variations?.length) return null;

    const defaultVariations = {};
    productData.variations.forEach((variation) => {
      if (variation.options.length > 0) {
        const firstInStock =
          variation.options.find((opt) => opt.quantity > 0) ||
          variation.options[0];
        defaultVariations[variation.name] = firstInStock;
      }
    });

    return Object.keys(defaultVariations).length > 0 ? defaultVariations : null;
  };

  return (
    <div className="container px-4 py-12 mx-auto my-20 product-page">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-col gap-8 lg:w-2/3">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex gap-4 overflow-x-auto sm:flex-col sm:w-1/4">
              {productData.image.map((item, index) => (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setImage(item);
                    scrollToTop();
                  }}
                  src={item}
                  key={index}
                  className="object-cover w-24 h-24 border border-gray-200 rounded-lg cursor-pointer sm:w-32 sm:h-32"
                  alt={`Product Image ${index + 1}`}
                />
              ))}
            </div>

            <div className="relative flex items-center justify-center w-full cursor-pointer sm:w-3/4">
              <div className="relative" style={{ zIndex: 10 }}>
                <Lens
                  zoomFactor={3}
                  lensSize={200}
                  hovering={hovering}
                  setHovering={setHovering}
                >
                  <motion.img
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    src={image}
                    alt="Main Product Image"
                    className="object-contain w-full h-auto"
                  />
                </Lens>
              </div>
            </div>
          </div>

          <hr />

          <div className="flex-1 mt-8 sm:mt-0">
            <h1 className="mb-3 text-2xl font-semibold text-gray-900">
              {productData.name}
            </h1>

            <div className="mb-5 text-xl font-medium text-gray-800">
              {(() => {
                const capital = productData.capital || 0;
                let markup = 0;
                if (productData.additionalCapital) {
                  if (productData.additionalCapital.type === 'percent') {
                    markup = capital * (productData.additionalCapital.value / 100);
                  } else {
                    markup = productData.additionalCapital.value || 0;
                  }
                }
                const subtotal = capital + markup;
                const vatPercent = productData.vat || 0;
                const vatAmount = subtotal * (vatPercent / 100);
                // Base price does NOT include variation
                const basePrice = subtotal + vatAmount;
                // Variation adjustment: only use the active variation's selected option
                let variationAdjustment = 0;
                if (activeVariationName && selectedVariations[activeVariationName]) {
                  variationAdjustment = selectedVariations[activeVariationName].priceAdjustment || 0;
                }
                const discountPercent = productData.discount || 0;
                // Discounted price: (base price * (1 - discount%)) + variationAdjustment
                const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                // For no discount, only add variationAdjustment once
                if (discountPercent > 0) {
                  return (
                <>
                  <span className="ml-2 text-gray-500 line-through">
                        {currency}{basePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className="ml-2 text-lg font-semibold text-green-600">
                        {currency}{discountedPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                      <span className="px-2 py-1 ml-2 text-sm text-red-500 bg-red-100 rounded">{discountPercent}% off</span>
                </>
                  );
                } else {
                  // Only add variationAdjustment once
                  return (
                <span>
                      {currency}{(basePrice + variationAdjustment).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
                  );
                }
              })()}
            </div>

            {productData.variations?.length > 0 && (
              <div className="mb-5">
                <label className="block mb-2 text-lg font-medium">
                  Choose Variation:
                </label>
                <div className="flex flex-wrap gap-2">
                  {productData.variations.map((variation) => (
                    <button
                      key={variation.name}
                      onClick={() => {
                        setActiveVariationName(variation.name);
                        if (!selectedVariations[variation.name]) {
                          const newSelection = {
                            ...selectedVariations,
                            [variation.name]: variation.options[0],
                          };
                          setSelectedVariations(newSelection);
                          calculatePrice(newSelection);
                          updateAvailableQuantity(newSelection);
                        }
                      }}
                      className={`px-4 py-2 text-sm border rounded-full transition-colors ${
                        activeVariationName === variation.name
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {variation.name}
                    </button>
                  ))}
                </div>

                {activeVariationName && (
                  <div className="mt-4">
                    <label className="block mb-2 text-lg font-medium">
                      Select Option:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {productData.variations
                        .find((v) => v.name === activeVariationName)
                        ?.options.map((option) => (
                          <button
                            key={option.name}
                            onClick={() => handleVariationChange(activeVariationName, option)}
                            className={`px-4 py-2 text-sm border rounded-full transition-colors ${
                              selectedVariations[activeVariationName]?.name ===
                              option.name
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
                            } ${
                              option.quantity <= 0
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={option.quantity <= 0}
                          >
                            {option.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              <p className="text-lg font-medium">Available Quantity: </p>
              <span>{selectedVariationQuantity}</span>
            </div>

            {userRole === "user" && (
              <>
                {selectedVariationQuantity === 0 ? (
                  <div className="inline-block px-4 py-2 text-lg font-semibold text-red-600 bg-red-100 border border-red-400 rounded-lg">
                    Out of Stock
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-5">
                      <label htmlFor="quantity" className="text-lg font-medium">
                        Quantity:
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, parseInt(e.target.value, 10) || 1)
                          )
                        }
                        className={twMerge(
                          "w-24 px-4 py-2 text-center border rounded-lg shadow-sm"
                        )}
                        min="1"
                        max={selectedVariationQuantity}
                      />
                    </div>

                    <div className="flex flex-wrap gap-4">
                  
<AnimatedButton
  text="ADD TO CART"
  successText="Added!"
  onClick={() => {
    const selectedVars = {};
    if (activeVariationName && selectedVariations[activeVariationName]) {
      selectedVars[activeVariationName] = {
        name: selectedVariations[activeVariationName].name,
        priceAdjustment: selectedVariations[activeVariationName].priceAdjustment || 0
      };
    }
    addToCart(
      productData._id,
      quantity,
      selectedVars,
      finalPrice
    );
  }}
  icon={<FaShoppingCart className="w-6 h-6 text-white" />}
  disabled={selectedVariationQuantity === 0}
/>
                      <AnimatedButton
                        text="BUY NOW"
                        successText="Redirecting..."
                        onClick={() => {
                          const selectedVars = {};
                          if (activeVariationName && selectedVariations[activeVariationName]) {
                            selectedVars[activeVariationName] = {
                              name: selectedVariations[activeVariationName].name,
                              priceAdjustment: selectedVariations[activeVariationName].priceAdjustment || 0
                            };
                          }
                          handleBuyNow(
                            productData._id,
                            quantity,
                            selectedVars,
                            finalPrice,
                            calculatePrice
                          );
                          toast.success("Redirecting to checkout...");
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={availableQuantity === 0}
                      />

                      <WishlistIcon
                        productId={productData._id}
                        isWishlisted={isWishlisted}
                        onToggle={() => {
                          toggleWishlist(productData._id);
                        }}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="mt-8 max-h-[400px] overflow-y-auto">
            <div className="pb-4 border-b">
              <b className="text-lg">Description</b>
            </div>
            <div className="mt-6 text-sm text-gray-600">
              <p>{productData.description}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between pb-4 border-b">
              <b className="text-xl font-semibold">Customer Reviews</b>
              {reviews.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-yellow-500">
                    {(
                      reviews.reduce((sum, review) => sum + review.rating, 0) /
                      reviews.length
                    ).toFixed(1)}
                    /5
                  </span>
                  <span className="text-sm text-gray-600">
                    ({reviews.length}{" "}
                    {reviews.length > 1 ? "reviews" : "review"})
                  </span>
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="mt-4">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter((r) => r.rating === star).length;
                  const percentage = ((count / reviews.length) * 100).toFixed(
                    1
                  );

                  return (
                    <div
                      key={star}
                      className="flex items-center mb-2 space-x-2"
                    >
                      <span className="w-6 text-sm font-medium text-gray-800">
                        {star}★
                      </span>
                      <div className="relative w-full h-3 bg-gray-200 rounded-full">
                        <div
                          className="absolute top-0 left-0 h-3 bg-yellow-400 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-gray-600">
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 max-h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <div
                    key={index}
                    className="p-5 border shadow-sm rounded-xl bg-gray-50"
                  >
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-10 h-10 font-bold text-gray-700 uppercase bg-gray-300 rounded-full">
                        {review.name ? review.name.charAt(0) : "A"}
                      </div>
                      <div className="ml-3">
                        <span className="font-semibold text-gray-800">
                          {review.name
                            ? review.name.slice(0, 2) +
                              review.name.slice(2).replace(/./g, "*")
                            : "Anonymous"}
                        </span>
                        <div className="text-sm font-medium text-yellow-500">
                          {"★".repeat(review.rating)}{" "}
                          <span className="text-gray-600">
                            ({review.rating}/5)
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="mt-3 text-xs text-gray-500">
                      {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-gray-500">
                  <p className="text-lg font-semibold">No reviews yet</p>
                  <p className="text-sm">
                    Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>

            {userRole === "user" && showReviewForm && (
              <div className="mt-8">
                <Review
                  productId={productId}
                  onSubmitReview={handleSubmitReview}
                />
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/3 lg:pl-8">
          <div className="sticky top-4">
            {isLoadingAds ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="w-full h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Sponsored Products</h3>
                {ads.slice(0, 3).map((ad) => (
                  <div 
                    key={ad._id}
                    className="relative p-4 transition-all duration-300 border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 group"
                    onClick={() => {
                      console.log(`Ad clicked: ${ad._id}`);
                      if (ad.link) {
                        window.open(ad.link, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >
                    {/* Ad Badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Sponsored
                      </span>
                    </div>
                    
                    {/* Ad Content */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-24 h-24 overflow-hidden rounded-lg">
                        {ad.video ? (
                          <video 
                            className="object-cover w-full h-full"
                            autoPlay
                            loop
                            muted
                            playsInline
                          >
                            <source src={ad.video} type="video/mp4" />
                          </video>
                        ) : (
                          <img
                            src={ad.imageUrl}
                            alt={ad.title || "Advertisement"}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Ctext x='100' y='100' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='16'%3EAd%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                          {ad.title || "Special Offer"}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {ad.description || "Check out this amazing offer!"}
                        </p>
                        {ad.price && (
                          <div className="mt-2">
                            {ad.discount ? (
                              <>
                                <span className="font-semibold text-red-600">
                                  ${(ad.price * (1 - ad.discount / 100)).toFixed(2)}
                                </span>
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ${ad.price.toFixed(2)}
                                </span>
                                <span className="ml-2 text-xs text-red-500">
                                  {ad.discount}% OFF
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-blue-600">
                                ${ad.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                        <button className="mt-3 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800">
                          {ad.cta || "Shop Now"} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
                No sponsored products available
              </div>
            )}
          </div>
        </div>
      </div>

      {productData && (
        <div className="mt-12">
          <RelatedProducts
            category={productData.category}
            excludeId={productData._id}
          />
        </div>
      )}
    </div>
  );
};

export default Product;