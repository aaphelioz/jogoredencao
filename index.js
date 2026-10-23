'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

const NOT_FOUND_PAGE = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 — Redenção</title>
  <style>
    html, body { height: 100%; }
    body {
      margin: 0;
      display: grid;
      place-items: center;
      background: #04070b;
      color: #7fa8c9;
      font-family: system-ui, sans-serif;
      text-align: center;
    }
    h1 { margin: 0 0 .5rem; font-size: 1.4rem; letter-spacing: .1em; }
    p { margin: 0; color: #6f8396; }
  </style>
</head>
<body>
  <div>
    <h1>404</h1>
    <p>Nada por aqui além da chuva.</p>
  </div>
</body>
</html>
`;

function sendNotFound(response) {
  const body = Buffer.from(NOT_FOUND_PAGE, 'utf8');
  response.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

function resolveRequestPath(requestUrl) {
  let pathname;

  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  } catch {
    return null;
  }

  if (pathname.includes('\0')) {
    return null;
  }

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.resolve(PUBLIC_DIR, `.${pathname}`);

  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return null;
  }

  return filePath;
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      Allow: 'GET, HEAD',
    });
    response.end('Método não permitido');
    return;
  }

  const filePath = resolveRequestPath(request.url || '/');

  if (!filePath) {
    sendNotFound(response);
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendNotFound(response);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'X-Content-Type-Options': 'nosniff',
    });

    if (request.method === 'HEAD') {
      response.end();
      return;
    }

    const stream = fs.createReadStream(filePath);

    stream.on('error', () => {
      if (!response.headersSent) {
        sendNotFound(response);
      } else {
        response.destroy();
      }
    });

    stream.pipe(response);
  });
});

server.listen(PORT, () => {
  console.log(`Redenção disponível em http://localhost:${PORT}`);
});
