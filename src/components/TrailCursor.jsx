import { useEffect, useState, useRef } from "react";
import birdGif from "../assets/gif/Bird.gif";
import "../css/TrailCursor.css";

const TrailCursor = () => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);

  const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const updateTargetPosition = (e) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", updateTargetPosition);

    const smoothMove = () => {
      setPosition((prev) => {
        const dx = targetPos.current.x - prev.x;
        const dy = targetPos.current.y - prev.y;

        // Lower lerp factor for more delay
        const lerpFactor = 0.05; // Adjust this for more delay (0.05 = more delay, 0.2 = less delay)
        const newX = prev.x + dx * lerpFactor;
        const newY = prev.y + dy * lerpFactor;

        // Calculate smooth rotation angle
        const angle = Math.atan2(dy, dx) * (0 / Math.PI);

        // Flip the bird if moving right
        setFlip(dx > 0);

        setRotation(angle);
        return { x: newX, y: newY };
      });

      requestAnimationFrame(smoothMove);
    };

    smoothMove(); // Start animation loop

    return () => window.removeEventListener("mousemove", updateTargetPosition);
  }, []);

  return (
    <img
      src={birdGif}
      alt="Flying Bird"
      className="bird"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -80%) rotate(${rotation}deg) scaleX(${flip ? -1 : 1})`,
      }}
    />
  );
};

export default TrailCursor;
