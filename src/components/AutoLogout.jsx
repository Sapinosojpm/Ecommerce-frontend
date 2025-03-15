import  { useEffect } from 'react';

const AutoLogout = () => {
  useEffect(() => {
    let inactivityTimer;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Perform logout actions here
        // For example, clear local storage and redirect to login page
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }, 600000); // 10 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetInactivityTimer));

    // Initialize the inactivity timer
    resetInactivityTimer();

    // Cleanup on component unmount
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, []);

  return null;
};

export default AutoLogout;
