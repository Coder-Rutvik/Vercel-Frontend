const API_BASE_URL = 'https://hotel-reservation-system-backend-1.onrender.com/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const hotelApi = {
  checkHealth: () => apiRequest('/health'),
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getProfile: () => apiRequest('/auth/me'),
  getAllRooms: () => apiRequest('/rooms'),
  getAvailableRooms: () => apiRequest('/rooms/available'),
  bookRooms: (data) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMyBookings: () => apiRequest('/bookings/my-bookings'),
  cancelBooking: (id) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT'
  })
};