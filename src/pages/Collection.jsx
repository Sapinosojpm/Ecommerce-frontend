import React, { useContext, useEffect, useState, useLayoutEffect } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { backendUrl } from '../../../admin/src/App';
import Lenis from "lenis";


const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilteredProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState('relavant');
  const [categories, setCategories] = useState([]);

  // Fetch categories from the backend
  useEffect(() => {
    axios.get(`${backendUrl}/api/categories`)
      .then(response => setCategories(response.data))
      .catch(error => console.error('Error fetching categories:', error));
  }, []);

  // Toggle Category Filter
  const toggleCategory = (e) => {
    setCategory((prev) =>
      prev.includes(e.target.value) ? prev.filter((item) => item !== e.target.value) : [...prev, e.target.value]
    );
  };

  // Toggle SubCategory Filter
  const toggleSubCategory = (e) => {
    setSubCategory((prev) =>
      prev.includes(e.target.value) ? prev.filter((item) => item !== e.target.value) : [...prev, e.target.value]
    );
  };

  // Apply filters to products
  const applyFilter = () => {
    let productCopy = [...products];

    // Filter by search input
    if (showSearch && search) {
      productCopy = productCopy.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by category
    if (category.length > 0) {
      productCopy = productCopy.filter((item) => category.includes(item.category));
    }

    // Filter by subCategory
    if (subCategory.length > 0) {
      productCopy = productCopy.filter((item) => subCategory.includes(item.subCategory));
    }

    // Apply discount calculation
    productCopy = productCopy.map((item) => ({
      ...item,
      finalPrice: item.discount && item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price,
    }));

    setFilteredProducts(productCopy);
  };

  useEffect(() => {
    applyFilter();
    console.log("Filtered Products:", filterProducts); // This will log the filtered products after applying the filters
  }, [category, subCategory, search, showSearch, products]);
  
  // Sort products
  const sortProduct = () => {
    let sortedProducts = [...filterProducts];

    switch (sortType) {
      case 'low-high':
        sortedProducts.sort((a, b) => a.finalPrice - b.finalPrice);
        break;
      case 'high-low':
        sortedProducts.sort((a, b) => b.finalPrice - a.finalPrice);
        break;
      default:
        applyFilter();
        return;
    }

    setFilteredProducts(sortedProducts);
  };

  // Apply filter when category, subCategory, search, or products change
  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, showSearch, products]);

  // Sort products when sorting type changes
  useEffect(() => {
    sortProduct();
  }, [sortType]);



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
    <div className='flex flex-col sm:flex-row py-20 gap-1 sm:gap-10 border-t md:px-[2vw] px-4'>
      
      {/* Filter Sidebar */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='flex items-center gap-2 my-2 text-xl cursor-pointer'>
          FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt='' />
        </p>

        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {categories.map((cat) => (
              <label key={cat._id} className='flex items-center gap-2'>
                <input className='w-3' type='checkbox' value={cat.name} onChange={toggleCategory} />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Product Display Section */}
      <div className='flex-1'>
        <div className='flex justify-between mb-4 text-base sm:text-2xl'>
          <Title text1={'All'} text2={'PRODUCTS'} />

          {/* Sorting Dropdown */}
          <select onChange={(e) => setSortType(e.target.value)} className='px-2 text-sm border-2 border-gray-300'>
            <option value='relavant'>Sort by: Relevant</option>
            <option value='low-high'>Sort by: Low to High</option>
            <option value='high-low'>Sort by: High to Low</option>
          </select>
        </div>

        {/* Product Grid */}
        <div className='grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 gap-y-6'>
          {filterProducts.length > 0 ? (
            filterProducts.map((item) => (
              <ProductItem
                key={item._id}
                name={item.name}
                id={item._id}
                price={item.price}
                discount={item.discount}
                image={item.image}
                description={item.description}
              />
            ))
          ) : (
            <p className='text-center text-gray-500 col-span-full'>No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collection;
