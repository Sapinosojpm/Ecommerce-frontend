import React, { useEffect, useState } from "react";
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const VoucherListComponent = ({ onClose }) => {
  const [vouchers, setVouchers] = useState([]);
  const [claimedVoucherIds, setClaimedVoucherIds] = useState(new Set()); // ✅ Store only IDs
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchVouchers = async () => {
      if (!token) {
        console.error("No token found, please log in.");
        setLoading(false);
        return;
      }

      try {
        // ✅ Fetch all available vouchers
        const allVouchersRes = await axios.get(`${backendUrl}/api/voucher-amounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Fetch claimed voucher IDs (only IDs)
        const claimedVouchersRes = await axios.get(`${backendUrl}/api/voucher-amounts/claimed-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ Convert IDs to strings and store in a Set
        const claimedIdsSet = new Set(claimedVouchersRes.data.map(id => id.toString()));

        setVouchers(allVouchersRes.data);
        setClaimedVoucherIds(claimedIdsSet); // ✅ Store as Set for fast lookup
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vouchers:", err.response?.data || err);
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [token]);

  const claimVoucher = async (id) => {
    if (!token) {
      alert("Please log in to claim a voucher.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }

      await axios.post(`${backendUrl}/api/voucher-amounts/claim/${id}`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("You claimed the voucher!");

      // ✅ Mark voucher as claimed instantly
      setClaimedVoucherIds((prev) => new Set([...prev, id.toString()]));

    } catch (error) {
      console.error("Error claiming voucher:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to claim voucher");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white shadow-lg rounded-lg p-5 w-[700px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Available Vouchers</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-900"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-300 p-2">
          {loading ? (
            <p>Loading vouchers...</p>
          ) : vouchers.length === 0 ? (
            <p>No available vouchers.</p>
          ) : (
            vouchers.map((voucher) => (
              <div key={voucher._id} className="p-3 mb-2 bg-white border rounded shadow-sm">
                <p>
                  <strong>Code:</strong> {voucher.code}
                </p>
                <p>
                  <strong>Amount:</strong> ₱{voucher.voucherAmount}
                </p>
                <p>
                  <strong>Expires:</strong> {voucher.expirationDate ? new Date(voucher.expirationDate).toLocaleDateString() : "No Expiry"}
                </p>
                {claimedVoucherIds.has(voucher._id.toString()) ? ( // ✅ Ensure IDs match
                  <button className="w-full p-2 mt-2 text-white bg-gray-400 rounded cursor-not-allowed" disabled>
                    Claimed
                  </button>
                ) : (
                  <button
                    onClick={() => claimVoucher(voucher._id)}
                    className="w-full p-2 mt-2 text-white bg-green-500 rounded hover:bg-green-600"
                  >
                    Claim
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VoucherListComponent;
