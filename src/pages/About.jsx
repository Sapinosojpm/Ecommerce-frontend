import React, { useEffect, useState } from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import axios from 'axios';
import Map3D from '../components/Map3D';
const backendUrl = import.meta.env.VITE_BACKEND_URL;
import ChatPopup from '../components/ChatPopup';
import Newsletter from '../components/NewsletterBox';
import JobPosting from '../components/JobPostingPopup';

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [aboutImage, setAboutImage] = useState(null);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/about`);
        setAboutData(response.data);
        setAboutImage(response.data.image);
      } catch (error) {
        console.error('Error fetching about data:', error);
      }
    };
    fetchAboutData();
  }, []);

  if (!aboutData) return <div className="flex items-center justify-center min-h-screen text-lg">Loading...</div>;

  return (
    <div className="container px-6 mx-auto my-20 md:px-12">
      {/* Page Title */}
      <div className="pt-8 text-center border-t">
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      {/* About Section */}
      <div className="flex flex-col-reverse items-center gap-16 my-10 md:flex-row">
        <div className="flex-1 space-y-6 text-gray-600">
          <p>{aboutData.description}</p>
          <p>{aboutData.additionalDescription}</p>
          <h3 className="text-xl font-semibold text-gray-800">{aboutData.missionTitle}</h3>
          <p>{aboutData.mission}</p>
        </div>
        <img
          className="object-cover w-full rounded-lg shadow-lg md:max-w-lg"
          src={aboutImage || assets.hasharon}
          alt="About Image"
          loading="lazy"
        />
      </div>

      {/* Why Choose Us Section */}
      <div className="py-4 text-4xl text-center">
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>
      <div className="grid grid-cols-1 gap-8 mb-20 text-sm md:grid-cols-3">
        {[{
          title: aboutData.qualityAssuranceTitle,
          description: aboutData.qualityAssurance
        }, {
          title: aboutData.convenienceTitle,
          description: aboutData.convenience
        }, {
          title: aboutData.customerServiceTitle,
          description: aboutData.customerService
        }].map((item, index) => (
          <div key={index} className="p-8 bg-white border rounded-lg shadow-md">
            <h4 className="mb-3 text-lg font-semibold">{item.title}</h4>
            <p className="text-gray-700">{item.description}</p>
          </div>
        ))}
      </div>



      {/* Map Section */}
      <div className="relative z-10 py-10">
        <Title text1={'OUR'} text2={'LOCATION'} />
        <div className="relative w-full h-[500px] bg-gray-200 rounded-lg overflow-hidden shadow-md">
          <Map3D />
        </div>
      </div>
    </div>
  );
};

export default About;