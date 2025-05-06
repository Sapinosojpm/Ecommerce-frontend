import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { backendUrl } from "../../../admin/src/App";

export default function SignUp() {
    const navigate = useNavigate();

    const handleSuccess = async (response) => {
        console.log("Google Credential:", response.credential);

        try {
            const result = await axios.post(`${backendUrl}/auth/google-signup`, {
                token: response.credential, // ✅ Fixed naming issue
            });

            if (result.data.success) {
                localStorage.setItem("user", JSON.stringify(result.data.user));
                navigate("/login");
            } else {
                console.error("Google Sign-Up Failed:", result.data.message);
            }
        } catch (error) {
            console.error("Google Sign-Up Error:", error);
        }
    };

    return (
        <GoogleOAuthProvider clientId="676896020946-npg2vukngeemscbtlnvid58o77b44mrg.apps.googleusercontent.com">
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <h1 className="text-3xl font-bold mb-6">Sign Up</h1>
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => console.error("Sign-Up Failed")}
                    text="signup_with" // ✅ Changes button text to "Sign up with Google"
                    theme="outline"
                    size="icon"
                />
            </div>
        </GoogleOAuthProvider>
    );
}
