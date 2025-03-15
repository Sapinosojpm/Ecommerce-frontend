import React, { useEffect, useState, useLayoutEffect } from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import axios from 'axios';
import Map3D from '../components/Map3D';
import Lenis from 'lenis';
import { backendUrl } from '../../../admin/src/App'; // ✅ Import backendUrl

const About = () => {
  const [aboutData, setAboutData] = useState(null);
  const [aboutImage, setAboutImage] = useState(null); // ✅ Store Image

  // ✅ Fetch Image from Backend
  useEffect(() => {
    const fetchAboutImage = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/about/image`); // Adjust endpoint if needed
        const data = await res.json();
        setAboutImage(`${backendUrl}${data.imageUrl}`);
      } catch (error) {
        console.error("Error fetching about image:", error);
      }
    };
    fetchAboutImage();
  }, []);

  // ✅ Fetch About Data
  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/about`);
        setAboutData(response.data);
      } catch (error) {
        console.error('Error fetching about data:', error);
      }
    };
    fetchAboutData();
  }, []);

  if (!aboutData) return <div>Loading...</div>;

  return (
    <div className='md:px-[7vw] px-4 my-20'>
      <div className='pt-8 text-3xl text-center border-t'>
        <Title text1={'ABOUT'} text2={'US'} />
      </div>

      <div className='flex flex-col gap-16 my-10 md:flex-row'>
        {/* ✅ Use Fetched Image */}
        <img
          className='w-full md:max-w-[450px]'
          src={aboutImage || assets.hasharon} 
          alt="About Image"
          loading="lazy"
        />

        <div className='flex flex-col justify-center gap-6 text-gray-600 md:w-2/4'>
          <p>{aboutData.description}</p>
          <p>{aboutData.additionalDescription}</p>
          <b className='text-gray-800'>{aboutData.missionTitle}</b>
          <p>{aboutData.mission}</p>
        </div>
      </div>

      <div className='py-4 text-4xl'>
        <Title text1={'WHY'} text2={'CHOOSE US'} />
      </div>

      <div className='flex flex-col mb-20 text-sm md:flex-row'>
        <div className='flex flex-col gap-5 px-10 py-8 border md:px-16 sm:py-20'>
          <b>{aboutData.qualityAssuranceTitle}</b>
          <p className='text-gray-700'>{aboutData.qualityAssurance}</p>
        </div>
        <div className='flex flex-col gap-5 px-10 py-8 border md:px-16 sm:py-20'>
          <b>{aboutData.convenienceTitle}</b>
          <p className='text-gray-700'>{aboutData.convenience}</p>
        </div>
        <div className='flex flex-col gap-5 px-10 py-8 border md:px-16 sm:py-20'>
          <b>{aboutData.customerServiceTitle}</b>
          <p className='text-gray-700'>{aboutData.customerService}</p>
        </div>
      </div>

      {/* ✅ Display 3D Map */}
      <div className="relative z-10 py-10">
        <Title text1={'OUR'} text2={'LOCATION'} />
        <div className="relative w-full h-[500px] bg-gray-200 rounded-lg overflow-hidden">
          <Map3D />
        </div>
      </div>
    </div>
  );
};

export default About;
