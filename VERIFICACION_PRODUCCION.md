# Verificación de Configuración en Producción

## 🔍 Verificar Frontend (Netlify)

### 1. Variable de Entorno VITE_API_URL

En Netlify, ve a:
- **Site settings** → **Environment variables** → **Build environment variables**

Debe existir:
- **Key**: `VITE_API_URL`
- **Value**: `https://backend-grd-production.up.railway.app`

**⚠️ IMPORTANTE**: Después de agregar/modificar esta variable, debes hacer un **nuevo deploy**.

### 2. Verificar en el Navegador

1. Abre tu sitio en Netlify
2. Abre la consola del navegador (F12)
3. Deberías ver en la consola:
   ```
   🔍 API Base URL: https://backend-grd-production.up.railway.app
   🔍 VITE_API_URL env: https://backend-grd-production.up.railway.app
   ```

Si ves `http://localhost:3000`, significa que la variable de entorno no está configurada o no se hizo un nuevo deploy después de agregarla.

## 🔍 Verificar Backend (Railway)

### 1. Variable de Entorno CORS_ORIGIN

En Railway, ve a:
- Tu proyecto → **Variables**

Debe existir:
- **Key**: `CORS_ORIGIN`
- **Value**: `https://tu-frontend.netlify.app` (reemplaza con tu URL real de Netlify)

**Ejemplo**:
```
CORS_ORIGIN=https://tu-app.netlify.app,http://localhost:5173
```

### 2. Otras Variables Requeridas en Railway

- `DATABASE_URL`: URL de tu base de datos PostgreSQL
- `JWT_SECRET`: Secreto para firmar los tokens JWT
- `PORT`: Puerto (Railway lo maneja automáticamente, pero puedes configurarlo)
- `NODE_ENV`: `production` (opcional, Railway lo puede configurar automáticamente)

### 3. Verificar que el Backend Esté Funcionando

Prueba el health check:
```bash
curl https://backend-grd-production.up.railway.app/health
```

Deberías obtener:
```json
{
  "ok": true,
  "message": "Servidor GRD activo 🚀",
  "timestamp": "...",
  "service": "backend-grd"
}
```

### 4. Verificar el Endpoint de Login

Prueba el endpoint de login (con credenciales válidas):
```bash
curl -X POST https://backend-grd-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## 🔧 Solución de Problemas

### Error: "No se pudo conectar al backend"

**Causas posibles:**

1. **La variable `VITE_API_URL` no está configurada en Netlify**
   - ✅ Verifica que exista en Build environment variables
   - ✅ Haz un nuevo deploy después de agregarla

2. **El backend no está funcionando en Railway**
   - ✅ Verifica los logs de Railway
   - ✅ Prueba el health check: `curl https://backend-grd-production.up.railway.app/health`

3. **Problema de CORS**
   - ✅ Verifica que `CORS_ORIGIN` en Railway incluya la URL de tu frontend en Netlify
   - ✅ Verifica que la URL no tenga una barra final `/`
   - ✅ Verifica que la URL use `https://` (no `http://`)

4. **La URL del backend es incorrecta**
   - ✅ Verifica que la URL en Railway sea correcta
   - ✅ Verifica que no haya espacios o caracteres extraños

### Error de CORS

Si ves errores de CORS en la consola del navegador:

1. **Verifica `CORS_ORIGIN` en Railway**
   - Debe incluir exactamente la URL de tu frontend
   - Ejemplo: `https://tu-app-123.netlify.app`
   - No incluyas la barra final

2. **Verifica los logs del backend en Railway**
   - Deberías ver: `🌐 CORS configurado para: [ 'https://tu-app.netlify.app' ]`

3. **Prueba con múltiples orígenes** (separados por comas):
   ```
   CORS_ORIGIN=https://tu-app.netlify.app,http://localhost:5173
   ```

## 📝 Checklist de Verificación

### Frontend (Netlify)
- [ ] Variable `VITE_API_URL` configurada
- [ ] Valor: `https://backend-grd-production.up.railway.app`
- [ ] Deploy realizado después de agregar la variable
- [ ] En consola del navegador se ve la URL correcta

### Backend (Railway)
- [ ] Variable `CORS_ORIGIN` configurada
- [ ] Valor incluye la URL de tu frontend en Netlify
- [ ] Variable `DATABASE_URL` configurada
- [ ] Variable `JWT_SECRET` configurada
- [ ] Health check responde correctamente
- [ ] Logs muestran CORS configurado

## 🚀 Pasos para Configurar desde Cero

### 1. Configurar Backend en Railway

1. Ve a tu proyecto en Railway
2. Navega a **Variables**
3. Agrega:
   ```
   CORS_ORIGIN=https://tu-frontend.netlify.app
   DATABASE_URL=tu-url-de-postgresql
   JWT_SECRET=tu-secreto-super-seguro
   ```
4. Guarda los cambios
5. Espera a que Railway haga deploy

### 2. Configurar Frontend en Netlify

1. Ve a tu proyecto en Netlify
2. Navega a **Site settings** → **Environment variables**
3. Haz clic en **Add variable**
4. Agrega:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://backend-grd-production.up.railway.app`
   - **Scopes**: Dejar en blanco (se aplica a todos los deploys)
5. Guarda
6. Ve a **Deploys** y haz clic en **Trigger deploy** → **Deploy site**

### 3. Verificar

1. Abre tu frontend en Netlify
2. Abre la consola del navegador (F12)
3. Intenta hacer login
4. Revisa los logs en la consola para ver qué está pasando

