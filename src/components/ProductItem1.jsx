import React from 'react';

const ProductItem1 = ({ image }) => {
  return (
    <div className="border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="m-5 rounded-lg">
        <img
          className="w-full object-cover h-40 hover:scale-105 transform transition-transform duration-300" // Adjusted the height and removed padding
          src={image[0]} // Assuming `image` is an array and the first image is the main one
          alt={name}
        />
      </div>

    </div>
  );
};


export default ProductItem1;
