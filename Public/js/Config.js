// Application Configuration
const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Save token to localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove token
const removeToken = () => {
  localStorage.removeItem('token');
};

// Save user data
const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Get user data
const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Logout
const logout = () => {
  removeToken();
  localStorage.removeItem('user');
  window.location.href = '/index.html';
};

// Check authentication
const checkAuth = () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/index.html';
  }
};

// Make API request with token
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Check content type
    const contentType = response.headers.get('content-type');
    
    // Handle non-JSON responses
    if (contentType && !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON Response:', text);
      console.error('Status:', response.status, response.statusText);
      throw new Error('Server returned HTML instead of JSON. Check your API endpoint.');
    }
    
    const result = await response.json();

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(result.msg || result.message || result.error || `Error ${response.status}: ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('API Request Error:', {
      endpoint: `${API_URL}${endpoint}`,
      method: method,
      error: error
    });
    throw error;
  }
};
