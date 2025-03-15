import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OrderStatus = () => {
    const navigate = useNavigate();
    const orderId = new URLSearchParams(window.location.search).get("orderId");

    useEffect(() => {
        if (!orderId) {
            navigate("/cart");
            return;
        }

        const verifyPayment = async () => {
            try {
                const { data } = await axios.post(`${backendUrl}/api/payment/verify-gcash`, {
                    orderId,
                    paymentStatus: "success",
                });

                if (data.success) {
                    navigate(`/orders?paymentSuccess=true`);  // ✅ Redirect with success flag
                } else {
                    console.error("Payment verification failed:", data.message);
                }
            } catch (error) {
                console.error("Error verifying payment:", error);
            }
        };

        verifyPayment();
    }, [orderId, navigate]);

    return (
        <div className="text-center mt-10">
            <h2 className="text-2xl font-bold">Verifying Payment...</h2>
        </div>
    );
};

export default OrderStatus;
