const ImageItem = ({ name, description, image }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col">
      {/* Image with gradient overlay & hover effect */}
      <div className="relative group">
        <img
          src={image}
          alt={name}
          className="w-full sm:h-[300px] md:h-[300px] lg:h-[300px] object-cover transition-opacity duration-500 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
      </div>

      {/* Card Content */}
      {/* <div className="p-5 flex flex-col flex-grow">
        <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
        <p className="text-gray-600 text-sm mt-2 leading-relaxed">{description}</p>
      </div> */}
    </div>
  );
};

export default ImageItem;
