import React from "react";

const AdBanner = ({ imageUrl, title, description, link }) => {
  return (
    <div className="p-4 mt-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <a href={link} target="_blank" rel="noopener noreferrer" className="block">
        <img src={imageUrl} alt={title} className="w-full rounded-md" />
      </a>
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 mt-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Learn More
        </a>
      </div>
    </div>
  );
};

export default AdBanner;
