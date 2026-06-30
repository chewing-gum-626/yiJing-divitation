const os = require('os');
os.networkInterfaces = () => ({ lo0: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] });
