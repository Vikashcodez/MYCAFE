import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// For SAME PC development - use localhost
const SERVER_IP = 'localhost'; // Use localhost for same PC
const API_URL = `http://${SERVER_IP}:5000/api`;

function App() {
  const [systemIp, setSystemIp] = useState('127.0.0.1'); // Set immediately for local dev
  const [assignedName, setAssignedName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Starting...');
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  
  const heartbeatRef = useRef(null);

  useEffect(() => {
    testServerConnection();
    
    // Start heartbeat immediately (IP is already set)
    startHeartbeat();
    
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);


  // Test server connection
  const testServerConnection = async () => {
    try {
      setConnectionStatus('Testing server connection...');
      addDebugLog(`Testing: ${API_URL}/test`);
      
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
        setConnectionStatus('Server is reachable ✓');
        addDebugLog(`Server response: ${JSON.stringify(data)}`);
        return true;
      } else {
        setConnectionStatus(`Server error: ${response.status}`);
        addDebugLog(`Server error: ${response.status}`);
        return false;
      }
    } catch (error) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      addDebugLog(`Connection error: ${error.message}`);
      
      // Show helpful alert
      setTimeout(() => {
        alert(`⚠️ Cannot connect to server!\n\nMake sure:\n1. Server is running on port 5000\n2. Run in terminal: cd backend && npm start\n3. Check if port 5000 is not in use\n\nServer URL: ${API_URL}`);
      }, 500);
      
      return false;
    }
  };

  // Start heartbeat
  const startHeartbeat = () => {
    // Send first heartbeat immediately
    sendHeartbeat();
    
    // Then every 1 second
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      sendHeartbeat();
    }, 1000);
    
    addDebugLog('Heartbeat started (every 1 second)');
  };

  // Send heartbeat
  const sendHeartbeat = async () => {
    try {
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
          userAgent: 'Local Development'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Only update state if connection status changed
        if (!isConnected) {
          setIsConnected(true);
          setConnectionStatus('Connected ✓');
          addDebugLog('✓ Connected to server');
        }
        
        setLastUpdate(new Date().toLocaleTimeString());
        
        if (data.hasName && data.assignedName !== assignedName) {
          setAssignedName(data.assignedName);
          addDebugLog(`Name assigned: "${data.assignedName}"`);
        }
      } else {
        // Connection failed
        if (isConnected) {
          setIsConnected(false);
          setConnectionStatus(`Heartbeat failed: ${response.status}`);
          addDebugLog(`✗ Heartbeat failed: ${response.status}`);
        }
      }
    } catch (error) {
      // Network error - don't spam logs
      if (isConnected) {
        setIsConnected(false);
        setConnectionStatus(`Connection lost: ${error.message}`);
        addDebugLog(`✗ Connection error: ${error.message}`);
      }
      
      // Try to reconnect
      setTimeout(() => {
        sendHeartbeat();
      }, 2000);
    }
  };

  // Manual heartbeat
  const manualHeartbeat = () => {
    sendHeartbeat();
  };

  // Check name
  const checkNameStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/client/check/${systemIp}`);
      if (response.ok) {
        const data = await response.json();
        if (data.exists && data.name) {
          setAssignedName(data.name);
          alert(`✅ Name: "${data.name}"`);
        } else {
          alert('No name assigned yet');
        }
      }
    } catch (error) {
      alert('Error checking name');
    }
  };

  // Copy IP
  const copyIpToClipboard = () => {
    navigator.clipboard.writeText(systemIp)
      .then(() => alert(`IP copied: ${systemIp}`))
      .catch(() => alert('Copy failed'));
  };

  // Add debug
  const addDebugLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setDebugLog(prev => [`[${time}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Restart connection
  const restartConnection = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    setIsConnected(false);
    setConnectionStatus('Restarting...');
    addDebugLog('Restarting connection...');
    testServerConnection();
    startHeartbeat();
  };

  // SIMPLIFIED STYLES
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    card: {
      width: '100%',
      maxWidth: '500px',
      background: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: '10px'
    },
    subtitle: {
      color: '#666',
      textAlign: 'center',
      marginBottom: '30px'
    },
    ipBox: {
      background: '#1e40af',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center',
      marginBottom: '20px'
    },
    ipText: {
      fontSize: '32px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
      margin: '10px 0'
    },
    nameBox: {
      padding: '25px',
      background: assignedName ? '#d1fae5' : '#f3f4f6',
      borderRadius: '10px',
      border: assignedName ? '3px solid #10b981' : '2px dashed #9ca3af',
      textAlign: 'center',
      marginBottom: '20px'
    },
    nameText: {
      fontSize: assignedName ? '36px' : '24px',
      fontWeight: 'bold',
      color: assignedName ? '#065f46' : '#6b7280',
      minHeight: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    statusBox: {
      padding: '20px',
      background: isConnected ? '#d1fae5' : '#fee2e2',
      borderRadius: '10px',
      border: `2px solid ${isConnected ? '#10b981' : '#ef4444'}`,
      textAlign: 'center',
      marginBottom: '20px'
    },
    statusText: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: isConnected ? '#065f46' : '#991b1b',
      marginBottom: '10px'
    },
    connectionStatus: {
      color: '#4b5563',
      fontSize: '14px'
    },
    buttons: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '20px'
    },
    button: {
      padding: '12px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    debugPanel: {
      background: '#1f2937',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '200px',
      overflowY: 'auto',
      marginTop: '20px'
    },
    footer: {
      textAlign: 'center',
      marginTop: '20px',
      color: '#6b7280',
      fontSize: '14px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Internet Cafe PC</h1>
        <p style={styles.subtitle}>Local Development Mode</p>
        
        {/* IP Display */}
        <div style={styles.ipBox}>
          <div>Your System IP:</div>
          <div style={styles.ipText}>{systemIp}</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            (Localhost for development)
          </div>
        </div>
        
        {/* Assigned Name */}
        <div style={styles.nameBox}>
          <div style={styles.nameText}>
            {assignedName || 'No name assigned'}
          </div>
          {assignedName && (
            <div style={{ color: '#059669', marginTop: '10px' }}>
              ✅ Name assigned by admin
            </div>
          )}
        </div>
        
        {/* Status */}
        <div style={styles.statusBox}>
          <div style={styles.statusText}>
            {isConnected ? '✅ Connected' : '❌ Not Connected'}
          </div>
          <div style={styles.connectionStatus}>
            {connectionStatus}
          </div>
          {lastUpdate && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              Last update: {lastUpdate}
            </div>
          )}
        </div>
        
        {/* Buttons */}
        <div style={styles.buttons}>
          <button 
            style={{ ...styles.button, background: '#3b82f6', color: 'white' }}
            onClick={manualHeartbeat}
          >
            🔄 Send Heartbeat
          </button>
          
          <button 
            style={{ ...styles.button, background: '#10b981', color: 'white' }}
            onClick={checkNameStatus}
          >
            🔍 Check Name
          </button>
          
          <button 
            style={{ ...styles.button, background: '#f59e0b', color: 'white' }}
            onClick={copyIpToClipboard}
          >
            📋 Copy IP
          </button>
          
          <button 
            style={{ ...styles.button, background: '#6b7280', color: 'white' }}
            onClick={restartConnection}
          >
            🔁 Restart
          </button>
        </div>
        
        {/* Debug Info */}
        {showDebug && (
          <div style={styles.debugPanel}>
            <div style={{ marginBottom: '10px', color: '#9ca3af' }}>
              Debug Log (Server: {API_URL})
            </div>
            {debugLog.map((log, i) => (
              <div key={i} style={{ marginBottom: '5px', fontSize: '11px' }}>
                {log}
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={() => setShowDebug(!showDebug)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            color: '#6b7280',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </button>
        
        {/* Footer */}
        <div style={styles.footer}>
          <div>Running on same PC for development</div>
          <div style={{ fontSize: '12px', marginTop: '5px' }}>
            Server: {API_URL} • Auto-refresh every 3s
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;