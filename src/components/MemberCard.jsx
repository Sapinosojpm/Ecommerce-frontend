const MemberCard = ({ name, description, image }) => {
    return (
      <div className="flex flex-col overflow-hidden transition-transform transform bg-white rounded-lg shadow-lg hover:scale-105 hover:shadow-xl">
        <div className="w-72 h-72 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={image} alt={name} className="object-cover w-full h-full" />
        </div>
        <div className="flex flex-col justify-between flex-grow p-4">
          <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
          <p className="flex-grow mt-2 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    );
  };
  
  export default MemberCard;
  