# 🎯 Prompt para el Backend - Revisión del Endpoint PATCH

## Problema Reportado

El frontend está enviando correctamente requests `PATCH /api/episodios/:id` pero el backend responde con **404 Not Found**.

## Acción Requerida

Revisa y corrige el endpoint `PATCH /api/episodios/:id` según las especificaciones en `ESPECIFICACION_BACKEND_FINANZAS.md` y el resumen en `RESUMEN_PROBLEMA_BACKEND.md`.

## Puntos Críticos a Verificar

### 1. **Ruta del Endpoint**
- ✅ Debe ser: `PATCH /api/episodios/:id` (en español, no `/api/episodes`)
- ✅ Verificar que el router esté registrado correctamente

### 2. **Búsqueda del Episodio**
**PROBLEMA CRÍTICO**: El backend puede estar buscando el episodio en el campo incorrecto.

El frontend envía el ID `1022626645` en la URL, pero el backend puede estar buscando:
- ❌ Por un campo `id` interno cuando debería buscar por `episodio`
- ❌ Por `episodio` cuando debería buscar por `id`
- ❌ El formato del ID no coincide (string vs número)

**Solución sugerida**: Implementar búsqueda flexible que intente ambos campos:
```javascript
// Buscar primero por episodio (CMBD), luego por id interno
const episodio = await db.episode.findFirst({
  where: {
    OR: [
      { episodio: req.params.id },
      { id: isNaN(Number(req.params.id)) ? undefined : Number(req.params.id) }
    ].filter(Boolean)
  }
});

if (!episodio) {
  return res.status(404).json({
    message: `El episodio ${req.params.id} no fue encontrado`,
    error: "NotFound"
  });
}
```

### 3. **Validación de Autenticación y Rol**
- ✅ Verificar token JWT
- ✅ Verificar que el usuario tenga rol `finanzas`
- ✅ Retornar 401 si no está autenticado
- ✅ Retornar 403 si no tiene permisos

### 4. **Actualización Parcial**
- ✅ El request viene con solo el campo editado (ej: `{ "montoAT": 4580 }`)
- ✅ Hacer UPDATE parcial (merge), no reemplazar todo el objeto
- ✅ Aplicar validaciones de tipo y rango

### 5. **Cálculo de `montoFinal`**
- ✅ **SIEMPRE** calcular `montoFinal = valorGRD + montoAT + pagoOutlierSup + pagoDemora`
- ✅ **IGNORAR** cualquier valor de `montoFinal` que venga en el request
- ✅ Tratar `null` o `undefined` como `0` en el cálculo

### 6. **Response**
- ✅ Devolver el episodio **completo** actualizado
- ✅ Incluir todos los campos calculados
- ✅ Status 200 OK en caso de éxito

## Ejemplo de Código Esperado

```javascript
router.patch('/api/episodios/:id', authenticateToken, checkRole(['finanzas']), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Buscar episodio (flexible)
    const episodio = await db.episode.findFirst({
      where: {
        OR: [
          { episodio: id },
          { id: isNaN(Number(id)) ? undefined : Number(id) }
        ].filter(Boolean)
      }
    });
    
    if (!episodio) {
      return res.status(404).json({
        message: `El episodio ${id} no fue encontrado`,
        error: "NotFound"
      });
    }
    
    // Validar campos
    // ... validaciones aquí ...
    
    // Actualizar campos (merge)
    const updated = await db.episode.update({
      where: { id: episodio.id },
      data: {
        ...updates,
        // IGNORAR montoFinal si viene, siempre calcularlo
        montoFinal: undefined // Se calculará después
      }
    });
    
    // Calcular montoFinal
    const montoFinal = (updated.valorGRD || 0) + 
                      (updated.montoAT || 0) + 
                      (updated.pagoOutlierSup || 0) + 
                      (updated.pagoDemora || 0);
    
    // Actualizar montoFinal
    const final = await db.episode.update({
      where: { id: episodio.id },
      data: { montoFinal }
    });
    
    // Devolver episodio completo
    res.json(final);
    
  } catch (error) {
    console.error('Error actualizando episodio:', error);
    res.status(500).json({
      message: "Error del servidor. Por favor, intenta nuevamente más tarde.",
      error: "InternalServerError"
    });
  }
});
```

## Testing

Prueba estos casos:
1. `PATCH /api/episodios/1022626645` con `{ "montoAT": 4580 }` → Debe funcionar
2. `PATCH /api/episodios/999999999` → Debe retornar 404
3. Verificar que el episodio se actualiza correctamente en la BD
4. Verificar que `montoFinal` se recalcula automáticamente

## Logs de Debug

Agrega logs temporales para verificar:
```javascript
console.log('🔍 Buscando episodio con ID:', id);
console.log('🔍 Episodio encontrado:', episodio);
console.log('📦 Updates recibidos:', updates);
console.log('✅ Episodio actualizado:', final);
```

## Referencias

- Especificación completa: `ESPECIFICACION_BACKEND_FINANZAS.md`
- Resumen del problema: `RESUMEN_PROBLEMA_BACKEND.md`

---

**Por favor, revisa estos puntos y corrige el endpoint. El problema más probable es que el backend está buscando el episodio por un campo diferente al que el frontend está enviando.**

