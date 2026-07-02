import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

const HealthInsights = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        setError('');

        if (user?.patient_id) {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/ai/health-insights/${user.patient_id}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('authToken')}`
              }
            }
          );

          setInsights(response.data.data);
        }
      } catch (err) {
        setError('Failed to load health insights');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [user?.patient_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Analyzing your health data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Health Insights</h1>
          <p className="text-gray-600 mt-2">AI-powered health analysis and recommendations</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        )}

        {!insights ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No insights available. Please ensure you have medical records.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Health Trend */}
            {insights.health_trend && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Trend</h2>
                <div className="flex items-center gap-4">
                  <div className={`text-4xl ${
                    insights.health_trend === 'improving' ? 'text-green-500' :
                    insights.health_trend === 'stable' ? 'text-blue-500' :
                    'text-orange-500'
                  }`}>
                    {insights.health_trend === 'improving' ? '📈' :
                     insights.health_trend === 'stable' ? '➡️' : '📉'}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Overall Trend</p>
                    <p className="text-2xl font-bold text-gray-900 capitalize">
                      {insights.health_trend || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Concerns */}
            {insights.key_concerns && insights.key_concerns.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Health Concerns</h2>
                <ul className="space-y-2">
                  {insights.key_concerns.map((concern, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-yellow-500 text-xl">⚠️</span>
                      <span className="text-gray-700">{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lifestyle Recommendations */}
            {insights.lifestyle_recommendations && insights.lifestyle_recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Lifestyle Recommendations</h2>
                <ul className="space-y-3">
                  {insights.lifestyle_recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Tests */}
            {insights.suggested_tests && insights.suggested_tests.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Suggested Medical Tests</h2>
                <ul className="space-y-2">
                  {insights.suggested_tests.map((test, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-500 text-xl">🔬</span>
                      <span className="text-gray-700">{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Disclaimer:</strong> These insights are AI-generated and should not replace professional medical advice. 
                Please consult with your healthcare provider for personalized recommendations.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HealthInsights;
