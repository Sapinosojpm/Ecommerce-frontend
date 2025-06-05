import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function Cursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { damping: 25, stiffness: 400 });
  const smoothY = useSpring(mouseY, { damping: 25, stiffness: 400 });

  useEffect(() => {
    const move = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseEnter = (e) => {
  if (e.target instanceof Element && e.target.matches('a, button, [role="button"], input, textarea, select')) {
    setIsHovered(true);
  }
};

const handleMouseLeave = (e) => {
  if (e.target instanceof Element && e.target.matches('a, button, [role="button"], input, textarea, select')) {
    setIsHovered(false);
  }
};


    

    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          translateX: smoothX,
          translateY: smoothY,
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          scale: isHovered ? 2 : isClicking ? 0.8 : 1,
          opacity: isClicking ? 0.3 : 0.6,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
        }}
      >
        <div className="w-8 h-8 bg-transparent border border-white rounded-full backdrop-blur-sm" />
      </motion.div>

      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          translateX: mouseX,
          translateY: mouseY,
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          scale: isHovered ? 0 : isClicking ? 1.5 : 1,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 400,
        }}
      >
        <div className="w-1 h-1 bg-white rounded-full mix-blend-difference" />
      </motion.div>

      {/* Hover Effect Ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          translateX: smoothX,
          translateY: smoothY,
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          scale: isHovered ? 1.5 : 0,
          opacity: isHovered ? 0.2 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300,
        }}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 blur-sm" />
      </motion.div>

      {/* Click Ripple Effect */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997]"
        style={{
          translateX: mouseX,
          translateY: mouseY,
          x: '-50%',
          y: '-50%',
        }}
        animate={{
          scale: isClicking ? [1, 2] : 1,
          opacity: isClicking ? [0.5, 0] : 0,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
      >
        <div className="w-6 h-6 border-2 border-white rounded-full mix-blend-difference" />
      </motion.div>
    </>
  );
}