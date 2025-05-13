import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const Review = ({ productId, onSubmitReview }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const checkReviewEligibility = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setCanReview(false);
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
  `${backendUrl}/api/product-reviews/can-review/${productId}/${userId}`,
  { headers: { Authorization: `Bearer ${token}` } } // ✅ Correct
);

      setCanReview(response.data.canReview);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      setCanReview(false);
    } finally {
      setIsLoading(false);
    }
  };

  checkReviewEligibility();
}, [productId, backendUrl, token]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide a rating and comment.");
      return;
    }

    if (!canReview) {
      toast.error("You're not eligible to review this product.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const reviewData = { 
        productId, 
        userId, 
        rating, 
        comment 
      };

      await onSubmitReview(reviewData);
      setRating(0);
      setComment("");
      setCanReview(false); // Prevent multiple reviews
      toast.success("Thank you for your review!");
    } catch (error) {
      toast.error("Failed to submit review. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="p-6 mt-6 text-center">Checking review eligibility...</div>;
  }

  if (!canReview) {
    return (
      <div className="p-6 mt-6 text-center bg-white border rounded-lg shadow-md">
        <h3 className="mb-2 text-lg font-semibold">Review This Product</h3>
        <p className="text-gray-600">
          You can leave a review after purchasing and receiving this item.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 mt-6 bg-white border rounded-lg shadow-md"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Write a Review
      </h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Rating
        </label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={`cursor-pointer transition-colors ${
                star <= rating ? "text-yellow-500" : "text-gray-300"
              }`}
              size={24}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>

      {/* Comment Box */}
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="block w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-blue-500 focus:border-blue-500"
          rows="4"
          placeholder="Share your experience with this product..."
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-5 py-2 text-white transition duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800"
      >
        Submit Review
      </button>
    </form>
  );
};

export default Review;