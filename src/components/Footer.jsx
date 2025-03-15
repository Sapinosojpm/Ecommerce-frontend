import React, { useState, useEffect } from "react";
import axios from "axios";
import { assets } from "../../../admin/src/assets/assets";
import { backendUrl } from "../../../admin/src/App";
import { Link } from "react-router-dom";
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
        setLogo(`${backendUrl}${data.imageUrl}`);
      } catch (error) {
        console.error("Error fetching logo:", error);
      }
    };

    fetchLogo();
  }, []);

  return (
    <div className="relative py-8 mt-12 text-white footer">
  {/* Wave Background */}
  <div className="absolute inset-x-0 bottom-0 overflow-hidden">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
      <path fill="#0F4D0F" fillOpacity="1" d="M0,192L60,202.7C120,213,240,235,360,224C480,213,600,171,720,138.7C840,107,960,85,1080,74.7C1200,64,1320,64,1380,64L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
    </svg>
  </div>

  <div className="container relative z-10 gap-12 px-6 mx-auto space-y-6 md:px-12 md:space-y-0 md:grid md:grid-cols-3">
    {/* Company Info */}
    <div className="space-y-3">
      <Link to="/">
        {logo ? (
          <img
            src={logo}
            className="w-16 mx-auto mb-3"
            alt="Logo"
          />
        ) : (
          <p>Loading...</p>
        )}
      </Link>
      <p>{footerData?.companyInfo}</p>
    </div>

    {/* Company Links */}
    <div className="px-6">
      <h3 className="mb-5 text-lg font-semibold">Company</h3>
      <ul className="space-y-2">
        {footerData?.companyLinks?.map((link, index) => (
          <li key={index}>
            {typeof link === "string" ? (
              link
            ) : (
              <a href={link?.href}>{link?.text}</a>
            )}
          </li>
        ))}
      </ul>
    </div>

    {/* Contact Info */}
    <div className="px-6">
      <h3 className="mb-5 text-lg font-semibold">Get In Touch</h3>
      <ul className="space-y-2">
        {footerData?.contactInfo?.map((info, index) => (
          <li key={index}>{info}</li>
        ))}
      </ul>
    </div>
  </div>

  <hr className="my-8" />

  {/* Copyright Text */}
  <div className="text-center">
    <p>{footerData?.copyrightText}</p>
  </div>
</div>

  );
};

export default Footer;
