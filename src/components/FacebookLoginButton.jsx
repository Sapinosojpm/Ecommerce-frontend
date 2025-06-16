import { useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const FacebookLoginButton = ({ disabled, onLoginSuccess, isSignUp = false }) => {
  const { backendUrl } = useContext(ShopContext);

  // Function to generate a secure random password
  const generateSecurePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)]; // Special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (document.getElementById("facebook-jssdk")) return;

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        window.FB.init({
          appId: "625233860060837", // Your Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });

        // Check login status on load
        window.FB.getLoginStatus((response) => {
          console.log("Facebook login status:", response.status);
        });
      };
    };

    loadFacebookSDK();
  }, []);

  // Handle Facebook login/signup
  const handleFBLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please refresh and try again.");
      return;
    }

    console.log("Starting Facebook login process...");

    window.FB.login(
      (response) => {
        console.log("Facebook login response:", response);
        
        if (response.authResponse) {
          console.log("Auth successful, getting user data...");
          
          // Get user's email and name from Facebook
          window.FB.api('/me', { fields: 'email,name,id' }, (userData) => {
            console.log("Facebook user data:", userData);
            
            if (userData && !userData.error) {
              if (!userData.email) {
                toast.error("Please grant email permission to continue.");
                return;
              }
              
              const generatedPassword = generateSecurePassword();
              handleFBResponse(response.authResponse.accessToken, userData, generatedPassword);
            } else {
              console.error("Facebook API error:", userData?.error);
              toast.error("Failed to get user information from Facebook. Please try again.");
            }
          });
        } else {
          console.log("Facebook login cancelled or failed");
          toast.error("Facebook authentication was cancelled or failed.");
        }
      },
      { 
        scope: "email,public_profile",
        return_scopes: true,
        auth_type: "rerequest" // Force permission dialog
      }
    );
  };

  // Send Facebook token to backend
  const handleFBResponse = async (accessToken, userData, generatedPassword) => {
    try {
      console.log("Sending data to backend:", {
        token: accessToken,
        email: userData.email,
        name: userData.name,
        isSignUp
      });

      toast.info(isSignUp ? "Creating your account..." : "Authenticating with Facebook...");
      
      const endpoint = isSignUp 
        ? `${backendUrl}/api/user/facebook-signup`
        : `${backendUrl}/api/user/facebook-login`;

      const res = await axios.post(endpoint, {
        token: accessToken,
        email: userData.email,
        name: userData.name,
        password: generatedPassword,
        isSignUp,
        facebookId: userData.id
      });

      console.log("Backend response:", res.data);

      if (res.data.success) {
        // Show password information only for new signups
        if (isSignUp) {
          // toast.success(
          //   "Account created successfully!",
          //   { autoClose: 10000 }
          // );
          
          // toast.info(
          //   `Your generated password is: ${generatedPassword}\nPlease save this password for future email login.`,
          //   { 
          //     autoClose: 15000,
          //     closeOnClick: false,
          //     pauseOnHover: true
          //   }
          // );
        }

        // Call the success callback with the response data
        if (onLoginSuccess) {
          onLoginSuccess({
            ...res.data,
            isNewUser: isSignUp
          });
        }
      } else {
        throw new Error(res.data.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Facebook authentication error:", {
        error: error,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error("Invalid Facebook credentials. Please try again.");
      } else if (error.response?.status === 403) {
        toast.error("This Facebook account is already linked to another account.");
      } else if (error.message?.includes("network")) {
        toast.error("Network error. Please check your internet connection.");
      } else if (error.response?.status === 409) {
        toast.error("An account with this email already exists. Please try logging in instead.");
      } else if (error.response?.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error(error.response?.data?.message || "Failed to authenticate with Facebook. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleFBLogin}
      disabled={disabled}
      className={`flex items-center justify-center w-full gap-2 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 rounded-md ${
        disabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#1877F2] hover:bg-[#166FE5]"
      }`}
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.675 0h-21.35C.61 0 0 .61 0 1.36v21.279c0 .749.61 1.361 1.325 1.361H12.82V14.93H9.692v-3.64h3.128V8.412c0-3.1 1.893-4.788 4.659-4.788 1.324 0 2.462.097 2.796.143v3.24l-1.92.001c-1.505 0-1.796.716-1.796 1.764v2.31h3.588l-.467 3.64h-3.121V24h6.126c.725 0 1.325-.612 1.325-1.361V1.36C24 .611 23.4 0 22.675 0z" />
      </svg>
      {isSignUp ? "Sign up with Facebook" : "Sign in with Facebook"}
    </button>
  );
};

export default FacebookLoginButton;
