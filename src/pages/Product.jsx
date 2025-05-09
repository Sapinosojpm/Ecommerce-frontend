import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { useParams } from "react-router-dom";
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
import ProductAdsDisplay from "../components/ProductsAdsDisplay";
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
    localStorage.getItem("role") || null
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [selectedVariations, setSelectedVariations] = useState({});
  const [finalPrice, setFinalPrice] = useState(0);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [activeVariationName, setActiveVariationName] = useState(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

    Object.values(selections).forEach((option) => {
      calculatedPrice += option.priceAdjustment || 0;
    });

    if (productData.discount > 0) {
      calculatedPrice = calculatedPrice * (1 - productData.discount / 100);
    }

    setFinalPrice(calculatedPrice);
  };

  const handleVariationChange = (variationName, option) => {
    const newSelections = {
      ...selectedVariations,
      [variationName]: option,
    };
    setSelectedVariations(newSelections);
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
    const savedSelections = localStorage.getItem(
      `product_${productId}_selections`
    );
    if (savedSelections) {
      try {
        const parsed = JSON.parse(savedSelections);
        if (productData) {
          const validSelections = {};
          Object.entries(parsed).forEach(([name, option]) => {
            const variation = productData.variations?.find(
              (v) => v.name === name
            );
            if (
              variation &&
              variation.options.some((opt) => opt.name === option.name)
            ) {
              validSelections[name] = option;
            }
          });
          if (Object.keys(validSelections).length > 0) {
            setSelectedVariations(validSelections);
            updateAvailableQuantity(validSelections);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved selections", e);
      }
    }
  }, [productData, productId]);

  useEffect(() => {
    if (selectedVariations && productData) {
      calculatePrice(selectedVariations);
    }
  }, [selectedVariations, productData]);

  useEffect(() => {
    setUserRole(localStorage.getItem("role") || null);
  }, []);

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
        // Find first in-stock option or fall back to first option
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

            <div className="z-50 flex items-center justify-center w-full cursor-pointer sm:w-3/4">
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

          <hr />

          <div className="flex-1 mt-8 sm:mt-0">
            <h1 className="mb-3 text-2xl font-semibold text-gray-900">
              {productData.name}
            </h1>

            <div className="mb-5 text-xl font-medium text-gray-800">
              {productData.discount && productData.discount > 0 ? (
                <>
                  <span className="ml-2 text-gray-500 line-through">
                    {currency}
                    {productData.price.toLocaleString()}
                  </span>

                  <span className="ml-2 text-lg font-semibold text-green-600">
                    {currency}
                    {finalPrice.toFixed(2)}
                  </span>
                  <span className="ml-2 text-sm text-red-500">{`${productData.discount}% off`}</span>
                </>
              ) : (
                <span>
                  {currency}
                  {finalPrice.toFixed(2)}
                </span>
              )}
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
                            onClick={() => {
                              const newSelection = {
                                ...selectedVariations,
                                [activeVariationName]: option,
                              };
                              setSelectedVariations(newSelection);
                              calculatePrice(newSelection);
                              updateAvailableQuantity(newSelection);
                            }}
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
                          addToCart(
                            productData._id,
                            quantity,
                            Object.keys(selectedVariations).length > 0
                              ? selectedVariations
                              : null
                          );
                        }}
                        icon={<FaShoppingCart className="w-6 h-6 text-white" />}
                        disabled={selectedVariationQuantity === 0}
                      />
                      <AnimatedButton
                        text="BUY NOW"
                        successText="Redirecting..."
                        onClick={() => {
                          handleBuyNow(
                            productData._id,
                            quantity,
                            Object.keys(selectedVariations).length > 0
                              ? selectedVariations
                              : null,
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

            {userRole === "user" && (
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
            <ProductAdsDisplay />
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
