import React, { useContext, useEffect, useState, useLayoutEffect } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { backendUrl } from 'const backendUrl = import.meta.env.VITE_BACKEND_URL;';
import Lenis from 'lenis';
import AdsDisplay from '../components/AdsDisplay';

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
    axios
      .get(`${backendUrl}/api/categories`)
      .then((response) => setCategories(response.data))
      .catch((error) => console.error('Error fetching categories:', error));
  }, []);

  // Toggle Category Filter
  const toggleCategory = (e) => {
    const selectedCategory = e.target.value;
    setCategory((prev) =>
      prev.includes(selectedCategory)
        ? prev.filter((item) => item !== selectedCategory)
        : [...prev, selectedCategory]
    );
  };

  // Toggle "Select All" for categories
  const toggleSelectAllCategories = (e) => {
    if (e.target.checked) {
      // Select all categories
      const allCategories = categories.map((cat) => cat.name);
      setCategory(allCategories);
    } else {
      // Deselect all categories
      setCategory([]);
    }
  };

  // Toggle SubCategory Filter
  const toggleSubCategory = (e) => {
    setSubCategory((prev) =>
      prev.includes(e.target.value)
        ? prev.filter((item) => item !== e.target.value)
        : [...prev, e.target.value]
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

  // Sort products when sorting type changes
  useEffect(() => {
    sortProduct();
  }, [sortType]);

  useLayoutEffect(() => {
    const lenis = new Lenis({
      smooth: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy(); // Cleanup
  }, []);

  return (
    <div className='flex flex-col sm:flex-row py-20 gap-6 sm:gap-10 border-t md:px-[2vw] px-4'>
      {/* Filter Sidebar */}
      <div className={`min-w-60 transition-all duration-300 ${showFilter ? 'block' : 'hidden'} sm:block`}>
        <p
          onClick={() => setShowFilter(!showFilter)}
          className='flex items-center gap-2 my-2 text-xl cursor-pointer sm:hidden'
        >
          FILTERS
          <img
            className={`h-3 ${showFilter ? 'rotate-90' : ''}`}
            src={assets.dropdown_icon}
            alt=''
          />
        </p>

        {/* Category Filter */}
        <div className='py-3 pl-5 mt-6 border border-gray-300 rounded-lg'>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
          {/* "Select All" Checkbox */}
          <label className='flex items-center gap-2 text-sm font-light text-gray-700'>
            <input
              type='checkbox'
              checked={category.length === categories.length}
              onChange={toggleSelectAllCategories}
              className='w-3'
            />
            Select All
          </label>
          {/* Individual Category Checkboxes */}
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {categories.map((cat) => (
              <label key={cat._id} className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  value={cat.name}
                  checked={category.includes(cat.name)}
                  onChange={toggleCategory}
                  className='w-3'
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      </div>

     {/* Main Content (Products + Ads) */}
<div className='flex w-full gap-6'>
  {/* Product Display Section */}
  <div className='flex flex-col flex-1'>
    <div className='flex justify-between mb-6 text-base sm:text-2xl'>
      <Title text1={'All'} text2={'PRODUCTS'} />

      {/* Sorting Dropdown */}
      <select
        onChange={(e) => setSortType(e.target.value)}
        className='px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500'
      >
        <option value='relavant'>Sort by: Relevant</option>
        <option value='low-high'>Sort by: Low to High</option>
        <option value='high-low'>Sort by: High to Low</option>
      </select>
    </div>

    {/* Product Grid */}
    <div className='grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 gap-y-6'>
      {filterProducts.length > 0 ? (
        filterProducts.map((item) => (
          <ProductItem
            key={item._id}
            name={item.name}
            id={item._id}
            quantity={item.quantity}
            price={item.price}
            discount={item.discount}
            video={item.video}
            image={item.image}
            description={item.description}
            variations={item.variations}
          />
        ))
      ) : (
        <p className='text-center text-gray-500 col-span-full'>No products found.</p>
      )}
    </div>
  </div>

  {/* Ads Section - Pantay sa Products */}
  <div className='flex flex-col w-1/4'>
    <AdsDisplay/>
  </div>
</div>

    </div>
  );
};

export default Collection;