# Instrucciones para el Backend: Agregar Columna Peso GRD

## 📋 Resumen

El frontend necesita que el backend agregue soporte para una nueva columna llamada **"Peso GRD Medio (Todos)"** que viene en el archivo maestro. Esta columna debe mapearse al campo `pesoGrd` y mostrarse como **"PESO GRD"** en la planilla de episodios.

## 🎯 Cambios Requeridos

### 1. Actualizar el Modelo de Datos (Schema de Prisma)

Agregar el campo `pesoGrd` al modelo `Episodio`:

```prisma
model Episodio {
  // ... campos existentes
  peso          Float?  // "Peso Medio [Norma IR]" - ya existe
  pesoGrd       Float?  // "Peso GRD Medio (Todos)" - NUEVO
  // ... resto de campos
}
```

### 2. Crear Migración de Base de Datos

Ejecutar una migración para agregar la columna `pesoGrd` a la tabla de episodios:

```bash
npx prisma migrate dev --name add_peso_grd_column
```

Esto generará una migración similar a:

```sql
ALTER TABLE "Episodio" ADD COLUMN "pesoGrd" DOUBLE PRECISION;
```

### 3. Mapear la Columna del Archivo Maestro

Al procesar la importación del archivo maestro Excel/CSV, mapear la columna `"Peso GRD Medio (Todos)"` al campo `pesoGrd`.

**Ubicación sugerida**: `src/routes/episodios.routes.ts` o en el servicio de importación.

**Ejemplo de mapeo**:

```typescript
// Cuando se procesa el archivo maestro
const mapeoColumnas = {
  'Episodio CMBD': 'episodio',
  'Peso Medio [Norma IR]': 'peso',
  'Peso GRD Medio (Todos)': 'pesoGrd',  // ← NUEVO
  'Estancia real del episodio': 'estanciaReal',
  // ... resto de mapeos
};

// Al procesar cada fila
const episodioData = {
  episodio: row['Episodio CMBD'],
  peso: parseFloat(row['Peso Medio [Norma IR]']) || null,
  pesoGrd: parseFloat(row['Peso GRD Medio (Todos)']) || null,  // ← NUEVO
  estanciaReal: parseFloat(row['Estancia real del episodio']) || null,
  // ... resto de campos
};
```

### 4. Validar que el Campo Sea Numérico

Asegurar que `pesoGrd` sea un número válido o `null`:

```typescript
function parsePesoGrd(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = parseFloat(String(value).trim());
  return isNaN(num) ? null : num;
}

// Usar en el mapeo
pesoGrd: parsePesoGrd(row['Peso GRD Medio (Todos)']),
```

### 5. Incluir el Campo en las Respuestas de la API

Asegurar que `pesoGrd` se incluya en todas las respuestas que devuelven episodios:

**Endpoints afectados**:
- `GET /api/episodios` - Lista de episodios
- `GET /api/episodios/:id` - Detalle de episodio
- `PATCH /api/episodios/:id` - Actualizar episodio (debe devolver `pesoGrd` en la respuesta)
- `POST /api/episodios/import` - Importar archivo maestro

**Ejemplo de respuesta**:

```typescript
// En el endpoint GET /api/episodios/:id
const episodio = await prisma.episodio.findUnique({
  where: { id: episodeId },
  select: {
    // ... otros campos
    peso: true,
    pesoGrd: true,  // ← Asegurar que se incluya
    // ... resto de campos
  }
});

return res.json({
  ...episodio,
  peso: episodio.peso ?? null,
  pesoGrd: episodio.pesoGrd ?? null,  // ← Incluir en respuesta
});
```

### 6. Actualizar el Procesamiento de PATCH (Opcional)

Si el endpoint `PATCH /api/episodios/:id` permite actualizar `pesoGrd` manualmente:

```typescript
// En el handler de PATCH
router.patch('/api/episodios/:id', async (req, res) => {
  const { pesoGrd, ...otrosCampos } = req.body;
  
  // Validar que pesoGrd sea numérico si viene
  if (pesoGrd !== undefined) {
    if (pesoGrd !== null && isNaN(parseFloat(pesoGrd))) {
      return res.status(400).json({ 
        message: 'pesoGrd debe ser un número válido' 
      });
    }
  }
  
  const episodioActualizado = await prisma.episodio.update({
    where: { id: req.params.id },
    data: {
      ...otrosCampos,
      ...(pesoGrd !== undefined && { pesoGrd: pesoGrd ? parseFloat(pesoGrd) : null }),
    },
  });
  
  return res.json(episodioActualizado);
});
```

**Nota**: Si `pesoGrd` es solo lectura (como en el frontend), puedes omitir esta parte y simplemente ignorar si viene en el body del PATCH.

## ✅ Checklist de Verificación

- [ ] Campo `pesoGrd` agregado al schema de Prisma
- [ ] Migración de base de datos creada y ejecutada
- [ ] Columna `"Peso GRD Medio (Todos)"` mapeada durante la importación del archivo maestro
- [ ] Campo `pesoGrd` incluido en respuestas de `GET /api/episodios`
- [ ] Campo `pesoGrd` incluido en respuestas de `GET /api/episodios/:id`
- [ ] Campo `pesoGrd` incluido en respuestas de `PATCH /api/episodios/:id`
- [ ] Validación numérica implementada para `pesoGrd`
- [ ] Prisma Client regenerado (`npx prisma generate`)

## 📝 Ejemplo de Datos

### Archivo Maestro (Excel/CSV)
```
| Episodio CMBD | Peso Medio [Norma IR] | Peso GRD Medio (Todos) | Estancia real del episodio |
|---------------|------------------------|------------------------|----------------------------|
| EP001         | 1.25                   | 1.30                   | 5                          |
| EP002         | 0.80                   | 0.85                   | 3                          |
```

### Respuesta de la API (JSON)
```json
{
  "id": "uuid-123",
  "episodio": "EP001",
  "peso": 1.25,
  "pesoGrd": 1.30,
  "estanciaReal": 5,
  // ... resto de campos
}
```

## 🔗 Referencias del Frontend

- **Tipo TypeScript**: `pesoGrd?: number` en `Episode` interface
- **Tipo TypeScript**: `pesoGrd: number | null` en `FinalRow` interface
- **Header en planilla**: `"PESO GRD"` (solo lectura, no editable)
- **Columna requerida**: `"Peso GRD Medio (Todos)"` en archivo maestro

## ⚠️ Notas Importantes

1. **Campo no editable**: El frontend tiene `pesoGrd` configurado como solo lectura (no editable), por lo que solo viene del archivo maestro.

2. **Valores null**: El campo puede ser `null` si no está disponible en el archivo maestro o si el valor no es numérico.

3. **Validación**: Validar que `pesoGrd` sea numérico antes de guardarlo en la base de datos.

4. **Compatibilidad**: Si ya hay episodios en la base de datos, el campo `pesoGrd` será `null` para esos registros hasta que se reimporten con el archivo maestro actualizado.

5. **No afecta cálculos**: El campo `pesoGrd` es solo informativo. Los cálculos de `valorGRD` siguen usando el campo `peso` (Peso Medio [Norma IR]).

## 📧 Preguntas o Dudas

Si hay dudas sobre la implementación, verificar:
- El frontend espera `pesoGrd` como `number | null` en las respuestas
- La columna del archivo maestro debe llamarse exactamente `"Peso GRD Medio (Todos)"`
- El campo debe ser numérico o null, no string vacío

---

**Prioridad**: Media-Alta  
**Estimación**: 1-2 horas (incluye migración, mapeo e incluir en respuestas)  
**Dependencias**: Ninguna (puede implementarse sin afectar funcionalidad existente)

