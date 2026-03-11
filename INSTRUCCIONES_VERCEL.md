# Subir a Git y desplegar en Vercel

## 1. Crear el repositorio en GitHub

1. Entra en [github.com](https://github.com) y inicia sesión.
2. Clic en **+** → **New repository**.
3. Nombre sugerido: `seccion-conexion-azure` (o el que prefieras).
4. Deja **Public** y **no** marques "Add a README" (ya tienes archivos).
5. Clic en **Create repository**.

## 2. Conectar y subir desde tu carpeta

En PowerShell, dentro de la carpeta del proyecto, ejecuta (sustituye `TU_USUARIO` y `NOMBRE_REPO` por los tuyos):

```powershell
git remote add origin https://github.com/TU_USUARIO/NOMBRE_REPO.git
git branch -M main
git push -u origin main
```

Si GitHub te pide autenticación, usa un **Personal Access Token** en lugar de la contraseña (Settings → Developer settings → Personal access tokens).

## 3. Desplegar en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con GitHub si quieres).
2. **Add New** → **Project**.
3. Importa el repositorio que acabas de subir.
4. Clic en **Deploy** (no hace falta cambiar opciones para este proyecto estático).
5. Cuando termine, tendrás una URL como: `https://seccion-conexion-azure.vercel.app`.

## 4. Configurar Azure

En el portal de Azure, en tu aplicación → **Autenticación** → **URI de redirección**, añade:

- `https://TU-PROYECTO.vercel.app`
- o `https://TU-PROYECTO.vercel.app/index.html`

Listo: el portal queda desplegado y usable como callback de Azure.
