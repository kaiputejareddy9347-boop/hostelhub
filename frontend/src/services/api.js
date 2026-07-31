const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:8080/api'
  : '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(url, options = {}) {
  options.headers = {
    ...getHeaders(),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, options);
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on login/register/home pages, redirect to login
      const path = window.location.pathname;
      if (path !== '/' && !path.includes('login') && !path.includes('register')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = (data && data.message) || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

const Api = {
  auth: {
    async login(username, password) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          name: data.name
        }));
      }
      return data;
    },

    async register(username, email, password, role, name, phone) {
      return await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role, name, phone })
      });
    },

    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    },

    getCurrentUser() {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
      return localStorage.getItem('token') !== null;
    }
  },

  hostels: {
    async getAll(city = '') {
      const query = city ? `?city=${encodeURIComponent(city)}` : '';
      return await request(`/hostels${query}`);
    },

    async getById(id) {
      return await request(`/hostels/${id}`);
    },

    async create(hostelData) {
      return await request('/hostels', {
        method: 'POST',
        body: JSON.stringify(hostelData)
      });
    },

    async addRoom(hostelId, roomData) {
      return await request(`/hostels/${hostelId}/rooms`, {
        method: 'POST',
        body: JSON.stringify(roomData)
      });
    },

    async getOwnerHostels() {
      return await request('/hostels/owner');
    },

    async addExpense(hostelId, expenseData) {
      return await request(`/hostels/${hostelId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData)
      });
    }
  },

  bookings: {
    async create(bookingData) {
      return await request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
    },

    async getStudentBookings() {
      return await request('/bookings/student');
    },

    async getOwnerBookings() {
      return await request('/bookings/owner');
    },

    async updateStatus(bookingId, status) {
      return await request(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    async terminate(bookingId) {
      return await request(`/bookings/${bookingId}/terminate`, {
        method: 'PUT'
      });
    },

    async changeCheckoutDate(bookingId, endDate) {
      return await request(`/bookings/${bookingId}/checkout-date`, {
        method: 'PUT',
        body: JSON.stringify({ endDate })
      });
    }
  },

  payments: {
    async create(paymentData) {
      return await request('/payments', {
        method: 'POST',
        body: JSON.stringify(paymentData)
      });
    },

    async getStudentPayments() {
      return await request('/payments/student');
    },

    async getOwnerPayments() {
      return await request('/payments/owner');
    }
  },

  invoices: {
    async getStudentInvoices() {
      return await request('/invoices/student');
    },

    async getOwnerInvoices() {
      return await request('/invoices/owner');
    }
  },

  complaints: {
    async create(complaintData) {
      return await request('/complaints', {
        method: 'POST',
        body: JSON.stringify(complaintData)
      });
    },

    async getStudentComplaints() {
      return await request('/complaints/student');
    },

    async getOwnerComplaints() {
      return await request('/complaints/owner');
    },

    async reply(complaintId, replyData) {
      return await request(`/complaints/${complaintId}/reply`, {
        method: 'PUT',
        body: JSON.stringify(replyData)
      });
    }
  },

  facilities: {
    async getAll() {
      return await request('/facilities');
    }
  }
};

export default Api;
export { API_BASE_URL };
