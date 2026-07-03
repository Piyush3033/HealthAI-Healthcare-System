import React, { useState, useEffect, useCallback } from 'react';
import { referralsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const Referrals = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('incoming');
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (activeTab === 'incoming') {
        response = await referralsAPI.getIncomingReferrals(1, 100);
      } else {
        response = await referralsAPI.getOutgoingReferrals(1, 100);
      }

      setReferrals(response.data.data || []);
    } catch (err) {
      setError('Failed to load referrals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  const handleAcceptReferral = async (referralId) => {
    try {
      await referralsAPI.acceptReferral(referralId);
      setError('');
      loadReferrals();
    } catch (err) {
      setError('Failed to accept referral');
      console.error(err);
    }
  };

  const handleRejectReferral = async (referralId, reason) => {
    try {
      await referralsAPI.rejectReferral(referralId, { rejection_reason: reason });
      setError('');
      loadReferrals();
    } catch (err) {
      setError('Failed to reject referral');
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />;
      case 'rejected':
        return <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />;
      default:
        return <Clock className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading referrals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Cross-Hospital Referrals
        </h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage and track patient referrals between hospitals
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

      {/* Tabs */}
      <div className={`flex gap-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'incoming'
              ? isDark
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-blue-600 border-b-2 border-blue-600'
              : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Incoming
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'outgoing'
              ? isDark
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-blue-600 border-b-2 border-blue-600'
              : isDark
              ? 'text-gray-400 hover:text-gray-300'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Outgoing
        </button>
      </div>

      {/* Referrals List */}
      {referrals.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            No {activeTab} referrals found
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {referrals.map((referral) => (
            <div
              key={referral._id}
              className={`p-6 rounded-lg border ${
                isDark
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(referral.status)}
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Patient: {referral.patient_id}
                    </h3>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {referral.reason}
                  </p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      Urgency: <span className="font-medium">{referral.urgency}</span>
                    </span>
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {new Date(referral.referral_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  referral.status === 'pending'
                    ? isDark
                      ? 'bg-yellow-900 text-yellow-200'
                      : 'bg-yellow-100 text-yellow-800'
                    : referral.status === 'accepted'
                    ? isDark
                      ? 'bg-green-900 text-green-200'
                      : 'bg-green-100 text-green-800'
                    : isDark
                    ? 'bg-red-900 text-red-200'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {referral.status}
                </span>
              </div>

              {activeTab === 'incoming' && referral.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleAcceptReferral(referral._id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-green-900 text-green-200 hover:bg-green-800'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectReferral(referral._id, 'Cannot be treated')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-red-900 text-red-200 hover:bg-red-800'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Referrals;
