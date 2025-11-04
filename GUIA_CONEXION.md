# Guía de Conexión Frontend-Backend

## 🚀 Pasos para Conectar Frontend con Backend en Desarrollo Local

### 1. Configurar el Backend

1. **Asegúrate de tener el archivo `.env` en el backend** (`/Users/mjmillan/Documents/backend-grd/.env`):
   ```env
   DATABASE_URL="postgresql://usuario:password@localhost:5432/grd?schema=public"
   PORT=3000
   JWT_SECRET=dev-secret-key-change-in-production
   CORS_ORIGIN=http://localhost:5173
   ```

2. **Instala las dependencias** (si no lo has hecho):
   ```bash
   cd /Users/mjmillan/Documents/backend-grd
   npm install
   ```

3. **Inicia la base de datos** (si usas PostgreSQL localmente):
   ```bash
   # Asegúrate de que PostgreSQL esté corriendo
   # Luego ejecuta las migraciones:
   npm run prisma:migrate
   ```

4. **Inicia el backend**:
   ```bash
   npm run dev
   ```
   
   Deberías ver:
   ```
   🚀 GRD Backend escuchando en http://localhost:3000
   📡 Health check: http://localhost:3000/health
   🔐 Login endpoint: http://localhost:3000/api/auth/login
   🌐 CORS configurado para: [ 'http://localhost:5173' ]
   ```

### 2. Configurar el Frontend

1. **Asegúrate de tener el archivo `.env` en el frontend** (`/Users/mjmillan/Documents/frontend-grd/.env`):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. **Instala las dependencias** (si no lo has hecho):
   ```bash
   cd /Users/mjmillan/Documents/frontend-grd
   npm install
   ```

3. **Inicia el frontend**:
   ```bash
   npm run dev
   ```

### 3. Verificar la Conexión

1. **Prueba el health check del backend**:
   ```bash
   curl http://localhost:3000/health
   ```
   
   Deberías obtener una respuesta JSON con `"ok": true`

2. **Abre el frontend** en `http://localhost:5173`

3. **Intenta hacer login** - deberías poder conectarte al backend

### 4. Solución de Problemas

#### Error: "No se pudo conectar al backend"
- ✅ Verifica que el backend esté corriendo en el puerto 3000
- ✅ Verifica que el archivo `.env` del frontend tenga `VITE_API_URL=http://localhost:3000`
- ✅ Reinicia el servidor de desarrollo del frontend después de crear/modificar el `.env`

#### Error de CORS
- ✅ Verifica que `CORS_ORIGIN` en el backend incluya `http://localhost:5173`
- ✅ Verifica que el backend esté usando `credentials: true` en CORS

#### Error de base de datos
- ✅ Verifica que PostgreSQL esté corriendo
- ✅ Verifica que la `DATABASE_URL` en el `.env` del backend sea correcta
- ✅ Ejecuta las migraciones: `npm run prisma:migrate`

## 📝 Notas Importantes

- **Los archivos `.env` NO se suben a Git** (están en `.gitignore`)
- **Después de crear/modificar `.env`, reinicia los servidores de desarrollo**
- **El puerto del backend es 3000 por defecto**
- **El puerto del frontend es 5173 por defecto (Vite)**

