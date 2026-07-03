import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { patientsAPI } from '../../services/api';
import { Plus, Users, Calendar, Send } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentAppointments: 0,
    pendingReferrals: 0
  });
  const [error, setError] = useState('');
  const [newPatient, setNewPatient] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: 'O+'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getRoleLabel = () => {
    const roleLabels = {
      admin: 'Hospital Administrator',
      doctor: 'Doctor',
      staff: 'Staff Member'
    };
    return roleLabels[user?.role] || user?.role;
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      await patientsAPI.createPatient({
        ...newPatient,
        hospital_id: user.hospital_id
      });
      setNewPatient({
        full_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'male',
        blood_group: 'O+'
      });
      setShowNewPatientForm(false);
      setError('');
      // Refresh stats
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create patient');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const patientsResponse = await patientsAPI.listPatients(1, 1);
      setStats({
        totalPatients: patientsResponse.data.pagination?.total || 0,
        recentAppointments: 12,
        pendingReferrals: 3
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
          <p className="text-gray-600 mt-2">{getRoleLabel()}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Patients Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.totalPatients}</p>
              </div>
              <div className="text-indigo-100 text-5xl">👥</div>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.recentAppointments}</p>
              </div>
              <div className="text-blue-100 text-5xl">📅</div>
            </div>
          </div>

          {/* Pending Referrals Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Referrals</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{stats.pendingReferrals}</p>
              </div>
              <div className="text-green-100 text-5xl">🏥</div>
            </div>
          </div>
        </div>

        {/* Admin Patient Creation Section */}
        {user?.role === 'admin' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
              <button
                onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Add New Patient
              </button>
            </div>

            {showNewPatientForm && (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Create New Patient
                </h3>
                <form onSubmit={handleCreatePatient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newPatient.full_name}
                      onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={newPatient.date_of_birth}
                      onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Gender
                    </label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Blood Group
                    </label>
                    <select
                      value={newPatient.blood_group}
                      onChange={(e) => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
                    >
                      Create Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPatientForm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <ul className="space-y-3">
              <li>
                <a href="/platform1/patients" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <Users className="w-4 h-4 mr-2" /> View Patients
                </a>
              </li>
              <li>
                <a href="/platform1/referrals" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <Send className="w-4 h-4 mr-2" /> Manage Referrals
                </a>
              </li>
            </ul>
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <strong>Hospital ID:</strong> {user?.hospital_id?.substring(0, 8)}...
              </li>
              <li>
                <strong>Email:</strong> {user?.email}
              </li>
              <li>
                <strong>Role:</strong> {user?.role}
              </li>
              <li>
                <strong>Platform:</strong> Healthcare Providers (Platform 1)
              </li>
              <li>
                <strong>Access Level:</strong> {user?.role === 'admin' ? 'Full' : 'Limited'}
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
