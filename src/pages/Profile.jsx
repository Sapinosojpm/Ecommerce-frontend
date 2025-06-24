import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lenis from "lenis";
import { Camera, Edit3, Save, X, User, MapPin, Mail, Phone, Upload } from "lucide-react";
import addressData from "../data/Philippines.json";

const Profile = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    postalCode: "",
    profilePicture: null,
  });

  const [formData, setFormData] = useState(userDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Dropdown states
  const [region, setRegion] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // scroll effect
  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Load regions from JSON
  useEffect(() => {
    const regionList = Object.entries(addressData).map(([key, value]) => ({
      id: key,
      name: value.region_name,
    }));
    setRegion(regionList);
  }, []);

  // Fetch user details from backend
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError("");
  
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }
  
        const response = await fetch(`${backendUrl}/api/profile`, {
          method: "GET",
          headers: {
            token,
            "Content-Type": "application/json",
          },
        });
  
        if (!response.ok) throw new Error("Failed to fetch user details");
  
        const data = await response.json();
        console.log("Fetched User Data:", data);
  
        // Step 1: Set user details
        setUserDetails(data);
        setFormData(data);
  
        // Step 2: Ensure dropdowns update AFTER state update
        setTimeout(() => {
          updateDropdowns(data);
        }, 100);
  
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserDetails();
  }, []);
  
  useEffect(() => {
    if (userDetails.region) {
      updateDropdowns(userDetails);
    }
  }, [userDetails]);

  const regionMapping = Object.entries(addressData).reduce((acc, [key, value]) => {
    acc[key] = value.region_name;
    return acc;
  }, {});
  
  const updateDropdowns = (data) => {
    console.log("Updating dropdowns with data:", data);
  
    const regionKey = String(data.region);
    console.log("Region Key from User:", regionKey);
    console.log("Available Regions in JSON:", Object.keys(addressData));
  
    // Convert region key to full name
    const regionName = regionMapping[regionKey] || regionKey;
  
    if (!regionName || !Object.values(regionMapping).includes(regionName)) {
      console.error(`Region "${regionKey}" not found in JSON!`);
      return;
    }
  
    // Find the correct region ID (e.g., "07")
    const regionId = Object.keys(regionMapping).find((key) => regionMapping[key] === regionName);
  
    if (!regionId) {
      console.error(`Region "${regionName}" does not match any key!`);
      return;
    }
  
    setProvinces(Object.keys(addressData[regionId]?.province_list || {}));
  
    if (data.province && addressData[regionId]?.province_list[data.province]) {
      setCities(Object.keys(addressData[regionId].province_list[data.province]?.municipality_list || {}));
    } else {
      setCities([]);
    }
  
    if (data.city && addressData[regionId]?.province_list[data.province]?.municipality_list[data.city]) {
      setBarangays(addressData[regionId].province_list[data.province].municipality_list[data.city]?.barangay_list || []);
    } else {
      setBarangays([]);
    }
  };

  useEffect(() => {
    if (userDetails.region) {
      console.log("🔥 Running updateDropdowns with:", userDetails);
      updateDropdowns(userDetails);
    }
  }, [userDetails]);

  // Handle image upload
 const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    setError('Please select a valid image file');
    return;
  }

  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    setError('Image size should be less than 5MB');
    return;
  }

  setUploadingImage(true);
  setError('');

  try {
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    const formDataUpload = new FormData();
    formDataUpload.append('profilePicture', file);

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const response = await fetch(`${backendUrl}/api/profile/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // use standard Bearer token
      },
      body: formDataUpload,
    });

    if (!response.ok) {
      // Try parse JSON error, fallback to default
      let errorMessage = 'Failed to upload image';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Not JSON error response
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    setFormData(prev => ({ ...prev, profilePicture: result.profilePictureUrl }));
    setUserDetails(prev => ({ ...prev, profilePicture: result.profilePictureUrl }));
    toast.success('Profile picture updated successfully!', {
      position: 'top-right',
      autoClose: 3000,
    });

  } catch (error) {
    console.error('Image upload error:', error);
    setError(error.message);
    toast.error(error.message || 'Failed to upload image. Please try again.', {
      position: 'top-right',
      autoClose: 3000,
    });
  } finally {
    setUploadingImage(false);
  }
};

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    console.log(`Changing ${name}:`, value);
  
    setFormData((prev) => {
      let updatedData = { ...prev, [name]: value };
  
      if (name === "region") {
        console.log("Updating provinces for region:", value);
        setProvinces(Object.keys(addressData[String(value)]?.province_list || {}));
        setCities([]);
        setBarangays([]);
        return { ...updatedData, province: "", city: "", barangay: "" };
      }
      if (name === "province") {
        console.log("Updating cities for province:", value);
        setCities(Object.keys(addressData[prev.region]?.province_list[value]?.municipality_list || {}));
        setBarangays([]);
        return { ...updatedData, city: "", barangay: "" };
      }
      if (name === "city") {
        console.log("Updating barangays for city:", value);
        setBarangays(addressData[prev.region]?.province_list[prev.province]?.municipality_list[value]?.barangay_list || []);
        return { ...updatedData, barangay: "" };
      }
  
      return updatedData;
    });
  };
  
  // Handle form submission (update user details)
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const updatedData = {
      ...formData,
      region: String(formData.region),
    };
  
    console.log("🚀 Data being sent to backend:", updatedData);
  
    if (JSON.stringify(userDetails) === JSON.stringify(updatedData)) {
      toast.info("No changes detected.", { position: "top-right", autoClose: 2000 });
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const response = await fetch(`${backendUrl}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token: localStorage.getItem("token"),
        },
        body: JSON.stringify(updatedData),
      });
  
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
  
      console.log("✅ Response from backend:", result);
  
      setUserDetails(result);
      setFormData(result);
      setEditMode(false);
      setImagePreview(null);
  
      toast.success("Profile updated successfully!", { position: "top-right", autoClose: 3000 });
  
    } catch (error) {
      console.error("❌ Profile update error:", error);
      setError(error.message);
      toast.error("Failed to update profile. Please try again.", { position: "top-right", autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  // Get user's first letter of first and last name for avatar
  const getInitials = () => {
    const first = formData.firstName ? formData.firstName.charAt(0).toUpperCase() : "";
    const last = formData.lastName ? formData.lastName.charAt(0).toUpperCase() : "";
    return first + last;
  };
  
  // Render form fields based on active section
  const renderFormFields = () => {
    switch(activeSection) {
      case "personal":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={formData.firstName} 
                  onChange={handleInputChange} 
                  placeholder="First Name" 
                  disabled={!editMode} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={formData.lastName} 
                  onChange={handleInputChange} 
                  placeholder="Last Name" 
                  disabled={!editMode} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="Email" 
                    disabled 
                    className="w-full py-3 pr-4 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed pl-11" 
                  />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    placeholder="Phone Number" 
                    disabled={!editMode} 
                    className="w-full py-3 pr-4 transition-colors border border-gray-300 rounded-lg pl-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500" 
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case "address":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input 
                type="text" 
                name="street" 
                value={formData.street} 
                onChange={handleInputChange} 
                placeholder="Street Address" 
                disabled={!editMode} 
                className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Region</label>
                <select
                  name="region"
                  value={String(formData.region)}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500" 
                  required
                >
                  <option value="">Select Region</option>
                  {region.map((region) => (
                    <option key={region.id} value={String(region.id)}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Province</label>
                <select 
                  name="province" 
                  value={formData.province} 
                  onChange={handleInputChange} 
                  disabled={!editMode || !formData.region} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="">Select Province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))} 
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">City/Municipality</label>
                <select 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange} 
                  disabled={!editMode || !formData.province} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="">Select City/Municipality</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Barangay</label>
                <select 
                  name="barangay" 
                  value={formData.barangay} 
                  onChange={handleInputChange} 
                  disabled={!editMode || !formData.city} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((barangay) => (
                    <option key={barangay} value={barangay}>
                      {barangay}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={formData.postalCode} 
                  onChange={handleInputChange} 
                  placeholder="Postal Code" 
                  disabled={!editMode} 
                  className="w-full px-4 py-3 transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  required
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center py-12 px-2">
      <div className="max-w-4xl w-full p-6 mx-auto my-10 mt-24 bg-white shadow-2xl rounded-2xl transition-all duration-300 hover:shadow-[0_8px_40px_rgba(8,131,149,0.10)]">
        {/* Loading and Error States */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="flex flex-col items-center p-8 bg-white shadow-2xl rounded-2xl">
              <div className="w-12 h-12 mb-4 border-4 border-t-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
              <p className="text-gray-600">Updating profile...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-center">
              <X className="w-5 h-5 mr-3" />
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            {/* Profile Header */}
            <div className="flex flex-col pb-6 mb-8 border-b-0 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                {/* Profile Picture with Upload */}
                <div className="relative mr-4 group">
                  <div className="relative">
                    {formData.profilePicture || imagePreview ? (
                      <img
                        src={imagePreview || formData.profilePicture}
                        alt="Profile"
                        className="object-cover w-20 h-20 border-4 border-gray-200 rounded-full shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-20 h-20 text-xl font-bold text-white border-4 border-gray-200 rounded-full shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
                        {getInitials()}
                      </div>
                    )}
                    {editMode && (
                      <div className="absolute -bottom-1 -right-1">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="flex items-center justify-center w-8 h-8 text-white transition-colors duration-200 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          title="Upload profile picture"
                          aria-label="Upload profile picture"
                        >
                          {uploadingImage ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {formData.firstName} {formData.lastName}
                  </h1>
                  <p className="flex items-center mt-1 text-sm text-gray-500">
                    <Mail className="w-4 h-4 mr-1" />
                    {formData.email}
                  </p>
                  {formData.phone && (
                    <p className="flex items-center mt-1 text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1" />
                      {formData.phone}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-6 py-2 text-white transition-all duration-200 bg-blue-600 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(userDetails);
                        setEditMode(false);
                        setImagePreview(null);
                        setError("");
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 transition-all duration-200 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:scale-105"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={JSON.stringify(userDetails) === JSON.stringify(formData)}
                      className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-105 ${
                        JSON.stringify(userDetails) === JSON.stringify(formData)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Sidebar + Content Layout */}
            <div className="flex flex-col md:flex-row gap-10">
              {/* Sidebar Navigation */}
              <div className="flex md:flex-col gap-2 md:gap-4 md:w-56 md:bg-gradient-to-br md:from-blue-50 md:to-green-50 md:rounded-2xl md:py-8 md:px-4 md:shadow-md">
                <button
                  onClick={() => setActiveSection("personal")}
                  className={`flex items-center gap-3 px-4 py-3 w-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg md:rounded-xl text-left md:text-base text-sm shadow-sm md:shadow-none ${
                    activeSection === "personal"
                      ? "bg-blue-100 text-blue-700 md:bg-blue-50"
                      : "text-gray-600 hover:text-blue-500 hover:bg-blue-50"
                  }`}
                  aria-label="Personal Information Tab"
                >
                  <User className="w-5 h-5" />
                  Personal Information
                </button>
                <button
                  onClick={() => setActiveSection("address")}
                  className={`flex items-center gap-3 px-4 py-3 w-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 rounded-lg md:rounded-xl text-left md:text-base text-sm shadow-sm md:shadow-none ${
                    activeSection === "address"
                      ? "bg-green-100 text-green-700 md:bg-green-50"
                      : "text-gray-600 hover:text-green-500 hover:bg-green-50"
                  }`}
                  aria-label="Address Tab"
                >
                  <MapPin className="w-5 h-5" />
                  Address
                </button>
              </div>
              {/* Form Content */}
              <div className="flex-1">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl shadow-inner">
                  {renderFormFields()}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;