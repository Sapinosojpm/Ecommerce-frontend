import React, { useState, useEffect } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import { Link } from "react-router-dom";
import NewsletterBox from "./NewsletterBox"; // Import your newsletter component
import '../css/Footer.css'; // Import custom CSS

const Footer = () => {
  const [footerData, setFooterData] = useState({
    companyInfo: "",
    companyLinks: [],
    contactInfo: [],
    copyrightText: "",
  });
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/footer`);
        setFooterData(data);
      } catch (error) {
        console.error("Error fetching footer data:", error);
      }
    };
    fetchFooterData();
  }, []);

useEffect(() => {
  const fetchLogo = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/logo`);
      const data = await res.json();
      // console.log("Cloudinary logo URL:", data.imageUrl); // ✅ Debug
      setLogo(data.imageUrl); // Don't prepend backendUrl
    } catch (error) {
      console.error("Error fetching logo:", error);
    }
  };

  fetchLogo();
}, []);


  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          
          {/* Company Info */}
          <div className="space-y-6 lg:col-span-2">
            <Link to="/" className="inline-block">
              {logo ? (
                <img
                  src={logo}
                  className="object-contain w-auto h-10"
                  alt="Logo"
                />
              ) : (
                <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
              )}
            </Link>
            
            <p className="max-w-md leading-relaxed text-gray-600">
              {footerData?.companyInfo || "Your trusted partner for quality products and exceptional service. Shop with confidence and discover amazing deals every day."}
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 transition-colors duration-200 hover:text-blue-600">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 transition-colors duration-200 hover:text-blue-400">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 transition-colors duration-200 hover:text-pink-600">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
              </a>
              
              <a href="#" className="text-gray-400 transition-colors duration-200 hover:text-blue-700">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Company
            </h3>
            <ul className="space-y-3">
              {footerData?.companyLinks && footerData?.companyLinks.length > 0 ? (
                footerData.companyLinks.map((link, index) => (
                  <li key={index}>
                    {typeof link === "string" ? (
                      <span className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">
                        {link}
                      </span>
                    ) : (
                      <a 
                        href={link?.href}
                        className="block text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900"
                      >
                        {link?.text}
                      </a>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li><a href="#" className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">About Us</a></li>
                  <li><a href="#" className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">Careers</a></li>
                  <li><a href="#" className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">Press</a></li>
                  <li><a href="#" className="text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">Blog</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Get In Touch
            </h3>
            <ul className="space-y-3">
              {footerData?.contactInfo && footerData?.contactInfo.length > 0 ? (
                footerData.contactInfo.map((info, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {info}
                  </li>
                ))
              ) : (
                <>
                  <li className="text-sm text-gray-600">support@example.com</li>
                  <li className="text-sm text-gray-600">+1 (555) 123-4567</li>
                  <li className="text-sm text-gray-600">1234 Business St.<br />Suite 100<br />City, State 12345</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Newsletter Component */}
        <div className="pt-8 mt-12 border-t border-gray-200">
          <NewsletterBox />
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between pt-8 mt-8 space-y-4 border-t border-gray-200 md:flex-row md:space-y-0">
          <p className="text-sm text-gray-500">
            {footerData?.copyrightText || `© ${new Date().getFullYear()} Your Store. All rights reserved.`}
          </p>
          
          {/* Payment Methods */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">We accept:</span>
              <div className="flex space-x-2">
                <img src={assets.gcash} alt="GCash" className="h-5 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;