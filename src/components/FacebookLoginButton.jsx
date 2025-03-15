import { useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const FacebookLoginButton = () => {
  const { setRole, setToken, navigate, backendUrl } = useContext(ShopContext);

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
          appId: "625233860060837", // Replace with your Facebook App ID
          cookie: true,
          xfbml: true,
          version: "v17.0", // Ensure this is a valid version
        });
      };
    };

    loadFacebookSDK();
  }, []);

  // Handle Facebook login
  const handleFBLogin = () => {
    if (!window.FB) {
      toast.error("Facebook SDK not loaded. Please refresh and try again.");
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          handleFBResponse(response.authResponse.accessToken);
        } else {
          toast.error("Facebook login failed.");
        }
      },
      { scope: "email,public_profile" }
    );
  };

  // Send Facebook token to backend
  const handleFBResponse = async (accessToken) => {
    try {
      const res = await axios.post(`${backendUrl}/api/user/facebook-login`, {
        token: accessToken,
      });

      if (res.data.success) {
        setToken(res.data.token);
        setRole(res.data.role);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        toast.success("Logged in successfully with Facebook!");
        navigate("/");
      } else {
        toast.error(res.data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to login with Facebook. Please try again.");
    }
  };

  return (
    <button
      onClick={handleFBLogin}
      className="w-full text-sm flex mb-5 items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-all duration-200"
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.675 0h-21.35C.61 0 0 .61 0 1.36v21.279c0 .749.61 1.361 1.325 1.361H12.82V14.93H9.692v-3.64h3.128V8.412c0-3.1 1.893-4.788 4.659-4.788 1.324 0 2.462.097 2.796.143v3.24l-1.92.001c-1.505 0-1.796.716-1.796 1.764v2.31h3.588l-.467 3.64h-3.121V24h6.126c.725 0 1.325-.612 1.325-1.361V1.36C24 .611 23.4 0 22.675 0z" />
      </svg>
      Sign in with Facebook
    </button>
  );
};

export default FacebookLoginButton;
