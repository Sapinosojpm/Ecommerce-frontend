import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { WishlistContext } from "../context/WishlistContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { toast } from "react-toastify";
const Wishlist = () => {
  const { removeFromWishlist } = useContext(WishlistContext);
  const [wishlistData, setWishlistData] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = "₱";
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found in localStorage");
        return null;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        console.error("Invalid token format");
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const userId = getUserIdFromToken();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/wishlist?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch wishlist: ${response.statusText}`);
        }

        const data = await response.json();
        setWishlistData(data.wishlist || []);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [userId]);

  const isWishlistEmpty = wishlistData.length === 0;

  const handleRemove = async (productId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/wishlist`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId: userId,
            productId: productId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to remove item from wishlist: ${response.statusText}`
        );
      }

      setWishlistData((prevWishlist) =>
        prevWishlist.filter((item) => item._id !== productId)
      );
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
    }
  };

  const handleClearWishlist = async () => {
    console.log("User ID before clearing wishlist:", userId);
  
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/wishlist/clear/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clear wishlist.");
      }
  
      setWishlistData([]); // Clear wishlist in the state
      toast.success("Wishlist cleared successfully!", { position: "top-right" });
    } catch (error) {
      console.error("Error clearing wishlist:", error);
    }
  };
  

  const calculateDiscountPrice = (price, discount) => {
    return discount ? price - price * (discount / 100) : price;
  };

  return (
    <div className="border-t pt-[80px] md:pt-[7%] sm:pt-[10%] md:px-[7vw] px-4">
      <div className="text-2xl mb-3 pt-[40px]">
        <Title text1={"YOUR"} text2={"WISHLIST"} />
      </div>

      {!isWishlistEmpty && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleClearWishlist}
            className="px-4 py-2 text-white transition bg-black rounded-md hover:bg-gray-600"
          >
            Clear Wishlist
          </button>
        </div>

        
      )}

      <div>
        {isWishlistEmpty ? (
          <p className="text-center text-gray-500">
            Your wishlist is empty.{" "}
            <Link to="/collection" className="text-blue-500 underline">
              Browse products
            </Link>{" "}
            to add some!
          </p>
        ) : (
          wishlistData.map((product) => (
            <div
              key={product._id}
              className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_2fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
            >
              <div className="flex items-start gap-6">
                <Link to={`/product/${product._id}`}>
                  <img
                    className="w-16 sm:w-20 hover:scale-105"
                    src={product.image?.[0]}
                    alt={product.name}
                  />
                </Link>
                <div>
                  <Link to={`/product/${product._id}`}>
                    <p className="text-xs font-medium sm:text-lg">
                      {product.name}
                    </p>
                  </Link>
                  <div className="flex items-center gap-5 mt-2">
                    {product.discount > 0 ? (
                      <div>
                        <p className="text-red-600">
                          {currency}
                          {calculateDiscountPrice(
                            product.price,
                            product.discount
                          ).toLocaleString()}
                        </p>
                        <p className="text-gray-500 line-through">
                          {currency}
                          {product.price?.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p>
                        {currency}
                        {product.price?.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <p className="font-medium">Available Quantity:</p>
                    <span>{product.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <img
                  onClick={() => handleRemove(product._id)}
                  className="w-4 mr-4 cursor-pointer sm:w-5"
                  src={assets.bin_icon}
                  alt="Remove item"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wishlist;
