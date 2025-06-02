import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/hero.css';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Hero = () => {
  const [heroData, setHeroData] = useState(null);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/hero`);
        console.log('Hero data:', data);

        if (data && (data.image || data.video)) {
          setHeroData({
            title: data.title,
            subtitle: data.subtitle,
            type: data.type || 'image',
            image: data.image?.startsWith('http') ? data.image : `${backendUrl}${data.image}`,

            video: data.video ? `${backendUrl}${data.video}` : null,
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
      className="relative flex flex-col sm:flex-row"
      style={{
        minHeight: '400px',
        position: 'relative',
        color: 'white',
      }}
    >
      {/* Video background */}
      {heroData.type === 'video' && heroData.video && (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
          src={heroData.video}
        />
      )}

      {/* Image background with overlay gradient */}
      {heroData.type === 'image' && heroData.image && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${heroData.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
      )}

      {/* Content (text) */}
      <div
        id="section1-content"
        className="flex items-center justify-center w-full py-10 sm:w-3/4 sm:py-0 sm:pl-10 sm:pr-5 sm:my-0"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div
          id="text-content-container"
          className="mx-6 py-[15%] sm:mx-16 text-center sm:text-left"
        >
          <h1 id="text-content" className="pt-[10%]">
            {heroData.title.replace(/(^"|"$)/g, '')}
          </h1>
          <p id="text-p" className="text-lg sm:text-xl">
            {heroData.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
