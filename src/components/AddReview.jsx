import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaRegStar, FaQuoteLeft, FaUser, FaTimes, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const ModernTestimonialPage = () => {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [ratingPercentage, setRatingPercentage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
    }
    
    fetchReviews();
  }, []);

  const fetchUserData = async (token) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/profile`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data && data.firstName && data.lastName) {
        setName(`${data.firstName.trim()} ${data.lastName.trim()}`);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`);
      if (response.data.success) {
        setReviews(response.data.reviews);
        calculateAverageRating(response.data.reviews);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError("Failed to load reviews. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAverageRating = (reviews) => {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;
    setAverageRating(avg);
    setRatingPercentage((avg / 5) * 100);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || !reviewText.trim()) {
      alert("Please provide a rating and review.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to be logged in to submit a review.");
        return;
      }

      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/reviews`,
        { rating, review: reviewText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        const updatedReviews = [data.review, ...reviews];
        setReviews(updatedReviews);
        setRating(0);
        setReviewText("");
        calculateAverageRating(updatedReviews);
        closeModal();
      }
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  const handleStarClick = (starIndex) => {
    setRating(starIndex);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "AN";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const maskName = (name) => {
    if (!name || name.length < 2) return "Anonymous";
    return name.charAt(0) + "*".repeat(name.length - 2) + name.charAt(name.length - 1);
  };

  const nextReview = () => {
    setCurrentReviewIndex((prevIndex) => 
      prevIndex + 3 >= reviews.length ? 0 : prevIndex + 1
    );
  };

  const prevReview = () => {
    setCurrentReviewIndex((prevIndex) => 
      prevIndex === 0 ? Math.max(0, reviews.length - 3) : prevIndex - 1
    );
  };

  // Get current reviews to display (3 at a time)
  const getCurrentReviews = () => {
    return reviews.slice(currentReviewIndex, currentReviewIndex + 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
            What Our Customers Say
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-600">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>

        {/* Stats Section */}
        <div className="p-8 mb-12 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-2 mb-2 md:justify-start">
                <span className="text-4xl font-bold text-gray-900">{averageRating}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600">
                Based on {reviews.length} customer review{reviews.length !== 1 ? 's' : ''}
              </p>
              <div className="w-48 h-2 mt-3 bg-gray-200 rounded-full">
                <div
                  className="h-2 transition-all duration-1000 ease-out rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  style={{ width: `${ratingPercentage}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-8 py-4 text-white transition-all duration-200 transform bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 hover:scale-105 hover:shadow-lg"
            >
              <FaPlus className="w-4 h-4" />
              Share Your Experience
            </button>
          </div>
        </div>

        {/* Three Reviews Display with Navigation */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-xl text-red-500">{error}</p>
            <button 
              onClick={fetchReviews}
              className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : reviews.length > 0 ? (
          <div className="relative">
            {/* Reviews Grid */}
            <div className="grid gap-8 md:grid-cols-3">
              {getCurrentReviews().map((review, index) => (
                <div key={index} className="relative p-8 transition-all duration-300 bg-white shadow-lg group rounded-2xl hover:shadow-2xl">
                  {/* Quote Icon */}
                  <FaQuoteLeft className="absolute w-8 h-8 text-blue-100 top-6 right-6" />
                  
                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`w-5 h-5 ${
                          star <= review.rating ? "text-yellow-400" : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="mb-6 leading-relaxed text-gray-700">
                    {review.review}
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 font-bold text-white rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                      {getInitials(review.name)}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        {maskName(review.name || "Anonymous")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={prevReview}
                className="flex items-center justify-center w-12 h-12 text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-110"
                aria-label="Previous reviews"
              >
                <FaChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-gray-600">
                Showing {Math.min(currentReviewIndex + 1, reviews.length)}-{Math.min(currentReviewIndex + 3, reviews.length)} of {reviews.length}
              </span>
              
              <button
                onClick={nextReview}
                className="flex items-center justify-center w-12 h-12 text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 hover:scale-110"
                aria-label="Next reviews"
              >
                <FaChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="col-span-full">
            <div className="py-16 text-center">
              <FaUser className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl text-gray-500">
                No reviews yet. Be the first to share your experience!
              </p>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="relative w-full max-w-lg transition-all transform bg-white shadow-2xl rounded-2xl">
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute z-10 flex items-center justify-center w-10 h-10 text-gray-400 transition-colors duration-200 rounded-full top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
              >
                <FaTimes className="w-5 h-5" />
              </button>

              {isLoggedIn ? (
                <div className="p-8">
                  <h3 className="mb-2 text-3xl font-bold text-gray-900">
                    Share Your Experience
                  </h3>
                  <p className="mb-8 text-gray-600">
                    Help others by sharing your honest feedback
                  </p>

                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    {/* Star Rating */}
                    <div>
                      <label className="block mb-3 text-sm font-semibold text-gray-700">
                        How would you rate your experience?
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleStarClick(star)}
                            className="p-1 transition-transform duration-200 focus:outline-none hover:scale-110"
                          >
                            {star <= rating ? (
                              <FaStar className="w-8 h-8 text-yellow-400" />
                            ) : (
                              <FaRegStar className="w-8 h-8 text-gray-300 hover:text-yellow-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment Box */}
                    <div>
                      <label className="block mb-3 text-sm font-semibold text-gray-700">
                        Tell us about your experience
                      </label>
                      <textarea
                        placeholder="What did you love most about our service? Any suggestions for improvement?"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full p-4 transition-colors duration-200 border border-gray-300 resize-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                        rows="5"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-4 font-semibold text-white transition-all duration-200 transform bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Submit Review
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                    <FaUser className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    Login Required
                  </h3>
                  <p className="text-gray-600">
                    Please log in to your account to leave a review
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernTestimonialPage;