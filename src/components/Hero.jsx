import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/hero.css';  // Adjust the path if necessary
import { backendUrl } from '../../../admin/src/App';

const Hero = () => {
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/hero`);
        console.log('Hero data:', data);
        if (data && data.image) {
          // Ensure full URL for the image
          setHeroData({
            title: data.title,
            subtitle: data.subtitle,
            image: `${backendUrl}${data.image}`,  // Add full URL for image
          });
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      }
    };
    fetchHeroData();
  }, []);
  

  if (!heroData) return <p>Loading...</p>;

  return (
    
    <div
      id="section1"
      className="flex flex-col border border-gray-400 sm:flex-row"
      style={{
        backgroundImage: `url(${heroData.image})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        minHeight: '400px', // Minimum height to ensure content is centered
      }}
    >

      
      <div 
        id="section1-content" 
        className="flex items-center justify-center w-full py-10 sm:w-1/2 sm:py-0 sm:pl-10 sm:pr-5 sm:my-0"
      >
        
        <div id="text-content-container" className="mx-6 py-[15%] sm:mx-16 text-center sm:text-left">
          <h1 
            id="text-content" 
            className="pt-[10%]"
          >
            {heroData.title}
          </h1>
          <p 
            id="text-p" 
            className="text-lg text-white sm:text-xl"
          >
            {heroData.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
