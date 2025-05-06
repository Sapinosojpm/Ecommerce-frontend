import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ResetPasswordWithOTP = () => {
  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = request, 2 = verify, 3 = reset
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      return toast.error('Please enter your email');
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/request-password-reset-otp`,
        { email: formData.email }
      );

      if (response.data.success) {
        const [name, domain] = formData.email.split('@');
        const masked = `${name[0]}*****@${domain}`;
        setMaskedEmail(masked);

        toast.success(`OTP sent to ${masked}`);
        setStep(2);
      }
    } catch (error) {
      console.error('OTP request error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!formData.otp) {
      return toast.error('Please enter the OTP');
    }

    if (formData.otp.length !== 6) {
      return toast.error('OTP must be 6 digits');
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/verify-reset-otp`,
        {
          email: formData.email,
          otp: formData.otp
        }
      );

      if (response.data.success) {
        toast.success('OTP verified successfully');
        setStep(3);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    if (formData.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    const hasUpperCase = /[A-Z]/.test(formData.newPassword);
    const hasLowerCase = /[a-z]/.test(formData.newPassword);
    const hasNumber = /\d/.test(formData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

    if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
      return toast.error(
        'Password must contain uppercase, lowercase, number, and special character'
      );
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${backendUrl}/api/user/verify-reset-otp`, // Note: Using same endpoint as backend combines verification and reset
        {
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        }
      );

      if (response.data.success) {
        toast.success('Password reset successfully!');
        setTimeout(() => navigate('/login'), 1000);  // Delay to ensure all operations complete
      }
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center">
          {step === 1 ? 'Request Password Reset' :
            step === 2 ? 'Verify OTP' :
              'Reset Password'}
        </h2>

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="mb-4 text-sm text-gray-600">
              We sent a 6-digit OTP to {maskedEmail || 'your email'}
            </p>

            <div>
              <label htmlFor="otp" className="block mb-1 text-sm font-medium">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                maxLength="6"
                pattern="\d{6}"
                inputMode="numeric"
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to Email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block mb-1 text-sm font-medium">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-1 text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="text-sm text-gray-600">
              <p>Password must contain:</p>
              <ul className="pl-5 mt-1 list-disc">
                <li>At least 8 characters</li>
                <li>Uppercase and lowercase letters</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordWithOTP;