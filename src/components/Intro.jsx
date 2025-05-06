import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { youtubeContext } from "../context/youtubeContext";
import ImageItem from "./ImageItem";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function getYoutubeEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    let videoId;

    if (parsedUrl.hostname === "youtu.be") {
      videoId = parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      videoId = parsedUrl.searchParams.get("v");
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&mute=1&rel=0&modestbranding=1`;
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
  }
  return url;
}

const Intro = () => {
  const { youtubeUrl } = useContext(youtubeContext);
  const { intros } = useContext(ShopContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  useEffect(() => {
    if (intros.length === 0) {
      setCurrentSlide(0);
    }
  }, [intros]);

  // Autoplay video when slide changes
  useEffect(() => {
    if (videoRef) {
      videoRef.play().catch(error => {
        console.log("Autoplay prevented:", error);
      });
    }
  }, [currentSlide, videoRef]);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % intros.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + intros.length) % intros.length);
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x < -50) {
      nextSlide();
    } else if (info.offset.x > 50) {
      prevSlide();
    }
  };

  if (!intros || intros.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  const currentIntro = intros[currentSlide];
  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  return (
    <motion.div
      className="flex flex-col gap-8 mx-4 my-12 lg:flex-row sm:mx-8 md:mx-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Image Slider Section */}
      <motion.div
        className="relative w-full overflow-hidden bg-black lg:w-1/2 rounded-2xl aspect-video"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <motion.div
          key={currentSlide}
          className="flex items-center justify-center w-full h-full"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          {currentIntro?.image ? (
            <ImageItem image={currentIntro.image} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No image available
            </div>
          )}
        </motion.div>

        {/* Navigation Arrows */}
        <motion.button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="absolute p-3 text-xl text-white transition-all duration-300 transform -translate-y-1/2 bg-black rounded-full shadow-lg left-4 top-1/2 bg-opacity-20 backdrop-blur-sm hover:bg-opacity-80 hover:scale-110"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovering ? 1 : 0.7 }}
          whileHover={{ scale: 1.1 }}
        >
          <FiChevronLeft size={24} />
        </motion.button>

        <motion.button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="absolute p-3 text-xl text-white transition-all duration-300 transform -translate-y-1/2 bg-black rounded-full shadow-lg right-4 top-1/2 bg-opacity-20 backdrop-blur-sm hover:bg-opacity-80 hover:scale-110"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovering ? 1 : 0.7 }}
          whileHover={{ scale: 1.1 }}
        >
          <FiChevronRight size={24} />
        </motion.button>

        {/* Slide Indicators */}
        <div className="absolute flex space-x-2 transform -translate-x-1/2 bottom-4 left-1/2">
          {intros.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === index ? "bg-white w-4" : "bg-white bg-opacity-50 hover:bg-opacity-80"
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute px-2 py-1 text-sm text-white bg-black bg-opacity-50 rounded-md top-4 right-4 backdrop-blur-sm">
          {currentSlide + 1}/{intros.length}
        </div>
      </motion.div>

      {/* Video Section */}
      <motion.div
        className="w-full overflow-hidden bg-gray-100 lg:w-1/2 rounded-2xl aspect-video"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {currentIntro?.video ? (
          <video
            ref={setVideoRef}
            width="100%"
            height="100%"
            controls={false}
            loop
            autoPlay
            muted
            playsInline
            className="object-cover w-full h-full"
            poster={currentIntro.image}
          >
            <source src={currentIntro.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : youtubeUrl ? (
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No video available
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Intro;

