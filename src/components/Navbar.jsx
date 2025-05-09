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
    setShowSearch,
    getCartCount,
    navigate,
    token,
    setToken,
    setCartItems,
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
    const interval = setInterval(checkTokenExpiration, 60000);
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

        {userRole === "admin" && (
          <motion.li 
            custom={navbarLinks.length}
            initial="hidden"
            animate="visible"
            variants={navLinkVariants}
          >
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 transition-colors duration-300 hover:text-blue-800"
            >
              Admin Panel
            </a>
          </motion.li>
        )}
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

        {/* Search Icon (Collection Page Only) */}
        {location.pathname === "/collection" && (
          <motion.button
            onClick={() => {
              setShowSearch(true);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="relative p-2 transition-colors rounded-full hover:bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Search"
          >
            <img 
              src={assets.search_icon} 
              className="w-5 h-5" 
              alt="Search" 
            />
          </motion.button>
        )}

        {/* Profile Icon & Dropdown - Fixed Click Issue */}
        <div className="relative" ref={profileDropdownRef}>
          <motion.button
            onClick={() => {
              if (token) {
                setProfileDropdownOpen(!profileDropdownOpen);
              } else {
                navigate("/login");
              }
            }}
            className="p-2 transition-colors rounded-full hover:bg-gray-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Profile"
          >
            <img 
              src={assets.profile_icon} 
              className="w-5 h-5" 
              alt="Profile" 
            />
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

        {/* Cart & Wishlist (Hidden for Admin) */}
        {userRole !== "admin" && (
          <>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
            className="fixed inset-0 z-40 bg-white"
            ref={dropdownRef}
          >
            <div className="flex flex-col h-full px-6 pt-20 overflow-y-auto">
              {!token && (
                <div className="flex items-center px-4 py-4 mb-4 text-sm text-red-600 rounded-lg bg-red-50">
                  <span className="w-2 h-2 mr-2 bg-red-500 rounded-full"></span>
                  You are not logged in
                </div>
              )}
              
              <ul className="mb-8 space-y-4">
                {navbarLinks.map((link, i) => (
                  <motion.li 
                    key={link._id}
                    custom={i}
                    variants={navLinkVariants}
                    initial="hidden"
                    animate="visible"
                    className="py-2 border-b border-gray-100"
                  >
                    <NavLink 
                      to={link.path} 
                      className={({ isActive }) => isActive ? "text-black font-semibold" : "text-gray-600"}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.name}
                    </NavLink>
                  </motion.li>
                ))}
                
                {userRole === "admin" && (
                  <motion.li
                    custom={navbarLinks.length}
                    variants={navLinkVariants}
                    initial="hidden"
                    animate="visible"
                    className="py-2 border-b border-gray-100"
                  >
                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </a>
                  </motion.li>
                )}
              </ul>
              
              {token && (
                <div className="mt-auto mb-12 space-y-3">
                  <h3 className="mb-2 text-sm font-semibold text-gray-400 uppercase">Account</h3>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full py-2 text-gray-700"
                  >
                    <span className="mr-2">
                      <img src={assets.profile_icon} className="w-5 h-5" alt="Profile" />
                    </span>
                    Profile
                  </button>
                  
                  {userRole !== "admin" && (
                    <button
                      onClick={() => {
                        navigate("/orders");
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full py-2 text-gray-700"
                    >
                      <span className="mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      </span>
                      Orders
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center w-full py-2 text-red-600"
                  >
                    <span className="mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                      </svg>
                    </span>
                    Logout
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