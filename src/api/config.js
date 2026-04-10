function getApiBaseUrl() {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' || host === '127.0.0.1') {
    // CRA dev server (npm start) — use proxy in package.json → same-origin /api
    if (port === '3000') {
      return '/api';
    }
    return `http://${host}:5000/api`;
  }
  return 'https://vercel-backend-lilac-rho.vercel.app/api';
}

const API_BASE_URL = getApiBaseUrl();

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

    const text = await response.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          response.ok
            ? 'Invalid response from server'
            : `Server error (${response.status}). Is the API running?`
        );
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        // ZOMBIE SESSION FIX: Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload(); // Force app to show Login screen
        throw new Error('Session Expired. Please login again.');
      }
      // Prefer validation error detail when backend returns Joi-style errors array
      if (data && Array.isArray(data.errors) && data.errors.length > 0) {
        const first = data.errors[0];
        throw new Error(first.message || data.message || 'Something went wrong');
      }
      throw new Error(data?.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Server connection failed. Please check if the backend is running.');
    }
    throw error;
  }
};

/** Socket.IO server (kitchen live updates). CRA dev uses backend on port 5000. */
export function getSocketBaseUrl() {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL.replace(/\/$/, '');
  }
  const host = window.location.hostname;
  const port = window.location.port;
  if ((host === 'localhost' || host === '127.0.0.1') && port === '3000') {
    return 'http://127.0.0.1:5000';
  }
  return window.location.origin;
}

export const adminApi = {
  getAllBookings: () => apiRequest('/admin/bookings'),
  getDashboardStats: () => apiRequest('/admin/stats'),
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
  getAllRooms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(query ? `/rooms?${query}` : '/rooms');
  },
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
  getBookingStats: () => apiRequest('/bookings/stats'),
  cancelBooking: (id) => apiRequest(`/bookings/${id}/cancel`, {
    method: 'PUT',
  }),

  // System
  checkHealth: () => apiRequest('/health'),
};

export const restaurantApi = {
  getMenu: () => apiRequest('/restaurant/menu'),
  addMenuItem: (itemData) => apiRequest('/restaurant/menu', {
    method: 'POST',
    body: JSON.stringify(itemData),
  }),
  createOrder: (orderData) => apiRequest('/restaurant/order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }),
  getActiveOrders: () => apiRequest('/restaurant/orders/active'),
  updateOrderStatus: (id, status) => apiRequest(`/restaurant/order/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),
};

export const billingApi = {
  getCombinedBill: (bookingId) => apiRequest(`/billing/${bookingId}`),
  payCheckout: (bookingId, paymentMode) => apiRequest(`/billing/${bookingId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMode }),
  }),
  downloadInvoicePdf: async (bookingId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/billing/${bookingId}/invoice-pdf`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed?.message || 'Failed to download invoice PDF');
      } catch {
        throw new Error('Failed to download invoice PDF');
      }
    }

    return response.blob();
  },
};

export const accountingApi = {
  addExpense: (expenseData) => apiRequest(`/accounting/expense`, {
    method: 'POST',
    body: JSON.stringify(expenseData),
  }),
  getDashboardMetrics: () => apiRequest(`/accounting/dashboard`),
  getReports: () => apiRequest(`/accounting/reports`),
  getTrends: (days = 14) => apiRequest(`/accounting/trends?days=${days}`),
};

export const inventoryApi = {
  getInventory: () => apiRequest(`/inventory`),
  addOrUpdateInventory: (itemData) => apiRequest(`/inventory`, {
    method: 'POST',
    body: JSON.stringify(itemData),
  }),
  seedDemoInventory: (replace = false) =>
    apiRequest(`/inventory/seed-demo`, {
      method: 'POST',
      body: JSON.stringify({ replace }),
    }),
};

export const proApi = {
  getAIDemand: () => apiRequest('/pro/ai-demand'),
  channelSync: (payload) =>
    apiRequest('/pro/channel-webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
