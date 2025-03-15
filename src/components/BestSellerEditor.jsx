import React, { useState, useEffect } from "react";
import axios from "axios";

const BestSellerEditor = () => {
    const [maxDisplay, setMaxDisplay] = useState(10);

    useEffect(() => {
        // Fetch current setting
        const fetchSetting = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/best-seller-setting`);
                setMaxDisplay(response.data.maxDisplay || 10);
            } catch (error) {
                console.error("Error fetching best seller setting:", error);
            }
        };
        fetchSetting();
    }, []);

    const handleSave = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/best-seller-setting`, { maxDisplay });
            alert("Best seller display updated successfully!");
        } catch (error) {
            console.error("Error updating best seller setting:", error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-xl font-bold">Best Seller Display Settings</h2>
            <label className="block mb-2">Number of Best Sellers to Display:</label>
            <input
                type="number"
                value={maxDisplay}
                onChange={(e) => setMaxDisplay(parseInt(e.target.value))}
                className="w-full p-2 border rounded"
            />
            <button onClick={handleSave} className="px-4 py-2 mt-4 text-white bg-blue-500 rounded">
                Save
            </button>
        </div>
    );
};

export default BestSellerEditor;
