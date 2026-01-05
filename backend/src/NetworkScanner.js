const ping = require('ping');
const os = require('os');

class NetworkScanner {
  constructor() {
    this.networkInterfaces = os.networkInterfaces();
    this.subnet = this.getLocalSubnet();
  }

  getLocalSubnet() {
    for (const interfaceName in this.networkInterfaces) {
      const interfaces = this.networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // Get first 3 octets of IP for subnet
          const ipParts = iface.address.split('.');
          return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.`;
        }
      }
    }
    return '192.168.1.'; // Default fallback
  }

  async scanNetwork(rangeStart = 1, rangeEnd = 50) {
    const activeIPs = [];
    const pingPromises = [];

    for (let i = rangeStart; i <= rangeEnd; i++) {
      const ip = `${this.subnet}${i}`;
      pingPromises.push(
        ping.promise.probe(ip, {
          timeout: 1,
          extra: ['-c', '1']
        }).then(result => {
          if (result.alive) {
            activeIPs.push({
              ip: ip,
              hostname: result.host || ip,
              isOnline: true,
              lastSeen: new Date().toISOString()
            });
          }
          return result;
        })
      );
    }

    await Promise.all(pingPromises);
    return activeIPs;
  }

  getNetworkInfo() {
    const info = [];
    for (const interfaceName in this.networkInterfaces) {
      const interfaces = this.networkInterfaces[interfaceName];
      interfaces.forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          info.push({
            interface: interfaceName,
            ip: iface.address,
            subnet: this.subnet,
            mac: iface.mac
          });
        }
      });
    }
    return info;
  }
}

module.exports = NetworkScanner;