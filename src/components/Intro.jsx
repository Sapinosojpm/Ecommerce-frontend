import React, { useState, useContext, useEffect, useRef } from "react";
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

const AUTO_SLIDE_INTERVAL = 6000;

const Intro = () => {
  const { youtubeUrl } = useContext(youtubeContext);
  const { intros } = useContext(ShopContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [videoRef, setVideoRef] = useState(null);
  const autoSlideRef = useRef();
  const ariaLiveRef = useRef();

  useEffect(() => {
    if (intros.length === 0) {
      setCurrentSlide(0);
    }
  }, [intros]);

  // Auto-slide logic
  useEffect(() => {
    if (!isHovering && intros.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % intros.length);
      }, AUTO_SLIDE_INTERVAL);
      return () => clearInterval(autoSlideRef.current);
    } else {
      clearInterval(autoSlideRef.current);
    }
  }, [isHovering, intros.length]);

  // Autoplay video when slide changes
  useEffect(() => {
    if (videoRef) {
      videoRef.play().catch(error => {
        // Autoplay prevented
      });
    }
    if (ariaLiveRef.current) {
      ariaLiveRef.current.textContent = `Showing slide ${currentSlide + 1} of ${intros.length}`;
    }
  }, [currentSlide, videoRef, intros.length]);

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
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-xl shadow-lg">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  const currentIntro = intros[currentSlide];
  const embedUrl = getYoutubeEmbedUrl(youtubeUrl);

  return (
    <section className="relative w-full py-8 px-2 sm:px-6 md:px-12 lg:px-20 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-3xl shadow-2xl my-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-100/60 via-white/60 to-green-100/60 blur-2xl opacity-60 z-0" />
      <motion.div
        className="relative z-10 flex flex-col gap-8 w-full lg:flex-row items-stretch"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Image Slider Section */}
        <motion.div
          className="relative w-full overflow-hidden bg-black/80 lg:w-1/2 rounded-2xl aspect-video shadow-xl"
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
              <ImageItem image={currentIntro.image} className="object-cover w-full h-full" loading="lazy" alt={currentIntro.title || "Intro image"} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No image available
              </div>
            )}
            {/* Glassmorphism overlay for title/desc */}
            {(currentIntro?.title || currentIntro?.description) && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/30 backdrop-blur-md rounded-b-2xl shadow-lg flex flex-col gap-1">
                {currentIntro.title && <h2 className="text-lg font-bold text-gray-900 drop-shadow-sm">{currentIntro.title}</h2>}
                {currentIntro.description && <p className="text-sm text-gray-800/90">{currentIntro.description}</p>}
              </div>
            )}
          </motion.div>

          {/* Navigation Arrows */}
          <motion.button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute p-2 text-xl text-white transition-all duration-300 transform -translate-y-1/2 bg-black/40 rounded-full shadow-lg left-2 top-1/2 hover:bg-opacity-80 hover:scale-110"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering ? 1 : 0.7 }}
            whileHover={{ scale: 1.1 }}
          >
            <FiChevronLeft size={22} />
          </motion.button>

          <motion.button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute p-2 text-xl text-white transition-all duration-300 transform -translate-y-1/2 bg-black/40 rounded-full shadow-lg right-2 top-1/2 hover:bg-opacity-80 hover:scale-110"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovering ? 1 : 0.7 }}
            whileHover={{ scale: 1.1 }}
          >
            <FiChevronRight size={22} />
          </motion.button>

          {/* Slide Indicators */}
          <div className="absolute flex space-x-2 transform -translate-x-1/2 bottom-4 left-1/2 z-10">
            {intros.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 rounded-full transition-all duration-200 border border-white/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  currentSlide === index ? "bg-white w-6" : "bg-white/60 w-2.5 hover:bg-white/90"
                }`}
              />
            ))}
          </div>

          {/* Slide Counter & aria-live */}
          <div className="absolute px-2 py-1 text-xs text-white bg-black/60 rounded-md top-3 right-3 backdrop-blur-sm shadow">
            {currentSlide + 1}/{intros.length}
            <span ref={ariaLiveRef} className="sr-only" aria-live="polite" />
          </div>
        </motion.div>

        {/* Video Section */}
        <motion.div
          className="w-full overflow-hidden bg-gray-100 lg:w-1/2 rounded-2xl aspect-video shadow-xl"
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
              loading="lazy"
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
              loading="lazy"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No video available
            </div>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Intro;