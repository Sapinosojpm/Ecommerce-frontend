import React, { useState, useContext, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";
import {
  FiUpload,
  FiX,
  FiCheck,
  FiChevronDown,
  FiArrowLeft,
  FiAlertCircle,
  FiHelpCircle,
  FiPackage,
  FiCamera,
  FiClock,
} from "react-icons/fi";

// Helper to upload a file to S3 and return the URL
async function uploadToS3(file, token, backendUrl) {
  const presignRes = await fetch(`${backendUrl}/api/upload/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ fileType: file.type }),
  });
  if (!presignRes.ok) throw new Error('Failed to get S3 pre-signed URL');
  const { uploadUrl, fileUrl } = await presignRes.json();
  const s3Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!s3Res.ok) throw new Error('Failed to upload file to S3');
  return fileUrl;
}

const ReturnProduct = () => {
  const { orderId, itemId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, token } = useContext(ShopContext);

  const [orderDetails, setOrderDetails] = useState(
    location.state?.orderDetails || null
  );
  const [returnRequest, setReturnRequest] = useState(null);
  const [returnStatus, setReturnStatus] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(
    !location.state?.orderDetails
  );
  const [showReasons, setShowReasons] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [returnTips, setReturnTips] = useState(false);

  const returnReasons = [
    { value: "damaged", label: "Product Damaged", icon: "🛠️" },
    { value: "defective", label: "Product Defective", icon: "⚠️" },
    { value: "wrong_item", label: "Wrong Item Received", icon: "❓" },
    { value: "not_as_described", label: "Not as Described", icon: "📝" },
    { value: "size_issue", label: "Size/Fit Issue", icon: "📏" },
    { value: "changed_mind", label: "Changed My Mind", icon: "🔄" },
    { value: "other", label: "Other", icon: "✨" },
  ];

  // Fetch order details if not provided in navigation state
  useEffect(() => {
    console.log("🔥 useEffect triggered with:", {
      orderId,
      itemId,
      orderDetails,
    });

    const fetchData = async () => {
      if (orderId && itemId) {
        try {
          setLoadingDetails(true);

          // Always check if return request exists first
          console.log("🔍 Checking if return already exists...");
          const returnCheck = await axios.get(
            `${backendUrl}/api/returns/check-return`,
            {
              params: { orderId, itemId },
              headers: { token },
            }
          );

          console.log("🔙 Return check response:", returnCheck.data);

          if (returnCheck.data.exists) {
            const returnData = returnCheck.data.returnRequest;
            console.log("✅ Return found:", returnData);

            setReturnRequest(returnData);
            setReturnStatus(returnData.status);
            setReason(returnData.reason);
            setDescription(returnData.description);

            setLoadingDetails(false);
            return; // stop here if return request found
          }

          // If no return request, check eligibility
          console.log("🔍 No return found. Checking eligibility...");

          const response = await axios.get(
            `${backendUrl}/api/returns/check-eligibility`,
            {
              params: { orderId, itemId },
              headers: { token },
            }
          );

          console.log("🔙 Eligibility check response:", response.data);

          if (response.data.eligible) {
            console.log(
              "✅ Item is eligible for return. Order details:",
              response.data.orderDetails
            );
            setOrderDetails(response.data.orderDetails);
          } else {
            console.warn("❌ Not eligible for return:", response.data.message);
            toast.error(
              response.data.message || "This item is not eligible for return"
            );
            navigate("/orders");
          }
        } catch (error) {
          console.error("❌ Error fetching data:", error);
          const errorMessage =
            error.response?.data?.message ||
            "Failed to load order details. Redirecting to orders page.";
          toast.error(errorMessage);
          navigate("/orders");
        } finally {
          setLoadingDetails(false);
        }
      } else {
        console.log("ℹ️ Skipping fetchData because missing orderId or itemId");
      }
    };

    fetchData();
  }, [backendUrl, token, orderId, itemId, navigate]);

  const handleEvidenceChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match("image.*")) {
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

  const handleNextStep = () => {
    if (currentStep === 1 && !reason) {
      toast.error("Please select a reason for return");
      return;
    }

    if (currentStep === 2 && !description) {
      toast.error("Please provide a detailed description");
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason for return");
      return;
    }

    if (!description) {
      toast.error("Please provide a detailed description");
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
          description,
        },
        { headers: { token } }
      );

      if (returnResponse.data.success) {
        const returnId = returnResponse.data.return._id;

        // If there's evidence, upload it to S3 and send the S3 URL to the backend
        if (evidence) {
          const s3Url = await uploadToS3(evidence, token, backendUrl);
          await axios.post(
            `${backendUrl}/api/returns/${returnId}/evidence`,
            { imageUrl: s3Url },
            {
              headers: {
                token,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        // Update local state with the new return request
        const newReturn = returnResponse.data.return;
        setReturnRequest(newReturn);
        setReturnStatus(newReturn.status); // Properly set status from new return

        toast.success("Return request submitted successfully!");
      } else {
        toast.error(
          returnResponse.data.message || "Failed to create return request"
        );
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-[7vw]">
      {/* Back button */}
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center mb-6 text-gray-600 transition-colors hover:text-gray-900"
      >
        <FiArrowLeft className="mr-2" />
        <span>Back to Orders</span>
      </button>

      <div className="mb-8">
        <Title text1={"RETURN"} text2={"PRODUCT"} />
      </div>

      {/* Return Status Banner */}
      {returnStatus === "pending" && (
        <div className="max-w-3xl p-6 mx-auto mb-6 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-1">
              <FiClock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-800">
                Return Request Submitted
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Your return request is currently under review by our team.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      SUBMITTED ON
                    </p>
                    <p className="text-sm font-medium">
                      {new Date(returnRequest.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-600">STATUS</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Pending Review
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Only show return form if no pending return exists */}
      {!returnRequest ||
        !["pending", "approved", "processing", "refunded", "rejected"].includes(returnStatus) ? (
        <>
          {/* Progress Indicators */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 bg-white text-gray-500"
                    }`}
                  >
                    {step}
                  </div>
                  <div
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step ? "text-blue-500" : "text-gray-500"
                    }`}
                  >
                    {step === 1 ? "Reason" : step === 2 ? "Details" : "Review"}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative flex items-center justify-between mt-4 mb-8">
              <div className="absolute left-0 right-0 h-1 bg-gray-200">
                <div
                  className="h-1 transition-all duration-300 bg-blue-500"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mb-8 overflow-hidden bg-white rounded-lg shadow-sm">
            {orderDetails && (
              <div className="p-6 border-b border-gray-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-800">
                  Order Information
                </h3>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                  {orderDetails?.itemDetails?.image?.[0] && (
  <img
    src={orderDetails?.itemDetails?.image[0]}
    alt={orderDetails?.itemDetails?.name || "Product image"}
    className="object-cover w-20 h-20 border border-gray-200 rounded-md"
  />
)}

<div className="flex-1">
  <p className="font-medium text-gray-800">
    {orderDetails?.itemDetails?.name}
  </p>
  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
    <div>
      <span className="font-medium">Quantity:</span>{" "}
      {orderDetails?.itemDetails?.quantity}
    </div>
    <div>
      <span className="font-medium">Price:</span>{" "}
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PHP",
      }).format(orderDetails?.itemDetails?.price)}
    </div>
    <div>
      <span className="font-medium">Order Date:</span>{" "}
      {new Date(orderDetails?.orderDate).toLocaleDateString()}
    </div>
    <div>
      <span className="font-medium">Order ID:</span>{" "}
      {orderDetails?.orderId?.slice(-8)}
    </div>
  </div>
</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6">
              {/* Return tips toggle */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setReturnTips(!returnTips)}
                  className="flex items-center text-sm text-blue-600 transition-colors hover:text-blue-700"
                >
                  <FiHelpCircle className="mr-2" />
                  {returnTips ? "Hide return tips" : "Show return tips"}
                </button>

                {returnTips && (
                  <div className="p-4 mt-3 border border-blue-100 rounded-lg bg-blue-50">
                    <h4 className="flex items-center mb-2 font-medium text-blue-800">
                      <FiAlertCircle className="mr-2" />
                      Tips for a successful return request
                    </h4>
                    <ul className="ml-6 space-y-2 text-sm text-blue-700 list-disc">
                      <li>Be specific about the issue with clear details</li>
                      <li>Upload clear photos showing the problem</li>
                      <li>Keep original packaging if possible</li>
                      <li>
                        Include all accessories that came with the product
                      </li>
                      <li>
                        Return requests are typically processed within 1-3
                        business days
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Step 1: Reason Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Reason for Return*
                    </label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {returnReasons.map((reasonItem) => (
                        <div
                          key={reasonItem.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            reason === reasonItem.value
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                              : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                          onClick={() => setReason(reasonItem.value)}
                        >
                          <div className="flex items-center">
                            <div className="mr-4 text-2xl">
                              {reasonItem.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {reasonItem.label}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {reasonItem.value === "damaged" &&
                                  "Product arrived physically damaged"}
                                {reasonItem.value === "defective" &&
                                  "Product doesn't work as expected"}
                                {reasonItem.value === "wrong_item" &&
                                  "Received a different item than ordered"}
                                {reasonItem.value === "not_as_described" &&
                                  "Product differs from description"}
                                {reasonItem.value === "size_issue" &&
                                  "Wrong size or doesn't fit properly"}
                                {reasonItem.value === "changed_mind" &&
                                  "No longer want the product"}
                                {reasonItem.value === "other" &&
                                  "Other reason not listed"}
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                reason === reasonItem.value
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {reason === reasonItem.value && (
                                <FiCheck className="text-xs text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Description and Evidence */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Detailed Description*
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Please describe the issue in detail. For example: 'The product stopped working after 2 days. When I turn it on, the power light flashes but it doesn't function.'"
                      required
                    ></textarea>
                    <p className="mt-2 text-sm text-gray-500">
                      <FiAlertCircle className="inline-block mr-1" />
                      Being specific helps us process your return faster
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Upload Evidence
                      <span className="ml-1 text-xs text-gray-500">
                        (Optional but recommended)
                      </span>
                    </label>

                    {preview ? (
                      <div className="relative p-4 border border-gray-300 rounded-lg bg-gray-50">
                        <img
                          src={preview}
                          alt="Preview"
                          className="object-contain w-full h-64 rounded-md"
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
                      <div className="flex flex-col items-center justify-center p-6 transition-colors border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center text-center">
                          <FiCamera className="w-12 h-12 mb-3 text-gray-400" />
                          <div className="mb-2 text-gray-600">
                            Take a clear photo showing the issue
                          </div>
                          <div className="flex text-sm text-gray-500">
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

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review and Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                      Review Your Return Request
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start pb-4 border-b border-gray-200">
                        <div className="w-24 font-medium text-gray-600">
                          Reason:
                        </div>
                        <div className="flex-1 text-gray-800">
                          {returnReasons.find((r) => r.value === reason)?.icon}{" "}
                          {returnReasons.find((r) => r.value === reason)?.label}
                        </div>
                      </div>

                      <div className="flex items-start pb-4 border-b border-gray-200">
                        <div className="w-24 font-medium text-gray-600">
                          Details:
                        </div>
                        <div className="flex-1 text-gray-800">
                          {description}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-600">
                          Evidence:
                        </div>
                        <div className="flex-1">
                          {preview ? (
                            <div className="mt-1">
                              <img
                                src={preview}
                                alt="Evidence"
                                className="object-cover w-32 h-32 border border-gray-200 rounded-md"
                              />
                            </div>
                          ) : (
                            <span className="text-gray-500">
                              No evidence uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-yellow-100 rounded-lg bg-yellow-50">
                    <div className="flex items-start">
                      <FiAlertCircle className="mt-1 mr-3 text-yellow-500" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">
                          What to expect next:
                        </h4>
                        <ul className="pl-5 mt-2 space-y-1 text-sm text-yellow-700 list-disc">
                          <li>
                            Our team will review your return request within 1-3
                            business days
                          </li>
                          <li>
                            You'll receive an email with the next steps once
                            approved
                          </li>
                          <li>
                            Keep the product and packaging intact until your
                            return is approved
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !reason || !description}
                      className={`flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        loading || !reason || !description
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-2 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
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
                </div>
              )}
            </form>
          </div>
        </>
      ) : (
        /* Show return status details when return exists */
        <div className="max-w-3xl mx-auto">
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-1">
                <div className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-100 rounded-full">
                  <FiPackage className="w-5 h-5" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Return Request Details
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Status
                      </p>
                      <p className="mt-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            returnStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : returnStatus === "approved"
                              ? "bg-green-100 text-green-800"
                              : returnStatus === "refunded"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {returnStatus === "pending"
                            ? "Pending Review"
                            : returnStatus === "approved"
                            ? "Approved"
                            : returnStatus === "refunded"
                            ? "Refund Processed"
                            : returnStatus}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Submitted On
                      </p>
                      <p className="mt-1">
                        {new Date(returnRequest.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Reason
                      </p>
                      <p className="mt-1">
                        {
                          returnReasons.find(
                            (r) => r.value === returnRequest.reason
                          )?.label
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Refund Amount
                      </p>
                      <p className="mt-1">
                        {returnRequest.refundAmount
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "PHP",
                            }).format(returnRequest.refundAmount)
                          : "To be determined"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Description
                    </p>
                    <p className="p-3 mt-1 rounded-md bg-gray-50">
                      {returnRequest.description}
                    </p>
                  </div>

                  {returnRequest.adminNotes && (
                    <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
                      <h4 className="flex items-center text-sm font-medium text-blue-800">
                        <FiAlertCircle className="mr-2" />
                        Admin Notes
                      </h4>
                      <p className="mt-2 text-sm text-blue-700">
                        {returnRequest.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">
              Status History
            </h3>
            <div className="flow-root mt-4">
              <ul className="-mb-8">
                {returnRequest.statusHistory.map(
                  (historyItem, historyItemIdx) => (
                    <li key={historyItem._id}>
                      <div className="relative pb-8">
                        {historyItemIdx !==
                        returnRequest.statusHistory.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span
                              className={`flex items-center justify-center w-8 h-8 rounded-full ring-8 ring-white ${
                                historyItem.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : historyItem.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : historyItem.status === "refunded"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {historyItem.status === "pending" ? (
                                <FiClock className="w-5 h-5" />
                              ) : historyItem.status === "approved" ? (
                                <FiCheck className="w-5 h-5" />
                              ) : historyItem.status === "refunded" ? (
                                <FiCheck className="w-5 h-5" />
                              ) : (
                                <FiAlertCircle className="w-5 h-5" />
                              )}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-800 capitalize">
                                {historyItem.status.replace(/_/g, " ")}
                                {historyItem.notes && (
                                  <span className="ml-1">
                                    - {historyItem.notes}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-sm text-right text-gray-500 whitespace-nowrap">
                              <time dateTime={historyItem.changedAt}>
                                {new Date(
                                  historyItem.changedAt
                                ).toLocaleString()}
                              </time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnProduct;
