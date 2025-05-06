import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const OTPVerification = ({
  phone,
  userId,
  onVerificationSuccess,
  backendUrl,
  onBack,
  isRegistration = false,
  initialFormData,
  onShowSignUpButton,
}) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    try {
      setLoading(true);
      
      const verificationResponse = await axios.post(
        `${backendUrl}/api/otp/verify-otp`,
        {
          phone: phone,
          code: otp,
          ...(userId && { userId })
          
        }
      );

      if (!verificationResponse.data.success) {
        throw new Error(verificationResponse.data.message || "OTP verification failed");
      }

      toast.success("OTP verified successfully!");
      setVerified(true);
      
      if (isRegistration) {
        onVerificationSuccess(verificationResponse.data);
        onShowSignUpButton();
      } else {
        const loginResponse = await axios.post(`${backendUrl}/api/user/login`, {
          phone: phone,
          otp: otp
        });
        onVerificationSuccess(loginResponse.data);
      }
      
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!verified ? (
        <>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            type="text"
            className="w-full px-3 py-2 text-black placeholder-gray-500 bg-white border border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter OTP Code"
            required
          />
          <div className="flex justify-between">
            <button
              onClick={handleVerifyOTP}
              disabled={loading || !otp.trim()}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={onBack}
              className="text-sm text-blue-600 underline hover:text-blue-800 focus:outline-none"
            >
              Back
            </button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-green-600">OTP Verified Successfully!</p>
          {isRegistration && (
            <button
              onClick={() => onVerificationSuccess({ verified: true })}
              className="w-full px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
            >
              Complete Registration
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OTPVerification;