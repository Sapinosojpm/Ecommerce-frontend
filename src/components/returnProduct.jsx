// Return Product Form Page Component
import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import { FiUpload, FiX, FiCheck, FiChevronDown } from "react-icons/fi";

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
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(!location.state?.orderDetails);
  const [showReasons, setShowReasons] = useState(false);
  
  const returnReasons = [
    { value: "damaged", label: "Product Damaged" },
    { value: "defective", label: "Product Defective" },
    { value: "wrong_item", label: "Wrong Item Received" },
    { value: "not_as_described", label: "Not as Described" },
    { value: "size_issue", label: "Size/Fit Issue" },
    { value: "changed_mind", label: "Changed My Mind" },
    { value: "other", label: "Other" }
  ];

  // Fetch order details if not provided in navigation state
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderDetails && orderId && itemId) {
        try {
          setLoadingDetails(true);
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

  const handleEvidenceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        toast.error("Please upload an image file (JPEG, PNG, GIF)");
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large (max 5MB)");
        return;
      }
      
      setEvidence(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEvidence = () => {
    setEvidence(null);
    setPreview(null);
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
        `${backendUrl}/api/returns/create-return`,
        {
          orderId,
          itemId,
          reason,
          description
        },
        { headers: { token } }
      );
      
      if (returnResponse.data.success) {
        const returnId = returnResponse.data.return._id;
        
        // If there's evidence, upload it
        if (evidence) {
          const formData = new FormData();
          formData.append("images", evidence);
          
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
      
      <div className="max-w-3xl mx-auto overflow-hidden bg-white rounded-lg shadow-sm">
        {orderDetails && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">Order Information</h3>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
              {orderDetails.itemDetails.image && orderDetails.itemDetails.image[0] && (
                <img
                  src={orderDetails.itemDetails.image[0]}
                  alt={orderDetails.itemDetails.name}
                  className="object-cover w-20 h-20 rounded-md"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">{orderDetails.itemDetails.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Quantity:</span> {orderDetails.itemDetails.quantity}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "PHP",
                    }).format(orderDetails.itemDetails.price)}
                  </div>
                  <div>
                    <span className="font-medium">Order Date:</span> {new Date(orderDetails.orderDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Order ID:</span> {orderDetails.orderId.slice(-8)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Reason for Return*
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReasons(!showReasons)}
                className="flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span>{reason ? returnReasons.find(r => r.value === reason)?.label : "Select a reason"}</span>
                <FiChevronDown className={`transition-transform ${showReasons ? 'transform rotate-180' : ''}`} />
              </button>
              {showReasons && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                  {returnReasons.map((reasonItem) => (
                    <div
                      key={reasonItem.value}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setReason(reasonItem.value);
                        setShowReasons(false);
                      }}
                    >
                      {reasonItem.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Detailed Description*
              <span className="ml-1 text-xs text-gray-500">(Please provide specific details about the issue)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
              placeholder="Describe the issue with the product..."
              required
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Upload Evidence
              <span className="ml-1 text-xs text-gray-500">(Optional but recommended)</span>
            </label>
            
            {preview ? (
              <div className="relative p-4 border border-gray-300 rounded-md">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="object-contain w-full h-48 rounded-md"
                />
                <button
                  type="button"
                  onClick={removeEvidence}
                  className="absolute p-1 text-red-500 bg-white rounded-full shadow-md top-2 right-2 hover:bg-red-50"
                >
                  <FiX size={18} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-8 border-2 border-gray-300 border-dashed rounded-md">
                <div className="flex flex-col items-center text-center">
                  <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
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
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col-reverse gap-4 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason || !description}
              className={`flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading || !reason || !description ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck className="mr-2" />
                  Submit Return Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnProduct;