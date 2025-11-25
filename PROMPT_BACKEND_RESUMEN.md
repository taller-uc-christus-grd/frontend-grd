# Prompt Rápido para el Backend

## Mapeo de Columnas de Peso del Archivo Maestro

El frontend necesita que el backend mapee correctamente dos columnas del archivo maestro a los campos en la base de datos:

### Mapeo de Columnas (Archivo Maestro → Campo BD → Header en Planilla):

1. **"Peso Medio [Norma IR]"** (columna en archivo maestro) → campo `peso` (BD) → Header **"PESO MEDIO"** (en planilla)
   - Este mapeo ya debería existir, verificar que funcione correctamente

2. **"Peso GRD Medio (Todos)"** (columna en archivo maestro) → campo `pesoGrd` (BD) → Header **"PESO GRD"** (en planilla)
   - **NUEVO**: Necesita agregarse al backend

### Cambios Requeridos:

1. **Agregar campo al modelo**: Crear campo `pesoGrd Float?` en el modelo Episodio (Prisma)
2. **Crear migración**: Ejecutar migración para agregar columna `pesoGrd` a la BD
3. **Mapear durante importación**: 
   - `"Peso Medio [Norma IR]"` → `peso` (ya existe, verificar)
   - `"Peso GRD Medio (Todos)"` → `pesoGrd` (NUEVO - validar numérico)
4. **Incluir en respuestas API**: Incluir `pesoGrd` en todas las respuestas de episodios:
   - `GET /api/episodios` 
   - `GET /api/episodios/:id`
   - `PATCH /api/episodios/:id`
   - `POST /api/episodios/import`

**Detalles**:
- Ambos campos son solo lectura (no editables desde frontend)
- Tipo: `Float?` (puede ser `null`)
- Validar que sean numéricos antes de guardar
- Nombres exactos de columnas en archivo maestro: `"Peso Medio [Norma IR]"` y `"Peso GRD Medio (Todos)"`

**Checklist**:
- [ ] Schema Prisma actualizado con `pesoGrd Float?`
- [ ] Migración de BD ejecutada
- [ ] Mapeo de columna implementado en importación
- [ ] Campo incluido en todas las respuestas de API de episodios
- [ ] Prisma Client regenerado

Ver documento completo: `PROMPT_BACKEND_COLUMNA_PESO_GRD.md` para ejemplos de código detallados.

