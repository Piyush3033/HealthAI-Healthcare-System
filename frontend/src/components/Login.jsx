import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, Activity, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTestCreds, setShowTestCreds] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/platform1/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Section - Branding */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-400 rounded-lg flex items-center justify-center">
                  <Heart className="w-7 h-7 text-blue-900" />
                </div>
                <h1 className="text-3xl font-bold">HealthAI</h1>
              </div>
              <h2 className="text-5xl font-bold leading-tight">
                The Future of <span className="text-cyan-400">Healthcare</span>
              </h2>
            </div>

            <p className="text-lg text-blue-100 leading-relaxed max-w-md">
              Seamless, secure, and intelligent healthcare management. Empowering hospitals and practitioners with advanced patient care solutions.
            </p>

            {/* Features */}
            <div className="space-y-4 pt-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Lock className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Medical-Grade Security</h3>
                  <p className="text-blue-200 text-sm">Patient data protected by enterprise encryption</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Real-Time Monitoring</h3>
                  <p className="text-blue-200 text-sm">Instant access to patient records and vital information</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Heart className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Multi-Hospital Network</h3>
                  <p className="text-blue-200 text-sm">Seamless patient referrals across healthcare facilities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Login Form */}
          <div className="bg-blue-800 bg-opacity-40 backdrop-blur-xl border border-blue-700 border-opacity-50 rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Sign In</h3>
              <p className="text-blue-100">Access your healthcare dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-100 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-900 bg-opacity-30 border border-blue-600 border-opacity-50 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none text-white placeholder-blue-300"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-blue-900 bg-opacity-30 border border-blue-600 border-opacity-50 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none text-white placeholder-blue-300"
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-blue-900 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Test Credentials Info */}
            <div className="border-t border-blue-600 border-opacity-50 pt-6">
              <button
                type="button"
                onClick={() => setShowTestCreds(!showTestCreds)}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
              >
                {showTestCreds ? 'Hide' : 'Show'} Test Credentials
              </button>

              {showTestCreds && (
                <div className="mt-4 space-y-3 text-sm">
                  <div
                    onClick={() => quickLogin('admin@centralmedical.in', 'Password@123')}
                    className="p-3 bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg cursor-pointer hover:bg-opacity-70 transition"
                  >
                    <p className="text-white font-medium">Admin Account</p>
                    <p className="text-blue-200 text-xs">admin@centralmedical.in</p>
                  </div>

                  <div
                    onClick={() => quickLogin('doctor1@centralmedical.in', 'Password@123')}
                    className="p-3 bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg cursor-pointer hover:bg-opacity-70 transition"
                  >
                    <p className="text-white font-medium">Doctor Account</p>
                    <p className="text-blue-200 text-xs">doctor1@centralmedical.in</p>
                  </div>

                  <div
                    onClick={() => quickLogin('staff1@centralmedical.in', 'Password@123')}
                    className="p-3 bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg cursor-pointer hover:bg-opacity-70 transition"
                  >
                    <p className="text-white font-medium">Staff Account</p>
                    <p className="text-blue-200 text-xs">staff1@centralmedical.in</p>
                  </div>

                  <div
                    onClick={() => quickLogin('rajesh@email.com', 'Patient@123')}
                    className="p-3 bg-blue-900 bg-opacity-50 border border-blue-600 rounded-lg cursor-pointer hover:bg-opacity-70 transition"
                  >
                    <p className="text-white font-medium">Patient Account</p>
                    <p className="text-blue-200 text-xs">rajesh@email.com</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-blue-600 border-opacity-50 pt-6 text-center">
              <p className="text-blue-100 text-xs">
                By signing in, you agree to our{' '}
                <span className="text-cyan-400 hover:underline cursor-pointer">Terms of Service</span> and{' '}
                <span className="text-cyan-400 hover:underline cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
