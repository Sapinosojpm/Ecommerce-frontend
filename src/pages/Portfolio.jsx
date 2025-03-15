import React, { useContext, useLayoutEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import CardItem from "../components/CardItem"; // Import the CardItem component
import Lenis from "lenis";
const Portfolio = () => {
  const { cards } = useContext(ShopContext); // Access cards data from context


  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true, // Enables smooth scrolling
      duration: 1.2, // Adjust smoothness
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Natural easing effect
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
  }, []);

  return (
    <div className="max-w-screen-xl px-4 pt-5 mx-auto my-20">
      <h1 className="mb-8 text-3xl font-semibold text-center text-gray-800">Some of Our Transactions</h1>
      
      <div className="grid grid-cols-2 gap-6 pt-12 card-collection sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Grid of Cards */}
        {cards.map((card) => (
          <CardItem
            key={card._id}
            name={card.name}
            description={card.description}
            image={card.image}
          />
        ))}
      </div>
    </div>
  );
};

export default Portfolio;
