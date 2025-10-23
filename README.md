# UC Christus – GRD (Frontend)
Base del MVP para Sprint 2 con React + Vite + TypeScript + Tailwind.

## Setup rápido
1) Crea `.env` copiando desde `.env.example`.
2) `npm install`
3) `npm run dev`
4) `npm install zustand`

## Rutas y roles
- `/` Landing (pública)
- `/login` Login
- `/dashboard` Autenticado
- `/carga` (codificador, admin)
- `/episodios` y `/episodios/:id`
- `/respaldos/:episodio`
- `/exportaciones` (finanzas, gestion)
- `/admin` (admin)

## Endpoints

## Contraparte
- Deberan agregar codigos AT (de no haberlos) para el backend los mapee correctamente al cargar el archivo. El backend deberá implementar esta logica de flexibilidad al agregar nuevos AT (crear una nueva version del mapeo de AT cuando se agregue un At con su codigo y detalles). Algo del estilo

| codigoAT         | descripcion             | precio |
| ---------------- | ----------------------- | ------ |
| BASTON-ADULTO    | Bastón adulto aluminio  | 18000  |
| SILLA-RUEDAS-SIM | Silla de ruedas simple  | 120000 |
| ORTESIS-MUNECA   | Órtesis muñeca estándar | 25000  |

- Sin tildes?
