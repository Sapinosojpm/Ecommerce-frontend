import React, { useState, useEffect, useLayoutEffect } from "react";
import { backendUrl } from "../../../admin/src/App";
import addressData from "../data/Philippines.json"; // Adjust the path
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Lenis from "lenis";
const Profile = () => {
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

  // Dropdown states
  const [region, setRegion] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // scroll effect
  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true, // Enables smooth scrolling
      duration: 1.2, // Adjust smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural easing effect
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
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
        console.log("Fetched User Data:", data); // ✅ Debugging
  
        // Step 1: Set user details
        setUserDetails(data);
        setFormData(data);
  
        // Step 2: Ensure dropdowns update AFTER state update
        setTimeout(() => {
          updateDropdowns(data);
        }, 100); // ✅ Give React time to update state
  
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
    acc[key] = value.region_name; // Convert "07" -> "Central Visayas"
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
  }, [userDetails]); // ✅ Runs only when `userDetails` updates
  
  
  
  
  
  

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    console.log(`Changing ${name}:`, value); // ✅ Debugging
  
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
      region: String(formData.region), // ✅ Convert region to a string before sending
    };
  
    console.log("🚀 Data being sent to backend:", updatedData); // Debugging
  
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
  
  
  
  
  
  
  return (
    <div className="max-w-3xl p-8 mx-auto my-20 bg-gray-100 rounded-lg shadow-lg">
  <h1 className="mb-10 text-3xl font-bold text-center text-gray-800">User Profile</h1>

  {error && <p className="text-center text-red-500">{error}</p>}
  {loading && <p className="text-center text-gray-500">Loading...</p>}

  {!loading && (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grid Layout for 2 Columns */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" disabled={!editMode} className="w-full px-4 py-2 border rounded-md" />
        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" disabled={!editMode} className="w-full px-4 py-2 border rounded-md" />
        
        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" disabled className="w-full px-4 py-2 bg-gray-200 border rounded-md" />
        <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" disabled={!editMode} className="w-full px-4 py-2 border rounded-md" required/>
        
        <input type="text" name="street" value={formData.street} onChange={handleInputChange} placeholder="Street Address" disabled={!editMode} className="w-full col-span-2 px-4 py-2 border rounded-md" required/>
        
        {/* Address Select Inputs */}
        <select
  name="region"
  value={String(formData.region)} // ✅ Ensure it's always a string
  onChange={handleInputChange}
  disabled={!editMode}
  className="w-full px-4 py-2 border rounded-md" required
>
  <option value="">Select Region</option>
  {region.map((region) => (
    <option key={region.id} value={String(region.id)}>
      {region.name}  {/* Debugging */}
    </option>
  ))}
</select>



        <select required name="province" value={formData.province} onChange={handleInputChange} disabled={!editMode || !formData.region} className="w-full px-4 py-2 border rounded-md">
          <option value="">Select Province</option>
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))} 
        </select>

        <select required name="city" value={formData.city} onChange={handleInputChange} disabled={!editMode || !formData.province} className="w-full px-4 py-2 border rounded-md">
          <option value="">Select City/Municipality</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select required name="barangay" value={formData.barangay} onChange={handleInputChange} disabled={!editMode || !formData.city} className="w-full px-4 py-2 border rounded-md">
          <option value="">Select Barangay</option>
          {barangays.map((barangay) => (
            <option key={barangay} value={barangay}>
              {barangay}
            </option>
          ))}
        </select>

        <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="Postal Code" disabled={!editMode} className="w-full px-4 py-2 border rounded-md" />
      </div>

      {/* Buttons */}
<div className="flex justify-center mt-8 space-x-4">
  {!editMode && (
    <button onClick={() => setEditMode(true)} className="px-6 py-3 text-white bg-green-600 rounded-md">
      Edit Profile
    </button>
  )}
  {editMode && (
    <>
      <button
        type="submit"
        disabled={JSON.stringify(userDetails) === JSON.stringify(formData)}
        className={`px-6 py-3 text-white rounded-md ${
          JSON.stringify(userDetails) === JSON.stringify(formData) ? "bg-gray-400" : "bg-blue-600"
        }`}
      >
        Save Changes
      </button>
      <button
        type="button"
        onClick={() => {
          setFormData(userDetails); // Reset to original details
          setEditMode(false); // Exit edit mode
        }}
        className="px-6 py-3 text-white bg-red-500 rounded-md"
      >
        Cancel
      </button>
    </>
  )}
</div>

    </form>
  )}
</div>

  );
};

export default Profile;
