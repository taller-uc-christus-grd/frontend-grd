# Configuración para Conectar Frontend con Backend

## 📋 Archivos a Editar en el Frontend

### 1. Variable de Entorno en Netlify (PRODUCCIÓN)

El frontend está configurado para usar la variable de entorno `VITE_API_URL`. Debes configurarla en el panel de Netlify:

1. Ve a tu proyecto en [Netlify](https://app.netlify.com)
2. Navega a **Site settings** → **Environment variables**
3. Agrega una nueva variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://backend-grd-production.up.railway.app`
4. **Importante**: Después de agregar la variable, debes hacer un nuevo deploy del frontend

### 2. Archivo de Configuración Local (.env)

Para desarrollo local, crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

O usa el archivo `.env.example` como referencia.

### 3. Archivo Principal de API

El archivo `src/lib/api.ts` ya está configurado correctamente para usar la variable de entorno:

```4:4:src/lib/api.ts
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
```

## 🔒 Configuración Requerida en el Backend

Para que el frontend pueda conectarse al backend, el backend **DEBE** configurar CORS correctamente:

### 1. Permitir el Origen del Frontend

El backend debe permitir solicitudes desde el dominio donde está desplegado tu frontend en Netlify. Por ejemplo:

```javascript
// Ejemplo de configuración CORS (Express.js)
const cors = require('cors');

app.use(cors({
  origin: [
    'https://tu-frontend.netlify.app', // URL de tu frontend en producción
    'http://localhost:5173' // Para desarrollo local
  ],
  credentials: true, // IMPORTANTE: el frontend usa withCredentials: true
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Headers Requeridos

El backend debe enviar estos headers en las respuestas:

- `Access-Control-Allow-Origin`: El dominio de tu frontend
- `Access-Control-Allow-Credentials: true` (CRÍTICO porque usas `withCredentials: true`)
- `Access-Control-Allow-Methods`: GET, POST, PUT, PATCH, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization

### 3. Manejar Preflight (OPTIONS)

El backend debe responder correctamente a las peticiones OPTIONS (preflight) que el navegador envía automáticamente.

### 4. Rutas del API

El frontend espera que las rutas del backend sigan este patrón:
- `/api/users`
- `/api/episodes`
- `/api/catalogs`
- etc.

Asegúrate de que tu backend tenga estas rutas disponibles.

## 🧪 Verificar la Conexión

Después de configurar todo:

1. Revisa la consola del navegador (F12) para ver errores de CORS
2. Verifica que las peticiones se están haciendo a la URL correcta
3. Revisa los headers de las respuestas del backend

## 📝 Notas Importantes

- **withCredentials: true**: El frontend está configurado para enviar cookies/credenciales. Esto requiere que el backend permita `credentials: true` en CORS.
- **Variables de entorno**: En Vite, las variables de entorno deben comenzar con `VITE_` para ser accesibles en el código del cliente.
- **Rebuild necesario**: Después de cambiar variables de entorno en Netlify, debes hacer un nuevo deploy.

