import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { ShopContext } from "../context/ShopContext";
import { youtubeContext } from "../context/youtubeContext";
import ImageItem from "./ImageItem";

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
      return `https://www.youtube.com/embed/${videoId}`;
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

  useEffect(() => {
    if (intros.length === 0) {
      setCurrentSlide(0);
    }
  }, [intros]);

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
    return <div>Loading...</div>;
  }

  const currentIntro = intros[currentSlide];
  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  return (
    <motion.div
      className="my-9 flex gap-2 flex-col sm:flex-row mx-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Image Slider Section */}
      <motion.div
        id="section2-content"
        className="h-[100%] w-full sm:w-1/2 flex items-center justify-center sm:py-0 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="relative w-full overflow-hidden">
          <motion.div
            key={currentSlide}
            className="flex justify-center items-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
          >
            {currentIntro?.image && <ImageItem image={currentIntro.image} />}
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-1xl bg-black bg-opacity-40 backdrop-blur-md p-4 rounded-full shadow-md transition-all duration-300 hover:bg-opacity-60 hover:scale-125 hover:shadow-lg"
          >
            &lt;
          </button>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-1xl bg-black bg-opacity-40 backdrop-blur-md p-4 rounded-full shadow-md transition-all duration-300 hover:bg-opacity-60 hover:scale-125 hover:shadow-lg"
          >
            &gt;
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {intros.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`w-3 h-3 rounded-full bg-white transition-all ${
                currentSlide === index ? "bg-opacity-80" : "bg-opacity-50 hover:bg-opacity-80"
              }`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute top-4 right-4 text-white">
          {currentSlide + 1}/{intros.length}
        </div>
      </motion.div>

      {/* Video Section */}
      <motion.div
        className="w-full sm:w-1/2 flex flex-col items-center justify-center sm:py-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {currentIntro?.video ? (
          <video width="100%" height="100%" controls>
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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        ) : (
          <p>No video available</p>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Intro;
