import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../../../admin/src/App";

const VoucherListComponent = ({ onClose }) => {
  const [vouchers, setVouchers] = useState([]);
  const [claimedVouchers, setClaimedVouchers] = useState([]);
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
        const allVouchersRes = await axios.get(`${backendUrl}/api/voucher-amounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setVouchers(allVouchersRes.data);

        const claimedVouchersRes = await axios.get(`${backendUrl}/api/voucher-amounts/claimed-vouchers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setClaimedVouchers(claimedVouchersRes.data);

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
      await axios.post(`${backendUrl}/api/voucher-amounts/claim/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("You claimed the voucher!");

      const claimedVoucher = vouchers.find((v) => v._id === id);
      const newClaimedVouchers = [...claimedVouchers, claimedVoucher];
      setClaimedVouchers(newClaimedVouchers);
    } catch (error) {
      console.error("Error claiming voucher:", error.response?.data || error);
      alert(error.response?.data?.message || "Failed to claim voucher");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white shadow-lg rounded-lg p-5 w-[700px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Available & Claimed Vouchers</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-900"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-300 p-2 border-r">
            <h3 className="mb-2 text-lg font-semibold">Claimable Vouchers</h3>
            {loading ? (
              <p>Loading vouchers...</p>
            ) : vouchers.filter((v) => !claimedVouchers.some((cv) => cv._id === v._id)).length === 0 ? (
              <p>No available vouchers.</p>
            ) : (
              vouchers
                .filter((v) => !claimedVouchers.some((cv) => cv._id === v._id))
                .map((voucher) => (
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
                    <button
                      onClick={() => claimVoucher(voucher._id)}
                      className="w-full p-2 mt-2 text-white bg-green-500 rounded hover:bg-green-600"
                    >
                      Claim
                    </button>
                  </div>
                ))
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-300 p-2">
            <h3 className="mb-2 text-lg font-semibold">Claimed Vouchers</h3>
            {claimedVouchers.length === 0 ? (
              <p>No claimed vouchers.</p>
            ) : (
              claimedVouchers.map((voucher) => (
                <div key={voucher._id} className="p-3 mb-2 bg-white border rounded shadow-sm">
                  <p>
                    <strong>Code:</strong> <span className="text-green-600">{voucher.code}</span>
                  </p>
                  <p>
                    <strong>Amount:</strong> ₱{voucher.voucherAmount}
                  </p>
                  <p>
                    <strong>Expires:</strong> {voucher.expirationDate ? new Date(voucher.expirationDate).toLocaleDateString() : "No Expiry"}
                  </p>
                  <button className="w-full p-2 mt-2 text-white bg-blue-500 rounded hover:bg-blue-600" disabled>
                    Claimed
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherListComponent;