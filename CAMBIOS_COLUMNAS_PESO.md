# Cambios: Columnas PESO en la Planilla de Episodios

## 📋 Resumen de Cambios

Se han realizado los siguientes cambios en el frontend:

### 1. Cambio de Nombre de Columna
- **Antes**: Columna mostrada como `"PESO"`
- **Ahora**: Columna mostrada como `"PESO MEDIO"`
- **Mapeo interno**: Sigue siendo el campo `peso` (no editable)
- **Columna del archivo maestro**: `"Peso Medio [Norma IR]"` (sin cambios)

### 2. Nueva Columna Agregada
- **Nombre mostrado**: `"PESO GRD"`
- **Campo interno**: `pesoGrd` (solo lectura, no editable)
- **Columna del archivo maestro**: `"Peso GRD Medio (Todos)"` (requerida)

## 📁 Archivos Modificados

### 1. `src/types.ts`
- ✅ Agregado campo `pesoGrd?: number` a la interfaz `Episode`
- ✅ Agregado campo `pesoGrd: number | null` a la interfaz `FinalRow`

### 2. `src/lib/planillaConfig.ts`
- ✅ Cambiado `['PESO', 'peso', false]` → `['PESO MEDIO', 'peso', false]`
- ✅ Agregado `['PESO GRD', 'pesoGrd', false]` después de "PESO MEDIO"

### 3. `src/lib/precheck.ts`
- ✅ Agregado `'Peso GRD Medio (Todos)'` a `REQUIRED_HEADERS`
- ✅ Agregado `'Peso GRD Medio (Todos)'` a `NUMERIC_HEADERS` (para validación numérica)
- ✅ Agregada validación numérica para `'Peso GRD Medio (Todos)'` en `validateRows()`

### 4. `src/pages/Carga.tsx`
- ✅ Agregado `'Peso GRD Medio (Todos)'` a `NUMERIC_HEADERS`
- ✅ Actualizada lista de columnas requeridas en la UI para incluir "Peso GRD Medio (Todos)"

### 5. `src/pages/Episodios.tsx`
- ✅ Agregado caso `'pesoGrd'` en `renderCellValue()` para mostrar el valor formateado

### 6. `src/pages/EpisodioDetalle.tsx`
- ✅ Cambiado label "Peso" → "Peso Medio"
- ✅ Agregado campo "Peso GRD" con `episodio.pesoGrd?.toFixed(2)`

### 7. `src/pages/Planilla.tsx`
- ✅ Cambiado label "Peso" → "Peso Medio"
- ✅ Agregado campo "Peso GRD" mostrando `ep.pesoGrd`

## 🔄 Mapeo de Columnas

### Archivo Maestro → Frontend

| Columna en Archivo Maestro | Campo en Frontend | Header en Planilla | Editable |
|---------------------------|-------------------|-------------------|----------|
| `"Peso Medio [Norma IR]"` | `peso` | `"PESO MEDIO"` | ❌ No |
| `"Peso GRD Medio (Todos)"` | `pesoGrd` | `"PESO GRD"` | ❌ No |

## ⚠️ Notas Importantes

### Frontend
- ✅ Todas las columnas están configuradas como **no editables** (solo lectura)
- ✅ Ambas columnas son **requeridas** en el archivo maestro
- ✅ Ambas columnas son **validadas como numéricas** durante la pre-validación

### Backend (Acción Requerida)
El backend necesita actualizarse para:

1. **Agregar el campo `pesoGrd` al modelo de datos**:
   - En el schema de Prisma (si usa Prisma)
   - En el modelo de base de datos

2. **Mapear la columna del archivo maestro**:
   - Cuando se importa el archivo maestro, mapear `"Peso GRD Medio (Todos)"` al campo `pesoGrd`

3. **Incluir el campo en las respuestas de la API**:
   - Asegurar que `pesoGrd` se incluya cuando se devuelven episodios
   - El campo puede ser `number` o `null` si no está disponible

4. **Migración de base de datos**:
   - Crear una migración para agregar la columna `pesoGrd` a la tabla de episodios

## ✅ Verificación

Para verificar que todo funciona:

1. **Carga de archivo maestro**:
   - El archivo debe tener la columna `"Peso GRD Medio (Todos)"`
   - La pre-validación debe validar que sea numérica

2. **Planilla de episodios**:
   - Debe mostrar dos columnas: `"PESO MEDIO"` y `"PESO GRD"`
   - Ambas deben ser de solo lectura

3. **Detalle de episodio**:
   - Debe mostrar ambos valores: "Peso Medio" y "Peso GRD"

## 📝 Ejemplo de Archivo Maestro

El archivo maestro debe incluir estas columnas:

```
| Episodio CMBD | ... | Peso Medio [Norma IR] | Peso GRD Medio (Todos) | Estancia real del episodio | ... |
|---------------|-----|------------------------|------------------------|----------------------------|-----|
| EP001         | ... | 1.25                   | 1.30                   | 5                          | ... |
| EP002         | ... | 0.80                   | 0.85                   | 3                          | ... |
```

## 🔗 Archivos Relacionados

- `src/types.ts` - Definiciones de tipos
- `src/lib/planillaConfig.ts` - Configuración de columnas de la planilla
- `src/lib/precheck.ts` - Validación de archivos maestro
- `src/pages/Carga.tsx` - Página de carga de archivos
- `src/pages/Episodios.tsx` - Lista de episodios
- `src/pages/EpisodioDetalle.tsx` - Detalle de episodio
- `src/pages/Planilla.tsx` - Vista de planilla

