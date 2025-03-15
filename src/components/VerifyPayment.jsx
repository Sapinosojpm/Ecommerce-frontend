import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axiosInstance"; // ✅ Secure API instance

function VerifyPayment() {
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("orderId");
      const paymentIntentId = urlParams.get("payment_intent_id");

      if (!orderId || !paymentIntentId) {
        console.error("❌ Missing orderId or paymentIntentId");
        navigate("/orders?paymentFailed=true");
        return;
      }

      try {
        const response = await API.get(`/payment/gcash/verify?orderId=${orderId}&payment_intent_id=${paymentIntentId}`);

        if (response.status === 200) {
          console.log("✅ Payment verified & stock deducted");
          navigate("/orders?paymentSuccess=true");
        } else {
          console.warn("⚠️ Payment verification failed");
          navigate("/orders?paymentFailed=true");
        }
      } catch (error) {
        console.error("❌ Payment verification failed:", error.response?.data || error.message);
        navigate("/orders?paymentFailed=true");
      }
    };

    verifyPayment();
  }, [navigate]);

  return <div>Verifying payment...</div>;
}

export default VerifyPayment;
