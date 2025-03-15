import React from 'react';

const ErrorPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <div className="animate-fadeIn">
        <h1 className="text-4xl text-red-600 mb-4">Oops! Something went wrong.</h1>
        <p className="text-lg text-gray-600 mb-8">We're sorry, but the page you're looking for doesn't exist.</p>
      </div>
      <div className="animate-bounce">
        <div className="text-6xl text-yellow-400">⚠️</div>
      </div>
    </div>
  );
};

export default ErrorPage;
