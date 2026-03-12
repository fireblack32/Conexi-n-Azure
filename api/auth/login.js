const crypto = require('crypto');

const STATE_COOKIE = 'auth_state';
const STATE_MAX_AGE = 600; // 10 min

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.APP_URL || 'http://localhost:3000';
}

function setStateCookie(res, state) {
  res.setHeader('Set-Cookie', [
    `${STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${STATE_MAX_AGE}`,
  ]);
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const baseUrl = getBaseUrl();
  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (!tenantId || !clientId) {
    return res.status(500).send('Configura AZURE_TENANT_ID y AZURE_CLIENT_ID en Vercel.');
  }

  const state = crypto.randomBytes(16).toString('hex');
  setStateCookie(res, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    response_mode: 'query',
    redirect_uri: redirectUri,
    scope: 'openid user.read',
    state,
  });

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  res.redirect(302, authUrl);
};
