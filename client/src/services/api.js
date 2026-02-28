// Centralized API client - all requests go through here
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/me')) {
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  me: () => api.get('/auth/me').then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  loginUrl: () => `${process.env.REACT_APP_API_URL || '/api'}/auth/spotify`,
};

export const statsApi = {
  overview: (range) => api.get('/stats/overview', { params: { range } }).then(r => r.data),
  topTracks: (range, limit = 20) => api.get('/stats/top-tracks', { params: { range, limit } }).then(r => r.data),
  topArtists: (range, limit = 20) => api.get('/stats/top-artists', { params: { range, limit } }).then(r => r.data),
  topAlbums: (range, limit = 20) => api.get('/stats/top-albums', { params: { range, limit } }).then(r => r.data),
  timeline: (range) => api.get('/stats/timeline', { params: { range } }).then(r => r.data),
  heatmap: (range) => api.get('/stats/heatmap', { params: { range } }).then(r => r.data),
  topGenres: (range) => api.get('/stats/top-genres', { params: { range } }).then(r => r.data),
};

export const historyApi = {
  list: (page = 1, limit = 50) => api.get('/history', { params: { page, limit } }).then(r => r.data),
};

export const userApi = {
  updateSettings: (data) => api.patch('/user/settings', data).then(r => r.data),
  resync: () => api.post('/user/resync').then(r => r.data),
  globalSettings: () => api.get('/user/global-settings').then(r => r.data),
  allUsers: () => api.get('/user/all').then(r => r.data),
  toggleRegistrations: (open) => api.post('/user/registrations', { open }).then(r => r.data),
  deleteUser: (userId) => api.delete(`/user/${userId}`).then(r => r.data),
};

export default api;
