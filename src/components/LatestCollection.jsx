import { useState, useEffect, useContext, useMemo } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import axios from "axios";

const LatestCollection = () => {
    const { products, currency } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);
    const [maxDisplay, setMaxDisplay] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch display settings
    useEffect(() => {
        const fetchSetting = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/latest-products`);
                setMaxDisplay(response.data.maxDisplay);
            } catch (err) {
                console.error("Error fetching latest product setting:", err);
                setError("Failed to load display settings");
                // Fallback to default value
                setMaxDisplay(10);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSetting();
    }, []);

    // Memoize sorted products to avoid unnecessary sorting
    const sortedProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        
        return [...products].sort((a, b) => {
            // Handle cases where createdAt might be missing or invalid
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });
    }, [products]);

    // Update latest products when sorted products or maxDisplay changes
    useEffect(() => {
        if (sortedProducts.length > 0) {
            setLatestProducts(sortedProducts.slice(0, maxDisplay));
        }
    }, [sortedProducts, maxDisplay]);

    if (error) {
        return (
            <div className='my-10 md:px-[7vw] px-4 md:mx-[6%] text-center text-red-500'>
                {error}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className='my-10 md:px-[7vw] px-4 md:mx-[6%]'>
                <div className='py-8 text-4xl text-center'>
                    <Title text1={'LATEST'} text2={'PRODUCTS'} />
                </div>
                <div className='grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6'>
                    {[...Array(maxDisplay)].map((_, index) => (
                        <div key={index} className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (latestProducts.length === 0) {
        return (
            <div className='my-10 md:px-[7vw] px-4 md:mx-[6%]'>
                <div className='py-8 text-4xl text-center'>
                    <Title text1={'LATEST'} text2={'PRODUCTS'} />
                </div>
                <p className="text-center text-gray-500">No latest products available</p>
            </div>
        );
    }

    return (
        <div className='my-10 md:px-[7vw] px-4 md:mx-[6%]'>
            <div className='py-8 text-4xl text-center'>
                <Title text1={'LATEST'} text2={'PRODUCTS'} />
            </div>

            <div className='grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6'>
                {latestProducts.map((item) => (
                    <ProductItem
                        key={item._id}
                        id={item._id}
                        image={item.image}
                        name={item.name}
                        price={item.price}
                        quantity={item.quantity}
                        discount={item.discount}
                        currency={currency}
                        video={item.video}
                        description={item.description}
                        createdAt={item.createdAt}
                    />
                ))}
            </div>
        </div>
    );
};

export default LatestCollection;