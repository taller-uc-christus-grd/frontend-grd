/**
 * EJEMPLO DE CÓMO LLAMAR A calcularPagoOutlierSuperior CORRECTAMENTE
 * 
 * Busca en tu código donde se llama a calcularPagoOutlierSuperior
 * y reemplaza con este formato.
 */

// ========== ANTES (INCORRECTO) ==========
// ❌ NO USAR:
const pagoOutlier = await calcularPagoOutlierSuperior({
  convenio: episodio.convenio,
  diasEstada: episodio.diasEstada,
  pesoGrd: Number(episodio.pesoGrd),
  precioBase: Number(episodio.precioBaseTramo),
  grdId: episodio.grdId,
  esFueraDeNorma: episodio.grupoEnNorma === false  // ❌ INCORRECTO
});

// ========== DESPUÉS (CORRECTO) ==========
// ✅ USAR ESTE FORMATO:
const pagoOutlier = await calcularPagoOutlierSuperior({
  convenio: episodio.convenio,
  diasEstada: episodio.diasEstada,
  pesoGrd: Number(episodio.pesoGrd),
  precioBase: Number(episodio.precioBaseTramo),
  grdId: episodio.grdId,
  inlierOutlier: episodio.inlierOutlier  // ✅ CORRECTO - debe ser 'Outlier Superior'
});

// ========== EJEMPLO EN CONTEXTO DE ACTUALIZACIÓN DE EPISODIO ==========
// Cuando actualices un episodio y necesites recalcular el pago outlier:

async function actualizarEpisodio(episodioId: number, datos: any) {
  // ... obtener episodio existente ...
  const episodio = await prisma.episodio.findUnique({
    where: { id: episodioId },
    include: { grd: true }
  });

  if (!episodio) {
    throw new Error('Episodio no encontrado');
  }

  // Calcular pago outlier superior si es FNS012 y es outlier superior
  let pagoOutlierSuperior = episodio.pagoOutlierSuperior || 0;
  
  if (episodio.convenio === 'FNS012' && episodio.inlierOutlier === 'Outlier Superior') {
    pagoOutlierSuperior = await calcularPagoOutlierSuperior({
      convenio: episodio.convenio,
      diasEstada: episodio.diasEstada,
      pesoGrd: Number(episodio.pesoGrd),
      precioBase: Number(episodio.precioBaseTramo),
      grdId: episodio.grdId,
      inlierOutlier: episodio.inlierOutlier  // ✅ Usar inlierOutlier
    });
  }

  // Actualizar episodio con el nuevo valor
  const episodioActualizado = await prisma.episodio.update({
    where: { id: episodioId },
    data: {
      ...datos,
      pagoOutlierSuperior: pagoOutlierSuperior,
      // Recalcular montoFinal
      montoFinal: (episodio.valorGrd || 0) + 
                  (episodio.montoAt || 0) + 
                  pagoOutlierSuperior + 
                  (episodio.pagoDemoraRescate || 0)
    }
  });

  return episodioActualizado;
}

