import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Common/Navigation';
import Platform1Dashboard from './components/Platform1/Dashboard';
import PatientsList from './components/Platform1/PatientsList';
import Referrals from './components/Platform1/Referrals';
import PatientDashboard from './components/Platform2/PatientDashboard';
import MedicalRecords from './components/Platform2/MedicalRecords';
import HealthInsights from './components/Platform2/HealthInsights';

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Platform 1: Healthcare Providers */}
      <Route
        path="/platform1/*"
        element={
          <ProtectedRoute>
            <>
              <Navigation />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/dashboard" element={<Platform1Dashboard />} />
                  <Route path="/patients" element={<PatientsList />} />
                  <Route path="/referrals" element={<Referrals />} />
                  <Route path="/" element={<Navigate to="/platform1/dashboard" replace />} />
                </Routes>
              </main>
            </>
          </ProtectedRoute>
        }
      />

      {/* Platform 2: Patient Portal */}
      <Route
        path="/platform2/*"
        element={
          <ProtectedRoute>
            <>
              <Navigation />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Routes>
                  <Route path="/dashboard" element={<PatientDashboard />} />
                  <Route path="/records" element={<MedicalRecords />} />
                  <Route path="/health-insights" element={<HealthInsights />} />
                  <Route path="/" element={<Navigate to="/platform2/dashboard" replace />} />
                </Routes>
              </main>
            </>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/platform1/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
