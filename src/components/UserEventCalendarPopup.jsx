import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const UserEventCalendarPopup = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'list'

  // Function to fetch events from the backend
  const fetchEvents = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getMonthData = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }
    
    return days;
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const monthYearString = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-11/12 max-w-4xl p-6 bg-white rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Event Calendar</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setView('month')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      view === 'month'
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      view === 'list'
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    List
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {view === 'month' ? (
              <div className="overflow-hidden bg-white rounded-xl">
                {/* Calendar Navigation */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <button
                    onClick={() => changeMonth(-1)}
                    className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-200"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">{monthYearString}</h3>
                  <button
                    onClick={() => changeMonth(1)}
                    className="p-1 text-gray-600 transition-colors rounded-full hover:bg-gray-200"
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                  {/* Week day headers */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-sm font-medium text-center text-gray-600 bg-gray-50">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {getMonthData().map((date, index) => {
                    const dayEvents = date ? getEventsForDate(date) : [];
                    return (
                      <div
                        key={index}
                        onClick={() => date && setSelectedDate(date)}
                        className={`min-h-[100px] p-2 bg-white transition-colors ${
                          date
                            ? 'cursor-pointer hover:bg-blue-50'
                            : 'bg-gray-50 cursor-default'
                        } ${isSelected(date) ? 'bg-blue-50' : ''}`}
                      >
                        {date && (
                          <>
                            <div
                              className={`inline-flex items-center justify-center w-8 h-8 mb-1 text-sm font-semibold rounded-full ${
                                isToday(date)
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event, idx) => (
                                <div
                                  key={idx}
                                  className="px-2 py-1 text-xs font-medium text-blue-700 truncate bg-blue-100 rounded"
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs font-medium text-gray-500">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 transition-shadow border border-gray-200 rounded-lg hover:shadow-md"
                    >
                      <h3 className="mb-2 text-xl font-semibold text-gray-800">{event.title}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-600">
                          <FiCalendar className="mr-2" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <FiClock className="mr-2" />
                          <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center text-gray-600">
                            <FiMapPin className="mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="mt-2 text-gray-600">{event.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <FiCalendar className="w-16 h-16 mb-4 text-gray-400" />
                    <p className="text-lg text-gray-500">No events scheduled</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserEventCalendarPopup;
