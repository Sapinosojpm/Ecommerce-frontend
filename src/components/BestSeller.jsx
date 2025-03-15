import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import axios from "axios";

const BestSeller = () => {
    const { products, currency } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    const [maxDisplay, setMaxDisplay] = useState(10);

    useEffect(() => {
        // Fetch max best-seller display limit
        const fetchMaxDisplay = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/best-seller-setting`);
                setMaxDisplay(response.data.maxDisplay || 10);
            } catch (error) {
                console.error("Error fetching best seller setting:", error);
            }
        };

        fetchMaxDisplay();
    }, []);

    useEffect(() => {
        const bestProducts = products.filter((item) => item.bestseller);
        setBestSeller(bestProducts.slice(0, maxDisplay));
    }, [products, maxDisplay]);

    return (
        <div className="my-[10%] md:px-[7vw] px-4 md:mx-[6%]">
            <div className="py-8 text-3xl text-center">
                <Title text1={"BEST"} text2={"SELLERS"} />
            </div>
            <div className="grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6">
                {bestSeller.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item._id}
                        image={item.image}
                        name={item.name}
                        price={item.price}
                        discount={item.discount}
                        currency={currency}
                        description={item.description}
                    />
                ))}
            </div>
        </div>
    );
};

export default BestSeller;
