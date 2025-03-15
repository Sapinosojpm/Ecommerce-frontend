import React, { useState, useEffect, useLayoutEffect } from 'react';
import Title from '../components/Title';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App'; // Ensure this path is correct
import { Link } from 'react-router-dom';
import Lenis from "lenis";
const Contact = () => {
  const [contactData, setContactData] = useState(null);

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

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/contact`);
        console.log('Fetched Data:', response.data); // Debug log

        // Ensure the image URL is complete
        if (response.data.image && !response.data.image.startsWith('http')) {
          // Update to the correct URL
          response.data.image = `${backendUrl}/uploads/${response.data.image}`;
        }

        setContactData(response.data);
      } catch (error) {
        console.error('Error fetching contact data:', error.response || error.message);
      }
    };

    fetchContactData();
  }, []); // Empty dependency array ensures this runs once on mount

  if (!contactData) return <div>Loading...</div>;

  return (
    <div className='my-20'>
      <div className="px-4 pt-10 text-2xl text-center border-t">
        <Title text1="CONTACT" text2="US" />
      </div>

      <div className="flex flex-col justify-center gap-10 px-4 my-10 md:flex-row mb-28">
        {/* Image Rendering */}
        {contactData.image && (
          <img 
            src={contactData.image} 
            alt="Contact Section" 
            className="mt-4 max-w-full  max-h-[400px]"
          />
        )}

        {/* Contact Details */}
        <div className="flex flex-col items-start justify-center gap-6">
          <p className="text-xl font-semibold text-gray-600">Our Store</p>
          <p className="text-gray-500">{contactData.address}</p>
          <p className="text-gray-500">
            Tel: {contactData.telephone.join(', ')}<br />
            Email: {contactData.email.join(', ')}
          </p>
          <p className="text-xl font-semibold text-gray-600">{contactData.businessName}</p>
          <p className="text-gray-500">Learn more about Hasharon</p>
          <Link to="/about">
          <button className="px-8 py-4 text-sm transition-all duration-500 border border-black hover:bg-black hover:text-white">
            Explore
          </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Contact;
