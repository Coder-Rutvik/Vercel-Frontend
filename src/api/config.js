// Dynamic API URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://hotel-reservation-system-backend-6nf6.onrender.com/api';

// Debug: Log API URL
console.log('📱 Frontend Environment:', process.env.NODE_ENV);
console.log('🔗 API Base URL:', API_BASE_URL);

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
  
  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `API request failed (${response.status})` };
      }
      
      throw new Error(errorData.message || errorData.error);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('🔥 API Error Details:', error.message);
    
    // User-friendly error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    }
    
    if (error.message.includes('CORS')) {
      throw new Error('Connection blocked by security policy. Please try again later.');
    }
    
    throw error;
  }
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Backend connected successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Backend connection failed: ${error.message}`,
      error: error.message
    };
  }
};

// ✅ COMPLETE hotelApi OBJECT
export const hotelApi = {
  // Test connection
  testConnection: testBackendConnection,
  
  // Health Check
  checkHealth: () => apiRequest('/health'),

  // Test Database Connection
  testDatabase: () => apiRequest('/db-test'),

  // Authentication Endpoints
  register: (data) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getProfile: () => apiRequest('/auth/me'),

  updateProfile: (data) => apiRequest('/auth/update-profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  changePassword: (data) => apiRequest('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Room Endpoints
  getAllRooms: () => apiRequest('/rooms'),

  getAvailableRooms: () => apiRequest('/rooms/available'),

  getRoomsByFloor: (floorNumber) => apiRequest(`/rooms/floor/${floorNumber}`),

  getRoomByNumber: (roomNumber) => apiRequest(`/rooms/number/${roomNumber}`),

  // Booking Endpoints
  bookRooms: (data) => apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getMyBookings: () => apiRequest('/bookings/my-bookings'),

  getBookingById: (id) => apiRequest(`/bookings/${id}`),

  cancelBooking: (id) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT'
  }),

  // Admin/System Endpoints
  generateRandomOccupancy: () => apiRequest('/rooms/random-occupancy', {
    method: 'POST'
  }),

  resetAllBookings: () => apiRequest('/rooms/reset-all', {
    method: 'POST'
  })
};