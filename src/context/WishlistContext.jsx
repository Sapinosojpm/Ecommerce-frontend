import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const WishlistContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    let token = localStorage.getItem("token");
    let userId = localStorage.getItem("userId");

    if (!userId && token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.id;
        localStorage.setItem("userId", userId);
      } catch (error) {
        console.error("❌ Error decoding token:", error);
      }
    }

    console.log("Fetching wishlist for:", { userId, token });

    if (!token || !userId) return;

    fetch(`${backendUrl}/api/wishlist?userId=${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Wishlist response:", data);
        if (data?.wishlist) {
          setWishlist(data.wishlist); // ✅ Now stores full product objects
        } else {
          console.warn("Unexpected wishlist response:", data);
          setWishlist([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching wishlist:", error);
        setWishlist([]);
      });
  }, []);

  console.log("🔑 Token:", localStorage.getItem("token"));
  console.log("🆔 User ID:", localStorage.getItem("userId"));

  // ✅ Toggle Wishlist Function (Add/Remove)
  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
  
    if (!userId) {
      console.error("❌ No user ID found!");
      return;
    }
  
    const isRemoving = wishlist.some((item) => item._id === productId);
  
    try {
      if (isRemoving) {
        console.log(`🔄 Removing from wishlist: ${productId}`);
        const response = await fetch(`${backendUrl}/api/wishlist`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId }),
        });
  
        if (response.ok) {
          setWishlist((prev) => prev.filter((item) => item._id !== productId)); // ✅ Fix: Use _id
        } else {
          console.error("❌ Wishlist remove error:", await response.json());
        }
      } else {
        console.log(`🔄 Adding to wishlist: ${productId}`);
        const response = await fetch(`${backendUrl}/api/wishlist/add`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, productId }),
        });
  
        if (response.ok) {
          const data = await response.json();
          setWishlist(data.wishlist); // ✅ Ensure full product objects are set
        } else {
          console.error("❌ Wishlist add error:", await response.json());
        }
      }
    } catch (error) {
      console.error("❌ Wishlist request failed:", error);
    }
  };
  
  

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
