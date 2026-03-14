const crypto = require('crypto');

const SESSION_COOKIE = 'session';
const STATE_COOKIE = 'auth_state';
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 h

function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.APP_URL || 'http://localhost:3000';
}

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = header.match(new RegExp('(?:^|;)\\s*' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1].trim()) : null;
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload);
  } catch (_) {
    return null;
  }
}

function signSession(payload, secret) {
  const data = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  const value = Buffer.from(data, 'utf8').toString('base64url') + '.' + signature;
  return value;
}

function parseSession(cookieValue, secret) {
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

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error, error_description } = req.query;
  const baseUrl = getBaseUrl();
  const appOrigin = baseUrl.replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (error) {
    const msg = error_description || error;
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent(msg));
    return;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!tenantId || !clientId || !clientSecret || !sessionSecret) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Faltan variables de entorno en el servidor.'));
    return;
  }

  const savedState = getCookie(req, STATE_COOKIE);
  if (!state || state !== savedState) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Estado inválido. Intenta iniciar sesión de nuevo.'));
    return;
  }

  if (!code) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('No se recibió código de autorización.'));
    return;
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let tokenRes;
  try {
    tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Error de conexión con Azure.'));
    return;
  }

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Token exchange failed:', tokenRes.status, errText);
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Error al obtener tokens. Revisa la configuración en Azure (plataforma Web, URI de redirección).'));
    return;
  }

  const tokens = await tokenRes.json();
  const idToken = tokens.id_token;
  if (!idToken) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Azure no devolvió id_token.'));
    return;
  }

  const claims = decodeJwtPayload(idToken);
  if (!claims) {
    res.redirect(302, appOrigin + '/?auth_error=' + encodeURIComponent('Token inválido.'));
    return;
  }

  const sessionPayload = {
    sub: claims.sub,
    name: claims.name || claims.preferred_username || 'Usuario',
    email: claims.preferred_username || claims.email || '',
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const sessionValue = signSession(sessionPayload, sessionSecret);

  const clearState = STATE_COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  const setSession = SESSION_COOKIE + '=' + encodeURIComponent(sessionValue) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + SESSION_MAX_AGE;
  res.setHeader('Set-Cookie', [clearState, setSession]);
  res.redirect(302, appOrigin + '/?auth_ok=1');
  
};
 

