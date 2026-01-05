import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [ipInput, setIpInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [systems, setSystems] = useState([]);
  const [message, setMessage] = useState('');
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchServerInfo();
    fetchSystems();
    
    const interval = setInterval(() => {
      fetchSystems();
    }, 3000); // Refresh every 3 seconds
    
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
      setMessage('❌ Please enter an IP address');
      return;
    }

    setChecking(true);
    try {
      const response = await axios.get(`${API_URL}/systems/check/${ipInput.trim()}`);
      
      if (response.data.exists) {
        if (response.data.isActive) {
          setMessage(`✅ System ${ipInput} is ACTIVE and ready for naming`);
          setNameInput(response.data.name || '');
        } else {
          setMessage(`⚠️ System ${ipInput} exists but is INACTIVE\nLast seen: ${response.data.lastSeen}`);
        }
      } else {
        setMessage(`❌ System ${ipInput} not found\nMake sure client app is running on that PC`);
      }
    } catch (error) {
      setMessage(`Error checking system: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  const assignName = async () => {
    if (!ipInput.trim()) {
      setMessage('❌ Please enter an IP address');
      return;
    }

    if (!nameInput.trim()) {
      setMessage('❌ Please enter a name for the system');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/systems/assign`, {
        ip: ipInput.trim(),
        name: nameInput.trim()
      });

      if (response.data.success) {
        setMessage(`✅ Name "${nameInput}" assigned to ${ipInput}`);
        setIpInput('');
        setNameInput('');
        fetchSystems();
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setMessage(`❌ ${error.response.data.error}\n${error.response.data.suggestion || ''}`);
      } else {
        setMessage('Error assigning name');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeSystem = async (ip) => {
    if (window.confirm(`Are you sure you want to remove system ${ip}?`)) {
      try {
        await axios.delete(`${API_URL}/systems/${ip}`);
        setMessage(`✅ System ${ip} removed`);
        fetchSystems();
      } catch (error) {
        setMessage('Error removing system');
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
    return `${hours}h ago`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🌐 Internet Cafe System Manager</h1>
        <p style={styles.subtitle}>Admin Control Panel</p>
        
        {serverInfo && (
          <div style={styles.serverStats}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{serverInfo.systems.total}</div>
              <div style={styles.statLabel}>Total Systems</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{serverInfo.systems.active}</div>
              <div style={styles.statLabel}>Active Now</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>{serverInfo.systems.inactive}</div>
              <div style={styles.statLabel}>Inactive</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Panel: Assign Name */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📝 Assign System Name</h2>
          
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Client PC IP Address:</label>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder="e.g., 192.168.1.10 or 14.99.202.2"
                  style={styles.input}
                />
                <button 
                  onClick={checkSystem}
                  disabled={checking}
                  style={{
                    ...styles.checkButton,
                    opacity: checking ? 0.7 : 1
                  }}
                >
                  {checking ? 'Checking...' : '🔍 Check'}
                </button>
              </div>
              <small style={styles.inputHint}>Enter the IP address shown on client PC</small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>System Name:</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g., Gaming PC-1, Counter PC, Admin PC"
                style={styles.input}
              />
              <small style={styles.inputHint}>Name will appear on client PC</small>
            </div>

            {message && (
              <div style={{
                ...styles.messageBox,
                backgroundColor: message.includes('✅') ? '#D1FAE5' : 
                                message.includes('⚠️') ? '#FEF3C7' : 
                                message.includes('❌') ? '#FEE2E2' : '#E0E7FF',
                borderColor: message.includes('✅') ? '#10B981' : 
                            message.includes('⚠️') ? '#F59E0B' : 
                            message.includes('❌') ? '#EF4444' : '#6366F1',
                color: message.includes('✅') ? '#065F46' : 
                      message.includes('⚠️') ? '#92400E' : 
                      message.includes('❌') ? '#991B1B' : '#3730A3'
              }}>
                {message.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            )}

            <button 
              onClick={assignName}
              style={{
                ...styles.assignButton,
                opacity: (!ipInput || !nameInput || loading) ? 0.5 : 1,
                cursor: (!ipInput || !nameInput || loading) ? 'not-allowed' : 'pointer'
              }}
              disabled={!ipInput || !nameInput || loading}
            >
              {loading ? '⏳ Assigning...' : '✅ Assign Name to System'}
            </button>

            <div style={styles.instructions}>
              <h3 style={styles.instructionsTitle}>📋 How to Use:</h3>
              <ol style={styles.instructionsList}>
                <li>Ask client for their IP address (shown on their screen)</li>
                <li>Enter IP and click "Check" to verify it's active</li>
                <li>Enter a name for the system</li>
                <li>Click "Assign Name"</li>
                <li>Name will appear on client PC automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Right Panel: Active Systems */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>
              💻 Connected Systems ({systems.length})
              <span style={styles.onlineCount}>
                ({systems.filter(s => s.isActive).length} online)
              </span>
            </h2>
            <button 
              onClick={fetchSystems}
              style={styles.refreshButton}
            >
              🔄 Refresh
            </button>
          </div>

          {systems.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📡</div>
              <p style={styles.emptyText}>No systems detected</p>
              <p style={styles.emptySubtext}>Client PCs will appear here when they connect</p>
            </div>
          ) : (
            <div style={styles.systemsList}>
              {systems.map((system) => (
                <div 
                  key={system.ip}
                  style={{
                    ...styles.systemCard,
                    borderLeftColor: system.isActive ? '#10B981' : '#EF4444',
                    backgroundColor: system.isActive ? '#F9FAFB' : '#FEF2F2'
                  }}
                >
                  <div style={styles.systemHeader}>
                    <div style={styles.systemInfo}>
                      <div style={styles.systemNameRow}>
                        <span style={styles.systemName}>
                          {system.name || 'Unnamed System'}
                        </span>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: system.isActive ? '#10B981' : '#EF4444'
                        }}>
                          {system.isActive ? '🟢 Online' : '🔴 Offline'}
                        </span>
                      </div>
                      <div style={styles.systemIp}>
                        <strong>IP:</strong> 
                        <span style={styles.ipText}>{system.ip}</span>
                      </div>
                      <div style={styles.systemDetails}>
                        <span>Last seen: {formatTimeAgo(system.lastHeartbeat)}</span>
                        <span>• Heartbeats: {system.heartbeats || 0}</span>
                        {system.userAgent && (
                          <span>• {system.userAgent.substring(0, 20)}...</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.systemActions}>
                      <button
                        onClick={() => {
                          setIpInput(system.ip);
                          setNameInput(system.name || '');
                          checkSystem();
                        }}
                        style={styles.editButton}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => removeSystem(system.ip)}
                        style={styles.deleteButton}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                  
                  {system.name && (
                    <div style={styles.nameAssigned}>
                      ✅ Name assigned: "{system.name}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          {systems.length > 0 && (
            <div style={styles.stats}>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>
                  {systems.filter(s => s.isActive).length}
                </div>
                <div style={styles.statLabel}>Online Now</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>
                  {systems.filter(s => s.name).length}
                </div>
                <div style={styles.statLabel}>Named Systems</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statNumber}>
                  {systems.filter(s => !s.isActive).length}
                </div>
                <div style={styles.statLabel}>Offline</div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <button 
              onClick={() => window.open(`${API_URL}/debug`, '_blank')}
              style={styles.debugButton}
            >
              🐛 Open Debug
            </button>
            <button 
              onClick={() => window.open(`${API_URL}/info`, '_blank')}
              style={styles.infoButton}
            >
              ℹ️ Server Info
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>
          🌐 Server running on: {API_URL} • 
          🖥️ Admin Panel: http://localhost:3000 • 
          💻 Client App: http://localhost:3001
        </p>
        <p style={styles.footerSubtext}>
          Systems are automatically detected when client app is running on PC
        </p>
      </div>
    </div>
  );
}

// ========== STYLES ==========
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#64748B',
    marginBottom: '20px'
  },
  serverStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '20px'
  },
  statItem: {
    textAlign: 'center',
    padding: '15px 25px',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    minWidth: '120px'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#3B82F6'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#64748B',
    marginTop: '5px'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '25px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid #E2E8F0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #F1F5F9'
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0
  },
  onlineCount: {
    fontSize: '1rem',
    color: '#64748B',
    fontWeight: 'normal',
    marginLeft: '10px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#475569'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '12px 15px',
    border: '2px solid #E2E8F0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.3s',
    outline: 'none'
  },
  inputHint: {
    fontSize: '0.85rem',
    color: '#94A3B8',
    marginTop: '4px'
  },
  checkButton: {
    padding: '12px 20px',
    backgroundColor: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.95rem',
    whiteSpace: 'nowrap'
  },
  assignButton: {
    padding: '15px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  },
  messageBox: {
    padding: '15px',
    borderRadius: '10px',
    border: '2px solid',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    whiteSpace: 'pre-line'
  },
  instructions: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#EFF6FF',
    borderRadius: '10px',
    border: '1px solid #DBEAFE'
  },
  instructionsTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: '10px'
  },
  instructionsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#374151',
    lineHeight: '1.8'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#64748B',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#94A3B8'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '15px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '1.2rem',
    marginBottom: '10px'
  },
  emptySubtext: {
    fontSize: '0.9rem'
  },
  systemsList: {
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '10px'
  },
  systemCard: {
    padding: '18px',
    marginBottom: '15px',
    borderRadius: '10px',
    borderLeft: '5px solid',
    transition: 'all 0.3s'
  },
  systemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  systemInfo: {
    flex: 1
  },
  systemNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  systemName: {
    fontSize: '1.3rem',
    fontWeight: '600',
    color: '#1E293B'
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    color: 'white',
    fontWeight: '500'
  },
  systemIp: {
    fontSize: '0.95rem',
    color: '#475569',
    marginBottom: '8px'
  },
  ipText: {
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '3px 8px',
    borderRadius: '5px',
    marginLeft: '8px',
    color: '#334155'
  },
  systemDetails: {
    display: 'flex',
    gap: '15px',
    fontSize: '0.85rem',
    color: '#64748B',
    flexWrap: 'wrap'
  },
  systemActions: {
    display: 'flex',
    gap: '10px'
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#FBBF24',
    color: '#92400E',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500'
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#FCA5A5',
    color: '#991B1B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500'
  },
  nameAssigned: {
    marginTop: '12px',
    padding: '8px 12px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  stats: {
    display: 'flex',
    gap: '15px',
    marginTop: '25px',
    paddingTop: '20px',
    borderTop: '2px solid #F1F5F9'
  },
  statBox: {
    flex: 1,
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px'
  },
  statNumber: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#1E293B'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#64748B',
    marginTop: '5px'
  },
  quickActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  debugButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#7C3AED',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  infoButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#06B6D4',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  footer: {
    textAlign: 'center',
    marginTop: '40px',
    padding: '20px',
    color: '#64748B',
    fontSize: '0.9rem',
    borderTop: '1px solid #E2E8F0'
  },
  footerText: {
    marginBottom: '8px'
  },
  footerSubtext: {
    fontSize: '0.85rem',
    color: '#94A3B8'
  }
};

export default App;