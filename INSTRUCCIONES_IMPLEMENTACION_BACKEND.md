# 🔧 Instrucciones para Implementar los Cambios en el Backend

## 📋 Pasos a Seguir

### 1. Crear el Middleware de Permisos

**Ubicación**: `backend-grd/middleware/episodioPermissions.js`

Copia el contenido del archivo `backend-middleware-episodios-permisos.js` que creé en este directorio.

**O crea el archivo directamente** con este contenido:

```javascript
function checkEpisodioPermissions(req, res, next) {
  const user = req.user;
  const updates = req.body;

  const finanzasOnlyFields = [
    'estadoRN', 'montoRN', 'at', 'atDetalle', 'montoAT',
    'diasDemoraRescate', 'pagoDemora', 'pagoOutlierSup',
    'precioBaseTramo', 'montoFinal', 'valorGRD', 'documentacion'
  ];

  const gestionOnlyFields = [
    'validado', 'comentariosGestion', 'fechaRevision', 'revisadoPor'
  ];

  const camposSolicitados = Object.keys(updates);
  const tieneCamposFinanzas = camposSolicitados.some(campo =>
    finanzasOnlyFields.includes(campo)
  );
  const tieneCamposGestion = camposSolicitados.some(campo =>
    gestionOnlyFields.includes(campo)
  );

  if (user.role === 'admin') {
    return next();
  }

  if (tieneCamposFinanzas && user.role !== 'finanzas') {
    return res.status(403).json({
      message: 'No tienes permisos para editar campos financieros. Se requiere rol "finanzas".',
      error: 'Forbidden'
    });
  }

  if (tieneCamposGestion && user.role !== 'gestion') {
    return res.status(403).json({
      message: 'No tienes permisos para validar episodios. Se requiere rol "gestión".',
      error: 'Forbidden'
    });
  }

  if (user.role === 'finanzas' && tieneCamposGestion) {
    return res.status(403).json({
      message: 'No tienes permisos para validar episodios. Solo puedes editar campos financieros.',
      error: 'Forbidden'
    });
  }

  if (user.role === 'gestion' && tieneCamposFinanzas) {
    return res.status(403).json({
      message: 'No tienes permisos para editar campos financieros. Solo puedes validar episodios.',
      error: 'Forbidden'
    });
  }

  if (!['finanzas', 'gestion', 'admin'].includes(user.role)) {
    return res.status(403).json({
      message: 'No tienes permisos para actualizar episodios.',
      error: 'Forbidden'
    });
  }

  next();
}

module.exports = checkEpisodioPermissions;
```

### 2. Modificar el Router de Episodios

**Ubicación**: Probablemente `backend-grd/routes/episodios.js` o similar

**Busca el endpoint PATCH** que probablemente se ve así:

```javascript
router.patch('/:id', authenticateToken, checkRole(['finanzas']), async (req, res) => {
  // ... código existente ...
});
```

**Modifícalo** para:

1. **Importar el nuevo middleware**:
```javascript
const checkEpisodioPermissions = require('../middleware/episodioPermissions');
```

2. **Reemplazar el middleware de rol**:
```javascript
// ANTES:
router.patch('/:id', authenticateToken, checkRole(['finanzas']), async (req, res) => {

// DESPUÉS:
router.patch('/:id', authenticateToken, checkEpisodioPermissions, async (req, res) => {
```

### 3. Verificar que req.user esté disponible

Asegúrate de que tu middleware `authenticateToken` (o como se llame) esté estableciendo `req.user` con la información del usuario autenticado, incluyendo el campo `role`:

```javascript
// Tu middleware de autenticación debería hacer algo así:
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role // ← IMPORTANTE: debe incluir el rol
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
```

### 4. Probar los Cambios

Después de hacer los cambios:

1. **Reinicia el servidor del backend**
2. **Prueba con usuario de gestión**:
   - Intenta validar un episodio (debe funcionar)
   - Intenta editar un campo financiero (debe dar 403)
3. **Prueba con usuario de finanzas**:
   - Intenta editar un campo financiero (debe funcionar)
   - Intenta validar un episodio (debe dar 403)

## 📝 Estructura de Archivos Esperada

```
backend-grd/
├── middleware/
│   ├── auth.js (o authenticateToken.js)
│   └── episodioPermissions.js  ← NUEVO
├── routes/
│   └── episodios.js  ← MODIFICAR
└── ...
```

## 🔍 Si No Funciona

1. **Verifica los logs del backend** para ver qué está pasando
2. **Agrega logs temporales** en el middleware:
```javascript
console.log('🔍 Usuario:', req.user.email);
console.log('🔍 Rol:', req.user.role);
console.log('🔍 Campos a actualizar:', Object.keys(req.body));
```
3. **Verifica que el middleware se esté ejecutando** antes del handler
4. **Verifica que req.user tenga el campo role** correctamente

## ✅ Checklist

- [ ] Archivo `middleware/episodioPermissions.js` creado
- [ ] Middleware importado en el router de episodios
- [ ] Middleware `checkEpisodioPermissions` agregado al endpoint PATCH
- [ ] Middleware `authenticateToken` establece `req.user.role`
- [ ] Servidor reiniciado
- [ ] Probado con usuario de gestión
- [ ] Probado con usuario de finanzas

