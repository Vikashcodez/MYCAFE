import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConnection } from '../context/ConnectionContext';
import { 
  User, 
  Lock, 
  LogIn, 
  Monitor,
  Gamepad2,
  UserCircle,
  Mail,
  Phone,
  Wifi,
  Activity,
  Zap
} from 'lucide-react';

function CustomerLogin() {
  const navigate = useNavigate();
  const {
    systemIp,
    assignedName,
    launchConfig,
    connectionStats,
    isConnected
  } = useConnection();
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const systemName = launchConfig?.systemName || assignedName || systemIp;

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }

    setLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      // Navigate to gaming session page (you can create this later)
      alert(`Welcome ${customerName}! Your gaming session is starting...`);
      setLoading(false);
      // For now, just go back to connection page
      // navigate('/gaming-session', { state: { customerName, systemName, launchConfig } });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-gray-100 p-4 relative overflow-hidden">
      {/* System Name in Corner */}
      <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-2 shadow-xl z-10">
        <div className="flex items-center space-x-2">
          <Monitor className="text-cyan-400" size={20} />
          <span className="font-bold text-cyan-300">{systemName}</span>
        </div>
      </div>

      {/* Connection Stats in Corner */}
      <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-2 shadow-xl z-10">
        <div className="flex items-center space-x-4 text-sm">
          <div className={`flex items-center space-x-1 ${isConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
            <Wifi size={16} />
            <span>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Activity className="text-cyan-400" size={16} />
            <span className="text-gray-300">{connectionStats.averagePing || 0}ms</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="text-blue-400" size={16} />
            <span className="text-gray-300">{connectionStats.heartbeatsSent || 0}</span>
          </div>
        </div>
      </div>

      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl mb-4 shadow-2xl">
              <Gamepad2 size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Welcome Gamer
            </h1>
            <p className="text-gray-400">Login to start your gaming session</p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Phone Input (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Available Games Preview */}
              {launchConfig?.software && launchConfig.software.length > 0 && (
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-xl">
                  <p className="text-sm text-gray-400 mb-3 font-medium">🎮 Available Games:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {launchConfig.software.map((game, idx) => (
                      <div key={idx} className="px-3 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg text-sm text-center border border-cyan-500/30">
                        {game}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  loading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white'
                }`}
              >
                <LogIn size={24} />
                <span>{loading ? 'Logging in...' : 'Start Gaming'}</span>
              </button>
            </form>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-start space-x-2 text-sm text-gray-400">
                <svg className="w-5 h-5 text-cyan-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-300 mb-1">Session Information</p>
                  <p>Your gaming session will begin once you log in. Have fun!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Gaming Cafe Management System • Secure Login
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
