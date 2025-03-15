import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OurPolicy = () => {
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/policies`);
        setPolicies(response.data);
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };

    fetchPolicies();
  }, []);

  return (
    <div className='flex flex-wrap justify-center gap-8 text-center text-gray-700'>
      {policies.map((policy) => (
        <div key={policy._id} className="w-60">
          <img 
            src={`${import.meta.env.VITE_BACKEND_URL}${policy.image}`} 
            alt={policy.title} 
            className="w-12 m-auto mb-5" 
          />

          <p className='font-semibold'>{policy.title}</p>
          <p className='text-gray-400'>{policy.description}</p>
        </div>
      ))}
    </div>
  );
};

export default OurPolicy;
