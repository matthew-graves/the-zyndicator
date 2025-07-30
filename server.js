const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const fs      = require('fs');
const path    = require('path');
const { url } = require('inspector');

const app  = express();
const srv  = http.createServer(app);
const host = '0.0.0.0';
const io   = new Server(srv);
const qrcodeTerminal  = require('qrcode-terminal');


app.use(express.static(path.join(__dirname, 'public')));

// ——— In-Memory Cache Setup ———
const codesCache = new Set();
// On startup, preload any existing codes from disk
fs.readFile('codes.txt', 'utf8', (err, data) => {
  if (!err && data) {
    data
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .forEach(code => codesCache.add(code));
    console.log(`Cache loaded: ${codesCache.size} codes.`);
  }
});

// When client sends a code, append to file only if new
io.on('connection', socket => {
  console.log('📱 phone connected');
  socket.on('code', code => {
    code = code.trim();
    if (codesCache.has(code)) {
      socket.emit('status', '⚠️ duplicate: ' + code);
      return;
    }

    // New code: add to cache and write
    codesCache.add(code);
    fs.appendFile('codes.txt', code + '\n', err => {
      if (err) {
        console.error('Failed to write code:', err);
        socket.emit('status', '❌ write error');
      } else {
        console.log('Saved code →', code);
        socket.emit('status', '✅ saved: ' + code);
      }
    });
  });
});


const PORT = process.env.PORT || 3000;

// ngrok url here, https required for camera access on iOS. Too lazy to automate this.
const phoneUrl = `<NGROK URL>`;
qrcodeTerminal.generate(phoneUrl, { small: true });

srv.listen(PORT, host, () => console.log(`Server listening on http://${host}:${PORT}`));
