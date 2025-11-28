# Problema: precioBaseTramo es null porque convenio es undefined

## 🔍 Diagnóstico Realizado

Los logs del frontend confirman que:

**✅ El backend SÍ está devolviendo el campo `precioBaseTramo` en la respuesta:**
```json
{
  "tienePrecioBaseTramo": true,
  "precioBaseTramoValue": null,
  "precioBaseTramoEsNull": true,
  "precioBaseTramoEsUndefined": false
}
```

**❌ PERO el campo `convenio` es `undefined`:**
```json
{
  "convenio": undefined,
  "peso": 0.2245,
  "pesoTipo": "number"
}
```

**El problema:** Sin el `convenio`, el backend **NO PUEDE** calcular el `precioBaseTramo` porque no sabe qué regla aplicar:
- ¿Es FNS012 o FNS026 (con tramos T1/T2/T3 basados en peso GRD)?
- ¿Es FNS019 o CH0041 (precio único)?

## ⚠️ Pregunta Crítica: ¿Cómo se Determina el Convenio?

Esta es la pregunta más importante que debe resolverse. El convenio puede venir de:

### Opción 1: Campo en el Archivo Maestro Original

El archivo maestro que se importa podría tener una columna con el convenio (ej: "Convenio", "Código Convenio", "Aseguradora", etc.).

**Acción requerida:**
1. Revisar el archivo maestro original importado
2. Identificar qué columna contiene el convenio
3. Mapear esa columna al campo `convenio` en el modelo `Episodio` durante la importación

### Opción 2: Relación con el Folio

El convenio podría determinarse desde el `folio` del episodio, si existe una relación entre folio y convenio en otra tabla.

**Acción requerida:**
1. Verificar si existe una tabla que relacione `folio` con `convenio`
2. Hacer un JOIN o lookup durante la importación o al calcular `precioBaseTramo`

### Opción 3: Campo en el Modelo Episodio

El convenio podría ser un campo directo en el modelo `Episodio` que debe ser poblado desde el archivo maestro o desde otra fuente.

**Acción requerida:**
1. Verificar si el modelo `Episodio` tiene un campo `convenio`
2. Si no existe, agregarlo al modelo y crear una migración
3. Poblarlo durante la importación

### Opción 4: Lógica de Negocio

El convenio podría determinarse mediante alguna lógica de negocio basada en otros campos del episodio (ej: centro, tipo de episodio, fecha, etc.).

**Acción requerida:**
1. Definir la lógica de negocio para determinar el convenio
2. Implementarla en el backend durante la importación o al calcular `precioBaseTramo`

## 🔧 Solución Temporal: Validación y Logging

Mientras se resuelve cómo obtener el convenio, el backend debe:

1. **Agregar logging** cuando `convenio` es `undefined` o `null`:
   ```typescript
   if (!convenio || convenio === undefined || convenio === null) {
     console.warn(`⚠️ No se puede calcular precioBaseTramo: convenio es undefined/null para episodio ${episodio.episodio}`);
     console.warn(`   Folio: ${episodio.folio}, Centro: ${episodio.centro}, Tipo: ${episodio.tipoEpisodio}`);
     return null; // precioBaseTramo = null
   }
   ```

2. **Validar** que el convenio existe antes de calcular:
   ```typescript
   async function calcularPrecioBaseTramo(episodio: Episodio): Promise<number | null> {
     const convenio = episodio.convenio;
     
     if (!convenio) {
       console.warn(`⚠️ Episodio ${episodio.episodio} no tiene convenio. No se puede calcular precioBaseTramo.`);
       return null;
     }
     
     // ... resto de la lógica
   }
   ```

## 📋 Checklist para el Backend

- [ ] **CRÍTICO:** Determinar cómo se obtiene el convenio del episodio
  - [ ] ¿Viene en el archivo maestro? (revisar columnas del archivo)
  - [ ] ¿Existe una relación con el folio?
  - [ ] ¿Existe un campo `convenio` en el modelo `Episodio`?
  - [ ] ¿Se determina mediante lógica de negocio?

- [ ] Si el convenio viene en el archivo maestro:
  - [ ] Identificar el nombre exacto de la columna en el archivo
  - [ ] Mapear esa columna al campo `convenio` durante la importación
  - [ ] Asegurar que el campo `convenio` se guarda en la base de datos

- [ ] Si el convenio se determina desde otra fuente:
  - [ ] Implementar la lógica para obtenerlo
  - [ ] Asegurar que se guarda en el modelo `Episodio`
  - [ ] Asegurar que se devuelve en las respuestas `GET /api/episodios/final`

- [ ] Una vez que el convenio esté disponible:
  - [ ] Verificar que la función de cálculo de `precioBaseTramo` lo use correctamente
  - [ ] Verificar que existen datos en `precios_convenios` para los convenios requeridos
  - [ ] Probar el cálculo con datos reales

- [ ] Agregar logging y validación:
  - [ ] Log cuando `convenio` es `undefined` o `null`
  - [ ] Log cuando no se encuentra precio en `precios_convenios`
  - [ ] Validar que el convenio existe antes de calcular

## 🎯 Pasos Inmediatos

1. **Paso 1:** Revisar el archivo maestro original para ver si tiene una columna de convenio
   - ¿Qué columnas tiene el archivo maestro?
   - ¿Hay alguna columna que contenga "convenio", "aseguradora", "contrato", "código", etc.?

2. **Paso 2:** Si el archivo maestro tiene el convenio:
   - Mapearlo durante la importación
   - Guardarlo en el modelo `Episodio`

3. **Paso 3:** Si el archivo maestro NO tiene el convenio:
   - Determinar de dónde viene (relación, lógica, etc.)
   - Implementar la lógica para obtenerlo

4. **Paso 4:** Una vez que el convenio esté disponible:
   - El cálculo de `precioBaseTramo` debería funcionar automáticamente según `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md`

## 📊 Datos Actuales del Episodio

Según los logs del frontend, el episodio tiene:
```json
{
  "episodio": "1020201555",
  "nombre": "ewr",
  "rut": "432",
  "centro": "Clínica San Carlos de Apoquindo",
  "folio": "4421269",
  "tipoEpisodio": "Urgencia Ambulatoria",
  "peso": 0.2245,
  "convenio": undefined  // ⚠️ ESTE ES EL PROBLEMA
}
```

**Pregunta:** ¿Se puede determinar el convenio a partir de alguno de estos campos (centro, folio, tipoEpisodio, etc.)?

## 📄 Documentos de Referencia

- `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md` - Documentación completa del cálculo automático
- `RESUMEN_BACKEND_PRECIO_BASE_TRAMO.md` - Resumen conciso del cálculo automático

