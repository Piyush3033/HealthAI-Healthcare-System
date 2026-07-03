import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { recordsAPI } from '../../services/api';

const MedicalRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [downloading, setDownloading] = useState(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await recordsAPI.getPatientRecords(user.patient_id, page, 20);
      setRecords(response.data.data || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.patient_id, page]);

  useEffect(() => {
    if (user?.patient_id) {
      loadRecords();
    }
  }, [loadRecords, user?.patient_id]);

  const handleDownload = async (recordId, title) => {
    try {
      setDownloading(recordId);
      const response = await recordsAPI.downloadRecord(recordId);

      // Create a blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to download record');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  const getRecordIcon = (type) => {
    const icons = {
      consultation: '👨‍⚕️',
      prescription: '💊',
      lab_report: '🧪',
      scan: '🔍',
      discharge_summary: '📋'
    };
    return icons[type] || '📄';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading medical records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No medical records found</p>
          </div>
        ) : (
          <>
            {/* Records Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {records.map((record) => (
                <div key={record._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{getRecordIcon(record.record_type)}</div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {record.record_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{record.title}</h3>

                  {record.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{record.description}</p>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    {new Date(record.created_at).toLocaleDateString()} at{' '}
                    {new Date(record.created_at).toLocaleTimeString()}
                  </div>

                  {record.downloadable && (
                    <button
                      onClick={() => handleDownload(record._id, record.title)}
                      disabled={downloading === record._id}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {downloading === record._id ? 'Downloading...' : 'Download as PDF'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MedicalRecords;
