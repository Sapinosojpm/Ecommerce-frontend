import { createContext, useState, useEffect } from "react";

export const VoucherAmountContext = createContext();

export const VoucherAmountProvider = ({ children }) => {
  const [voucher, setVoucher] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  return (
    <VoucherAmountContext.Provider value={{ 
      voucher, setVoucher, 
      voucherDiscount, setVoucherDiscount 
    }}>
      {children}
    </VoucherAmountContext.Provider>
  );
};
