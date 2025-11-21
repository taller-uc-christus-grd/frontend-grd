# Configuración de API y Autenticación

Este documento describe cómo está configurado el frontend para conectarse al backend con PostgreSQL.

## 📋 Archivos de Configuración

### 1. Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

**Nota:** Este archivo está en `.gitignore` y no se sube a Git.

### 2. Configuración de API (`src/lib/api.ts`)

El archivo `src/lib/api.ts` configura axios con:

- ✅ URL base desde `VITE_API_URL` del `.env`
- ✅ `withCredentials: true` para cookies
- ✅ Interceptor que agrega automáticamente el token JWT en `Authorization: Bearer <token>`
- ✅ Manejo automático de errores 401 (redirige a login)
- ✅ Manejo de errores de conexión y CORS

## 🔐 Autenticación

### Hook `useAuth`

El hook `useAuth` proporciona funciones para autenticación:

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, login, logout, getCurrentUser } = useAuth();
  
  // Login
  const handleLogin = async () => {
    try {
      const role = await login('usuario@example.com', 'password123');
      console.log('Rol del usuario:', role);
    } catch (error) {
      console.error('Error al iniciar sesión:', error.message);
    }
  };
  
  // Obtener usuario actual desde el backend
  const handleGetUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      console.log('Usuario actual:', currentUser);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
  
  // Logout
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div>
      {user ? (
        <p>Usuario: {user.email} ({user.role})</p>
      ) : (
        <p>No autenticado</p>
      )}
    </div>
  );
}
```

### Servicio de Autenticación (`src/services/authService.ts`)

Funciones directas sin hooks:

```tsx
import { login, getCurrentUser, logout } from '@/services/authService';

// Login
const role = await login({ email: 'user@example.com', password: 'pass123' });

// Obtener usuario actual
const user = await getCurrentUser();

// Logout
await logout();
```

## 🌐 Peticiones Autenticadas

### Helpers de API (`src/services/apiHelpers.ts`)

Funciones helper para realizar peticiones autenticadas:

```tsx
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, uploadFile } from '@/services/apiHelpers';
import type { Episode } from '@/types';

// GET - Obtener datos
const episodios = await apiGet<Episode[]>('/api/episodios');
const episodio = await apiGet<Episode>(`/api/episodios/${id}`);

// POST - Crear recurso
const nuevoEpisodio = await apiPost<Episode>('/api/episodios', {
  episodio: '12345',
  rut: '12345678-9',
  nombre: 'Juan Pérez',
});

// PUT - Actualizar recurso completo
const episodioActualizado = await apiPut<Episode>(`/api/episodios/${id}`, {
  ...datosCompletos,
});

// PATCH - Actualizar recurso parcial
const episodioParcial = await apiPatch<Episode>(`/api/episodios/${id}`, {
  validado: true,
  estadoRN: 'Aprobado',
});

// DELETE - Eliminar recurso
await apiDelete(`/api/episodios/${id}`);

// Upload de archivo
const result = await uploadFile('/api/upload', file, {
  tipo: 'episodios',
  centro: 'Hospital1',
});
```

### Uso Directo de Axios

También puedes usar `api` directamente (ya está configurado con tokens):

```tsx
import api from '@/lib/api';

// El token se agrega automáticamente
const response = await api.get('/api/episodios');
const episodios = response.data;
```

## 📝 Endpoints del Backend

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
  - Body: `{ email: string, password: string }`
  - Response: `{ user: User, token?: string }`

- `GET /api/auth/me` - Obtener usuario actual
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user: User }` o `User`

- `POST /api/auth/logout` - Cerrar sesión (opcional)
  - Headers: `Authorization: Bearer <token>`

### Otros Endpoints

Todos los endpoints bajo `/api/*` requieren autenticación mediante el header:
```
Authorization: Bearer <token>
```

El token se agrega automáticamente por el interceptor de axios si el usuario está autenticado.

## 🔄 Flujo de Autenticación

1. **Usuario inicia sesión:**
   ```tsx
   const role = await login(email, password);
   // El token se guarda en localStorage como 'grd_user'
   // Se agrega automáticamente a todas las peticiones
   ```

2. **Al cargar la aplicación:**
   - Se verifica si hay un usuario en `localStorage`
   - Si existe, se restaura el token en los headers de axios
   - El usuario queda autenticado

3. **En cada petición:**
   - El interceptor de axios agrega `Authorization: Bearer <token>`
   - Si el token es inválido (401), se limpia la sesión y redirige a login

4. **Cerrar sesión:**
   ```tsx
   await logout();
   // Limpia localStorage y redirige a /login
   ```

## ⚠️ Manejo de Errores

### Errores Automáticos

- **401 (No autorizado):** Se limpia la sesión y redirige a `/login`
- **Error de red/CORS:** Se muestra mensaje descriptivo en consola
- **Timeout:** Se muestra mensaje de timeout

### Ejemplo de Manejo Manual

```tsx
try {
  const episodios = await apiGet<Episode[]>('/api/episodios');
} catch (error: any) {
  if (error.response?.status === 401) {
    // Ya manejado automáticamente, pero puedes hacer algo extra
    console.log('Sesión expirada');
  } else if (error.response?.status === 403) {
    console.log('No tienes permiso para esta acción');
  } else if (error.response?.status === 404) {
    console.log('Recurso no encontrado');
  } else {
    console.error('Error:', error.message);
  }
}
```

## 📚 Ejemplos Completos

Ver el archivo `src/examples/ApiUsageExample.tsx` para ejemplos completos de uso.

## ✅ Verificación

Para verificar que todo está funcionando:

1. **Verifica el `.env`:**
   ```bash
   cat .env
   # Debe mostrar: VITE_API_URL=http://localhost:3000
   ```

2. **Inicia el frontend:**
   ```bash
   npm run dev
   ```

3. **Abre la consola del navegador (F12):**
   - Deberías ver: `🔍 API Base URL: http://localhost:3000`
   - Si no ves esto, verifica que el `.env` exista y reinicia el servidor

4. **Intenta hacer login:**
   - Usa credenciales válidas del backend
   - Verifica que el token se guarde en localStorage

5. **Verifica las peticiones en la pestaña Network:**
   - Todas las peticiones a `/api/*` deben tener el header `Authorization: Bearer <token>`

## 🔧 Solución de Problemas

### Error: "No se pudo conectar al backend"

- ✅ Verifica que el backend esté corriendo en `http://localhost:3000`
- ✅ Verifica que el `.env` tenga `VITE_API_URL=http://localhost:3000`
- ✅ Reinicia el servidor de desarrollo después de crear/modificar el `.env`

### Error: "Sesión expirada" después de login

- ✅ Verifica que el backend devuelva el token correctamente
- ✅ Verifica que el token se guarde en localStorage como `grd_user`
- ✅ Revisa la consola del navegador para ver errores

### Error de CORS

- ✅ Verifica que el backend tenga CORS configurado para `http://localhost:5173`
- ✅ Verifica que el backend use `credentials: true` en CORS
- ✅ El frontend ya está configurado con `withCredentials: true`

### El token no se agrega a las peticiones

- ✅ Verifica que el usuario esté autenticado (ver localStorage)
- ✅ Verifica que `src/lib/api.ts` tenga el interceptor configurado
- ✅ Revisa la consola del navegador para ver logs de debugging

