import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Rocket, 
  Package, 
  CheckCircle, 
  Circle,
  Monitor,
  Gamepad2,
  Save,
  Send
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function SystemConfig({ system, onBack }) {
  const [installedSoftware, setInstalledSoftware] = useState([]);
  const [selectedSoftware, setSelectedSoftware] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Simulate fetching installed software from client PC
    // In real implementation, this would query the client
    fetchInstalledSoftware();
  }, []);

  const fetchInstalledSoftware = () => {
    // Mock data - in real implementation, fetch from client
    const mockSoftware = [
      { id: 1, name: 'Valorant', icon: '🎮', installed: true },
      { id: 2, name: 'League of Legends', icon: '⚔️', installed: true },
      { id: 3, name: 'CS:GO', icon: '🔫', installed: true },
      { id: 4, name: 'Dota 2', icon: '🛡️', installed: true },
      { id: 5, name: 'Fortnite', icon: '🏆', installed: true },
      { id: 6, name: 'Minecraft', icon: '⛏️', installed: true },
      { id: 7, name: 'GTA V', icon: '🚗', installed: true },
      { id: 8, name: 'Apex Legends', icon: '🎯', installed: true },
      { id: 9, name: 'PUBG', icon: '🪂', installed: true },
      { id: 10, name: 'Overwatch', icon: '🦸', installed: true },
      { id: 11, name: 'Steam', icon: '💨', installed: true },
      { id: 12, name: 'Epic Games', icon: '🎮', installed: true },
    ];
    setInstalledSoftware(mockSoftware);
  };

  const toggleSoftware = (softwareId) => {
    setSelectedSoftware(prev => {
      if (prev.includes(softwareId)) {
        return prev.filter(id => id !== softwareId);
      } else {
        return [...prev, softwareId];
      }
    });
  };

  const handleLaunch = async () => {
    if (selectedSoftware.length === 0) {
      setMessage({ text: 'Please select at least one software to launch', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const selectedApps = installedSoftware.filter(sw => selectedSoftware.includes(sw.id));
      
      const response = await axios.post(`${API_URL}/systems/launch`, {
        ip: system.ip,
        software: selectedApps.map(s => s.name),
        systemName: system.name || system.ip
      });

      if (response.data.success) {
        setMessage({ 
          text: `Launch command sent to ${system.name || system.ip}!`, 
          type: 'success' 
        });
        
        // Auto redirect back after 2 seconds
        setTimeout(() => {
          onBack();
        }, 2000);
      }
    } catch (error) {
      setMessage({ 
        text: 'Error sending launch command', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const MessageAlert = ({ message }) => {
    if (!message) return null;

    const styles = {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      error: 'bg-rose-50 border-rose-200 text-rose-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };

    return (
      <div className={`p-4 rounded-xl border ${styles[message.type]} flex items-start space-x-3 mb-6`}>
        <CheckCircle className="w-5 h-5 mt-0.5" />
        <p className="font-medium">{message.text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Systems</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center">
                <Monitor className="mr-3 text-cyan-400" size={32} />
                Configure System
              </h1>
              <p className="text-gray-400 mt-2">
                {system.name || system.ip} • {system.ip}
              </p>
            </div>
          </div>
        </div>

        {message && <MessageAlert message={message} />}

        {/* System Info Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Gamepad2 className="mr-2 text-cyan-400" size={24} />
            System Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">System Name</p>
              <p className="text-lg font-medium text-cyan-300">
                {system.name || 'Unnamed System'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">IP Address</p>
              <p className="text-lg font-mono text-blue-300">{system.ip}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`text-lg font-medium ${system.isActive ? 'text-emerald-300' : 'text-amber-300'}`}>
                {system.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>

        {/* Software Selection */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Package className="mr-2 text-purple-400" size={24} />
            Select Software to Launch
          </h2>
          <p className="text-gray-400 mb-6">Choose the games and applications available for customers</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {installedSoftware.map(software => (
              <button
                key={software.id}
                onClick={() => toggleSoftware(software.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSoftware.includes(software.id)
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-4xl">{software.icon}</div>
                  <div className="text-sm font-medium text-center">
                    {software.name}
                  </div>
                  <div className="mt-2">
                    {selectedSoftware.includes(software.id) ? (
                      <CheckCircle className="text-cyan-400" size={20} />
                    ) : (
                      <Circle className="text-gray-600" size={20} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-700">
            <p className="text-sm text-gray-400">
              Selected: <span className="text-cyan-400 font-medium">{selectedSoftware.length}</span> applications
            </p>
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            disabled={loading || selectedSoftware.length === 0}
            className={`flex-1 px-6 py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all ${
              loading || selectedSoftware.length === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
            }`}
          >
            <Rocket size={20} />
            <span>{loading ? 'Launching...' : 'Launch System'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SystemConfig;
