import React, { useState, useEffect } from 'react';
import { backendUrl } from '../../../admin/src/App'; // Adjust the import as needed

const UserEventCalendarPopup = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState([]);

  // Function to fetch events from the backend
  const fetchEvents = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/events`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      } else {
        console.error('Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch events when the component mounts
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  return (
    <>
      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Semi-transparent overlay */}
          <div
            className="absolute inset-0 bg-black opacity-60"
            onClick={onClose}
          ></div>
          {/* Modal content */}
          <div className="relative z-50 w-11/12 max-w-4xl mx-auto overflow-hidden bg-white shadow-2xl rounded-2xl">
            {/* Header with green background */}
            <div className="flex items-center justify-between px-6 py-4 bg-green-700">
              <h2 className="text-2xl font-bold text-white">Upcoming Events!</h2>
              <button
                onClick={onClose}
                className="text-3xl font-bold text-white transition-colors hover:text-green-200"
              >
                &times;
              </button>
            </div>
            {/* Content area with event cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {events.length > 0 ? (
                  events.map((event) => (
                    <div
                      key={event._id}
                      className="p-6 transition-shadow duration-300 border border-green-200 rounded-lg shadow-sm bg-green-50 hover:shadow-md"
                    >
                      <h3 className="mb-4 text-xl font-semibold text-green-800">
                        {event.title}
                      </h3>

                      <div className="mb-4">
                        <p className="text-sm text-gray-700">
                          <span>{new Date(event.startDate).toLocaleString()}</span>
                          <span className="mx-2 text-gray-500">to</span>
                          <span>{new Date(event.endDate).toLocaleString()}</span>
                        </p>
                      </div>

                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-lg text-center text-green-600 col-span-full">
                    No upcoming events.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserEventCalendarPopup;
