const crypto = require('crypto');

const SESSION_COOKIE = 'session';

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = header.match(new RegExp('(?:^|;)\\s*' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

function parseSession(cookieValue, secret) {
  if (!cookieValue || !secret) return null;
  try {
    const [b64, sig] = cookieValue.split('.');
    if (!b64 || !sig) return null;
    const data = Buffer.from(b64, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (expected !== sig) return null;
    const payload = JSON.parse(data);
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionSecret = '3a8b26a805bce8d26ba6257a4f93bd7260993a8f86bf1331d0f157f1bd1b37cb';
  if (!sessionSecret) {
    return res.status(500).json({ error: 'SESSION_SECRET no configurado' });
  }

  const cookieValue = getCookie(req, SESSION_COOKIE);
  const session = parseSession(cookieValue, sessionSecret);

  if (!session) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(401).json({ error: 'No autenticado' });
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    user: {
      name: session.name,
      email: session.email,
      sub: session.sub,
    },
  });
};
