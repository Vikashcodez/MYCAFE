import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Cpu, 
  Wifi, 
  WifiOff,
  Copy,
  RefreshCw,
  Search,
  Server,
  Shield,
  Zap,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Gamepad2,
  Monitor,
  Keyboard,
  MousePointer,
  Cctv,
  Power
} from 'lucide-react';

const SERVER_IP = 'localhost';
const API_URL = `http://${SERVER_IP}:5000/api`;

function ClientConnectionPage() {
  const [systemIp, setSystemIp] = useState('127.0.0.1');
  const [assignedName, setAssignedName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Initializing System...');
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [connectionStats, setConnectionStats] = useState({
    heartbeatsSent: 0,
    lastHeartbeatTime: null,
    averagePing: 0,
    uptime: '00:00:00'
  });
  
  const heartbeatRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    testServerConnection();
    startHeartbeat();
    
    // Start uptime timer
    const uptimeInterval = setInterval(() => {
      const uptimeMs = Date.now() - startTimeRef.current;
      const hours = Math.floor(uptimeMs / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((uptimeMs % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((uptimeMs % 60000) / 1000).toString().padStart(2, '0');
      setConnectionStats(prev => ({
        ...prev,
        uptime: `${hours}:${minutes}:${seconds}`
      }));
    }, 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      clearInterval(uptimeInterval);
    };
  }, []);

  const testServerConnection = async () => {
    try {
      setConnectionStatus('Establishing secure connection...');
      addDebugLog(`Connecting to: ${API_URL}/test`);
      
      const response = await fetch(`${API_URL}/test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('Secure connection established ✓');
        addDebugLog(`Server handshake successful: ${JSON.stringify(data)}`);
        return true;
      } else {
        setConnectionStatus(`Connection error: ${response.status}`);
        addDebugLog(`Server response error: ${response.status}`);
        return false;
      }
    } catch (error) {
      setConnectionStatus(`Connection timeout: ${error.message}`);
      addDebugLog(`Network error: ${error.message}`);
      
      // Show connection guide
      setTimeout(() => {
        alert(`⚠️ Server Connection Required\n\nTo connect this gaming system:\n\n1. Ensure the admin server is running\n2. Server URL: ${API_URL}\n3. Run command: cd backend && npm start\n4. Verify port 5000 is available\n\nCurrent IP: ${systemIp}`);
      }, 1000);
      
      return false;
    }
  };

  const startHeartbeat = () => {
    sendHeartbeat();
    
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat();
    }, 1000);
    
    addDebugLog('Heartbeat monitoring initiated (1s interval)');
  };

  const sendHeartbeat = async () => {
    try {
      const startTime = Date.now();
      const ip = systemIp;
      
      const response = await fetch(`${API_URL}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ip: ip,
          timestamp: Date.now(),
          userAgent: navigator.userAgent || 'Gaming System',
          performance: {
            cores: navigator.hardwareConcurrency || 8,
            memory: '16GB',
            gpu: 'RTX 3060'
          }
        })
      });
      
      const ping = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        
        if (!isConnected) {
          setIsConnected(true);
          setConnectionStatus('Connected to gaming network ✓');
          addDebugLog('✓ System registered on gaming network');
        }
        
        setLastUpdate(new Date().toLocaleTimeString());
        
        // Update connection stats
        setConnectionStats(prev => ({
          ...prev,
          heartbeatsSent: prev.heartbeatsSent + 1,
          lastHeartbeatTime: new Date().toLocaleTimeString(),
          averagePing: Math.round((prev.averagePing * prev.heartbeatsSent + ping) / (prev.heartbeatsSent + 1))
        }));
        
        if (data.hasName && data.assignedName !== assignedName) {
          setAssignedName(data.assignedName);
          addDebugLog(`System name updated: "${data.assignedName}"`);
        }
      } else {
        if (isConnected) {
          setIsConnected(false);
          setConnectionStatus(`Connection disrupted: ${response.status}`);
          addDebugLog(`✗ Network disruption detected`);
        }
      }
    } catch (error) {
      if (isConnected) {
        setIsConnected(false);
        setConnectionStatus('Network connection lost');
        addDebugLog(`✗ Connection timeout`);
      }
      
      // Attempt reconnection
      setTimeout(() => {
        sendHeartbeat();
      }, 2000);
    }
  };

  const manualHeartbeat = () => {
    sendHeartbeat();
  };

  const checkNameStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/client/check/${systemIp}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.name) {
          setAssignedName(data.name);
          addDebugLog(`Name verified: "${data.name}"`);
        }
      }
    } catch (error) {
      addDebugLog('Error checking system name');
    }
  };

  const copyIpToClipboard = () => {
    navigator.clipboard.writeText(systemIp)
      .then(() => addDebugLog('System IP copied to clipboard'))
      .catch(() => addDebugLog('Copy operation failed'));
  };

  const addDebugLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
  };

  const restartConnection = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setIsConnected(false);
    setConnectionStatus('Reinitializing connection...');
    addDebugLog('Connection restart initiated');
    testServerConnection();
    startHeartbeat();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                <Gamepad2 size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Gaming System Client
                </h1>
                <p className="text-gray-400">Local Development Terminal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="px-4 py-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400">Server</div>
                <div className="font-mono text-sm">{SERVER_IP}:5000</div>
              </div>
            </div>
          </div>

          {/* System Information Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">System Uptime</p>
                  <p className="text-2xl font-bold text-cyan-300">{connectionStats.uptime}</p>
                </div>
                <div className="p-3 bg-cyan-500/10 rounded-lg">
                  <Clock className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Heartbeats</p>
                  <p className="text-2xl font-bold text-emerald-300">{connectionStats.heartbeatsSent}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Activity className="text-emerald-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average Ping</p>
                  <p className="text-2xl font-bold text-blue-300">{connectionStats.averagePing}ms</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Zap className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Connection</p>
                  <p className="text-xl font-bold">
                    <span className={isConnected ? 'text-emerald-300' : 'text-rose-300'}>
                      {isConnected ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${isConnected ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                  {isConnected ? (
                    <Wifi className="text-emerald-400" size={24} />
                  ) : (
                    <WifiOff className="text-rose-400" size={24} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - System Info */}
          <div className="space-y-6">
            {/* System Identification Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    <Cpu className="mr-3 text-cyan-400" size={24} />
                    System Identification
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Gaming System Details</p>
                </div>
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full absolute -top-1 -right-1 ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <Shield className="text-gray-600" size={24} />
                </div>
              </div>

              {/* IP Address Display */}
              <div className="mb-6">
                <div className="text-gray-400 text-sm mb-2">System IP Address</div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-5">
                  <div className="font-mono text-2xl md:text-3xl font-bold text-center text-white tracking-wider">
                    {systemIp}
                  </div>
                  <div className="text-center text-gray-300 mt-2 text-sm">
                    Local Development Instance
                  </div>
                </div>
              </div>

              {/* Assigned Name Display */}
              <div>
                <div className="text-gray-400 text-sm mb-2">System Display Name</div>
                <div className={`rounded-xl p-6 border-2 transition-all duration-300 ${assignedName ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30' : 'bg-gray-800/50 border-gray-700 border-dashed'}`}>
                  <div className={`text-center font-bold ${assignedName ? 'text-4xl md:text-5xl text-emerald-300' : 'text-2xl text-gray-400 italic'}`}>
                    {assignedName || 'Awaiting Assignment'}
                  </div>
                  
                  {assignedName && (
                    <div className="mt-4 flex items-center justify-center space-x-2 text-emerald-400">
                      <CheckCircle size={20} />
                      <span className="font-medium">Name assigned by administrator</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Connection Status Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Server className="mr-2 text-blue-400" size={20} />
                Connection Monitor
              </h3>
              
              <div className={`rounded-xl p-5 mb-4 ${isConnected ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-lg font-bold ${isConnected ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {isConnected ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                    </span>
                  </div>
                  {lastUpdate && (
                    <div className="text-gray-400 text-sm">
                      <Clock size={14} className="inline mr-1" />
                      {lastUpdate}
                    </div>
                  )}
                </div>
                <div className="text-gray-300">{connectionStatus}</div>
              </div>

              {/* Connection Details */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Last Heartbeat</span>
                  <span className="font-mono">{connectionStats.lastHeartbeatTime || '--:--:--'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Server URL</span>
                  <span className="font-mono text-sm">{API_URL}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Update Frequency</span>
                  <span className="font-medium">1 second</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center">
                    <Keyboard className="mr-3 text-amber-400" size={24} />
                    System Controls
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Manual system operations</p>
                </div>
                <Power className="text-gray-600" size={24} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={manualHeartbeat}
                  className="group p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl hover:border-blue-400 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                      <RefreshCw className="text-blue-400" size={24} />
                    </div>
                  </div>
                  <div className="text-center font-medium">Force Heartbeat</div>
                  <div className="text-gray-400 text-xs text-center mt-1">Manual update</div>
                </button>

                <button
                  onClick={checkNameStatus}
                  className="group p-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl hover:border-emerald-400 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                      <Search className="text-emerald-400" size={24} />
                    </div>
                  </div>
                  <div className="text-center font-medium">Verify Name</div>
                  <div className="text-gray-400 text-xs text-center mt-1">Check assignment</div>
                </button>

                <button
                  onClick={copyIpToClipboard}
                  className="group p-4 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 rounded-xl hover:border-cyan-400 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                      <Copy className="text-cyan-400" size={24} />
                    </div>
                  </div>
                  <div className="text-center font-medium">Copy IP</div>
                  <div className="text-gray-400 text-xs text-center mt-1">For admin reference</div>
                </button>

                <button
                  onClick={restartConnection}
                  className="group p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-xl hover:border-amber-400 transition-all hover:scale-[1.02] active:scale-95"
                >
                  <div className="flex items-center justify-center mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                      <Activity className="text-amber-400" size={24} />
                    </div>
                  </div>
                  <div className="text-center font-medium">Restart Link</div>
                  <div className="text-gray-400 text-xs text-center mt-1">Reinitialize</div>
                </button>
              </div>

              {/* Quick Info */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                <h4 className="font-medium mb-2 flex items-center">
                  <Monitor className="mr-2 text-gray-400" size={16} />
                  Quick Reference
                </h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Provide IP <code className="bg-gray-900 px-1 rounded">{systemIp}</code> to admin</li>
                  <li>• System auto-updates every second</li>
                  <li>• Admin assigns names remotely</li>
                  <li>• Connection persists until system shutdown</li>
                </ul>
              </div>
            </div>

            {/* Debug Panel */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center">
                  <Cctv className="mr-2 text-rose-400" size={20} />
                  System Monitor
                </h3>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {showDebug ? 'Hide Logs' : 'Show Logs'}
                </button>
              </div>

              {showDebug && (
                <div className="bg-black/40 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
                  <div className="text-gray-400 mb-2 text-xs">Event Log:</div>
                  {debugLog.map((log, i) => (
                    <div 
                      key={i} 
                      className={`py-1 px-2 rounded mb-1 ${log.includes('✓') ? 'bg-emerald-500/10 text-emerald-300' : log.includes('✗') ? 'bg-rose-500/10 text-rose-300' : 'bg-gray-800/30'}`}
                    >
                      {log}
                    </div>
                  ))}
                  {debugLog.length === 0 && (
                    <div className="text-gray-500 italic">Waiting for system events...</div>
                  )}
                </div>
              )}

              {/* System Status */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{connectionStats.heartbeatsSent}</div>
                  <div className="text-xs text-gray-400">Pulses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-300">{connectionStats.averagePing}ms</div>
                  <div className="text-xs text-gray-400">Latency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-300">{connectionStats.uptime.split(':')[0]}h</div>
                  <div className="text-xs text-gray-400">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span>{isConnected ? 'Connected to Gaming Network' : 'Network Disconnected'}</span>
              </div>
            </div>
            <div className="space-x-4">
              <span>Local Development Mode</span>
              <span className="text-gray-600">•</span>
              <span>Auto-sync: 1s</span>
              <span className="text-gray-600">•</span>
              <span>Server: {API_URL}</span>
            </div>
          </div>
          <div className="mt-3 text-gray-600 text-xs">
            Gaming System Client v2.0 • For demonstration and development purposes
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientConnectionPage;