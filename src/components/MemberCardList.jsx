import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import MemberCard from "./MemberCard";

const MemberCardList = () => {
  const { memberCards } = useContext(ShopContext);

  console.log("Member Cards Data:", memberCards); // Debugging Log

  return (
    <div className="max-w-screen-xl px-4 pt-24 mx-auto">
      <h1 className="mb-8 text-3xl font-semibold text-center text-gray-800">
        Company Members
      </h1>

      <div className="grid grid-cols-2 gap-6 pt-12 card-collection sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Prevent crash when memberCards is undefined */}
        {Array.isArray(memberCards) && memberCards.length > 0 ? (
          memberCards.map((memberCard) => (
            <MemberCard
              key={memberCard._id}
              name={memberCard.name}
              description={memberCard.description}
              image={memberCard.image}
            />
          ))
        ) : (
          <div>No member cards available.</div>
        )}
      </div>
    </div>
  );
};

export default MemberCardList;
