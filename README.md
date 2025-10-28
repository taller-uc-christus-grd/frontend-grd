# UC Christus – GRD (Frontend)
Base del MVP para Sprint 2 con React + Vite + TypeScript + Tailwind.

## Setup rápido
1) Crea `.env` copiando desde `.env.example`.
2) `npm install`
3) `npm run dev`

## Rutas y roles
- `/` Landing (pública)
- `/login` Login
- `/dashboard` Autenticado
- `/carga` (codificador, admin)
- `/episodios` y `/episodios/:id`
- `/respaldos/:episodio`
- `/exportaciones` (finanzas, gestion)
- `/admin` (admin)

## Deploy en Netlify

### Configuración
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Credenciales de prueba
- Admin: `admin@ucchristus.cl` / cualquier contraseña
- Codificador: `codificador@ucchristus.cl` / cualquier contraseña
- Finanzas: `finanzas@ucchristus.cl` / cualquier contraseña
- Gestión: `gestion@ucchristus.cl` / cualquier contraseña
