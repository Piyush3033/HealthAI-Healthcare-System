import React, { useState, useEffect, useMemo } from 'react';
import { patientsAPI } from '../../services/api';
import DataGrid from '../DataGrid/DataGrid';
import { useTheme } from '../../context/ThemeContext';
import { Eye } from 'lucide-react';

const PatientsList = () => {
  const { isDark } = useTheme();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await patientsAPI.listPatients(1, 100);
      setPatients(response.data.data || []);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'patient_id',
        header: 'Patient ID',
        cell: (info) => (
          <span className="font-medium">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'blood_group',
        header: 'Blood Group',
        cell: (info) => info.getValue() || 'N/A',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isDark
              ? 'bg-green-900 text-green-200'
              : 'bg-green-100 text-green-800'
          }`}>
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: '_id',
        header: 'Action',
        cell: (info) => (
          <a
            href={`/platform1/patients/${info.row.original.patient_id}`}
            className={`inline-flex items-center gap-1 font-medium transition-colors ${
              isDark
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            View
          </a>
        ),
      },
    ],
    [isDark]
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Patients</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage and view all patient records
        </p>
      </div>

      {error && (
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-red-900 border-red-700 text-red-200'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {error}
        </div>
      )}

      <DataGrid
        columns={columns}
        data={patients}
        enableSearch={true}
        enableVirtualization={true}
      />
    </div>
  );
};

export default PatientsList;
