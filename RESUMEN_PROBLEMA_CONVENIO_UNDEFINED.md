# Resumen: Problema con precioBaseTramo = null

## 🔍 Diagnóstico Confirmado

Los logs del frontend muestran que:

✅ **El backend SÍ está devolviendo el campo `precioBaseTramo`**
❌ **PERO su valor es `null` porque `convenio` es `undefined`**

```json
{
  "precioBaseTramo": null,
  "convenio": undefined,  // ⚠️ ESTE ES EL PROBLEMA
  "peso": 0.2245
}
```

## ⚠️ Problema Principal

**Sin el `convenio`, el backend NO PUEDE calcular el `precioBaseTramo`** porque no sabe qué regla aplicar:
- ¿FNS012/FNS026 (con tramos T1/T2/T3 basados en peso GRD)?
- ¿FNS019/CH0041 (precio único)?

## 🔧 Solución Requerida

El backend necesita determinar el `convenio` del episodio. Las opciones son:

### Opción 1: El convenio viene en el archivo maestro

El archivo maestro que se envía al backend probablemente tiene **TODAS las columnas** del archivo original (el frontend envía el archivo completo, no solo las columnas requeridas).

**Acción:**
1. Revisar todas las columnas del archivo maestro que se recibe en el backend
2. Buscar columnas que contengan "convenio", "aseguradora", "contrato", "código convenio", etc.
3. Mapear esa columna al campo `convenio` durante la importación

### Opción 2: El convenio se determina desde el folio

Si existe una relación entre `folio` y `convenio` en otra tabla o lógica de negocio.

**Acción:**
1. Implementar la lógica para obtener el convenio desde el folio
2. Guardar el convenio en el modelo `Episodio`

### Opción 3: Agregar el convenio al modelo Episodio

Si el convenio no existe como campo, agregarlo al modelo y poblarlo.

**Acción:**
1. Agregar campo `convenio` al modelo Prisma `Episodio`
2. Crear migración
3. Poblar el campo durante la importación o mediante lógica de negocio

## 📋 Pasos Inmediatos para el Backend

1. **Revisar el archivo maestro** que se recibe en `POST /api/episodios/import`:
   - ¿Qué columnas tiene el archivo completo?
   - ¿Hay alguna columna que contenga el convenio?
   - Loggear todas las columnas disponibles

2. **Verificar el modelo Episodio**:
   - ¿Existe el campo `convenio`?
   - Si no existe, agregarlo y crear migración

3. **Implementar mapeo del convenio** durante la importación:
   - Si viene en el archivo maestro, mapearlo
   - Si se determina desde otra fuente, implementar la lógica

4. **Una vez que el convenio esté disponible**:
   - El cálculo de `precioBaseTramo` debería funcionar automáticamente según `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md`

## 📄 Documentos de Referencia

- `PROBLEMA_PRECIO_BASE_CONVENIO_UNDEFINED.md` - Diagnóstico detallado
- `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md` - Documentación del cálculo automático
- `RESUMEN_BACKEND_PRECIO_BASE_TRAMO.md` - Resumen del cálculo

## 🎯 Próximo Paso

**El backend debe revisar el archivo maestro que recibe** para ver si tiene una columna con el convenio, o determinar de dónde debe venir el convenio.

