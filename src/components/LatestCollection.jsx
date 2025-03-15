import { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from './Title';
import ProductItem from './ProductItem';
import axios from "axios";

const LatestCollection = () => {
    const { products, currency } = useContext(ShopContext);
    const [latestProducts, setLatestProducts] = useState([]);
    const [maxDisplay, setMaxDisplay] = useState(10);

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/latest-products`);
                setMaxDisplay(response.data.maxDisplay);
            } catch (error) {
                console.error("Error fetching latest product setting:", error);
            }
        };
        fetchSetting();
    }, []);

    useEffect(() => {
        const sortedProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLatestProducts(sortedProducts.slice(0, maxDisplay));
    }, [products, maxDisplay]);

    return (
        <div className='my-10 md:px-[7vw] px-4 md:mx-[6%]'>
            <div className='py-8 text-4xl text-center'>
                <Title text1={'LATEST'}  text2={'PRODUCTS'} />
            </div>

            <div className='grid grid-cols-2 sm:gap-[2%] md:gap-x-[7%] sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6'>
                {latestProducts.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item._id}
                        image={item.image}
                        name={item.name}
                        price={item.price}
                        discount={item.discount}
                        currency={currency}
                        video={item.video}
                        description={item.description}
                    />
                ))}
            </div>
        </div>
    );
};

export default LatestCollection;
