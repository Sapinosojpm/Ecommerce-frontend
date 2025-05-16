import React, { useState, useEffect } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("token");
    setIsLoggedIn(!!user);
  }, []);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/admin/discounts`);
        setDiscount(response.data.discountPercent);
      } catch (error) {
        console.error("Error fetching discount:", error);
      }
    };

    fetchDiscount();
  }, []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/subscribe`, { email });
      setMessage(response.data.message);
      setEmail("");
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl p-6 mx-2 mx-auto my-4 text-white rounded-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl bg-darkGreen">
      <p className="mb-4 text-xl font-medium text-center text-black sm:text-2xl md:text-3xl">
        Subscribe now {discount ? `& get ${discount}% off` : "and get exclusive discounts!"}
      </p>

      {!isLoggedIn ? (
        <p className="mt-3 text-sm text-center text-red-500 sm:text-base">
          Please log in to subscribe and receive a discount.
        </p>
      ) : (
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col items-center gap-3 p-3 border border-gray-300 rounded-lg sm:flex-row"
        >
          <input
            className="w-full p-3 text-black rounded-md sm:flex-1"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full px-6 py-3 mt-3 text-white bg-black rounded-md sm:w-auto sm:mt-0 hover:bg-gray-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "SUBSCRIBE"}
          </button>
        </form>
      )}

      {message && (
        <p className="mt-4 text-center text-green-500" aria-live="polite">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-center text-red-500" aria-live="assertive">
          {error}
        </p>
      )}
    </div>
  );
};

export default NewsletterBox;
