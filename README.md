# Sección de conexión - Azure

Portal de redirección/callback autorizado para conexión con Azure. Incluye los módulos: Contabilidad, Auditorías y Legales. La autenticación se hace con Azure AD (Entra ID) mediante un backend que canjea el código por tokens (flujo Web); no hace falta configurar la app como SPA en Azure.

## Despliegue en Vercel

1. Sube este repositorio a tu cuenta de GitHub/GitLab.
2. En [vercel.com](https://vercel.com) → **Add New** → **Project** → importa el repo.
3. Configura las variables de entorno (Project → Settings → Environment Variables):
   - `AZURE_TENANT_ID` — ID del directorio de Azure AD.
   - `AZURE_CLIENT_ID` — ID de la aplicación en Entra ID.
   - `AZURE_CLIENT_SECRET` — Secreto de la aplicación (solo para tipo "Web").
   - `SESSION_SECRET` — Una cadena aleatoria larga para firmar la sesión (ej: `openssl rand -hex 32`).
   - Opcional: `APP_URL` — URL base de la app (en Vercel suele usarse `VERCEL_URL` automáticamente).
4. En Azure Portal → Entra ID → Registros de aplicaciones → tu app → **Autenticación**:
   - Plataforma **Web** (no SPA).
   - URI de redirección: `https://TU-PROYECTO.vercel.app/api/auth/callback` (sustituye por tu URL de Vercel).
5. Deploy.

## Uso local

Necesitas ejecutar las APIs (p. ej. con `vercel dev`). La variable `APP_URL` debe ser la URL donde sirves el frontend (ej: `http://localhost:3000`). En Azure añade también `http://localhost:3000/api/auth/callback` como URI de redirección si pruebas en local.
