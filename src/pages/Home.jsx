import React, { useState, useEffect, useLayoutEffect } from "react";
import axios from "axios";
import Lenis from "lenis";

import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
// import NewsletterBox from "../components/NewsletterBox";
import Intro from "../components/Intro";
import ProductList from "../components/ProductList";
import AddReview from "../components/AddReview";
import DealsPopup from "../components/DealsPopup";
import JobPostingPopup from "../components/JobPostingPopup";
import { YoutubeProvider } from "../context/youtubeContext";
import SaleProductsList from "../components/SaleProductsList";
const Home = () => {
  const [components, setComponents] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/homepage`);
        setComponents(response.data.components);
      } catch (error) {
        console.error("Error fetching homepage settings:", error);
      }
    };

    const trackPageView = async () => {
      const token = localStorage.getItem("token"); 
      const page = "Home";
    
      let sessionId = localStorage.getItem("sessionId"); 
      if (!sessionId) {
        sessionId = `guest-${Date.now()}`;
        localStorage.setItem("sessionId", sessionId);
      }
    
      let userId = "guest"; 
      if (token) {
        try {
          const decodedToken = JSON.parse(atob(token.split(".")[1])); 
          userId = decodedToken.id || "guest"; 
        } catch (error) {
          console.error("⚠️ Error decoding token:", error);
        }
      }
    
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/pageviews/track`,
          { page, userId, sessionId }, 
          { headers: { Authorization: token ? `Bearer ${token}` : "", "x-session-id": sessionId } }
        );
        console.log("🔹 Page view recorded:", response.data);
      } catch (error) {
        console.error("❌ Error tracking page view:", error.response?.data || error.message);
      }
    };

    fetchSettings();
    trackPageView();
  }, []);

  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true, // Enables smooth scrolling
      duration: 1.2, // Adjust smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural easing effect
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
  }, []);

  if (!components) return <p className="mt-10 text-center text-gray-500">Loading...</p>;

  return (
    <div>
      {components?.DealsPopup && <DealsPopup />}
      {components?.JobPostingPopup && <JobPostingPopup />}
      {components?.Hero && <Hero />}
      {components?.ProductList && <ProductList />}
      <hr className="my-6 border-gray-300" />
      <YoutubeProvider>{components?.Intro && <Intro />}</YoutubeProvider>
      {components?.SaleProductsList && <SaleProductsList />}
      {components?.LatestCollection && <LatestCollection />}
      {components?.BestSeller && <BestSeller />}
      {components?.AddReview && <AddReview />}
      {components?.OurPolicy && <OurPolicy />}
      {/* {components?.NewsletterBox && <NewsletterBox />} */}
    </div>
  );
};

export default Home;
