import React, { useState, useEffect, useLayoutEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lenis from "lenis";
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
  });

  const [formData, setFormData] = useState(userDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

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
            <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="Email" 
                  disabled 
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg" 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="Phone Number" 
                  disabled={!editMode} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              </div>
            </div>
          </div>
        );
        
      case "address":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Street Address</label>
              <input 
                type="text" 
                name="street" 
                value={formData.street} 
                onChange={handleInputChange} 
                placeholder="Street Address" 
                disabled={!editMode} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              
              <div className="space-y-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={formData.postalCode} 
                  onChange={handleInputChange} 
                  placeholder="Postal Code" 
                  disabled={!editMode} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
    <div className="max-w-4xl p-6 mx-auto my-10 mt-24 bg-white shadow-lg rounded-xl">
      {/* Loading and Error States */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full border-t-blue-500 animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
          {/* Profile Header */}
          <div className="flex flex-col items-center justify-between pb-6 mb-6 text-center border-b md:flex-row md:text-left">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="flex items-center justify-center w-16 h-16 mr-4 text-xl font-bold text-white bg-blue-600 rounded-full">
                {getInitials()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {formData.firstName} {formData.lastName}
                </h1>
                <p className="text-sm text-gray-500">{formData.email}</p>
              </div>
            </div>
            
            <div>
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)} 
                  className="px-6 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(userDetails);
                      setEditMode(false);
                    }}
                    className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={JSON.stringify(userDetails) === JSON.stringify(formData)}
                    className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      JSON.stringify(userDetails) === JSON.stringify(formData)
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    }`}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
  
          {/* Tab Navigation */}
          <div className="flex mb-6 border-b">
            <button
              onClick={() => setActiveSection("personal")}
              className={`px-4 py-3 font-medium ${
                activeSection === "personal"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveSection("address")}
              className={`px-4 py-3 font-medium ${
                activeSection === "address"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              Address
            </button>
          </div>
          
          {/* Form Content */}
          <form className="mb-6" onSubmit={handleSubmit}>
            {renderFormFields()}
          </form>
        </>
      )}
    </div>
  );
};

export default Profile;