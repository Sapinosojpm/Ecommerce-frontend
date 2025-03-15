import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLoginButton from '../components/FacebookLoginButton';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { setRole, token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [captchaValue, setCaptchaValue] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (token) {
      navigate('/'); // Redirect to homepage/dashboard if logged in
    }
  }, [token, navigate]);

  const handleGoogleLoginSuccess = async (response) => {
    console.log('Google login response:', response);
    const { credential } = response;

    if (!credential) {
      toast.error('Google login credential not found');
      return;
    }

    try {
      setLoading(true);
      const backendResponse = await axios.post(`${backendUrl}/api/user/google-login`, {
        token: credential,
      });

      if (backendResponse.data.success) {
        setToken(backendResponse.data.token);
        setRole(backendResponse.data.role);
        localStorage.setItem('token', backendResponse.data.token);
        localStorage.setItem('role', backendResponse.data.role);
        toast.success('Logged in successfully with Google!');
        navigate('/'); // Navigate to home after successful login
      } else {
        toast.error(backendResponse.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to login with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if ((currentState === 'Login' || currentState === 'Sign Up') && !captchaValue) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    try {
      setLoading(true);
      let response;
      if (currentState === 'Sign Up') {
        response = await axios.post(backendUrl + '/api/user/register', {
          firstName,
          lastName,
          email,
          password,
          captcha: captchaValue,
        });
      } else {
        response = await axios.post(backendUrl + '/api/user/login', {
          email,
          password,
          captcha: captchaValue,
        });
      }

      if (response.data.success) {
        setToken(response.data.token);
        setRole(response.data.role);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        toast.success('Logged in successfully!');
        navigate('/'); // Redirect to home page/dashboard after login
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="bg-white shadow-lg rounded-lg p-8 w-[90%] sm:max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-8 border border-black">
        {/* Traditional Login Section */}
        <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center text-black">{currentState}</h2>

          {currentState === "Sign Up" && (
            <>
              <input
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                type="text"
                className="w-full px-3 py-2 border border-black rounded bg-white text-black placeholder-black"
                placeholder="First Name"
                required
              />
              <input
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
                type="text"
                className="w-full px-3 py-2 border border-black rounded bg-white text-black placeholder-black"
                placeholder="Last Name"
                required
              />
            </>
          )}

          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="w-full px-3 py-2 border border-black rounded bg-white text-black placeholder-black"
            placeholder="Email"
            required
          />

          {currentState !== "Forgot Password" && (
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              className="w-full px-3 py-2 border border-black rounded bg-white text-black placeholder-black"
              placeholder="Password"
              required
            />
          )}

          <div className="w-full flex justify-between text-sm">
            {currentState === "Login" && (
              <p onClick={() => setCurrentState("Forgot Password")} className="cursor-pointer text-black underline">
                Forgot your password?
              </p>
            )}
            {currentState === "Login" ? (
              <p onClick={() => setCurrentState("Sign Up")} className="cursor-pointer text-black underline">
                Create account
              </p>
            ) : (
              <p onClick={() => setCurrentState("Login")} className="cursor-pointer text-black underline">
                Login Here
              </p>
            )}
          </div>

          {(currentState === "Login" || currentState === "Sign Up") && (
            <ReCAPTCHA
              sitekey="6Lck2tUqAAAAAHYkl_8iLMk2RYfoTQj9k6fM508F"
              onChange={(value) => setCaptchaValue(value)}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className={`bg-black text-white font-light px-4 py-2 rounded ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
            }`}
          >
            {loading ? "Processing..." : currentState === "Login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Google & Facebook Login Section */}
        <div className="w-full flex flex-col items-center justify-center border-l border-black px-6">
          <h2 className="text-md font-semibold mb-4 text-black">Or continue with</h2>
          <div className="w-full">
            <FacebookLoginButton />
          </div>
          <div className="w-full">
            <GoogleOAuthProvider clientId="676896020946-npg2vukngeemscbtlnvid58o77b44mrg.apps.googleusercontent.com">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={() => toast.error("Google login failed. Please try again.")}
                useOneTap
                theme="outline"
                shape="rectangular"
                size="large"
                width="100%"
                disabled={loading}
              />
            </GoogleOAuthProvider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
