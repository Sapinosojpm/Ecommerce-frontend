import React, { useState, useContext, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; 
import { ShopContext } from "../context/ShopContext";
import { WishlistContext } from "../context/WishlistContext";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("role") || null);
  const [logo, setLogo] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const {
    getCartCount,
    navigate,
    token,
    setToken,
    setCartItems,
    user,
  } = useContext(ShopContext);
  
  const { wishlist } = useContext(WishlistContext);
  const location = useLocation();
  const [navbarLinks, setNavbarLinks] = useState([]);

  // Logout Function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken("");
    setCartItems({});
    setUserRole(null);
    navigate("/login");
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch navbar links
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/navbar-links`);
        const data = await res.json();
        setNavbarLinks(data.filter((link) => link.enabled));
      } catch (error) {
        console.error("Error fetching navbar links:", error);
      }
    };
    fetchLinks();
  }, []);

  // Fetch Logo with improved error handling
  useEffect(() => {
    const fetchLogo = async () => {
      setLogoLoading(true);
      setLogoError(false);
      try {
        const res = await fetch(`${backendUrl}/api/logo`);
        if (!res.ok) throw new Error("Failed to fetch logo");
        const data = await res.json();
        
        // Handle both full URL and relative path cases
        const logoUrl = data.imageUrl.startsWith("http") 
          ? data.imageUrl 
          : `${backendUrl}${data.imageUrl}`;
        
        setLogo(logoUrl);
      } catch (error) {
        console.error("Error fetching logo:", error);
        setLogoError(true);
        // Fallback to default logo in assets
        setLogo(assets.logo);
      } finally {
        setLogoLoading(false);
      }
    };
    fetchLogo();
  }, []);

  // Token validation and expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        logout();
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

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 600000);
    return () => clearInterval(interval);
  }, []);

  // Update userRole when token changes
  useEffect(() => {
    setUserRole(localStorage.getItem("role") || null);
  }, [token]);

  const getWishlistCount = () => (wishlist ? wishlist.length : 0);

  // Animation variants
  const mobileMenuVariants = {
    closed: { opacity: 0, x: "100%" },
    open: { opacity: 1, x: 0 }
  };

  const navLinkVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (i) => ({ 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <nav className="px-4 flex items-center justify-between py-4 font-medium md:px-[7vw] top-0 bg-white w-full z-50 fixed left-0 right-0 shadow-sm">
      {/* Logo */}
      <Link to="/" className="relative z-10">
        {logoLoading ? (
          <motion.div 
            className="w-32 h-10 bg-gray-100 rounded animate-pulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : logoError ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold"
          >
            MyStore
          </motion.div>
        ) : (
          <motion.img
            src={logo}
            className="object-contain h-12 cursor-pointer"
            alt="Logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={() => {
              setLogoError(true);
              setLogo(assets.logo);
            }}
          />
        )}
      </Link>

      {/* Desktop Navigation Links */}
      <ul className="hidden gap-8 text-sm text-gray-700 lg:flex">
        {navbarLinks.map((link, index) => (
          <motion.li
            key={link._id}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={navLinkVariants}
          >
            <NavLink 
              to={link.path} 
              className={({ isActive }) => 
                isActive 
                  ? "text-black font-semibold relative after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:h-0.5 after:w-full after:bg-black after:transition-all" 
                  : "hover:text-black transition-colors duration-300"
              }
            >
              {link.name}
            </NavLink>
          </motion.li>
        ))}
      </ul>

      {/* Right Side Icons */}
      <div className="flex items-center gap-6">
        {/* Not Logged In Indicator */}
        <AnimatePresence>
          {!token && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="items-center hidden px-3 py-1 text-xs font-medium text-red-600 rounded-full md:flex bg-red-50"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
              Not logged in
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart & Wishlist (Hidden for Admin) */}
        {userRole !== "admin" && (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:block"
            >
              <Link 
                to="/cart" 
                className="relative block p-2 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Cart"
              >
                <img
                  src={assets.cart_icon}
                  className="w-5 h-5"
                  alt="Cart"
                />
                {getCartCount() > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[8px]">
                    {getCartCount()}
                  </span>
                )}
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden lg:block"
            >
              <Link 
                to="/wishlist" 
                className="relative block p-2 transition-colors rounded-full hover:bg-gray-100"
                aria-label="Wishlist"
              >
                <img
                  src={assets.wishlist_icon}
                  className="w-5 h-5"
                  alt="Wishlist"
                />
                {getWishlistCount() > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[8px]">
                    {getWishlistCount()}
                  </span>
                )}
              </Link>
            </motion.div>
          </>
        )}

        {/* Vertical Divider (desktop only) */}
        <div className="hidden lg:block h-8 w-px bg-gray-200 mx-2"></div>

        {/* Profile Icon & Dropdown - Always at far right on desktop, hidden on mobile */}
        <div className="relative ml-2 hidden lg:block" ref={profileDropdownRef}>
          <motion.button
            onClick={() => {
              if (token) {
                setProfileDropdownOpen(!profileDropdownOpen);
              } else {
                navigate("/login");
              }
            }}
            className="p-1.5 transition-colors rounded-full hover:bg-gray-100 border border-gray-200 shadow-sm"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.97 }}
            aria-label="Profile"
          >
            {token && user && user.profilePicture ? (
              <img
                src={user.profilePicture}
                className="w-8 h-8 object-cover rounded-full border border-gray-300 shadow-sm"
                alt="Profile"
              />
            ) : token && user && user.firstName ? (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-base border border-gray-300 shadow-sm">
                {user.firstName[0]}
              </div>
            ) : (
              <img
                src={assets.profile_icon}
                className="w-6 h-6"
                alt="Profile"
              />
            )}
          </motion.button>
          
          {token && profileDropdownOpen && (
            <div className="absolute right-0 z-20 pt-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-1 py-2 bg-white border border-gray-100 rounded-md shadow-lg"
              >
                <div className="flex flex-col w-36">
                  <motion.button
                    onClick={() => {
                      navigate("/profile");
                      setProfileDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-left transition-colors rounded-md hover:bg-gray-50"
                    whileHover={{ x: 3 }}
                  >
                    Profile
                  </motion.button>
                  
                  {userRole !== "admin" && (
                    <motion.button
                      onClick={() => {
                        navigate("/orders");
                        setProfileDropdownOpen(false);
                      }}
                      className="px-4 py-2 text-sm text-left transition-colors rounded-md hover:bg-gray-50"
                      whileHover={{ x: 3 }}
                    >
                      Orders
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="px-4 py-2 text-sm text-left text-red-600 transition-colors rounded-md hover:bg-red-50"
                    whileHover={{ x: 3 }}
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 transition-colors rounded-full hover:bg-gray-100 lg:hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Menu"
        >
          {!mobileMenuOpen ? (
            <img
              src={assets.menu_icon}
              className="w-5 h-5"
              alt="Menu"
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          )}
        </motion.button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed inset-0 z-40 flex justify-end bg-black/30"
            ref={dropdownRef}
          >
            <div className="flex flex-col h-full w-full max-w-xs bg-white px-4 pt-8 pb-6 rounded-l-2xl shadow-2xl overflow-y-auto relative">
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Profile Section */}
              <div className="mb-6">
                <h3 className="mb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</h3>
                {token ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    {user && user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        className="w-10 h-10 object-cover rounded-full"
                        alt="Profile"
                      />
                    ) : user && user.firstName && user.lastName ? (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-sm">
                        {user.firstName[0] + user.lastName[0]}
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                        <img
                          src={assets.profile_icon}
                          className="w-5 h-5"
                          alt="Profile"
                        />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {user && (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "My Account"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user && user.email ? user.email : "Welcome back"}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-3 text-sm text-red-600 rounded-lg border border-red-200 bg-red-50">
                    <span className="w-2 h-2 mr-3 bg-red-500 rounded-full"></span>
                    <div>
                      <div className="font-medium">Not logged in</div>
                      <div className="text-xs text-red-500">Please sign in to continue</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {token && (
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-8">
                    {/* Profile Button */}
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
                      className="flex flex-col items-center p-2 transition-colors rounded-full hover:bg-gray-100"
                    >
                      <img
                        src={assets.profile_icon}
                        className="w-6 h-6 mb-1"
                        alt="Profile"
                      />
                      <span className="text-xs text-gray-700">Profile</span>
                    </button>

                    {/* Cart Button (non-admin only) */}
                    {userRole !== "admin" && (
                      <button
                        onClick={() => {
                          navigate("/cart");
                          setMobileMenuOpen(false);
                        }}
                        className="relative flex flex-col items-center p-2 transition-colors rounded-full hover:bg-gray-100"
                      >
                        <img
                          src={assets.cart_icon}
                          className="w-6 h-6 mb-1"
                          alt="Cart"
                        />
                        <span className="text-xs text-gray-700">Cart</span>
                        {getCartCount() > 0 && (
                          <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[10px]">
                            {getCartCount()}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Wishlist Button (non-admin only) */}
                    {userRole !== "admin" && (
                      <button
                        onClick={() => {
                          navigate("/wishlist");
                          setMobileMenuOpen(false);
                        }}
                        className="relative flex flex-col items-center p-2 transition-colors rounded-full hover:bg-gray-100"
                      >
                        <img
                          src={assets.wishlist_icon}
                          className="w-6 h-6 mb-1"
                          alt="Wishlist"
                        />
                        <span className="text-xs text-gray-700">Wishlist</span>
                        {getWishlistCount() > 0 && (
                          <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center bg-black text-white rounded-full text-[10px]">
                            {getWishlistCount()}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Orders Button (non-admin only) */}
                    {userRole !== "admin" && (
                      <button
                        onClick={() => {
                          navigate("/orders");
                          setMobileMenuOpen(false);
                        }}
                        className="flex flex-col items-center p-2 transition-colors rounded-full hover:bg-gray-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        <span className="text-xs text-gray-700">Orders</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Section */}
              <div className="mb-6">
                <h3 className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Navigation</h3>
                <ul className="space-y-1">
                  {navbarLinks.map((link, i) => (
                    <motion.li 
                      key={link._id}
                      custom={i}
                      variants={navLinkVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <NavLink 
                        to={link.path} 
                        className={({ isActive }) => 
                          isActive 
                            ? "block px-3 py-2 rounded-md bg-black text-white font-medium" 
                            : "block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        }
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.name}
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Logout Button (if logged in) */}
              {token && (
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;