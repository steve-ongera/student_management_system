// frontend/src/services/apiHelper.js
import api from './api';

// Helper function to handle file downloads
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to handle file uploads
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Upload failed:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to handle pagination
export const paginate = (data, page = 1, perPage = 10) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: data.slice(start, end),
    total: data.length,
    page,
    perPage,
    totalPages: Math.ceil(data.length / perPage),
  };
};

// Helper function to format API errors
export const formatApiError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'Server error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null,
    };
  } else {
    return {
      message: error.message || 'An unexpected error occurred',
      status: -1,
      data: null,
    };
  }
};

// Debounce function for search inputs
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Cache helper for API responses
class ApiCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const apiCache = new ApiCache();

// Batch request helper
export const batchRequests = async (requests) => {
  try {
    const responses = await Promise.all(requests);
    return responses.map(response => response.data);
  } catch (error) {
    throw formatApiError(error);
  }
};

// Retry logic for failed requests
export const retryRequest = async (requestFn, retries = 3, delay = 1000) => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest(requestFn, retries - 1, delay * 2);
  }
};

export default {
  downloadFile,
  uploadFile,
  paginate,
  formatApiError,
  debounce,
  apiCache,
  batchRequests,
  retryRequest,
};