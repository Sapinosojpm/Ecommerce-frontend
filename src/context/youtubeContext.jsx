// src/context/youtubeContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { backendUrl } from '../../../admin/src/App';

// Create and export the context as a named export
export const youtubeContext = createContext();

export const YoutubeProvider = ({ children }) => {
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/embed/default");

  useEffect(() => {
    fetch(`${backendUrl}/api/youtube-url`)
      .then((res) => res.json())
      .then((data) => {
        if (data.youtubeUrl) {
          setYoutubeUrl(data.youtubeUrl);
        }
      })
      .catch((error) => {
        console.error("Error fetching YouTube URL:", error);
      });
  }, []);

  return (
    <youtubeContext.Provider value={{ youtubeUrl, setYoutubeUrl }}>
      {children}
    </youtubeContext.Provider>
  );
};
