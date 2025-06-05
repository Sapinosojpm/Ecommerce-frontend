import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import AdCard from "./AdCard";
import axios from "axios";

const BestSeller = () => {
    const { products, currency } = useContext(ShopContext);
    const [bestSeller, setBestSeller] = useState([]);
    const [maxDisplay, setMaxDisplay] = useState(10);
    const [ads, setAds] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [settingsResponse, adsResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/best-seller-setting`),
                    axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/ads`)
                ]);
                setMaxDisplay(settingsResponse.data.maxDisplay || 10);
                setAds(adsResponse.data.filter(ad => ad.isActive));
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    // Function to integrate ads with products
    const integrateAdsWithProducts = (products, ads) => {
        if (!ads.length) return products.map(product => ({ type: 'product', data: product }));

        const integrated = [];
        const adPositions = [4]; // Adjusted positions for smaller collections or add more positions as needed
        // Example: [3, 6, 9] for every 3rd product, or [5] for a single ad after the first 5 products
        let adIndex = 0;

        products.forEach((product, index) => {
            integrated.push({ type: 'product', data: product });

            if (adPositions.includes(index + 1) && ads[adIndex]) {
                integrated.push({ 
                    type: 'ad', 
                    data: ads[adIndex],
                    id: `ad-${ads[adIndex]._id}-${index}`
                });
                adIndex = (adIndex + 1) % ads.length;
            }
        });

        return integrated;
    };

   useEffect(() => {
    const bestProducts = products.filter((item) => item.bestseller);
    setBestSeller(integrateAdsWithProducts(bestProducts.slice(0, maxDisplay), ads));
}, [products, maxDisplay, ads]);


    return (
        <div className="my-[10%] md:px-[7vw] px-4 md:mx-[6%]">
            <div className="py-8 text-3xl text-center">
                <Title text1={"BEST"} text2={"SELLERS"} />
                <p className="text-lg text-gray-600">"Don’t miss out on our best-selling products — loved by hundreds of happy customers! These top-rated items are flying off the shelves fast, so grab yours while stocks last and see why everyone’s talking about them!"</p>
            </div>
            <div className="grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6">
                {bestSeller.map((item) => (
                    item.type === 'product' ? (
                        <ProductItem
                            key={item.data._id}
                            id={item.data._id}
                            image={item.data.image}
                            quantity={item.data.quantity}
                            name={item.data.name}
                            price={item.data.price}
                            discount={item.data.discount}
                            currency={currency}
                            description={item.data.description}
                        />
                    ) : (
                        <AdCard
                            key={item.id}
                            ad={item.data}
                        />
                    )
                ))}
            </div>
        </div>
    );
};

export default BestSeller;