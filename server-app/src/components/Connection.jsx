import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Wifi, 
  Server, 
  Cpu, 
  Globe, 
  RefreshCw, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Users,
  Monitor,
  Gamepad2,
  Zap,
  Shield,
  Activity,
  Clock,
  Settings
} from 'lucide-react';
import SystemConfig from './SystemConfig';

const API_URL = 'http://localhost:5000/api';

function ConnectionPage() {
  const [ipInput, setIpInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [systems, setSystems] = useState([]);
  const [message, setMessage] = useState('');
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [configSystem, setConfigSystem] = useState(null);

  useEffect(() => {
    fetchServerInfo();
    fetchSystems();
    
    const interval = setInterval(() => {
      fetchSystems();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchServerInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/info`);
      setServerInfo(response.data);
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const fetchSystems = async () => {
    try {
      const response = await axios.get(`${API_URL}/systems`);
      setSystems(response.data.systems);
    } catch (error) {
      console.error('Error fetching systems:', error);
    }
  };

  const checkSystem = async () => {
    if (!ipInput.trim()) {
      setMessage({ text: 'Please enter an IP address', type: 'error' });
      return;
    }

    setChecking(true);
    try {
      const response = await axios.get(`${API_URL}/systems/check/${ipInput.trim()}`);
      
      if (response.data.exists) {
        if (response.data.isActive) {
          setMessage({ 
            text: `System ${ipInput} is ACTIVE and ready for naming`, 
            type: 'success' 
          });
          setNameInput(response.data.name || '');
        } else {
          setMessage({ 
            text: `System ${ipInput} exists but is INACTIVE. Last seen: ${response.data.lastSeen}`, 
            type: 'warning' 
          });
        }
      } else {
        setMessage({ 
          text: `System ${ipInput} not found. Make sure client app is running on that PC`, 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ text: `Error checking system: ${error.message}`, type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const assignName = async () => {
    if (!ipInput.trim()) {
      setMessage({ text: 'Please enter an IP address', type: 'error' });
      return;
    }

    if (!nameInput.trim()) {
      setMessage({ text: 'Please enter a name for the system', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/systems/assign`, {
        ip: ipInput.trim(),
        name: nameInput.trim()
      });

      if (response.data.success) {
        setMessage({ 
          text: `Name "${nameInput}" assigned to ${ipInput}`, 
          type: 'success' 
        });
        setIpInput('');
        setNameInput('');
        fetchSystems();
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setMessage({ 
          text: `${error.response.data.error}. ${error.response.data.suggestion || ''}`, 
          type: 'error' 
        });
      } else {
        setMessage({ text: 'Error assigning name', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeSystem = async (ip) => {
    if (window.confirm(`Are you sure you want to remove system ${ip}?`)) {
      try {
        await axios.delete(`${API_URL}/systems/${ip}`);
        setMessage({ text: `System ${ip} removed`, type: 'success' });
        fetchSystems();
      } catch (error) {
        setMessage({ text: 'Error removing system', type: 'error' });
      }
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const MessageAlert = ({ message }) => {
    if (!message) return null;

    const styles = {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      error: 'bg-rose-50 border-rose-200 text-rose-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      warning: <AlertTriangle className="w-5 h-5" />,
      info: <AlertTriangle className="w-5 h-5" />
    };

    return (
      <div className={`p-4 rounded-xl border ${styles[message.type]} flex items-start space-x-3`}>
        {icons[message.type]}
        <p className="font-medium">{message.text}</p>
      </div>
    );
  };

  // If configSystem is set, show configuration page
  if (configSystem) {
    return (
      <SystemConfig 
        system={configSystem} 
        onBack={() => setConfigSystem(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                <Gamepad2 className="inline-block mr-3" size={32} />
                Gaming Cafe Control Center
              </h1>
              <p className="text-gray-400 mt-2">Advanced System Management Dashboard</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg">
                <Server size={20} />
                <span className="text-sm font-medium">{API_URL}</span>
              </div>
              <button
                onClick={fetchServerInfo}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          {serverInfo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Systems</p>
                    <p className="text-2xl font-bold text-cyan-300">{serverInfo.systems.total}</p>
                  </div>
                  <div className="p-3 bg-cyan-500/10 rounded-lg">
                    <Cpu className="text-cyan-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Now</p>
                    <p className="text-2xl font-bold text-emerald-300">{serverInfo.systems.active}</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-lg">
                    <Activity className="text-emerald-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Inactive</p>
                    <p className="text-2xl font-bold text-amber-300">{serverInfo.systems.inactive}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Clock className="text-amber-400" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Uptime</p>
                    <p className="text-2xl font-bold text-blue-300">{serverInfo.uptime}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Zap className="text-blue-400" size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: System Assignment */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  <Monitor className="mr-3 text-cyan-400" size={24} />
                  System Configuration
                </h2>
                <p className="text-gray-400 text-sm mt-1">Assign names to connected gaming systems</p>
              </div>
              <Shield className="text-gray-600" size={24} />
            </div>

            <div className="space-y-6">
              {/* IP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Client System IP Address
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="text"
                      value={ipInput}
                      onChange={(e) => setIpInput(e.target.value)}
                      placeholder="192.168.1.10 or 14.99.202.2"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={checkSystem}
                    disabled={checking}
                    className={`px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-medium flex items-center space-x-2 transition-all ${checking ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Search size={18} />
                    <span>{checking ? 'Checking...' : 'Verify'}</span>
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-2 ml-1">Enter IP address displayed on the client PC</p>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  System Display Name
                </label>
                <div className="relative">
                  <Edit2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Gaming PC-1, Counter PC, Admin Station"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-gray-500 text-sm mt-2 ml-1">This name will appear on the client system</p>
              </div>

              {/* Message Alert */}
              <MessageAlert message={message} />

              {/* Assign Button */}
              <button
                onClick={assignName}
                disabled={!ipInput || !nameInput || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${
                  !ipInput || !nameInput || loading
                    ? 'bg-gray-700 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/25'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="animate-spin mr-2" size={20} />
                    Assigning System Name...
                  </span>
                ) : (
                  'Assign System Name'
                )}
              </button>

              {/* Instructions */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
                <h3 className="font-bold text-lg mb-3 flex items-center">
                  <Users className="mr-2 text-cyan-400" size={20} />
                  Quick Setup Guide
                </h3>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 text-sm font-bold">1</span>
                    <span>Obtain IP address from the client system display</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 text-sm font-bold">2</span>
                    <span>Enter IP and click "Verify" to check system status</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 text-sm font-bold">3</span>
                    <span>Enter a descriptive name for the gaming system</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3 text-sm font-bold">4</span>
                    <span>Click "Assign System Name" to complete configuration</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Right Panel: Connected Systems */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  <Wifi className="mr-3 text-emerald-400" size={24} />
                  Connected Gaming Systems
                  <span className="ml-3 px-3 py-1 bg-gray-700 rounded-full text-sm">
                    {systems.filter(s => s.isActive).length} Active
                  </span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Real-time monitoring of all cafe systems</p>
              </div>
              <button
                onClick={fetchSystems}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <RefreshCw size={18} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {systems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Server className="text-gray-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Systems Connected</h3>
                <p className="text-gray-500">Gaming systems will appear here when they connect</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {systems.map((system) => (
                  <div
                    key={system.ip}
                    className={`bg-gray-800/50 border rounded-xl p-4 transition-all hover:bg-gray-800/70 ${
                      system.isActive ? 'border-emerald-500/30' : 'border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${system.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            <h3 className="font-bold text-lg">
                              {system.name || (
                                <span className="text-gray-400 italic">Unnamed System</span>
                              )}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              system.isActive 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {system.isActive ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setConfigSystem(system)}
                              disabled={!system.isActive}
                              className={`px-3 py-1 rounded-lg flex items-center space-x-1 transition-colors ${
                                system.isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                                  : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Settings size={14} />
                              <span className="text-sm">Configure</span>
                            </button>
                            <button
                              onClick={() => {
                                setIpInput(system.ip);
                                setNameInput(system.name || '');
                                checkSystem();
                              }}
                              className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg flex items-center space-x-1 transition-colors"
                            >
                              <Edit2 size={14} />
                              <span className="text-sm">Edit</span>
                            </button>
                            <button
                              onClick={() => removeSystem(system.ip)}
                              className="px-3 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg flex items-center space-x-1 transition-colors"
                            >
                              <Trash2 size={14} />
                              <span className="text-sm">Remove</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-400">IP Address</p>
                            <p className="font-mono font-medium bg-gray-900 px-3 py-1 rounded-lg">
                              {system.ip}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400">Last Activity</p>
                            <p className="flex items-center text-gray-300">
                              <Clock size={14} className="mr-2" />
                              {formatTimeAgo(system.lastHeartbeat)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400">Heartbeats</p>
                            <p className="text-gray-300">{system.heartbeats || 0} signals</p>
                          </div>
                        </div>

                        {system.userAgent && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-gray-400 text-sm">System Info</p>
                            <p className="text-gray-300 text-sm truncate">{system.userAgent}</p>
                          </div>
                        )}

                        {system.name && (
                          <div className="mt-3 flex items-center space-x-2 text-emerald-400">
                            <CheckCircle size={16} />
                            <span className="text-sm">Name assigned: "{system.name}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Stats */}
            {systems.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-300">
                    {systems.filter(s => s.isActive).length}
                  </p>
                  <p className="text-gray-400 text-sm">Online Now</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-300">
                    {systems.filter(s => s.name).length}
                  </p>
                  <p className="text-gray-400 text-sm">Named Systems</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-300">
                    {systems.filter(s => !s.isActive).length}
                  </p>
                  <p className="text-gray-400 text-sm">Offline</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => window.open(`${API_URL}/debug`, '_blank')}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Activity size={18} />
                <span>Debug Console</span>
              </button>
              <button
                onClick={() => window.open(`${API_URL}/info`, '_blank')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl flex items-center justify-center space-x-2 transition-all"
              >
                <Server size={18} />
                <span>Server Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {/* <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Gaming Cafe Control Center v2.0 • Powered by Real-time Monitoring System
          </p>
          <p>
            Server: {API_URL} • Admin Panel: http://localhost:5173 • Client App: http://localhost:5174
          </p>
          <p className="mt-2 text-gray-600">
            Systems automatically connect when client application is running on gaming PCs
          </p>
        </div> */}
      </div>
    </div>
  );
}

export default ConnectionPage;