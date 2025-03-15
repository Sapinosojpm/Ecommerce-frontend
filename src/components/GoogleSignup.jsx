// src/components/GoogleSignUp.js
import React, { useState } from "react";
import { GoogleLogin } from "react-oauth/google";
import { useHistory } from "react-router-dom";
import axios from "axios";

const GoogleSignUp = () => {
  const [error, setError] = useState("");
  const history = useHistory();

  const handleGoogleSuccess = async (response) => {
    try {
      const { credential } = response;
      const { data } = await axios.post("/api/auth/google", { credential });

      if (data.success) {
        history.push("/dashboard"); // Redirect to a different page after successful login
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleGoogleFailure = (error) => {
    setError("Google sign-up failed. Please try again.");
  };

  return (
    <div>
      <h1>Sign Up with Google</h1>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleFailure}
      />
      {error && <p>{error}</p>}
    </div>
  );
};

export default GoogleSignUp;
