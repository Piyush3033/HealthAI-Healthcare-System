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
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  verifyToken: () => apiClient.post('/auth/verify-token', {}),
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword })
};

// Hospitals API
export const hospitalsAPI = {
  createHospital: (data) => apiClient.post('/hospitals', data),
  listHospitals: (page = 1, perPage = 20) =>
    apiClient.get('/hospitals', { params: { page, per_page: perPage } }),
  getHospital: (hospitalId) => apiClient.get(`/hospitals/${hospitalId}`),
  updateHospital: (hospitalId, data) => apiClient.put(`/hospitals/${hospitalId}`, data),
  getHospitalNetwork: (hospitalId) => apiClient.get(`/hospitals/${hospitalId}/network`)
};

// Patients API
export const patientsAPI = {
  createPatient: (data) => apiClient.post('/patients/create', data),
  getPatient: (patientId) => apiClient.get(`/patients/${patientId}`),
  listPatients: (page = 1, perPage = 20) =>
    apiClient.get('/patients', { params: { page, per_page: perPage } }),
  updatePatient: (patientId, data) => apiClient.put(`/patients/${patientId}`, data),
  searchPatients: (query) => apiClient.get('/patients/search', { params: { q: query } }),
  setPatientPassword: (patientId, password) =>
    apiClient.post(`/patients/${patientId}/set-password`, { password })
};

// Records API
export const recordsAPI = {
  createRecord: (data) => apiClient.post('/records/create', data),
  getPatientRecords: (patientId, page = 1, perPage = 20) =>
    apiClient.get(`/records/${patientId}`, { params: { page, per_page: perPage } }),
  getRecord: (recordId) => apiClient.get(`/records/${recordId}`),
  downloadRecord: (recordId) => apiClient.get(`/records/${recordId}/download`, { responseType: 'blob' }),
  deleteRecord: (recordId) => apiClient.delete(`/records/${recordId}`)
};

// Referrals API
export const referralsAPI = {
  createReferral: (data) => apiClient.post('/referrals/create', data),
  getOutgoingReferrals: (page = 1, perPage = 20) =>
    apiClient.get('/referrals/outgoing', { params: { page, per_page: perPage } }),
  getIncomingReferrals: (page = 1, perPage = 20) =>
    apiClient.get('/referrals/incoming', { params: { page, per_page: perPage } }),
  getReferral: (referralId) => apiClient.get(`/referrals/${referralId}`),
  acceptReferral: (referralId) => apiClient.put(`/referrals/${referralId}/accept`, {}),
  rejectReferral: (referralId, data) => apiClient.put(`/referrals/${referralId}/reject`, data)
};

// Permissions API
export const permissionsAPI = {
  setUserPermissions: (userId, data) =>
    apiClient.post(`/permissions/users/${userId}/set`, data),
  getUserPermissions: (userId) =>
    apiClient.get(`/permissions/users/${userId}/get`),
  checkPermission: (data) =>
    apiClient.post('/permissions/check', data),
  grantCrossHospitalAccess: (userId, hospitalId) =>
    apiClient.post(`/permissions/grant-cross-hospital`, { hospital_id: hospitalId })
};

export default apiClient;
