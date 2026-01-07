import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const ConnectionContext = createContext();

const SERVER_IP = 'localhost';
const API_URL = `http://${SERVER_IP}:5000/api`;

export const ConnectionProvider = ({ children }) => {
  const [systemIp, setSystemIp] = useState('127.0.0.1');
  const [assignedName, setAssignedName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Initializing System...');
  const [debugLog, setDebugLog] = useState([]);
  const [connectionStats, setConnectionStats] = useState({
    heartbeatsSent: 0,
    lastHeartbeatTime: null,
    averagePing: 0,
    uptime: '00:00:00'
  });
  const [launched, setLaunched] = useState(false);
  const [launchConfig, setLaunchConfig] = useState(null);
  
  const heartbeatRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    testServerConnection();
    startHeartbeat();
    checkLaunchStatus();
    
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

    // Check launch status periodically
    const launchCheckInterval = setInterval(() => {
      checkLaunchStatus();
    }, 3000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      clearInterval(uptimeInterval);
      clearInterval(launchCheckInterval);
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
    }
  };

  const checkLaunchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/systems/launch-status/${systemIp}`);
      if (response.ok) {
        const data = await response.json();
        if (data.launched && !launched) {
          setLaunched(true);
          setLaunchConfig(data.config);
          addDebugLog('🚀 System launched! Awaiting customer login...');
          
          // Acknowledge the launch
          await fetch(`${API_URL}/systems/launch-acknowledge/${systemIp}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } catch (error) {
      // Silently fail - launch status check is not critical
    }
  };

  const addDebugLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${time}] ${message}`, ...prev.slice(0, 19)]);
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

  const restartConnection = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setIsConnected(false);
    setConnectionStatus('Reinitializing connection...');
    addDebugLog('Connection restart initiated');
    testServerConnection();
    startHeartbeat();
  };

  const value = {
    systemIp,
    assignedName,
    isConnected,
    lastUpdate,
    connectionStatus,
    debugLog,
    connectionStats,
    launched,
    launchConfig,
    manualHeartbeat,
    checkNameStatus,
    restartConnection,
    addDebugLog,
    API_URL
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
