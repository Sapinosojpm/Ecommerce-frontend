import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OurPolicy = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/policies`);
        setPolicies(response.data);
      } catch (error) {
        console.error('Error fetching policies:', error);
        setError('Failed to load policies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="w-64 h-8 mx-auto mb-4 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 mx-auto bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-32 h-5 mx-auto mb-2 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-40 h-4 mx-auto bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Unable to Load Policies</h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Our Commitment to You
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            We're dedicated to providing exceptional service and building trust through transparent policies.
          </p>
        </div>

        {/* Policy Cards Container */}
        <div
          className={`${
            policies.length < 4
              ? 'flex flex-wrap justify-center gap-8'
              : 'grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {policies.map((policy, index) => (
            <div 
              key={policy._id} 
              className="p-6 text-center transition-all duration-300 bg-white border border-gray-100 shadow-sm group rounded-xl hover:shadow-md hover:border-gray-200"
              style={{ 
                animationDelay: `${index * 150}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 transition-colors duration-300 bg-gray-100 rounded-full group-hover:bg-gray-900">
                <img 
                  src={
                    policy.image?.startsWith('http')
                      ? policy.image
                      : `${import.meta.env.VITE_BACKEND_URL}${policy.image || ''}`
                  }
                  alt={policy.title} 
                  className="object-contain w-8 h-8 transition-all duration-300 group-hover:brightness-0 group-hover:invert" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <svg 
                  className="hidden w-8 h-8 text-gray-600 transition-colors duration-300 group-hover:text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-800">
                {policy.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
                {policy.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        {policies.length > 0 && (
          <div className="pt-8 mt-12 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-8 text-center">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Trusted by thousands</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Secure & Safe</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Quality Guaranteed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default OurPolicy;
