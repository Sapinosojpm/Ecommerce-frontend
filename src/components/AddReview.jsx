import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar, FaRegStar } from "react-icons/fa";
import Title from "./Title";
import NewsletterBox from "./NewsletterBox";
import AdBanner from "./AdBanner";
import ProductsAdsDisplayHome from "./ProductsAdsDisplayHome";

const WebsiteReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [ratingPercentage, setRatingPercentage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
    }
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

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`)
      .then((response) => {
        if (response.data.success) {
          setReviews(response.data.reviews);
          calculateAverageRating(response.data.reviews);
        }
      })
      .catch((error) => console.error("Error fetching reviews:", error));
  }, []);

  const calculateAverageRating = (reviews) => {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;
    setAverageRating(avg);
    setRatingPercentage((avg / 5) * 100);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || !review.trim()) {
      alert("Please provide a rating and review.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/reviews`,
        {
          name,
          rating,
          review,
        }
      );
      if (data.success) {
        const updatedReviews = [...reviews, data.review];
        setReviews(updatedReviews);
        setRating(0);
        setReview("");
        calculateAverageRating(updatedReviews);
      }
    } catch (error) {
      console.error("Error adding review:", error);
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

  return (
    <div className="w-full min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col max-w-screen-xl gap-6 mx-auto lg:flex-row">
        {/* Main Content */}
        <div className="w-full border border-gray-200 rounded-lg lg:w-2/3">
          {/* Average Rating */}
          <div className="flex flex-col items-center m-5 mb-8 text-center">
            <p className="mb-2 text-xl text-gray-700">
              Average Rating:{" "}
              <span className="font-bold text-gray-900">{averageRating}/5</span>
            </p>
            <div className="w-full h-3 max-w-xs bg-gray-300 rounded-full">
              <div
                className="h-3 transition-all duration-500 bg-gray-600 rounded-full"
                style={{ width: `${ratingPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Scrollable Review Section */}
          <div className="max-h-[400px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300 p-4">
            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <div key={i} className="p-5 border shadow-sm rounded-xl bg-gray-50">
                  <div className="flex items-center mb-3">
                    <div className="flex items-center justify-center w-10 h-10 font-bold text-gray-700 uppercase bg-gray-300 rounded-full">
                      {r.name ? r.name.charAt(0) : "A"}
                    </div>
                    <div className="ml-3">
                      <span className="font-semibold text-gray-800">
                        {r.name
                          ? r.name.slice(0, 2) + r.name.slice(2).replace(/./g, "*")
                          : "Anonymous"}
                      </span>
                      <div className="text-sm font-medium text-yellow-500">
                        {"★".repeat(r.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{r.review}</p>
                  <p className="mt-3 text-xs text-gray-500">{formatDate(r.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-gray-500">
                No reviews yet. Be the first to leave one!
              </p>
            )}
          </div>

          {/* Review Form (Always Visible) */}
          {isLoggedIn ? (
            <div className="m-2 mt-6 bg-white border rounded-lg shadow-md p-7">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">Write a Review</h3>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Rating */}
                <p className="text-sm text-gray-800">Rating</p>
                <div className="flex justify-start space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => handleStarClick(star)} className="cursor-pointer">
                      {star <= rating ? (
                        <FaStar className="text-2xl text-yellow-500" />
                      ) : (
                        <FaRegStar className="text-2xl text-gray-400" />
                      )}
                    </span>
                  ))}
                </div>

                {/* Comment Box */}
                <p className="text-sm text-gray-800">Comment</p>
                <textarea
                  placeholder="Your Review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full px-5 py-2 text-white bg-black rounded-lg hover:bg-gray-700 active:bg-green-800"
                >
                  Submit Review
                </button>
              </form>
            </div>
          ) : (
            <p className="p-4 mt-4 text-center text-red-500">
              You must be logged in to leave a review.
            </p>
          )}
        </div>

        {/* Right Sidebar Container - Hidden on mobile */}
      <div className="flex flex-col w-full h-full p-4 space-y-6 border border-gray-200 rounded-lg">
  {/* Ad Banner */}
  <div>
    <ProductsAdsDisplayHome />
  </div>

  {/* Newsletter at the bottom */}
  <div className="mt-auto">
    <NewsletterBox />
  </div>
</div>

      </div>

    
    </div>
  );
};

export default WebsiteReviewPage;