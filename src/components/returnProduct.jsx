// Return Product Form Page Component (create a new file: ReturnProduct.jsx)
import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";

const ReturnProduct = () => {
  const { orderId, itemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(ShopContext);
  
  const [orderDetails, setOrderDetails] = useState(
    location.state?.orderDetails || null
  );
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(!location.state?.orderDetails);
  
  // Fetch order details if not provided in navigation state
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderDetails && orderId && itemId) {
        try {
          setLoadingDetails(true);
          // Try to get eligibility check which includes order details
          const response = await axios.get(
            `${backendUrl}/api/returns/check-eligibility`,
            {
              params: { orderId, itemId },
              headers: { token },
            }
          );
          
          if (response.data.eligible) {
            setOrderDetails(response.data.orderDetails);
          } else {
            toast.error(response.data.message || "This item is not eligible for return");
            navigate("/orders");
          }
        } catch (error) {
          console.error("Error fetching order details:", error);
          toast.error("Failed to load order details. Redirecting to orders page.");
          navigate("/orders");
        } finally {
          setLoadingDetails(false);
        }
      }
    };
    
    fetchOrderDetails();
  }, [backendUrl, token, orderId, itemId, orderDetails, navigate]);
  
  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };
  
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };
  
  const handleEvidenceChange = (e) => {
    setEvidence(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error("Please select a reason for return");
      return;
    }
    
    try {
      setLoading(true);
      
      // First create the return request
      const returnResponse = await axios.post(
        `${backendUrl}/api/returns`,
        {
          orderId,
          itemId,
          reason,
          description
        },
        { headers: { token } }
      );
      
      if (returnResponse.data.success) {
        const returnId = returnResponse.data.returnId;
        
        // If there's evidence, upload it
        if (evidence) {
          const formData = new FormData();
          formData.append("evidence", evidence);
          
          await axios.post(
            `${backendUrl}/api/returns/${returnId}/evidence`,
            formData,
            { 
              headers: { 
                token,
                "Content-Type": "multipart/form-data" 
              } 
            }
          );
        }
        
        toast.success("Return request submitted successfully!");
        navigate("/orders");
      } else {
        toast.error(returnResponse.data.message || "Failed to create return request");
      }
    } catch (error) {
      console.error("Error creating return request:", error);
      toast.error(
        error.response?.data?.message || 
        "Failed to submit return request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  
  if (loadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-[7vw]">
      <div className="mb-6">
        <Title text1={"RETURN"} text2={"PRODUCT"} />
      </div>
      
      <div className="max-w-2xl p-6 mx-auto bg-white rounded-lg shadow-sm">
        {orderDetails && (
          <div className="pb-6 mb-6 border-b">
            <h3 className="mb-4 text-lg font-medium">Order Information</h3>
            <div className="flex items-start gap-4">
              {orderDetails.itemDetails.image && orderDetails.itemDetails.image[0] && (
                <img
                  src={orderDetails.itemDetails.image[0]}
                  alt={orderDetails.itemDetails.name}
                  className="object-cover w-20 h-20 rounded"
                />
              )}
              <div>
                <p className="font-medium">{orderDetails.itemDetails.name}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Quantity: {orderDetails.itemDetails.quantity}
                </p>
                <p className="text-sm text-gray-500">
                  Price: {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "PHP",
                  }).format(orderDetails.itemDetails.price)}
                </p>
                <p className="text-sm text-gray-500">
                  Order Date: {new Date(orderDetails.orderDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Reason for Return*
            </label>
            <select
              value={reason}
              onChange={handleReasonChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a reason</option>
              <option value="damaged">Product Damaged</option>
              <option value="defective">Product Defective</option>
              <option value="wrong_item">Wrong Item Received</option>
              <option value="not_as_described">Not as Described</option>
              <option value="size_issue">Size/Fit Issue</option>
              <option value="changed_mind">Changed My Mind</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Detailed Description
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Please provide more details about your return reason..."
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Upload Evidence (optional)
            </label>
            <div className="flex justify-center px-6 py-4 mt-1 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative font-medium text-blue-600 bg-white rounded-md cursor-pointer hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleEvidenceChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
            {evidence && (
              <p className="mt-2 text-sm text-green-600">
                File selected: {evidence.name}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
                loading || !reason ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Submitting..." : "Submit Return Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnProduct;