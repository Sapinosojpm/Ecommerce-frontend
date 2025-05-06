import React, { useState } from "react";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa";

const Review = ({ productId, onSubmitReview }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide a rating and comment.");
      return;
    }
    onSubmitReview({ productId, rating, comment });
    setRating(0);
    setComment("");
  };

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
          placeholder="Write your review here..."
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
