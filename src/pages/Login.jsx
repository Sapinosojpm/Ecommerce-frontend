import React, { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import ReCAPTCHA from "react-google-recaptcha";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLoginButton from "../components/FacebookLoginButton";
import validator from "validator";
import OTPVerification from "../components/OTPVerification";
import { useLocation } from "react-router-dom"; // Add this import
import {
  countryCodes,
  formatPhoneNumber,
  getPlaceholder,
  getPattern,
  getMaxLength,
} from "../assets/countryCodes";
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
  const location = useLocation(); // Get location to extract URL parameters
  const [currentState, setCurrentState] = useState("Login");
  const { setRole, token, setToken, navigate, backendUrl, setCartItems } =
    useContext(ShopContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    userId: "",
  });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [captchaError, setCaptchaError] = useState(null);
  const recaptchaRef = React.useRef();
  const [loading, setLoading] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+63");
  const [showCountryList, setShowCountryList] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [filteredCountries, setFilteredCountries] = useState([]);

  // Sort countries by name and group by region
  const sortedCountries = useMemo(() => {
    const regions = {
      Popular: ["+63", "+1", "+44", "+61", "+86", "+91"], // Most used countries
      Asia: countryCodes.filter(
        (c) => c.code.startsWith("+8") || c.code.startsWith("+9")
      ),
      Europe: countryCodes.filter(
        (c) => c.code.startsWith("+3") || c.code.startsWith("+4")
      ),
      Americas: countryCodes.filter(
        (c) => c.code.startsWith("+1") || c.code.startsWith("+5")
      ),
      Oceania: countryCodes.filter((c) => c.code.startsWith("+6")),
      Africa: countryCodes.filter((c) => c.code.startsWith("+2")),
    };

    // Sort each region's countries by name
    Object.keys(regions).forEach((region) => {
      if (region === "Popular") {
        regions[region] = regions[region].map((code) =>
          countryCodes.find((c) => c.code === code)
        );
      } else {
        regions[region].sort((a, b) => a.country.localeCompare(b.country));
      }
    });

    return regions;
  }, []);

  // Update filtered countries when search changes
  useEffect(() => {
    if (searchCountry) {
      const filtered = countryCodes.filter(
        (country) =>
          country.country.toLowerCase().includes(searchCountry.toLowerCase()) ||
          country.code.includes(searchCountry)
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries([]);
    }
  }, [searchCountry]);

  // Extract reset token from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      console.log("Reset token found in URL:", token.substring(0, 10) + "...");
      setResetToken(token);
      setCurrentState("Reset Password");
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update phone input handler
  const handlePhoneChange = (e) => {
    // Remove all non-digit characters
    const rawDigits = e.target.value.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      phone: rawDigits,
    }));
  };

  // Add country code selection handler
  const handleCountrySelect = (code) => {
    setSelectedCountryCode(code);
    setShowCountryList(false);
    setSearchCountry("");
    // Clear phone number when country changes
    setFormData((prev) => ({ ...prev, phone: "" }));
  };

  // Handle successful login (common function for all login methods)
  const handleLoginSuccess = async (data) => {
    try {
      // Store token and user data
      setToken(data.token);
      setRole(data.role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      const userId = data.userId || data.user?._id || data.id;
      if (userId) {
        localStorage.setItem("userId", userId);
      }

      // Fetch cart data
      try {
        const cartResponse = await axios.get(`${backendUrl}/api/cart/get`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
          params: {
            userId: userId,
          },
        });

        if (cartResponse.data.success) {
          setCartItems(cartResponse.data.cartData || {});
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setCartItems({});
      }

      toast.success("Login successful! Redirecting...");
      navigate("/");
    } catch (error) {
      console.error("Login success error:", error);
      toast.error("Error during login process. Please try again.");
    }
  };

  // Handle Facebook login/signup success
  const handleFacebookLoginSuccess = async (data) => {
    try {
      if (data.isNewUser) {
        toast.success("Account created successfully with Facebook!");
      }
      await handleLoginSuccess(data);
    } catch (error) {
      console.error("Facebook login error:", error);
      toast.error("Failed to complete Facebook login. Please try again.");
    }
  };

  // Handle Google login/signup success
  const handleGoogleLoginSuccess = async (response) => {
    try {
      setLoading(true);
      const { credential } = response;

      if (!credential) {
        throw new Error("Google authentication failed. Please try again.");
      }

      console.log("Starting Google authentication process...");
      console.log("Current state:", currentState);

      const endpoint = `${backendUrl}/api/auth/google-auth`;

      const backendResponse = await axios.post(endpoint, {
        token: credential,
        isSignUp: currentState === "Sign Up",
      });

      console.log("Backend response:", backendResponse.data);

      if (backendResponse.data.success) {
        if (currentState === "Sign Up") {
          toast.success("Account created successfully with Google!");
        }
        await handleLoginSuccess(backendResponse.data);
      } else {
        throw new Error(
          backendResponse.data.message || "Google authentication failed"
        );
      }
    } catch (error) {
      console.error("Google authentication error:", {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Handle specific error cases
      if (error.response?.status === 404) {
        toast.error("No account found. Please sign up first.");
      } else if (error.response?.status === 409) {
        toast.error(
          "An account with this email already exists. Please try logging in instead."
        );
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to authenticate with Google. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP verification success handler
  const handleOtpVerificationSuccess = () => {
    setOtpVerified(true);
    toast.success("Phone number verified successfully!");

    // If this is part of login flow, fetch cart data
    if (currentState === "Login") {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (userId && token) {
          fetchUserCart(userId, token);
        }
      } catch (error) {
        console.error("Error in verification success:", error);
      }
    }
  };

  // Helper function to fetch user cart
  const fetchUserCart = async (userId, token) => {
    try {
      const cartResponse = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          userId,
        },
      });

      if (cartResponse.data.success) {
        setCartItems(cartResponse.data.cartData || {});
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // Complete registration after OTP verification
  const handleCompleteRegistration = async () => {
    try {
      setLoading(true);
      toast.info("Finalizing your registration...");
      const completeResponse = await axios.post(
        `${backendUrl}/api/user/complete-registration`,
        {
          userId: formData.userId,
          phone: formData.phone,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }
      );
      handleLoginSuccess(completeResponse.data);
      toast.success("Registration complete! Welcome to our platform.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to complete registration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Validate form data with more helpful messages
  const validateForm = () => {
    // Sign Up validation
    if (currentState === "Sign Up") {
      // Name validation
      if (!formData.firstName.trim()) {
        toast.error("Please enter your first name");
        return false;
      }
      if (!formData.lastName.trim()) {
        toast.error("Please enter your last name");
        return false;
      }

      // Email validation
      if (!formData.email) {
        toast.error("Email address is required");
        return false;
      }
      if (!validator.isEmail(formData.email)) {
        toast.error(
          "Please enter a valid email address (e.g., user@example.com)"
        );
        return false;
      }

      // Password validation
      if (!formData.password) {
        toast.error("Password is required");
        return false;
      }
      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters long");
        return false;
      }

      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

      if (!hasUpperCase || !hasLowerCase) {
        toast.error(
          "Password must contain both uppercase and lowercase letters"
        );
        return false;
      }

      if (!hasNumbers) {
        toast.error("Password must contain at least one number");
        return false;
      }

      if (!hasSpecialChar) {
        toast.error("Password must contain at least one special character");
        return false;
      }

      // Phone validation
      if (!formData.phone) {
        toast.error("Phone number is required for verification");
        return false;
      }
      // Combine country code and phone digits
      const fullPhone = `${selectedCountryCode}${formData.phone}`;
      if (!/^\+?[1-9]\d{9,14}$/.test(fullPhone)) {
        toast.error(
          "Please enter a valid phone number with country code (e.g., +639834567890)"
        );
        return false;
      }

      // CAPTCHA validation
      if (!captchaValue) {
        toast.error("Please complete the CAPTCHA verification");
        return false;
      }
    }
    // Login validation
    else if (currentState === "Login" && !isPhoneLogin) {
      if (!formData.email) {
        toast.error("Please enter your email address");
        return false;
      }
      if (!validator.isEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      if (!formData.password) {
        toast.error("Please enter your password");
        return false;
      }
      if (!captchaValue) {
        toast.error("Please complete the CAPTCHA verification");
        return false;
      }
    }

    // Forgot Password validation
    else if (currentState === "Forgot Password") {
      if (!formData.email) {
        toast.error("Please enter your email address");
        return false;
      }
      if (!validator.isEmail(formData.email)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    }
    // Add before the axios.post call in handleSubmit
    console.log("Sending login data:", {
      email: formData.email,
      password: formData.password,
      captcha: captchaValue,
    });

    return true;
  };

  // Show a friendly message with potential solutions based on error
  // Add this temporarily to your handleAuthError function to see the exact server response
  const handleAuthError = (error) => {
    console.error("Authentication error:", error);

    // ADD THESE DEBUG LINES:
    console.log("=== DEBUG ERROR DETAILS ===");
    console.log("Status:", error.response?.status);
    console.log("Response data:", error.response?.data);
    console.log("Response headers:", error.response?.headers);
    console.log("Error message from server:", error.response?.data?.message);
    console.log("============================");

    // Extract relevant error information
    const errorResponse = error.response;
    const errorStatus = errorResponse?.status;
    const errorMessage = errorResponse?.data?.message;

    // Handle specific known error cases with helpful messages
    if (errorStatus === 401) {
      toast.error(
        "Invalid email or password. Please check your credentials and try again."
      );
    } else if (errorStatus === 403) {
      toast.error(
        "Your account is locked. Please contact customer support for assistance."
      );
    } else if (errorStatus === 404 && currentState === "Login") {
      toast.error(
        "We couldn't find an account with that email. Please check your email or create a new account."
      );
    } else if (errorStatus === 429) {
      toast.error(
        "Too many login attempts. Please try again after a few minutes."
      );
    } else if (errorMessage && errorMessage.toLowerCase().includes("captcha")) {
      toast.error("CAPTCHA verification failed. Please try again.");
    } else if (errorMessage && errorMessage.toLowerCase().includes("network")) {
      toast.error(
        "Connection issue detected. Please check your internet connection and try again."
      );
    } else if (errorResponse?.data?.errors) {
      // Handle specific field validation errors
      const serverErrors = errorResponse.data.errors;
      Object.entries(serverErrors).forEach(([field, message]) => {
        toast.error(
          `${field.charAt(0).toUpperCase() + field.slice(1)}: ${message}`
        );
      });
    } else {
      // Generic error message as fallback
      toast.error(
        errorMessage ||
          "Unable to process your request. Please try again in a few moments."
      );
    }
  };

  // Add this function after the existing state declarations
  const resetCaptcha = () => {
    setCaptchaValue(null);
    setCaptchaError(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  // Main form submit handler
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Reset any previous CAPTCHA errors
    setCaptchaError(null);

    // Handle password reset form separately
    if (currentState === "Reset Password") {
      await handlePasswordReset(event);
      return;
    }

    // Validate form data before submission
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Handle Sign Up flow
      if (currentState === "Sign Up") {
        if (otpVerified) {
          await handleCompleteRegistration();
          return;
        }

        if (registrationPending && showOtpField) {
          return;
        }

        toast.info("Processing your registration...");
        const response = await axios.post(`${backendUrl}/api/user/register`, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          phone: formData.phone.trim(),
          captcha: captchaValue,
        });

        if (response.data.needsVerification) {
          setRegistrationPending(true);
          setShowOtpField(true);
          setFormData((prev) => ({
            ...prev,
            userId: response.data.tempUserData._id,
            email: response.data.tempUserData.email,
            password: response.data.tempUserData.password,
            firstName: response.data.tempUserData.firstName,
            lastName: response.data.tempUserData.lastName,
          }));
          await handleSendOTP();
          toast.success(
            "Verification code sent! Please check your phone to complete registration."
          );
          return;
        }

        if (response.data.success) {
          handleLoginSuccess(response.data);
          toast.success(
            "Account created successfully! Welcome to our platform."
          );
        }
        return;
      }

      // Handle Forgot Password flow
      if (currentState === "Forgot Password") {
        toast.info("Sending password reset instructions...");
        const response = await axios.post(
          `${backendUrl}/api/user/reset-password`,
          { email: formData.email }
        );
        toast.success(
          response.data.message ||
            "Password reset link sent! Please check your email inbox."
        );
        return;
      }

      // Regular email login
      toast.info("Authenticating...");
      const response = await axios.post(`${backendUrl}/api/user/login`, {
        email: formData.email,
        password: formData.password,
        captcha: captchaValue,
      });

      if (response.data.success) {
        handleLoginSuccess(response.data);
        toast.success("Login successful! Redirecting...");
      }
    } catch (error) {
      handleAuthError(error);

      // Handle CAPTCHA specific errors
      if (error.response?.data?.message?.toLowerCase().includes("captcha")) {
        setCaptchaError(error.response.data.message);
        resetCaptcha();
      }

      // Reset verification state if needed
      if (error.response?.data?.needsVerification === false) {
        setRegistrationPending(false);
        setShowOtpField(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form fields based on current state
  const renderFormFields = () => {
    switch (currentState) {
      case "Sign Up":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <input
                name="firstName"
                onChange={handleInputChange}
                value={formData.firstName}
                type="text"
                className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="First Name"
                required
                disabled={registrationPending && showOtpField}
              />
              <input
                name="lastName"
                onChange={handleInputChange}
                value={formData.lastName}
                type="text"
                className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Last Name"
                required
                disabled={registrationPending && showOtpField}
              />
            </div>
            <input
              name="email"
              onChange={handleInputChange}
              value={formData.email}
              type="email"
              className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              required
              disabled={registrationPending && showOtpField}
            />
            <div className="relative">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCountryList(!showCountryList)}
                  className="flex items-center px-3 py-2 space-x-2 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-xl">
                    {
                      countryCodes.find((c) => c.code === selectedCountryCode)
                        ?.flag
                    }
                  </span>
                  <span className="text-gray-700">{selectedCountryCode}</span>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder={getPlaceholder(selectedCountryCode)}
                  maxLength={getMaxLength(selectedCountryCode)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Country List Dropdown */}
              {showCountryList && (
                <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg w-72">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      placeholder="Search country..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-60">
                    {searchCountry
                      ? // Show filtered results
                        filteredCountries.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => handleCountrySelect(country.code)}
                            className="flex items-center w-full px-4 py-2 space-x-3 text-left hover:bg-gray-50"
                          >
                            <span className="text-xl">{country.flag}</span>
                            <span className="text-gray-700">
                              {country.country}
                            </span>
                            <span className="ml-auto text-gray-500">
                              {country.code}
                            </span>
                          </button>
                        ))
                      : // Show grouped results
                        Object.entries(sortedCountries).map(
                          ([region, countries]) => (
                            <div key={region}>
                              <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50">
                                {region}
                              </div>
                              {countries.map((country) => (
                                <button
                                  key={country.code}
                                  onClick={() =>
                                    handleCountrySelect(country.code)
                                  }
                                  className="flex items-center w-full px-4 py-2 space-x-3 text-left hover:bg-gray-50"
                                >
                                  <span className="text-xl">
                                    {country.flag}
                                  </span>
                                  <span className="text-gray-700">
                                    {country.country}
                                  </span>
                                  <span className="ml-auto text-gray-500">
                                    {country.code}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )
                        )}
                  </div>
                </div>
              )}
            </div>
            <input
              name="password"
              onChange={handleInputChange}
              value={formData.password}
              type="password"
              className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              required
              minLength={8}
              disabled={registrationPending && showOtpField}
            />

            {registrationPending && showOtpField && (
              <OTPVerification
                phone={formData.phone}
                userId={formData.userId}
                onVerificationSuccess={handleOtpVerificationSuccess}
                backendUrl={backendUrl}
                onBack={() => {
                  setRegistrationPending(false);
                  setShowOtpField(false);
                  setOtpVerified(false);
                }}
                isRegistration={true}
                initialFormData={formData}
                onShowSignUpButton={handleOtpVerificationSuccess}
              />
            )}
          </>
        );
      case "Forgot Password":
        return (
          <input
            name="email"
            onChange={handleInputChange}
            value={formData.email}
            type="email"
            className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            required
          />
        );
      case "Reset Password":
        return (
          <>
            <input
              name="newPassword"
              onChange={(e) => setNewPassword(e.target.value)}
              value={newPassword}
              type="password"
              className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="New Password"
              required
              minLength={8}
            />
            <input
              name="confirmPassword"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              type="password"
              className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm New Password"
              required
              minLength={8}
            />
          </>
        );
      default: // Login
        return (
          <>
            {!isPhoneLogin ? (
              <>
                <input
                  name="email"
                  onChange={handleInputChange}
                  value={formData.email}
                  type="email"
                  className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                  required
                />
                <input
                  name="password"
                  onChange={handleInputChange}
                  value={formData.password}
                  type="password"
                  className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  required
                />
                {/* <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsPhoneLogin(true)}
                    className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none"
                  >
                    Login with Phone Number
                  </button>
                </div> */}
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCountryList(!showCountryList)}
                      className="flex items-center px-3 py-2 text-black bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="mr-2">
                        {
                          countryCodes.find(
                            (c) => c.code === selectedCountryCode
                          )?.flag
                        }
                      </span>
                      <span>{selectedCountryCode}</span>
                      <svg
                        className="w-4 h-4 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <input
                      name="phone"
                      onChange={handlePhoneChange}
                      value={formData.phone}
                      type="tel"
                      className="flex-1 px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={getPlaceholder(selectedCountryCode)}
                      required
                      maxLength={getMaxLength(selectedCountryCode)}
                      pattern={getPattern(selectedCountryCode)}
                      disabled={showOtpField}
                    />
                  </div>
                </div>
                {showOtpField ? (
                  <OTPVerification
                    phone={formData.phone}
                    onVerificationSuccess={handleLoginSuccess}
                    backendUrl={backendUrl}
                    onBack={() => {
                      setIsPhoneLogin(false);
                      setShowOtpField(false);
                    }}
                  />
                ) : (
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhoneLogin(false);
                        setShowOtpField(false);
                      }}
                      className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none"
                    >
                      Back to Email Login
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        );
    }
  };

  // Render footer links based on current state
  const renderFooterLinks = () => {
    if (currentState === "Login") {
      return (
        <div className="flex justify-between w-full text-sm">
          <button
            type="button"
            onClick={() => navigate("/reset-password")} // Update this to your route
            className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Forgot password?
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentState("Sign Up");
              setOtpVerified(false);
            }}
            className="text-blue-600 underline hover:text-blue-800 focus:outline-none"
          >
            Create account
          </button>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setCurrentState("Login");
          setIsPhoneLogin(false);
          setShowOtpField(false);
          setRegistrationPending(false);
          setOtpVerified(false);
        }}
        className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none"
      >
        Back to login
      </button>
    );
  };

  // Render submit button with appropriate label
  const renderSubmitButton = () => {
    // Don't show button during certain states
    if (
      (registrationPending && otpVerified) ||
      (isPhoneLogin && showOtpField)
    ) {
      return null;
    }

    let buttonText;
    switch (currentState) {
      case "Login":
        buttonText = "Sign In";
        break;
      case "Sign Up":
        buttonText = "Sign Up";
        break;
      case "Forgot Password":
        buttonText = "Send Reset Link";
        break;
      case "Reset Password":
        buttonText = "Reset Password";
        break;
      default:
        buttonText = "Submit";
    }

    return (
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } flex items-center justify-center`}
      >
        {loading ? (
          <>
            <svg
              className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          buttonText
        )}
      </button>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="grid w-full max-w-4xl grid-cols-1 gap-8 p-8 bg-white border border-gray-200 rounded-lg shadow-xl md:grid-cols-2">
        <div>
          <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
            {currentState}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}

            {renderFooterLinks()}

            {/* Show CAPTCHA for Login and Sign Up with email */}
            {(currentState === "Login" || currentState === "Sign Up") &&
              !isPhoneLogin && (
                <div className="space-y-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={siteKey}
                    onChange={(value) => {
                      setCaptchaValue(value);
                      setCaptchaError(null);
                    }}
                    onExpired={() => {
                      setCaptchaValue(null);
                      setCaptchaError("CAPTCHA expired. Please verify again.");
                    }}
                    onError={() => {
                      setCaptchaValue(null);
                      setCaptchaError("CAPTCHA error. Please try again.");
                    }}
                    className="my-4"
                  />

                  {captchaError && (
                    <p className="text-sm text-red-600">{captchaError}</p>
                  )}
                </div>
              )}

            {renderSubmitButton()}
          </form>
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-l border-gray-200">
          <h3 className="mb-6 text-lg font-medium text-gray-700">
            Or {currentState === "Sign Up" ? "sign up" : "continue"} with
          </h3>

          <div className="w-full space-y-4">
            <GoogleOAuthProvider
              clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
            >
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() =>
                  toast.error("Google authentication failed. Please try again.")
                }
                useOneTap
                theme="outline"
                shape="rectangular"
                size="large"
                width="300"
                disabled={loading}
                text={
                  currentState === "Sign Up" ? "signup_with" : "continue_with"
                }
              />
            </GoogleOAuthProvider>

            <FacebookLoginButton
              disabled={loading}
              onLoginSuccess={handleFacebookLoginSuccess}
              isSignUp={currentState === "Sign Up"}
            />
          </div>

          {currentState === "Forgot Password" && (
            <div className="mt-6 text-center text-gray-600">
              <p>
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
