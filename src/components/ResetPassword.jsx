import React, { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Use useNavigate here
import axios from 'axios';
import { ShopContext } from '../context/ShopContext'; // Import useContext here

const ResetPassword = () => {
  const { token } = useParams(); // Extract token from URL
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Replace useHistory with useNavigate
  const { backendUrl } = useContext(ShopContext); // Use context for backend URL

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      // Send POST request to backend to reset password
      const response = await axios.post(`${backendUrl}/api/user/reset-password/${token}`, { newPassword });

      if (response.data.success) {
        setSuccess('Password reset successfully!');
        // Optionally redirect after success
        setTimeout(() => {
          navigate('/login'); // Use navigate() for redirect
        }, 2000);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('An error occurred while resetting the password.');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {success && <p className="text-green-600 text-center mb-4">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
