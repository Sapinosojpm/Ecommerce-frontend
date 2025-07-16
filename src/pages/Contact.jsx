import React, { useState, useEffect, useLayoutEffect } from 'react';
import Title from '../components/Title';
import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import { Link } from 'react-router-dom';
import Lenis from 'lenis';
import ChatPopup from '../components/ChatPopup';
import Newsletter from '../components/NewsletterBox';
import JobPosting from '../components/JobPostingPopup';
import { FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

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
      <div className="pt-10 text-center border-t border-gray-200">
        <Title text1="CONTACT" text2="US" />
        <p className="max-w-2xl mx-auto mt-4 text-gray-600">
          We'd love to hear from you. Get in touch with us for any inquiries or questions.
        </p>
      </div>

      {/* Contact Content */}
      <div className="grid items-start grid-cols-1 gap-12 mt-12 md:grid-cols-2">
        {/* Image */}
        {contactData.image && (
          <div className="relative overflow-hidden shadow-xl rounded-2xl aspect-w-16 aspect-h-9">
            <img
              src={contactData.image}
              alt="Contact Section"
              className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}

        {/* Contact Details */}
        <div className="flex flex-col gap-6 p-8 bg-white shadow-lg rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-800">{contactData.businessName}</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 text-white bg-gray-800 rounded-full">
                <FiMapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Address</h3>
                <p className="text-gray-600">{contactData.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 text-white bg-gray-800 rounded-full">
                <FiPhone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Phone</h3>
                <div className="flex flex-wrap gap-2">
                  {contactData.telephone.map((phone, index) => (
                    <a 
                      key={index} 
                      href={`tel:${phone}`}
                      className="text-gray-600 hover:text-gray-800 hover:underline"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 text-white bg-gray-800 rounded-full">
                <FiMail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Email</h3>
                <div className="flex flex-wrap gap-2">
                  {contactData.email.map((email, index) => (
                    <a 
                      key={index} 
                      href={`mailto:${email}`}
                      className="text-gray-600 hover:text-gray-800 hover:underline"
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {contactData.hours && (
              <div className="flex items-start gap-4">
                <div className="p-2 text-white bg-gray-800 rounded-full">
                  <FiClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Business Hours</h3>
                  <p className="text-gray-600">{contactData.hours}</p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <Link 
              to="/about" 
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 transition-all border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white group"
            >
              Learn More About Us
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Sections */}
      <div className="grid grid-cols-1 gap-8 mt-20 md:grid-cols-2">
        <div className="p-8 transition-all duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
          <h3 className="mb-6 text-xl font-bold text-center text-gray-800">Join Our Team</h3>
          <JobPosting embedded={true} />
        </div>
        
        <div className="p-8 transition-all duration-300 bg-white shadow-lg rounded-2xl hover:shadow-xl">
          <h3 className="mb-6 text-xl font-bold text-center text-gray-800">Have Questions?</h3>
          <ChatPopup embedded={true} />
        </div>
      </div>

      {/* Map Section */}
      {contactData.location && (
        <div className="mt-20">
          <h3 className="mb-6 text-xl font-bold text-center text-gray-800">Find Us on Map</h3>
          <div className="overflow-hidden shadow-xl rounded-2xl aspect-w-16 aspect-h-9">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(contactData.location)}&output=embed`}
              width="300"
              height="400"
              frameBorder="0"
              allowFullScreen
              className="border-0"
              aria-hidden="false"
              tabIndex="0"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;