import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../../../admin/src/App";

const NewsletterBox = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [discount, setDiscount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if the user is logged in
  useEffect(() => {
    const user = localStorage.getItem("token"); // Adjust according to your auth system
    setIsLoggedIn(!!user);
  }, []);

  // Fetch the latest discount
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/admin/discounts`);
        setDiscount(response.data.discountPercent); // Assuming backend returns { discountPercent }
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
      setEmail(""); // Reset email input on success
    } catch (error) {
      setError(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white rounded-lg bg-darkGreen">
      <p className="mb-4 text-2xl font-medium">
        Subscribe now & get {discount ? `${discount}%` : "a"} off
      </p>

      {!isLoggedIn ? (
        <p className="mt-3 text-red-500">Please log in to subscribe and receive a discount.</p>
      ) : (
        <form
          onSubmit={onSubmitHandler}
          className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg"
        >
          <input
            className="flex-1 p-3 text-black rounded-md"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-6 py-3 text-white bg-black rounded-md hover:bg-gray-900 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "SUBSCRIBE"}
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default NewsletterBox;
