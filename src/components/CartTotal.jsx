import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const CartTotal = ({ items: propItems }) => {
  const {
    currency,
    delivery_fee,
    getCartAmount,
    getDiscountAmount,
    getTotalAmount,
    applyDiscount,
    cartItems = {},
    discountPercent,
    getCartItemsWithDetails,
    voucherAmountDiscount,
    setVoucherAmountDiscount,
    buyNowItem,
    products = [],
  } = useContext(ShopContext);

  const [voucher, setVoucher] = useState("");
  const [loading, setLoading] = useState(false);
  const [claimedVouchers, setClaimedVouchers] = useState([]);

  // Unified: getCartData returns the items to display (from prop, or from cart context)
  const getCartData = () => {
    if (Array.isArray(propItems) && propItems.length > 0) {
      // If propItems are provided (Buy Now or custom), use them directly
      return propItems.map((item, idx) => {
        // If item.productData is missing, try to find it from products
        let productData = item.productData;
        if (!productData && item._id) {
          productData = products.find((p) => p._id === item._id || p._id === item.productId);
        }
        return {
          ...item,
          productData: productData || item,
        };
      });
    }
    // Fallback: build from cartItems in context
    const tempDataMap = {};
    for (const compositeKey in cartItems) {
      const item = cartItems[compositeKey];
      const baseProductId = compositeKey.split('-')[0];
      const product = products.find((p) => p._id === baseProductId);
      let normalizedVariationKey = 'default';
      if (item.variations && Object.keys(item.variations).length > 0) {
        const sortedVariationEntries = Object.entries(item.variations).sort(([a], [b]) => a.localeCompare(b));
        normalizedVariationKey = JSON.stringify(Object.fromEntries(sortedVariationEntries));
      }
      const normalizedKey = `${baseProductId}-${normalizedVariationKey}`;
      if (product && item.quantity > 0) {
        let availableStock = product.quantity;
        if (item.variations && product.variations?.length > 0) {
          const variationQuantities = Object.entries(item.variations).map(
            ([varName, varData]) => {
              const variation = product.variations.find((v) => v.name === varName);
              if (!variation) return 0;
              const option = variation.options.find((o) => o.name === varData.name);
              return option?.quantity || 0;
            }
          );
          availableStock = Math.min(...variationQuantities);
        }
        if (tempDataMap[normalizedKey]) {
          tempDataMap[normalizedKey].quantity += item.quantity;
        } else {
          tempDataMap[normalizedKey] = {
            _id: normalizedKey,
            quantity: item.quantity,
            variations: item.variations || null,
            productData: product,
            availableStock,
            variationAdjustment: typeof item.variationAdjustment === 'number' ? item.variationAdjustment : 0,
          };
        }
      }
    }
    return Object.values(tempDataMap);
  };

  // Calculate subtotal and total for unified items
    const cartData = getCartData();
  const subtotal = cartData.reduce((total, item) => {
      const productData = item.productData;
      if (!productData) return total;
    const capitalValue = productData.capital || 0;
    let markup = 0;
    if (productData.additionalCapital) {
      if (productData.additionalCapital.type === 'percent') {
        markup = capitalValue * (productData.additionalCapital.value / 100);
      } else {
        markup = productData.additionalCapital.value || 0;
      }
    }
    const subtotalBase = capitalValue + markup;
    const vatPercent = productData.vat || 0;
    const vatAmount = subtotalBase * (vatPercent / 100);
    const basePrice = subtotalBase + vatAmount;
    const variationAdjustment = item.variationAdjustment || 0;
    const discountPercent = productData.discount || 0;
    const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
    const priceWithVariation = basePrice + variationAdjustment;
    const itemPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
    const quantity = item.quantity || 1;
    const itemTotal = Math.round((itemPrice * quantity) * 100) / 100;
    // Debug log for each cart item
    console.log('CART ITEM DEBUG:', { name: productData.name, capitalValue, markup, subtotalBase, vatPercent, vatAmount, basePrice, variationAdjustment, discountPercent, discountedPrice, priceWithVariation, itemPrice, quantity, itemTotal });
      return Math.round((total + itemTotal) * 100) / 100;
    }, 0);

  // Calculate total: subtotal + shipping fee - voucher
  const shippingFee = typeof delivery_fee === 'number' ? delivery_fee : 0;
  const voucherValue = voucherAmountDiscount?.amount || 0;
  const total = Math.round((subtotal + shippingFee - voucherValue) * 100) / 100;

  // Calculate discount amount
  const discountAmount = Math.round(getDiscountAmount() * 100) / 100;

  useEffect(() => {
    const fetchClaimedVouchers = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(
          `${backendUrl}/api/voucher-amounts/claimed-vouchers1`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();
        console.log("📌 Claimed Vouchers API Response:", data);

        if (data && data.length > 0) {
          setClaimedVouchers(data);
        } else {
          console.log("❌ No claimed vouchers found.");
        }
      } catch (error) {
        console.error("🚨 Error fetching claimed vouchers:", error);
      }
    };

    fetchClaimedVouchers();
  }, []);

// In CartTotal.jsx - update the validateVoucher function
const validateVoucher = async (code) => {
  if (!code.trim()) return;

  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("⚠️ You must be logged in to apply a voucher.");
    return;
  }

  setLoading(true);
  let hasValidVoucher = false;
  let newVoucherAmount = 0;

  try {
    // Try subscriber voucher validation first
    let percentageData = { success: false };
    try {
      const percentageResponse = await fetch(
        `${backendUrl}/api/subscribers/validate-voucher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ voucher: code }),
        }
      );
      if (percentageResponse.ok) {
        percentageData = await percentageResponse.json();
      }
    } catch (err) {
      // Ignore network/404 errors, will try free voucher next
    }

    if (percentageData.success) {
      toast.success(
        `🎉 Voucher applied! ${percentageData.discountPercent}% off!`
      );
      applyDiscount(percentageData.discountPercent);
      hasValidVoucher = true;
    } else {
      // Try free/fixed voucher endpoint
      const fixedResponse = await fetch(
        `${backendUrl}/api/voucher-amounts/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code, totalAmount: total }),
        }
      );
      const fixedData = await fixedResponse.json();
      
      if (fixedData?.message?.includes("This voucher requires a minimum purchase of ₱")) {
        toast.error(`${fixedData.message}`);
        return;
      }
      
      if (fixedData?.success && fixedData?.voucherAmount) {
        // --- Prevent voucher from exceeding order total ---
        const maxVoucher = Math.max(0, subtotal + shippingFee - discountAmount);
        let appliedVoucher = fixedData.voucherAmount;
        if (appliedVoucher > maxVoucher) {
          appliedVoucher = maxVoucher;
          toast.warn("Voucher amount was reduced to avoid zero or negative order total.");
        }
        // ---
        toast.success(`🎉 ₱${appliedVoucher} discount applied!`);
        newVoucherAmount = appliedVoucher;
        hasValidVoucher = true;
      } else {
        toast.error("❌ Invalid or expired voucher.");
      }
    }

    if (hasValidVoucher) {
      setVoucher(code);
      setVoucherAmountDiscount({
        code: code,
        amount: newVoucherAmount,
        minimumPurchase: undefined,
      });
    } else {
      setVoucher("");
      setVoucherAmountDiscount({ code: "", amount: 0, minimumPurchase: 0 });
      applyDiscount(0);
    }
  } catch (error) {
    console.error("🚨 Fetch Error:", error);
    toast.error("🚨 Error validating voucher.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    console.log("🎯 Claimed Vouchers:", claimedVouchers);
  }, [claimedVouchers]);

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4 text-2xl font-semibold">
        <Title text1="CART" text2="TOTAL" />
      </div>

      <div className="mt-4 space-y-3 text-sm text-gray-700">
        {/* Unified breakdown for both Buy Now and Cart flows */}
        <div className="mb-2 mt-2 text-base font-semibold text-blue-700">Cart Item Breakdown</div>
        {getCartData().length > 2 ? (
          <div className="max-h-80 overflow-y-auto border rounded-lg bg-white shadow-sm">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-blue-50 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-gray-700">Product</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700">Qty</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Price</th>
                  <th className="px-2 py-2 text-right font-semibold text-gray-700">Total</th>
                  <th className="px-2 py-2 text-center font-semibold text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody>
                {getCartData().map((item, idx) => {
                  const productData = item.productData;
                  if (!productData) return null;
                  const capitalValue = productData.capital || 0;
                  let markup = 0;
                  if (productData.additionalCapital) {
                    if (productData.additionalCapital.type === 'percent') {
                      markup = capitalValue * (productData.additionalCapital.value / 100);
                    } else {
                      markup = productData.additionalCapital.value || 0;
                    }
                  }
                  const subtotalBase = capitalValue + markup;
                  const vatPercent = productData.vat || 0;
                  const vatAmount = subtotalBase * (vatPercent / 100);
                  const basePrice = subtotalBase + vatAmount;
                  const variationAdjustment = item.variationAdjustment || 0;
                  const discountPercent = productData.discount || 0;
                  const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
                  const priceWithVariation = basePrice + variationAdjustment;
                  const itemPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
                  const quantity = item.quantity || 1;
                  const itemTotal = Math.round((itemPrice * quantity) * 100) / 100;
                  // State for expand/collapse
                  const [expanded, setExpanded] = React.useState(false);
                  return (
                    <React.Fragment key={item._id || idx}>
                      <tr className="border-b hover:bg-blue-50 transition">
                        <td className="px-2 py-2 font-medium text-gray-900">{productData.name}</td>
                        <td className="px-2 py-2 text-center">{quantity}</td>
                        <td className="px-2 py-2 text-right">{currency}{itemPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-2 py-2 text-right font-bold text-blue-900">{currency}{itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                        <td className="px-2 py-2 text-center">
                          <button
                            className="text-blue-600 underline text-xs font-medium"
                            onClick={() => setExpanded((prev) => !prev)}
                            type="button"
                          >
                            {expanded ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="px-4 py-2">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm">
                              <div className="text-gray-600">Base Price:</div>
                              <div className="text-gray-800">{currency}{capitalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-gray-600">Markup:</div>
                              <div className="text-gray-800">{currency}{markup.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-gray-600"> VAT ({vatPercent}%):</div>
                              <div className="text-gray-800">{currency}{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-gray-600">Variation Adj.:</div>
                              <div className="text-gray-800">{currency}{variationAdjustment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              <div className="text-gray-600">Subtotal (Base+VAT):</div>
                              <div className="text-gray-800">{currency}{basePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                              {discountPercent > 0 && <><div className="text-gray-600">Discount ({discountPercent}%):</div><div className="text-red-600">-{currency}{(basePrice * (discountPercent / 100)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></>}
                            </div>
                            <div className="flex items-center justify-between mt-2 bg-blue-100 rounded-lg px-3 py-2">
                              <span className="font-bold text-blue-900 flex items-center gap-1">Final Price:</span>
                              <span className="font-bold text-blue-900 text-base">{currency}{itemPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} x {quantity} = {currency}{itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>
        ) : (
          // Original detailed card layout for 3 or fewer items
          getCartData().map((item, idx) => {
            const productData = item.productData;
            if (!productData) return null;
            const capitalValue = productData.capital || 0;
            let markup = 0;
            if (productData.additionalCapital) {
              if (productData.additionalCapital.type === 'percent') {
                markup = capitalValue * (productData.additionalCapital.value / 100);
              } else {
                markup = productData.additionalCapital.value || 0;
              }
            }
            const subtotalBase = capitalValue + markup;
            const vatPercent = productData.vat || 0;
            const vatAmount = subtotalBase * (vatPercent / 100);
            const basePrice = subtotalBase + vatAmount;
            const variationAdjustment = item.variationAdjustment || 0;
            const discountPercent = productData.discount || 0;
            const discountedPrice = (basePrice * (1 - discountPercent / 100)) + variationAdjustment;
            const priceWithVariation = basePrice + variationAdjustment;
            const itemPrice = discountPercent > 0 ? discountedPrice : priceWithVariation;
            const quantity = item.quantity || 1;
            const itemTotal = Math.round((itemPrice * quantity) * 100) / 100;
            // Debug log for cart item display
            console.log('CART ITEM DISPLAY DEBUG:', { name: productData.name, capitalValue, markup, subtotalBase, vatPercent, vatAmount, basePrice, variationAdjustment, discountPercent, discountedPrice, priceWithVariation, itemPrice, quantity, itemTotal });
            return (
              <div
                key={item._id || idx}
                className="mb-4 p-4 rounded-xl border-l-4 border-blue-500 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                  <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                    {productData.name}
                  </div>
                  <div className="text-xs text-gray-500">Qty: <span className="font-bold text-gray-700">{quantity}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs sm:text-sm mb-2">
                  <div className="text-gray-600">Base Price:</div>
                  <div className="text-gray-800">{currency}{capitalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-gray-600">Markup:</div>
                  <div className="text-gray-800">{currency}{markup.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-gray-600"> VAT ({vatPercent}%):</div>
                  <div className="text-gray-800">{currency}{vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-gray-600">Variation Adj.:</div>
                  <div className="text-gray-800">{currency}{variationAdjustment.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  <div className="text-gray-600">Subtotal (Base+VAT):</div>
                  <div className="text-gray-800">{currency}{basePrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  {discountPercent > 0 && <><div className="text-gray-600">Discount ({discountPercent}%):</div><div className="text-red-600">-{currency}{(basePrice * (discountPercent / 100)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></>}
                </div>
                <div className="flex items-center justify-between mt-2 bg-blue-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-blue-900 flex items-center gap-1">Final Price:</span>
                  <span className="font-bold text-blue-900 text-base">{currency}{itemPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} x {quantity} = {currency}{itemTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
            );
          })
        )}
        {/* Subtotal line */}
        <div className="flex items-center justify-between mt-2">
              <p>Subtotal</p>
              <p className="font-medium">
                {currency}
            {subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between font-medium text-red-500">
            <p>Discount ({discountPercent}%)</p>
            <p>
              -{currency}
              {discountAmount.toLocaleString()}
            </p>
          </div>
        )}

        {voucherAmountDiscount.amount > 0 && (
          <div className="flex items-center justify-between font-medium text-green-600">
            <p>Applied Voucher: {voucherAmountDiscount.code}</p>
            <p>
              -{currency}
              {voucherAmountDiscount.amount.toLocaleString()}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p>Shipping Fee</p>
          <p className="font-medium">
            {currency}
            {shippingFee.toLocaleString()}
          </p>
        </div>

        <hr className="my-2 border-gray-300" />

        <div className="flex items-center justify-between font-bold">
          <p>Total</p>
          <p>
            {currency}
            {total.toLocaleString()}
          </p>
        </div>
      </div>

      {claimedVouchers.length > 0 && (
        <div className="mt-6">
          <label className="text-sm font-medium text-gray-600">
            Your Vouchers
          </label>
          <div className="mt-2 overflow-y-auto max-h-28 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {claimedVouchers
              .filter((v) => v.isActive)
              .map((v) => (
                <div
                  key={v._id}
                  className="flex items-center justify-between p-2 mb-2 border rounded-md"
                >
                  <span className="text-sm text-gray-700">
                    {v.voucherCode
                      ? `${v.voucherCode} - ₱${
                          v.voucherAmount || 0
                        } off (Min. Spend: ₱${v.minimumPurchase || 0})`
                      : "❌ Missing Voucher Data"}
                  </span>
                  <button
                    className="px-3 py-1 text-white transition bg-blue-500 rounded-md hover:bg-blue-600"
                    onClick={() => validateVoucher(v.voucherCode)}
                    disabled={loading}
                  >
                    Apply
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <label className="text-sm font-medium text-gray-600">
          Enter Voucher Code
        </label>
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
            className="px-4 py-2 text-white transition bg-black rounded-r-md hover:bg-green-600 disabled:opacity-50"
            onClick={() => validateVoucher(voucher)}
            disabled={loading}
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
