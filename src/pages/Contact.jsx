import React, { useState, useEffect, useLayoutEffect } from 'react';
import Title from '../components/Title';
import axios from 'axios';
import { backendUrl } from '../../../admin/src/App';
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import ChatPopup from '../components/ChatPopup';
import Newsletter from '../components/NewsletterBox';
import JobPosting from '../components/JobPostingPopup';

const Contact = () => {
  const [contactData, setContactData] = useState(null);

  useLayoutEffect(() => {
    const lenis = new Lenis({ smooth: true, duration: 1.2 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/contact`);
        if (response.data.image && !response.data.image.startsWith('http')) {
          response.data.image = `${backendUrl}/uploads/${response.data.image}`;
        }
        setContactData(response.data);
      } catch (error) {
        console.error('Error fetching contact data:', error.response || error.message);
      }
    };

    fetchContactData();
  }, []);

  if (!contactData) return <div className="py-20 text-center text-gray-500">Loading...</div>;

  return (
    <div className="container px-6 mx-auto my-20 lg:px-20">
      {/* Title Section */}
      <div className="pt-10 text-center border-t">
        <Title text1="CONTACT" text2="US" />
      </div>

      {/* Contact Content */}
      <div className="grid items-center grid-cols-1 gap-12 mt-12 md:grid-cols-2">
        {/* Image */}
        {contactData.image && (
          <img
            src={contactData.image}
            alt="Contact Section"
            className="w-full max-w-md mx-auto shadow-lg rounded-2xl"
          />
        )}

        {/* Contact Details */}
        <div className="flex flex-col gap-4">
          <p className="text-xl font-semibold text-gray-700">{contactData.businessName}</p>
          <p className="text-gray-600">{contactData.address}</p>
          <p className="text-gray-600">
            <span className="font-medium">Tel:</span> {contactData.telephone.join(', ')}<br />
            <span className="font-medium">Email:</span> {contactData.email.join(', ')}
          </p>
          {/* <Link to="/about">
            <button className="px-6 py-3 mt-4 text-sm font-medium text-gray-700 transition-all border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white">
              Learn More
            </button>
          </Link> */}
          <div className=''>
          <Newsletter />
          </div>
        </div>
      </div>

      {/* Chat, Newsletter & Job Posting */}
      <div className="grid grid-cols-1 gap-12 mt-16 md:grid-cols-2">
        <div className="flex justify-center">
          <JobPosting embedded={true} />
        </div>
        <div className="flex justify-center">
          {/* ChatPopup Fixed at Bottom Right */}
          <ChatPopup embedded={true} />
        </div>
      </div>

      
    </div>
  );
};

export default Contact;
