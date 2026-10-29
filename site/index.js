// Static file server for the Mira Road Community Survey site.
// No dependencies - plain Node http/fs.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function send(res, status, body, contentType) {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = path.normalize(path.join(ROOT, urlPath));

  // Guard against path traversal outside the site root.
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, 'Forbidden', 'text/plain');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, '404.html'), (notFoundErr, notFoundPage) => {
        send(res, 404, notFoundErr ? '404 Not Found' : notFoundPage, 'text/html; charset=UTF-8');
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME_TYPES[ext] || 'application/octet-stream');
  });
});

server.listen(PORT, () => {
  console.log(`Mira Road Community Survey site running at http://localhost:${PORT}`);
});
