import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { useLocation, Link } from "react-router-dom";
import { toast } from "react-toastify";

const TokenDiagnostic = () => {
  const location = useLocation();
  const { backendUrl } = useContext(ShopContext);
  const [token, setToken] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState("");

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    
    if (urlToken) {
      setToken(urlToken);
      setManualToken(urlToken);
      console.log("Token from URL:", urlToken.substring(0, 10) + "...");
    }
  }, [location]);

  // Test the token against a simple endpoint
  const testToken = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      // Use a simpler endpoint first - just to see if we can reach the backend
      const pingResponse = await axios.get(`${backendUrl}/api/health`);
      
      // Record results
      let diagnosticResults = {
        pingSuccess: true,
        pingResponse: pingResponse.data,
        tokenLength: token.length,
        tokenFirstChars: token.substring(0, 10) + "...",
        tokenLastChars: "..." + token.substring(token.length - 10),
        validationTried: false
      };
      
      // Now try to validate the token
      try {
        const validationResponse = await axios.post(
          `${backendUrl}/api/user/validate-reset-token`, 
          { token }
        );
        
        diagnosticResults = {
          ...diagnosticResults,
          validationTried: true,
          validationSuccess: true,
          validationResponse: validationResponse.data
        };
      } catch (validationError) {
        diagnosticResults = {
          ...diagnosticResults,
          validationTried: true,
          validationSuccess: false,
          validationError: {
            message: validationError.message,
            response: validationError.response?.data || null,
            status: validationError.response?.status || null
          }
        };
      }
      
      setResults(diagnosticResults);
      
    } catch (error) {
      setResults({
        pingSuccess: false,
        error: {
          message: error.message,
          response: error.response?.data || null,
          status: error.response?.status || null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-800">Password Reset Token Diagnostic</h1>
        
        <div className="p-4 mb-6 border border-blue-200 rounded-md bg-blue-50">
          <h2 className="mb-2 text-lg font-medium text-blue-800">Token from URL</h2>
          {token ? (
            <div className="font-mono text-sm break-all">
              <p><strong>Length:</strong> {token.length} characters</p>
              <p><strong>Token:</strong> {token.substring(0, 15)}...{token.substring(token.length - 15)}</p>
            </div>
          ) : (
            <p className="text-blue-700">No token found in URL</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 text-gray-700">Enter or edit token manually:</label>
          <textarea
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            className="w-full h-24 p-2 font-mono text-sm border border-gray-300 rounded-md"
          />
          <div className="mt-2">
            <button
              onClick={() => setToken(manualToken)}
              className="px-4 py-2 text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Use This Token
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <button
            onClick={testToken}
            disabled={loading || !token}
            className={`px-4 py-2 rounded-md ${
              loading || !token
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Testing..." : "Test Token"}
          </button>
        </div>
        
        {results && (
          <div className="p-4 border border-gray-200 rounded-md">
            <h2 className="mb-3 text-lg font-medium">Test Results</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-700">API Connection:</h3>
              {results.pingSuccess ? (
                <p className="text-green-600">✓ Successfully connected to API</p>
              ) : (
                <p className="text-red-600">✗ Failed to connect to API</p>
              )}
            </div>
            
            {results.validationTried && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700">Token Validation:</h3>
                {results.validationSuccess ? (
                  <p className="text-green-600">✓ Token is valid</p>
                ) : (
                  <p className="text-red-600">✗ Token validation failed</p>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium text-gray-700">Raw Results:</h3>
              <pre className="p-3 mt-2 overflow-auto text-xs bg-gray-100 rounded-md max-h-60">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Back to Login Page
          </Link>
          
          <Link to="/reset-password" className="text-blue-600 hover:text-blue-800">
            Go to Reset Password Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TokenDiagnostic;