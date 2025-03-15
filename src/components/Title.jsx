import React from "react";
import { assets } from "../assets/assets";

const Title = ({ text1, text2, iconSrc }) => {
  const [firstPart, secondPart] = text1.split(" "); 

  return (
    <div className="inline-flex items-center gap-2 mb-3 text-3xl font-bold text-gray-500">
      {firstPart} {iconSrc && <img src={assets.flashsale} alt="icon" className="w-6 h-6 mx-1" />} {secondPart} <span className="text-gray-700">{text2}</span>
    {/* Line Separator */}
    <div className="w-8 sm:w-12 h-[1px] sm:h-[2px] bg-gray-700"></div>

    </div>
  );
};

export default Title;
