import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { patientsAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentAppointments: 0,
    pendingReferrals: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch dashboard statistics
        const patientsResponse = await patientsAPI.listPatients(1, 1);
        
        setStats({
          totalPatients: patientsResponse.data.pagination?.total || 0,
          recentAppointments: 12, // Would be fetched from API
          pendingReferrals: 3 // Would be fetched from API
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <ul className="space-y-3">
              <li>
                <a href="/platform1/patients" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <span className="mr-2">→</span> View Patients
                </a>
              </li>
              <li>
                <a href="/platform1/records" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <span className="mr-2">→</span> View Medical Records
                </a>
              </li>
              <li>
                <a href="/platform1/referrals" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                  <span className="mr-2">→</span> Manage Referrals
                </a>
              </li>
              {user?.role === 'admin' && (
                <>
                  <li>
                    <a href="/platform1/users" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                      <span className="mr-2">→</span> Manage Users
                    </a>
                  </li>
                  <li>
                    <a href="/platform1/departments" className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
                      <span className="mr-2">→</span> Manage Departments
                    </a>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Recent Activity */}
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
