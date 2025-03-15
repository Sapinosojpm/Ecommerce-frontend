import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const CartTotal = () => {
    const { 
        currency, 
        delivery_fee, 
        getCartAmount, 
        getDiscountAmount, 
        getTotalAmount,
        applyDiscount,
        cartItems = [],
        discountPercent,
        getCartItemsWithDetails,
        voucherAmountDiscount, 
        setVoucherAmountDiscount
    } = useContext(ShopContext);

    const [voucher, setVoucher] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [claimedVouchers, setClaimedVouchers] = useState([]); // ✅ State for claimed vouchers

    useEffect(() => {
        const fetchProducts = async () => {
            const productDetails = await getCartItemsWithDetails();
            setProducts(productDetails);
        };

        if (cartItems.length > 0) fetchProducts();
    }, [cartItems]);

    useEffect(() => {
        // ✅ Fetch claimed vouchers from the backend
        const fetchClaimedVouchers = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
        
            try {
                const response = await fetch(`${backendUrl}/api/voucher-amounts/claimed-vouchers`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
        
                console.log('Claimed Vouchers Data:', data); // Check what data contains
        
                // Check if vouchers exist in the response data
                if (data && data.length > 0) {
                    setClaimedVouchers(data); // Set vouchers if they exist
                } else {
                    console.log("❌ No claimed vouchers found.");
                }
            } catch (error) {
                console.error("🚨 Error fetching claimed vouchers:", error);
            }
        };
        
        fetchClaimedVouchers();
    }, []);

    const cartAmount = getCartAmount();
    const discountAmount = getDiscountAmount();
    const totalAmount = getTotalAmount();

    // ✅ Validate Voucher (Handles Percentage & Fixed Discounts)
    const validateVoucher = async (code) => {
        if (!code.trim()) return;

        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('⚠️ You must be logged in to apply a voucher.');
            return;
        }

        setLoading(true);
        let hasValidVoucher = false;

        try {
            // 🔹 Step 1: Check Percentage Voucher
            const percentageResponse = await fetch(`${backendUrl}/api/subscribers/validate-voucher`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ voucher: code }),
            });

            const percentageData = await percentageResponse.json();

            if (percentageData.success) {
                toast.success(`🎉 Voucher applied! ${percentageData.discountPercent}% off!`);
                applyDiscount(percentageData.discountPercent);
                setVoucherAmountDiscount(0);
                setVoucher(code);
                hasValidVoucher = true;
            }

            // 🔹 Step 2: Check Fixed Amount Voucher
            const fixedResponse = await fetch(`${backendUrl}/api/voucher-amounts/apply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code, totalAmount })
            });

            const fixedData = await fixedResponse.json();
            console.log("🔍 Fixed Voucher Response:", fixedData);

            if (fixedData?.message?.includes("This voucher requires a minimum purchase of ₱")) {
                toast.error(`${fixedData.message}`);
                return;
            }

            if (fixedData?.success && fixedData?.voucherAmount) {
                toast.success(`🎉 ₱${fixedData.voucherAmount} discount applied!`);
                setVoucherAmountDiscount(fixedData.voucherAmount);
                applyDiscount(0);
                setVoucher(code);
                hasValidVoucher = true;
            }

            if (!hasValidVoucher) {
                toast.error('❌ Invalid or expired voucher.');
                setVoucherAmountDiscount(0);
                applyDiscount(0);
            }

        } catch (error) {
            console.error("🚨 Fetch Error:", error);
            toast.error('🚨 Error validating voucher.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full p-6 bg-white rounded-lg shadow-md">
            <div className="mb-4 text-2xl font-semibold">
                <Title text1="CART" text2="TOTAL" />
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                    <p>Subtotal</p>
                    <p className="font-medium">{currency}{cartAmount.toLocaleString()}.00</p>
                </div>

                {discountAmount > 0 && (
                    <div className="flex items-center justify-between font-medium text-red-500">
                        <p>Discount ({discountPercent}%)</p>
                        <p>-{currency}{discountAmount.toLocaleString()}.00</p>
                    </div>
                )}

                {voucherAmountDiscount > 0 && (
                    <div className="flex items-center justify-between font-medium text-red-500">
                        <p>Voucher Discount</p>
                        <p>-{currency}{voucherAmountDiscount.toLocaleString()}.00</p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <p>Shipping Fee</p>
                    <p className="font-medium">{currency}{delivery_fee.toLocaleString()}.00</p>
                </div>

                <hr className="my-2 border-gray-300" />

                <div className="flex items-center justify-between text-lg font-bold">
                    <p>Total</p>
                    <p>{currency}{totalAmount.toLocaleString()}.00</p>
                </div>
            </div>

            {/* ✅ Claimed Vouchers List */}
            {claimedVouchers.length > 0 && (
                <div className="mt-6">
                    <label className="text-sm font-medium text-gray-600">Your Claimed Vouchers</label>
                    <div className="mt-2 overflow-y-auto max-h-28 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                        {claimedVouchers.map((v, index) => (
                            <div key={index} className="flex items-center justify-between p-2 mb-2 border rounded-md">
                                <span className="text-sm">{v.code} - ₱{v.voucherAmount} off</span>
                                <button 
                                    className="px-3 py-1 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
                                    onClick={() => validateVoucher(v.code)}
                                    disabled={loading}
                                >
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ✅ Manual Voucher Input */}
            <div className="mt-6">
                <label className="text-sm font-medium text-gray-600">Enter Voucher Code</label>
                <div className="flex items-center mt-2">
                    <input 
                        type="text" 
                        className="w-full p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                        placeholder="Enter voucher code" 
                        value={voucher} 
                        onChange={(e) => setVoucher(e.target.value)}
                        disabled={loading} 
                    />
                    <button 
                        className="px-4 py-2 text-white transition bg-green-500 rounded-r-md hover:bg-green-600 disabled:opacity-50"
                        onClick={() => validateVoucher(voucher)}
                        disabled={loading}
                    >
                        {loading ? 'Applying...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartTotal;
