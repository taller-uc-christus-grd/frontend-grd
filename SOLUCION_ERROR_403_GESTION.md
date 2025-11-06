# 🔧 Solución al Error 403 en Validación de Episodios (Rol Gestión)

## ❌ Problema Actual

El frontend está recibiendo un error **403 Forbidden** cuando un usuario con rol `gestion` intenta validar un episodio.

**Error en consola:**
```
PATCH https://backend-grd-production.up.railway.app/api/episodios/1022626645 403 (Forbidden)
```

## 🔍 Causa del Problema

El endpoint `PATCH /api/episodios/:id` actualmente solo permite el rol `finanzas`, pero **también debe permitir el rol `gestion`** cuando se están actualizando campos relacionados con la validación de gestión.

## 📋 Campos que Gestión Puede Actualizar

Los usuarios con rol `gestion` deben poder actualizar estos campos:

1. **`validado`** (boolean) - Aprobar o rechazar el episodio
2. **`comentariosGestion`** (string) - Comentarios de la revisión
3. **`fechaRevision`** (string ISO) - Fecha de la revisión
4. **`revisadoPor`** (string) - Email del usuario que revisó

## ✅ Solución en el Backend

### Opción 1: Modificar el Middleware de Permisos (Recomendado)

El middleware de verificación de roles debe permitir **ambos roles** (`finanzas` y `gestion`), pero con permisos diferentes según los campos que se están actualizando:

```javascript
// Middleware de permisos para PATCH /api/episodios/:id
async function checkEpisodioPermissions(req, res, next) {
  const user = req.user; // Usuario autenticado desde JWT
  const updates = req.body;
  
  // Campos que solo finanzas puede editar
  const finanzasOnlyFields = [
    'estadoRN', 'montoRN', 'at', 'atDetalle', 'montoAT',
    'diasDemoraRescate', 'pagoDemora', 'pagoOutlierSup',
    'precioBaseTramo', 'montoFinal', 'valorGRD', 'documentacion'
  ];
  
  // Campos que gestión puede editar
  const gestionFields = [
    'validado', 'comentariosGestion', 'fechaRevision', 'revisadoPor'
  ];
  
  // Verificar qué campos se están intentando actualizar
  const camposSolicitados = Object.keys(updates);
  const tieneCamposFinanzas = camposSolicitados.some(campo => 
    finanzasOnlyFields.includes(campo)
  );
  const tieneCamposGestion = camposSolicitados.some(campo => 
    gestionFields.includes(campo)
  );
  
  // Si intenta editar campos de finanzas, debe tener rol finanzas
  if (tieneCamposFinanzas && user.role !== 'finanzas') {
    return res.status(403).json({
      message: 'No tienes permisos para editar campos financieros. Se requiere rol "finanzas".',
      error: 'Forbidden'
    });
  }
  
  // Si intenta editar campos de gestión, debe tener rol gestion
  if (tieneCamposGestion && user.role !== 'gestion') {
    return res.status(403).json({
      message: 'No tienes permisos para validar episodios. Se requiere rol "gestión".',
      error: 'Forbidden'
    });
  }
  
  // Si intenta editar ambos tipos, debe tener ambos roles (o admin)
  if (tieneCamposFinanzas && tieneCamposGestion) {
    if (!['finanzas', 'gestion', 'admin'].includes(user.role)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción.',
        error: 'Forbidden'
      });
    }
  }
  
  // Si no tiene ningún rol permitido
  if (!['finanzas', 'gestion', 'admin'].includes(user.role)) {
    return res.status(403).json({
      message: 'No tienes permisos para actualizar episodios.',
      error: 'Forbidden'
    });
  }
  
  next();
}

// Uso en el router
router.patch(
  '/api/episodios/:id',
  authenticateToken,      // Verifica JWT
  checkEpisodioPermissions, // Verifica permisos según campos
  async (req, res) => {
    // ... lógica de actualización ...
  }
);
```

### Opción 2: Permitir Ambos Roles en el Middleware Actual (Más Simple)

Si prefieres una solución más simple, modifica el middleware existente para permitir ambos roles:

```javascript
// Middleware actual (probablemente solo permite 'finanzas')
function checkRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'No autorizado',
        error: 'Unauthorized'
      });
    }
    
    // Permitir ambos roles: finanzas y gestion
    if (!roles.includes(req.user.role) && req.user.role !== 'gestion') {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
        error: 'Forbidden'
      });
    }
    
    next();
  };
}

// Uso
router.patch(
  '/api/episodios/:id',
  authenticateToken,
  checkRole(['finanzas', 'gestion']), // ← Agregar 'gestion'
  async (req, res) => {
    // ... lógica ...
  }
);
```

## 📤 Request que Envía el Frontend (Gestión)

Cuando un usuario de gestión valida un episodio, el frontend envía:

```json
{
  "validado": true,
  "comentariosGestion": "Episodio revisado y aprobado",
  "fechaRevision": "2024-01-20T10:30:00.000Z",
  "revisadoPor": "gestion@ucchristus.cl"
}
```

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**URL:**
```
PATCH /api/episodios/1022626645
```

## ✅ Response Esperada (200 OK)

```json
{
  "episodio": "1022626645",
  "validado": true,
  "comentariosGestion": "Episodio revisado y aprobado",
  "fechaRevision": "2024-01-20T10:30:00.000Z",
  "revisadoPor": "gestion@ucchristus.cl",
  // ... resto de campos del episodio ...
}
```

## 🧪 Casos de Prueba

1. ✅ Usuario `gestion` actualiza `validado` → Debe funcionar (200 OK)
2. ✅ Usuario `gestion` actualiza `comentariosGestion` → Debe funcionar (200 OK)
3. ❌ Usuario `gestion` intenta actualizar `montoAT` → 403 Forbidden
4. ✅ Usuario `finanzas` actualiza `montoAT` → Debe funcionar (200 OK)
5. ✅ Usuario `admin` actualiza cualquier campo → Debe funcionar (200 OK)

## 📝 Checklist de Implementación

- [ ] Modificar middleware de permisos para permitir rol `gestion`
- [ ] Verificar que el endpoint acepta campos de gestión (`validado`, `comentariosGestion`, etc.)
- [ ] Verificar que los campos de gestión se persisten correctamente
- [ ] Probar con usuario `gestion` validando un episodio
- [ ] Probar que `gestion` NO puede editar campos financieros
- [ ] Verificar logs del backend para confirmar que funciona

## 🔍 Verificación Rápida

Para verificar rápidamente si el problema está en los permisos, agrega logs temporales:

```javascript
router.patch('/api/episodios/:id', authenticateToken, (req, res, next) => {
  console.log('🔍 Usuario:', req.user.email);
  console.log('🔍 Rol:', req.user.role);
  console.log('🔍 Campos a actualizar:', Object.keys(req.body));
  next();
}, checkRole(['finanzas', 'gestion']), async (req, res) => {
  // ... lógica ...
});
```

Si el log muestra que el rol es `gestion` pero aún así falla, el problema está en el middleware `checkRole`.

---

**Fecha**: 2024-01-XX
**Prioridad**: Alta
**Estado**: Pendiente de corrección en backend

