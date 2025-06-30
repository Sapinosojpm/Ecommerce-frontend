const CardItem = ({ name, description, image }) => {
    return (
      <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-xl flex flex-col">
        <div className="w-72 h-72 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="p-4 flex flex-col justify-between flex-grow">
          <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
          <p className="text-gray-600 text-sm mt-2 flex-grow">{description}</p>
        </div>
      </div>
    );
  };
  
  export default CardItem;
  