# ConectaGRD – Sistema de Gestión GRD

Sistema integral de gestión GRD que automatiza y simplifica los procesos de codificación, validación y facturación para equipos de salud de UC Christus.

## 🚀 Setup rápido
1) Crea `.env` copiando desde `.env.example`.
2) `npm install`
3) `npm run dev`

## 🔐 Credenciales de Prueba

El sistema utiliza autenticación mock para desarrollo. **La contraseña no se valida**, solo importa el email:

### 👨‍💻 Codificador GRD
- **Email**: `codificador@ucchristus.cl`
- **Contraseña**: `cualquier_contraseña`
- **Acceso**: Panel de codificación, carga de datos, validaciones

### 💰 Finanzas / Ciclo de Ingresos
- **Email**: `finanzas@ucchristus.cl`
- **Contraseña**: `cualquier_contraseña`
- **Acceso**: Validación GRD, exportaciones, indicadores financieros

### 📊 Coordinación / Gestión
- **Email**: `gestion@ucchristus.cl`
- **Contraseña**: `cualquier_contraseña`
- **Acceso**: Supervisión, reportes, análisis de eficiencia

### ⚙️ Administrador del Sistema
- **Email**: `admin@ucchristus.cl`
- **Contraseña**: `cualquier_contraseña`
- **Acceso**: Configuración, permisos, mantenimiento

## 🛣️ Rutas y Redirección Automática

### Rutas Públicas
- `/` - Landing page
- `/login` - Formulario de autenticación

### Rutas por Rol (Redirección Automática)
- `/codificador` - Panel Codificador GRD
- `/finanzas` - Panel Finanzas / Ciclo de Ingresos
- `/gestion` - Panel Coordinación / Gestión
- `/admin` - Panel Administrador

### Rutas Funcionales
- `/dashboard` - Dashboard general
- `/carga` - Carga de datos (codificador, admin)
- `/episodios` - Gestión de episodios
- `/episodios/:id` - Detalle de episodio
- `/respaldos/:episodio` - Respaldos por episodio
- `/exportaciones` - Exportaciones (finanzas, gestión)

## 🎯 Características Implementadas

### ✅ Redirección según Rol
- Detección automática del rol desde el email
- Redirección inmediata al panel correspondiente
- Rutas protegidas y condicionales por rol
- Mantenimiento de sesión activa hasta logout

### ✅ Interfaz por Perfil
- Paneles específicos para cada rol
- Funcionalidades adaptadas a cada perfil
- Indicador visual del rol actual
- Navegación contextual

### ✅ Sistema de Autenticación
- Autenticación mock para desarrollo
- Persistencia de sesión en localStorage
- Protección de rutas por rol
- Logout seguro

## 🏗️ Arquitectura

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Context API
- **Authentication**: Mock system con localStorage