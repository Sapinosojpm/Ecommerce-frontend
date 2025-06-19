import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiX, FiPlus, FiTruck } from 'react-icons/fi';

const AdminOrders = () => {
  const [showAddTrackingModal, setShowAddTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', carrierCode: 'jtexpress-ph' });

  const addTracking = async () => {
    try {
      if (!trackingForm.trackingNumber || !selectedOrderForTracking?.orderNumber) {
        toast.error('Please enter a tracking number and select an order');
        return;
      }

      console.log('Adding tracking:', {
        orderNumber: selectedOrderForTracking.orderNumber,
        trackingNumber: trackingForm.trackingNumber,
        carrierCode: trackingForm.carrierCode
      });

      const response = await axios.post(
        `${backendUrl}/api/tracking/create`,
        {
          tracking_number: trackingForm.trackingNumber,
          carrier_code: trackingForm.carrierCode,
          order_number: selectedOrderForTracking.orderNumber
        },
        { headers: { token } }
      );

      console.log('Add Tracking Response:', response.data);

      if (response.data.meta.code === 200) {
        // Update the order in the database with tracking info
        const orderUpdateResponse = await axios.post(
          `${backendUrl}/api/tracking/order/${selectedOrderForTracking.orderId}/tracking`,
          {
            trackingNumber: trackingForm.trackingNumber,
            carrierCode: trackingForm.carrierCode
          },
          { headers: { token } }
        );

        if (orderUpdateResponse.data.success) {
          toast.success('Tracking added successfully');
          loadOrderData();
          setShowAddTrackingModal(false);
          setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
          setSelectedOrderForTracking(null);
        }
      }
    } catch (error) {
      console.error('Error adding tracking:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      toast.error(error.response?.data?.message || 'Failed to add tracking');
    }
  };

  // Add this helper function to check if tracking can be added
  const canAddTracking = (order) => {
    const status = order.status?.toLowerCase();
    return status === 'shipped' || status === 'ready for pickup';
  };

  // Add status transition handling
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/order/${orderId}/status`,
        { status: newStatus },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        loadOrderData();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  // Add status options
  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready for pickup', label: 'Ready for Pickup' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' }
  ];

  return (
    <div>
      {showAddTrackingModal && selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Tracking Information</h3>
              <button
                onClick={() => {
                  setShowAddTrackingModal(false);
                  setSelectedOrderForTracking(null);
                  setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Order Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedOrderForTracking.orderNumber}
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Carrier
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={trackingForm.carrierCode}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    carrierCode: e.target.value
                  })}
                >
                  <option value="jtexpress-ph">JT Express</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Tracking Number
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({
                    ...trackingForm,
                    trackingNumber: e.target.value
                  })}
                  placeholder="Enter JT Express tracking number"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Example: JT0002443869195
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddTrackingModal(false);
                    setSelectedOrderForTracking(null);
                    setTrackingForm({ trackingNumber: '', carrierCode: 'jtexpress-ph' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addTracking}
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!trackingForm.trackingNumber}
                >
                  Add Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 