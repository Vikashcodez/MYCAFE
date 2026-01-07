const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Configure CORS to allow all origins (for local network)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store connected systems in memory
const systems = new Map(); // ip -> { name, lastHeartbeat, createdAt }

// ========== CLIENT ENDPOINTS ==========

// Client heartbeat (automatic every 5 seconds)
app.post('/api/heartbeat', (req, res) => {
  const { ip, timestamp, userAgent } = req.body;
  
  console.log(`📡 Heartbeat from IP: ${ip} at ${new Date().toLocaleTimeString()}`);
  
  if (!ip) {
    return res.status(400).json({ 
      success: false, 
      error: 'IP address is required' 
    });
  }
  
  const now = Date.now();
  
  // Create or update system entry
  if (!systems.has(ip)) {
    systems.set(ip, {
      name: null,
      lastHeartbeat: now,
      createdAt: now,
      userAgent: userAgent || 'Unknown',
      heartbeats: 1
    });
    console.log(`✅ New system registered: ${ip}`);
  } else {
    const system = systems.get(ip);
    system.lastHeartbeat = now;
    system.heartbeats = (system.heartbeats || 0) + 1;
    if (userAgent) system.userAgent = userAgent;
  }
  
  const system = systems.get(ip);
  
  res.json({
    success: true,
    ip: ip,
    hasName: !!system.name,
    assignedName: system.name,
    isActive: true,
    message: 'Heartbeat received successfully',
    timestamp: now,
    totalHeartbeats: system.heartbeats || 1
  });
});

// Client check status
app.get('/api/client/check/:ip', (req, res) => {
  const ip = req.params.ip;
  const now = Date.now();
  
  if (systems.has(ip)) {
    const system = systems.get(ip);
    const isActive = (now - system.lastHeartbeat) < 30000; // 30 seconds
    
    res.json({
      exists: true,
      name: system.name,
      isActive: isActive,
      lastHeartbeat: system.lastHeartbeat,
      lastSeen: new Date(system.lastHeartbeat).toLocaleString(),
      createdAt: system.createdAt,
      userAgent: system.userAgent,
      heartbeats: system.heartbeats || 0
    });
  } else {
    res.json({
      exists: false,
      message: 'System not registered with server',
      suggestion: 'Make sure client app is running on that PC'
    });
  }
});

// ========== ADMIN ENDPOINTS ==========

// Get all systems
app.get('/api/systems', (req, res) => {
  const now = Date.now();
  const activeSystems = [];
  
  systems.forEach((system, ip) => {
    const isActive = (now - system.lastHeartbeat) < 30000; // 30 seconds threshold
    
    activeSystems.push({
      ip: ip,
      name: system.name,
      isActive: isActive,
      lastHeartbeat: system.lastHeartbeat,
      lastSeen: new Date(system.lastHeartbeat).toLocaleTimeString(),
      createdAt: system.createdAt,
      ageSeconds: Math.floor((now - system.createdAt) / 1000),
      userAgent: system.userAgent,
      heartbeats: system.heartbeats || 0
    });
  });
  
  // Sort by last heartbeat (newest first)
  activeSystems.sort((a, b) => b.lastHeartbeat - a.lastHeartbeat);
  
  res.json({
    success: true,
    total: activeSystems.length,
    active: activeSystems.filter(s => s.isActive).length,
    systems: activeSystems,
    timestamp: now
  });
});

// Check specific system
app.get('/api/systems/check/:ip', (req, res) => {
  const ip = req.params.ip;
  const now = Date.now();
  
  if (systems.has(ip)) {
    const system = systems.get(ip);
    const isActive = (now - system.lastHeartbeat) < 30000;
    
    res.json({
      exists: true,
      isActive: isActive,
      name: system.name,
      lastHeartbeat: system.lastHeartbeat,
      lastSeen: new Date(system.lastHeartbeat).toLocaleString(),
      message: isActive ? 
        `✅ System ${ip} is ACTIVE and ready for naming` : 
        `⚠️ System ${ip} is INACTIVE (last seen: ${new Date(system.lastHeartbeat).toLocaleTimeString()})`
    });
  } else {
    res.json({
      exists: false,
      isActive: false,
      message: `❌ System ${ip} not found. Make sure client app is running on that PC.`
    });
  }
});

// Assign/Update system name
app.post('/api/systems/assign', (req, res) => {
  const { ip, name } = req.body;
  
  if (!ip || !ip.trim()) {
    return res.status(400).json({
      success: false,
      error: 'IP address is required'
    });
  }
  
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'System name is required'
    });
  }
  
  const trimmedIp = ip.trim();
  const trimmedName = name.trim();
  
  if (!systems.has(trimmedIp)) {
    return res.status(404).json({
      success: false,
      error: `System ${trimmedIp} not found`,
      suggestion: 'Make sure client app is running and has sent at least one heartbeat'
    });
  }
  
  const system = systems.get(trimmedIp);
  const oldName = system.name;
  const now = Date.now();
  
  // Check if system was active recently (last 5 minutes)
  const isRecentlyActive = (now - system.lastHeartbeat) < 300000; // 5 minutes
  
  if (!isRecentlyActive) {
    return res.status(400).json({
      success: false,
      error: `System ${trimmedIp} is not active`,
      lastSeen: new Date(system.lastHeartbeat).toLocaleString(),
      suggestion: 'Wait for client to send heartbeat or restart client app'
    });
  }
  
  system.name = trimmedName;
  system.lastHeartbeat = now; // Update heartbeat time
  
  console.log(`✅ Name assigned: ${trimmedIp} → "${trimmedName}"`);
  
  res.json({
    success: true,
    ip: trimmedIp,
    name: trimmedName,
    oldName: oldName,
    message: `Name "${trimmedName}" successfully assigned to ${trimmedIp}`,
    timestamp: now,
    lastSeen: new Date(system.lastHeartbeat).toLocaleString()
  });
});

// Remove system
app.delete('/api/systems/:ip', (req, res) => {
  const ip = req.params.ip;
  
  if (systems.has(ip)) {
    const system = systems.get(ip);
    systems.delete(ip);
    console.log(`🗑️ System removed: ${ip} (was: ${system.name || 'unnamed'})`);
    
    res.json({
      success: true,
      message: `System ${ip} removed successfully`,
      removedSystem: {
        ip: ip,
        name: system.name,
        lastSeen: new Date(system.lastHeartbeat).toLocaleString()
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: `System ${ip} not found`
    });
  }
});

// Launch system with selected software
app.post('/api/systems/launch', (req, res) => {
  const { ip, software, systemName } = req.body;
  
  if (!ip || !ip.trim()) {
    return res.status(400).json({
      success: false,
      error: 'IP address is required'
    });
  }
  
  const trimmedIp = ip.trim();
  
  if (!systems.has(trimmedIp)) {
    return res.status(404).json({
      success: false,
      error: `System ${trimmedIp} not found`
    });
  }
  
  const system = systems.get(trimmedIp);
  
  // Store launch configuration
  system.launchConfig = {
    software: software || [],
    launchedAt: Date.now(),
    systemName: systemName || system.name || trimmedIp,
    launched: true
  };
  
  console.log(`🚀 Launch command sent to ${trimmedIp}: ${software?.join(', ')}`);
  
  res.json({
    success: true,
    ip: trimmedIp,
    message: `Launch command sent to ${systemName || trimmedIp}`,
    software: software,
    timestamp: Date.now()
  });
});

// Check launch status for client
app.get('/api/systems/launch-status/:ip', (req, res) => {
  const ip = req.params.ip;
  
  if (systems.has(ip)) {
    const system = systems.get(ip);
    
    if (system.launchConfig && system.launchConfig.launched) {
      res.json({
        success: true,
        launched: true,
        config: system.launchConfig
      });
    } else {
      res.json({
        success: true,
        launched: false,
        message: 'System not launched yet'
      });
    }
  } else {
    res.status(404).json({
      success: false,
      error: `System ${ip} not found`
    });
  }
});

// Acknowledge launch (client confirms it received the launch command)
app.post('/api/systems/launch-acknowledge/:ip', (req, res) => {
  const ip = req.params.ip;
  
  if (systems.has(ip)) {
    const system = systems.get(ip);
    
    if (system.launchConfig) {
      system.launchConfig.acknowledged = true;
      system.launchConfig.acknowledgedAt = Date.now();
    }
    
    console.log(`✅ Launch acknowledged by ${ip}`);
    
    res.json({
      success: true,
      message: 'Launch acknowledged'
    });
  } else {
    res.status(404).json({
      success: false,
      error: `System ${ip} not found`
    });
  }
});

// ========== DEBUG & INFO ENDPOINTS ==========

// Server info endpoint
app.get('/api/info', (req, res) => {
  const now = Date.now();
  const activeCount = Array.from(systems.values()).filter(
    sys => (now - sys.lastHeartbeat) < 30000
  ).length;
  
  res.json({
    server: 'Internet Cafe System Monitor',
    version: '1.0.0',
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    systems: {
      total: systems.size,
      active: activeCount,
      inactive: systems.size - activeCount
    },
    endpoints: [
      'GET  /api/info - Server information',
      'GET  /api/systems - List all systems',
      'GET  /api/systems/check/:ip - Check specific system',
      'POST /api/systems/assign - Assign name to system',
      'POST /api/heartbeat - Client heartbeat',
      'GET  /api/client/check/:ip - Check client status',
      'DELETE /api/systems/:ip - Remove system'
    ]
  });
});

// Debug endpoint - detailed system info
app.get('/api/debug', (req, res) => {
  const now = Date.now();
  const debugData = [];
  
  systems.forEach((system, ip) => {
    const isActive = (now - system.lastHeartbeat) < 30000;
    const lastSeenSeconds = Math.floor((now - system.lastHeartbeat) / 1000);
    
    debugData.push({
      ip: ip,
      name: system.name,
      isActive: isActive,
      lastHeartbeat: system.lastHeartbeat,
      lastSeen: `${lastSeenSeconds} seconds ago`,
      lastSeenTime: new Date(system.lastHeartbeat).toLocaleString(),
      createdAt: system.createdAt,
      age: `${Math.floor((now - system.createdAt) / 1000)} seconds`,
      userAgent: system.userAgent,
      heartbeats: system.heartbeats || 0,
      status: isActive ? 'ACTIVE' : 'INACTIVE'
    });
  });
  
  // Sort by status (active first)
  debugData.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return b.lastHeartbeat - a.lastHeartbeat;
  });
  
  res.json({
    serverTime: new Date().toLocaleString(),
    timestamp: now,
    totalSystems: systems.size,
    activeSystems: debugData.filter(s => s.isActive).length,
    systems: debugData
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working correctly',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString(),
    systemsCount: systems.size,
    endpoints: {
      client: '/api/heartbeat (POST)',
      admin: '/api/systems (GET)',
      assign: '/api/systems/assign (POST)',
      check: '/api/systems/check/:ip (GET)'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    memory: process.memoryUsage(),
    systems: systems.size
  });
});

// ========== ERROR HANDLING ==========

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET  /api/info',
      'GET  /api/systems',
      'POST /api/heartbeat',
      'POST /api/systems/assign'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: Date.now()
  });
});

// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Internet Cafe System Monitor Server
📍 Server running on: http://localhost:${PORT}
📡 Accessible on network: http://[YOUR_IP]:${PORT}
🌐 CORS enabled for all origins

📊 Available Endpoints:
   GET  http://localhost:${PORT}/api/info
   GET  http://localhost:${PORT}/api/systems
   GET  http://localhost:${PORT}/api/systems/check/:ip
   POST http://localhost:${PORT}/api/systems/assign
   POST http://localhost:${PORT}/api/heartbeat
   GET  http://localhost:${PORT}/api/debug

🖥️  Admin Panel: http://localhost:5173
💻 Client App: http://localhost:5174

💡 To find your server IP on network:
   Windows: ipconfig
   Mac/Linux: ifconfig | grep "inet "
  `);
  
  // Log network interfaces
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  console.log('\n🔌 Network Interfaces:');
  Object.keys(interfaces).forEach(iface => {
    interfaces[iface].forEach(address => {
      if (address.family === 'IPv4' && !address.internal) {
        console.log(`   ${iface}: ${address.address} → http://${address.address}:${PORT}`);
      }
    });
  });
});