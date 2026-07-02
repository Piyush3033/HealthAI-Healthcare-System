import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { recordsAPI } from '../../services/api';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecords: 0,
    upcomingAppointments: 0
  });
  const [error, setError] = useState('');
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch recent records
        if (user?.patient_id) {
          const recordsResponse = await recordsAPI.getPatientRecords(user.patient_id, 1, 5);
          setRecentRecords(recordsResponse.data.data || []);
          setStats({
            totalRecords: recordsResponse.data.pagination?.total || 0,
            upcomingAppointments: 2 // Would be fetched from appointments API
          });
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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
          <p className="text-gray-600 mt-2">Patient ID: {user?.patient_id}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Medical Records Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Medical Records</p>
                <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.totalRecords}</p>
              </div>
              <div className="text-indigo-100 text-5xl">📄</div>
            </div>
            <a href="/platform2/records" className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              View All Records →
            </a>
          </div>

          {/* Appointments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{stats.upcomingAppointments}</p>
              </div>
              <div className="text-blue-100 text-5xl">📅</div>
            </div>
            <a href="/platform2/appointments" className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
              Book Appointment →
            </a>
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Medical Records</h2>
          {recentRecords.length === 0 ? (
            <p className="text-gray-600">No medical records yet</p>
          ) : (
            <div className="space-y-4">
              {recentRecords.map((record) => (
                <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{record.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Type: {record.record_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {record.downloadable && (
                      <button
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 transition"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="/platform2/records" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  → View All Records
                </a>
              </li>
              <li>
                <a href="/platform2/appointments" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  → Book Appointment
                </a>
              </li>
              <li>
                <a href="/platform2/health-insights" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  → Health Insights
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referrals</h3>
            <p className="text-gray-600 text-sm mb-4">
              View referrals from other hospitals and specialist recommendations
            </p>
            <a href="/platform2/referrals" className="text-indigo-600 hover:text-indigo-700 font-medium">
              → View Referrals
            </a>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h3>
            <p className="text-gray-600 text-sm mb-4">
              Control who can access your medical records
            </p>
            <a href="/platform2/access-logs" className="text-indigo-600 hover:text-indigo-700 font-medium">
              → View Access Logs
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
