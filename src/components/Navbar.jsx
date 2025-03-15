import React, { useState, useContext, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ Import Framer Motion
import { ShopContext } from "../context/ShopContext";
import { WishlistContext } from "../context/WishlistContext";
import { backendUrl } from "../../../admin/src/App";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const [logo, setLogo] = useState(null);
  const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);
  const { wishlist } = useContext(WishlistContext);
  const location = useLocation();

  // ✅ Logout Function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setCartItems({});
    setUserRole(null);
    navigate("/login");
  };

  // ✅ Fetch Logo from Backend
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/logo`);
        const data = await res.json();
        setLogo(`${backendUrl}${data.imageUrl}`);
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };
    fetchLogo();
  }, []);

  // log out the user if localStorage no longer contains a token after a browser restart.
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logout(); // Only logout if token is missing
        return;
      }
  
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          logout();
        }
      } catch (error) {
        logout();
      }
    };
  
    // Run check on page load
    checkTokenExpiration();
  
    // Run periodically every 60 seconds
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);
  

  // ✅ Update userRole when token changes
  useEffect(() => {
    setUserRole(localStorage.getItem("role") || null);
  }, [token]);

  const getWishlistCount = () => (wishlist ? wishlist.length : 0);

  return (
    <div className="px-4 flex items-center z-50 justify-between py-3 font-medium md:px-[7vw] top-0 bg-white w-full z-50 shadow-md fixed left-0 right-0">
      {/* Logo */}
      <Link to="/">
        {logo ? (
          <motion.img
            src={logo}
            className="w-12"
            alt="Logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
        ) : (
          <p>Loading...</p>
        )}
      </Link>

      {/* Navigation Links */}
      <ul className="hidden gap-5 text-sm text-gray-700 sm:flex">
        <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <NavLink to="/" className="hover:scale-105">
            <p>Home</p>
            <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </motion.li>
        <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <NavLink to="/collection" className="hover:scale-105">
          <p>Products</p>
          <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </motion.li>
        <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <NavLink to="/about" className="hover:scale-105">
          <p>About</p>
          <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </motion.li>
        <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <NavLink to="/contact" className="hover:scale-105">
          <p>Contact</p>
          <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </motion.li>
        <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <NavLink to="/portfolio" className="hover:scale-105">
          <p>Portfolio</p>
          <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </NavLink>
        </motion.li>
        {userRole === "admin" && (
          <motion.li whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-105"
            >
              Admin Panel
            </a>
            <hr className="w-full border-none h-[1.5px] bg-gray-700 hidden" />
          </motion.li>
        )}
      </ul>

      <div className="flex items-center gap-6">
        {/* ✅ "Not Logged In" Message with Animation */}
        {!token && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-3 py-1 text-sm font-medium text-red-600 rounded bg-red-50"
          >
            You are not logged in
          </motion.div>
        )}

        {/* Search Icon (Only on Collection Page) */}
        {location.pathname === "/collection" && (
          <motion.img
          onClick={() => {
            setShowSearch(true);
            window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top
          }}
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          alt="Search"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
        
        )}

        {/* Profile Icon */}
        <div className="relative group">
          <motion.img
            onClick={() => (token ? null : navigate("/login"))}
            className="w-5 cursor-pointer hover:scale-105"
            src={assets.profile_icon}
            alt="Profile"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
          {token && (
            <motion.div
              className="absolute right-0 hidden pt-4 group-hover:block dropdown-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2 px-5 py-3 text-gray-500 rounded w-36 bg-slate-100">
                <p
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer hover:text-black"
                >
                  Profile
                </p>
                {userRole !== "admin" && (
                  <p
                    onClick={() => navigate("/orders")}
                    className="cursor-pointer hover:text-black"
                  >
                    Orders
                  </p>
                )}
                <p onClick={logout} className="cursor-pointer hover:text-black">
                  Logout
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cart & Wishlist (Hidden for Admin) */}
        {userRole !== "admin" && (
          <>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link to="/cart" className="relative">
                <img src={assets.cart_icon} className="w-5 hover:scale-105" alt="Cart" />
                <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center bg-black text-white rounded-full text-[8px]">
                  {getCartCount()}
                </p>
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Link to="/wishlist" className="relative">
                <img
                  src={assets.wishlist_icon}
                  className="w-5 cursor-pointer hover:scale-105"
                  alt="Wishlist"
                />
                <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center bg-black text-white rounded-full text-[8px]">
                  {getWishlistCount()}
                </p>
              </Link>
            </motion.div>
          </>
        )}

        {/* Mobile Menu Icon */}
        <motion.img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt="Menu"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
};

export default Navbar;
