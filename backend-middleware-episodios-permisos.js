/**
 * Middleware de permisos para el endpoint PATCH /api/episodios/:id
 * 
 * Este middleware valida que:
 * - Gestión solo puede actualizar campos de validación
 * - Finanzas solo puede actualizar campos financieros
 * - Admin puede actualizar todo
 * 
 * Coloca este archivo en: backend-grd/middleware/episodioPermissions.js
 * o en la carpeta donde tengas tus middlewares
 */

/**
 * Middleware para verificar permisos de edición de episodios según el rol
 */
function checkEpisodioPermissions(req, res, next) {
  const user = req.user; // Usuario autenticado desde JWT (debe estar en req.user después de authenticateToken)
  const updates = req.body;

  // Campos que solo finanzas puede editar
  const finanzasOnlyFields = [
    'estadoRN',
    'montoRN',
    'at',
    'atDetalle',
    'montoAT',
    'diasDemoraRescate',
    'pagoDemora',
    'pagoOutlierSup',
    'precioBaseTramo',
    'montoFinal',
    'valorGRD',
    'documentacion'
  ];

  // Campos que solo gestión puede editar
  const gestionOnlyFields = [
    'validado',
    'comentariosGestion',
    'fechaRevision',
    'revisadoPor'
  ];

  // Verificar qué campos se están intentando actualizar
  const camposSolicitados = Object.keys(updates);
  const tieneCamposFinanzas = camposSolicitados.some(campo =>
    finanzasOnlyFields.includes(campo)
  );
  const tieneCamposGestion = camposSolicitados.some(campo =>
    gestionOnlyFields.includes(campo)
  );

  // Admin puede editar todo
  if (user.role === 'admin') {
    return next();
  }

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

  // Si intenta editar campos que no son de su rol
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

  // Verificar que tenga al menos uno de los roles permitidos
  if (!['finanzas', 'gestion', 'admin'].includes(user.role)) {
    return res.status(403).json({
      message: 'No tienes permisos para actualizar episodios.',
      error: 'Forbidden'
    });
  }

  next();
}

module.exports = checkEpisodioPermissions;

