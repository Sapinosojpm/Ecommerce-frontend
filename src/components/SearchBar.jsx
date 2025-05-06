import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import { useLocation } from 'react-router-dom';

const SearchBar = () => {
  const { search, setSearch, showSearch, setShowSearch, products } = useContext(ShopContext);
  const [visible, setVisible] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const location = useLocation();

  // Show/hide search bar based on route
  useEffect(() => {
    if (location.pathname.includes('collection')) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [location]);

  // Filter suggestions based on search input
  useEffect(() => {
    if (search) {
      const filteredSuggestions = products
        .filter((product) =>
          product.name.toLowerCase().includes(search.toLowerCase())
        )
        .map((product) => product.name);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]); // Clear suggestions if search is empty
    }
  }, [search, products]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion); // Autofill the search bar
    setSuggestions([]); // Clear suggestions
  };

  return showSearch && visible ? (
    <div className='mt-20 text-center border-t border-b bg-gray-50'>
      <div className='relative inline-flex items-center justify-center w-3/4 px-5 py-2 mx-3 my-5 border border-gray-400 rounded-full sm:w-1/2'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='flex-1 text-sm outline-none bg-inherit'
          type='text'
          placeholder='Search'
        />
        <img className='w-4' src={assets.search_icon} alt='' />
        {/* Display suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className='absolute left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg top-full'>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className='p-2 cursor-pointer hover:bg-gray-100'
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
      <img
        onClick={() => setShowSearch(false)}
        className='inline w-3 cursor-pointer'
        src={assets.cross_icon}
        alt=''
      />
    </div>
  ) : null;
};

export default SearchBar;