import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => apiClient.post('/api/auth/register', userData),
  login: (email, password) => apiClient.post('/api/auth/login', { email, password }),
  verifyToken: () => apiClient.post('/api/auth/verify-token', {}),
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/api/auth/change-password', { old_password: oldPassword, new_password: newPassword })
};

// Hospitals API
export const hospitalsAPI = {
  createHospital: (data) => apiClient.post('/api/hospitals', data),
  listHospitals: (page = 1, perPage = 20) =>
    apiClient.get('/api/hospitals', { params: { page, per_page: perPage } }),
  getHospital: (hospitalId) => apiClient.get(`/api/hospitals/${hospitalId}`),
  updateHospital: (hospitalId, data) => apiClient.put(`/api/hospitals/${hospitalId}`, data),
  getHospitalNetwork: (hospitalId) => apiClient.get(`/api/hospitals/${hospitalId}/network`)
};

// Patients API
export const patientsAPI = {
  createPatient: (data) => apiClient.post('/api/patients/create', data),
  getPatient: (patientId) => apiClient.get(`/api/patients/${patientId}`),
  listPatients: (page = 1, perPage = 20) =>
    apiClient.get('/api/patients', { params: { page, per_page: perPage } }),
  updatePatient: (patientId, data) => apiClient.put(`/api/patients/${patientId}`, data),
  searchPatients: (query) => apiClient.get('/api/patients/search', { params: { q: query } }),
  setPatientPassword: (patientId, password) =>
    apiClient.post(`/api/patients/${patientId}/set-password`, { password })
};

// Records API
export const recordsAPI = {
  createRecord: (data) => apiClient.post('/api/records/create', data),
  getPatientRecords: (patientId, page = 1, perPage = 20) =>
    apiClient.get(`/api/records/${patientId}`, { params: { page, per_page: perPage } }),
  getRecord: (recordId) => apiClient.get(`/api/records/${recordId}`),
  downloadRecord: (recordId) => apiClient.get(`/api/records/${recordId}/download`, { responseType: 'blob' }),
  deleteRecord: (recordId) => apiClient.delete(`/api/records/${recordId}`)
};

// Referrals API
export const referralsAPI = {
  createReferral: (data) => apiClient.post('/api/referrals/create', data),
  getOutgoingReferrals: (page = 1, perPage = 20) =>
    apiClient.get('/api/referrals/outgoing', { params: { page, per_page: perPage } }),
  getIncomingReferrals: (page = 1, perPage = 20) =>
    apiClient.get('/api/referrals/incoming', { params: { page, per_page: perPage } }),
  getReferral: (referralId) => apiClient.get(`/api/referrals/${referralId}`),
  acceptReferral: (referralId) => apiClient.put(`/api/referrals/${referralId}/accept`, {}),
  rejectReferral: (referralId, data) => apiClient.put(`/api/referrals/${referralId}/reject`, data)
};

// Permissions API
export const permissionsAPI = {
  setUserPermissions: (userId, data) =>
    apiClient.post(`/api/permissions/users/${userId}/set`, data),
  getUserPermissions: (userId) =>
    apiClient.get(`/api/permissions/users/${userId}/get`),
  checkPermission: (data) =>
    apiClient.post('/api/permissions/check', data),
  grantCrossHospitalAccess: (userId, hospitalId) =>
    apiClient.post(`/api/permissions/grant-cross-hospital`, { hospital_id: hospitalId })
};

export default apiClient;
