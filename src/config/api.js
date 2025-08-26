// API Configuration
const API_CONFIGS = {
  development: {
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
  },
  production: {
    baseURL: 'https://backend-da-clothing.vercel.app/api',
    timeout: 15000,
  }
};

// Current environment - change this to 'production' when deploying
const CURRENT_ENV = 'development';

export const API_CONFIG = API_CONFIGS[CURRENT_ENV];
export const API_BASE_URL = API_CONFIG.baseURL;

// API endpoints
export const ENDPOINTS = {
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id) => `/products/${id}`,
  PRODUCT_BY_NAME: (name) => `/products/name/${name}`,
  
  // Categories
  CATEGORIES: '/categories',
  CATEGORY_BY_ID: (id) => `/categories/${id}`,
  CATEGORY_BY_NAME: (name) => `/categories/${name}`,
};

// Helper function to build full URLs
export const buildURL = (endpoint) => {
  const fullURL = `${API_BASE_URL}${endpoint}`;
  
  // Debug logging in development
  if (CURRENT_ENV === 'development') {
    console.log(`API URL: ${fullURL}`);
  }
  
  return fullURL;
};

// Axios default configuration
export const API_DEFAULTS = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: API_CONFIG.timeout,
};

// Helper function to handle API errors
export const handleAPIError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      type: 'server_error',
      status,
      message: data?.message || `Server error: ${status}`,
      details: data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      type: 'network_error',
      message: 'No response from server. Please check if the backend is running.',
      details: error.request,
    };
  } else {
    // Something else happened
    return {
      type: 'request_error',
      message: error.message || 'Request setup error',
      details: error,
    };
  }
};

export default {
  API_CONFIG,
  API_BASE_URL,
  ENDPOINTS,
  buildURL,
  API_DEFAULTS,
  handleAPIError,
}; 