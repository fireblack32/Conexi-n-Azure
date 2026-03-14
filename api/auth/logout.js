const SESSION_COOKIE = 'session';
const STATE_COOKIE = 'auth_state';

const BASE_URL = 'https://conexi-n-azure.vercel.app';

function getBaseUrl() {
  return BASE_URL;
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl = getBaseUrl();
  const appOrigin = baseUrl.replace(/\/$/, '');

  const clearSession = SESSION_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  const clearState = STATE_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  res.setHeader('Set-Cookie', [clearSession, clearState]);
  res.redirect(302, appOrigin + '/');
};
