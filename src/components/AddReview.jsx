import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaRegStar } from 'react-icons/fa'; // Import star icons
import Title from './Title';

const WebsiteReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0); // Rating is now an integer
  const [review, setReview] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false); // Track modal visibility
  const [averageRating, setAverageRating] = useState(0);
  const [ratingPercentage, setRatingPercentage] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetchUserData(token);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ensure 'data.user' exists and has firstName & lastName properties
      if (data && data.firstName && data.lastName) {
        setName(`${data.firstName.trim()} ${data.lastName.trim()}`);
      } else {
        console.error('Invalid user data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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
      .catch((error) => console.error('Error fetching reviews:', error));
  }, []);

  const calculateAverageRating = (reviews) => {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = reviews.length ? (totalRating / reviews.length).toFixed(1) : 0;
    setAverageRating(avg);
    setRatingPercentage((avg / 5) * 100);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reviews`, {
        name,
        rating,
        review,
      });
      if (data.success) {
        const updatedReviews = [...reviews, data.review];
        setReviews(updatedReviews);
        setShowPopup(true);
        setRating(0); // Reset rating after submission
        setReview('');
        calculateAverageRating(updatedReviews);
        setShowReviewModal(false); // Close the modal after submitting
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  // Handle star click for rating
  const handleStarClick = (starIndex) => {
    setRating(starIndex);
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };

  return (
    <div className="w-full min-h-screen py-8 bg-gray-50">
      <div className="container max-w-screen-xl px-8 mx-auto">
        <div className="flex justify-center mb-12">
          <Title text1={'WEBSITE'} text2={'REVIEW'} />
        </div>

        {/* Combined average rating and add review button in a row */}
        <div className="flex items-center justify-between mb-12">
          <div className="text-center">
            <p className="mb-2 text-xl text-gray-700">
              Average Rating: <span className="font-bold text-gray-900">{averageRating}/5</span>
            </p>
            <div className="w-full h-3 mb-6 bg-gray-300 rounded-full">
              <div
                className="h-3 transition-all duration-500 bg-green-600 rounded-full"
                style={{ width: `${ratingPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Show review form only if logged in */}
          <div className="text-center">
            {!isLoggedIn ? (
              <div className="p-8 bg-white border border-gray-200 shadow-lg rounded-xl">
                <h2 className="mb-6 text-3xl font-semibold text-gray-900">Leave a Review</h2>
                <p className="text-lg font-semibold text-red-500">You must be logged in to leave a review.</p>
              </div>
            ) : (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-6 py-3 font-semibold text-white transition-all duration-300 bg-green-600 rounded-lg hover:bg-green-700"
              >
                Write a review
              </button>
            )}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="overflow-hidden">
          <h2 className="mb-6 text-3xl font-semibold text-gray-900">Visitor Reviews</h2>
          <div className="flex space-x-6 overflow-x-auto scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-300">
            {reviews.length > 0 ? (
              reviews.map((r, i) => (
                <div key={i} className="min-w-[300px] p-6 bg-gray-100 rounded-lg shadow-md border-gray-300">
                  <h3 className="mb-1 text-xl font-medium text-gray-900">{r.name}</h3>
                  <p className="text-sm text-gray-500 ">Reviewed on: {formatDate(r.createdAt)}</p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, index) => (
                      <span key={index}>
                        {index < r.rating ? (
                          <FaStar className="text-yellow-500" />
                        ) : (
                          <FaRegStar className="text-yellow-500" />
                        )}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 italic text-gray-800">{r.review}</p>
                  
                </div>
              ))
            ) : (
              <p className="italic text-gray-500">No reviews yet. Be the first to leave one!</p>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60">
          <div className="w-full max-w-lg p-8 bg-white shadow-xl rounded-xl animate-fadeIn">
            <form onSubmit={handleSubmitReview} className="space-y-6">
              <h2 className="text-3xl font-semibold text-center text-gray-900">Submit Your Review</h2>

              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  className="w-full p-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  readOnly
                />

                {/* Rating stars */}
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, index) => (
                    <span key={index} onClick={() => handleStarClick(index + 1)} className="cursor-pointer">
                      {index < rating ? (
                        <FaStar className="text-xl text-yellow-500" />
                      ) : (
                        <FaRegStar className="text-xl text-gray-400" />
                      )}
                    </span>
                  ))}
                </div>

                <textarea
                  placeholder="Your Review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="4"
                  required
                />

                <button
                  type="submit"
                  className="w-full py-3 font-semibold text-white transition-all duration-300 transform bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105"
                >
                  Submit Review
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowReviewModal(false)}
              className="w-full py-3 mt-6 font-semibold text-white transition-all duration-300 transform bg-gray-600 rounded-lg hover:bg-gray-700 hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60">
          <div className="w-full max-w-sm p-8 text-center bg-white shadow-xl rounded-xl animate-fadeIn">
            <p className="mb-6 text-lg font-semibold text-gray-700">Review submitted successfully! 🎉</p>
            <button
              onClick={() => setShowPopup(false)}
              className="px-6 py-2 font-semibold text-white transition-all duration-300 transform bg-green-600 rounded-lg hover:bg-green-700 hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebsiteReviewPage;
