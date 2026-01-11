const API_BASE_URL = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Server connection failed. Please check if the backend is running.');
    }
    throw error;
  }
};

export const hotelApi = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getProfile: () => apiRequest('/auth/me'),
  updateProfile: (userData) => apiRequest('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),

  // Rooms
  getAllRooms: () => apiRequest('/rooms'),
  getAvailableRooms: () => apiRequest('/rooms/available'),
  getRoomByNumber: (num) => apiRequest(`/rooms/number/${num}`),
  getRoomTypes: () => apiRequest('/rooms/types'),

  // System/Admin
  generateRandomOccupancy: () => apiRequest('/rooms/random-occupancy', {
    method: 'POST',
  }),
  resetAllBookings: () => apiRequest('/rooms/reset-all', {
    method: 'POST',
  }),

  // Bookings
  bookRooms: (bookingData) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),
  getMyBookings: () => apiRequest('/bookings/my-bookings'),
  cancelBooking: (id) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),

  // System
  checkHealth: () => apiRequest('/health'),
  checkDb: () => apiRequest('/db-test'),
};