/**
 * Ejemplo de cómo modificar el endpoint PATCH /api/episodios/:id
 * 
 * Este archivo muestra cómo debería verse el router modificado.
 * Busca tu archivo de rutas de episodios (probablemente en routes/episodios.js o similar)
 * y modifícalo según este ejemplo.
 */

// Importar el middleware de permisos
const checkEpisodioPermissions = require('../middleware/episodioPermissions');
// o si estás usando ES modules:
// import checkEpisodioPermissions from '../middleware/episodioPermissions.js';

// Ejemplo de router (Express.js)
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth'); // Tu middleware de autenticación JWT

/**
 * PATCH /api/episodios/:id
 * Actualiza un episodio (campos financieros o de validación según el rol)
 */
router.patch(
  '/:id',
  authenticateToken,           // 1. Verifica JWT y carga req.user
  checkEpisodioPermissions,    // 2. Verifica permisos según campos y rol
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Buscar episodio (búsqueda flexible por episodio o id)
      // Ajusta esto según tu ORM/BD (Prisma, Mongoose, etc.)
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
          error: 'NotFound'
        });
      }

      // Si finanzas está actualizando campos financieros, calcular montoFinal
      if (req.user.role === 'finanzas' || req.user.role === 'admin') {
        // Aplicar actualizaciones parciales
        const updated = await db.episode.update({
          where: { id: episodio.id },
          data: {
            ...updates,
            // Ignorar montoFinal si viene en el request, se calculará después
            montoFinal: undefined
          }
        });

        // Calcular montoFinal automáticamente
        const montoFinal = (updated.valorGRD || 0) +
                          (updated.montoAT || 0) +
                          (updated.pagoOutlierSup || 0) +
                          (updated.pagoDemora || 0);

        // Actualizar montoFinal
        const final = await db.episode.update({
          where: { id: episodio.id },
          data: { montoFinal }
        });

        return res.json(final);
      }

      // Si gestión está actualizando campos de validación
      if (req.user.role === 'gestion' || req.user.role === 'admin') {
        const updated = await db.episode.update({
          where: { id: episodio.id },
          data: updates
        });

        return res.json(updated);
      }

      // Este caso no debería llegar aquí por el middleware, pero por seguridad:
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
        error: 'Forbidden'
      });

    } catch (error) {
      console.error('Error actualizando episodio:', error);
      return res.status(500).json({
        message: 'Error del servidor. Por favor, intenta nuevamente más tarde.',
        error: 'InternalServerError'
      });
    }
  }
);

module.exports = router;

