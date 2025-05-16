import React, { useContext, useEffect, useState, useLayoutEffect } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
const backendUrl = import.meta.env.VITE_BACKEND_URL;
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

  // Close filter panel when screen size increases beyond mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setShowFilter(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="px-4 py-6 mx-auto mt-12 lg:mt-12 max-w-screen-2xl md:py-12 sm:px-6 lg:px-8">
      {/* Page Header with Title + Filters Toggle Button (Mobile) */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b">
        <Title text1={'All'} text2={'PRODUCTS'} />
        
        {/* Filter Toggle Button (Mobile Only) */}
        <button 
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg lg:hidden"
        >
          <span className="font-medium">Filters</span>
          <img
            className={`h-3 transition-transform ${showFilter ? 'rotate-180' : ''}`}
            src={assets.dropdown_icon}
            alt="Toggle filters"
          />
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filter Sidebar - Overlay on mobile, sidebar on desktop */}
       <div 
  className={`
    ${showFilter ? 'fixed inset-0 z-50 bg-black bg-opacity-50' : 'hidden'} 
    lg:block lg:static lg:bg-transparent lg:z-auto
  `}

          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFilter(false);
          }}
        >
       <div 
  className={`
    ${showFilter ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
    fixed top-0 left-0 h-full w-4/5 max-w-xs lg:max-w-none lg:w-60 
    bg-white lg:bg-transparent lg:static transition-transform duration-300
    overflow-y-auto p-6 lg:p-0 shadow-lg lg:shadow-none z-50
  `}

            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Filter Header */}
            <div className="flex items-center justify-between mb-6 sm:hidden">
              <h3 className="text-lg font-bold">Filters</h3>
              <button 
                onClick={() => setShowFilter(false)}
                className="p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Category Filter */}
            <div className="px-4 py-4 mb-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="mb-3 text-sm font-semibold tracking-wider uppercase">Categories</h3>
              
              {/* "Select All" Checkbox */}
              <label className="flex items-center gap-2 px-1 py-1 mb-2 text-sm text-gray-700 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={category.length === categories.length && categories.length > 0}
                  onChange={toggleSelectAllCategories}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Select All</span>
              </label>
              
              {/* Divider */}
              <div className="h-px my-2 bg-gray-200"></div>
              
              {/* Individual Category Checkboxes */}
              <div className="flex flex-col gap-1 pr-1 overflow-y-auto max-h-60">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <label key={cat._id} className="flex items-center gap-2 px-1 py-1 text-sm text-gray-700 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        value={cat.name}
                        checked={category.includes(cat.name)}
                        onChange={toggleCategory}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm italic text-gray-500">Loading categories...</p>
                )}
              </div>
            </div>

            {/* Mobile Apply Filters Button */}
            <button 
              onClick={() => setShowFilter(false)}
              className="w-full py-2 text-white bg-blue-600 rounded-lg sm:hidden"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="flex justify-end mb-6">
            <div className="relative">
              <select
                onChange={(e) => setSortType(e.target.value)}
                className="py-2 pl-4 pr-10 text-sm bg-white border border-gray-300 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="relavant">Sort by: Relevant</option>
                <option value="low-high">Sort by: Price Low to High</option>
                <option value="high-low">Sort by: Price High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Flexible Layout for Products and Ads */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Product Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
                  <div className="py-20 text-center col-span-full">
                    <p className="text-lg text-gray-500">No products found matching your criteria.</p>
                    {(category.length > 0 || subCategory.length > 0 || search) && (
                      <button 
                        onClick={() => {
                          setCategory([]);
                          setSubCategory([]);
                        }}
                        className="mt-4 text-blue-600 underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ads Section - Responsive display */}
            <div className="w-full mt-8 lg:w-1/4 lg:mt-0">
              <div className="sticky top-6">
                <AdsDisplay />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;