/**
 * MEJORA PARA: backend-grd/src/routes/episodios.routes.ts
 * 
 * Mejora en la función calcularPagoDemoraRescate para usar percentil75 desde GRD
 * cuando esté disponible.
 */

/**
 * Calcula el pago por demora de rescate (US-12)
 * 
 * CH0041: diasDemora × montoDiaEspera (desde PrecioConvenio)
 * FNS012/FNS026/FNS019: ((pesoGrd × precioBaseTramo) / diasPercentil75) × diasDemora
 */
async function calcularPagoDemoraRescate(params: {
  convenio?: string | null;
  diasDemora?: number | null;
  pagoDemoraInput?: number | null;
  pesoGrd?: number | null;
  precioBaseTramo?: number | null;
  grdId?: number | null;
  fechaIngreso?: Date | null;
}): Promise<number> {
  const { convenio, diasDemora, pagoDemoraInput, pesoGrd, precioBaseTramo, grdId, fechaIngreso } = params;
  
  const dias = typeof diasDemora === 'number' && diasDemora > 0 ? diasDemora : 0;
  const conv = (convenio || '').toString().trim().toUpperCase();

  if (dias === 0) {
    return (typeof pagoDemoraInput === 'number' && !isNaN(pagoDemoraInput)) ? pagoDemoraInput : 0;
  }

  try {
    // ========== CH0041 ==========
    if (conv === 'CH0041') {
      const montoDia = await obtenerMontoDiaEsperaCH0041(fechaIngreso);
      if (!montoDia || isNaN(montoDia)) {
        console.warn('⚠️ CH0041: No se encontró montoDiaEspera. Usando input o 0.');
        return (typeof pagoDemoraInput === 'number' && !isNaN(pagoDemoraInput)) ? pagoDemoraInput : 0;
      }
      const resultado = dias * montoDia;
      console.log(`✅ CH0041: ${dias} días × ${montoDia} = ${resultado}`);
      return resultado;
    }

    // ========== FNS012 / FNS026 / FNS019 ==========
    if (conv === 'FNS012' || conv === 'FNS026' || conv === 'FNS019') {
      let diasP75: number | null = null;
      
      // MEJORA: Priorizar percentil75 desde GRD si está disponible
      if (grdId) {
        const grd = await prisma.grd.findUnique({ where: { id: grdId } });
        if (grd) {
          // Priorizar percentil75 si está disponible
          if (grd.percentil75) {
            diasP75 = Number(grd.percentil75);
            console.log(`✅ ${conv}: Usando percentil75 desde GRD: ${diasP75}`);
          } else if (grd.puntoCorteSup) {
            diasP75 = Number(grd.puntoCorteSup);
            console.log(`ℹ️ ${conv}: Usando puntoCorteSup como fallback: ${diasP75}`);
          }
        }
      }
      
      // Fallback desde ConfiguracionSistema si es necesario
      if (!diasP75) {
        const cfg = await prisma.configuracionSistema.findUnique({ 
          where: { clave: 'diasPercentil75' } 
        });
        if (cfg && cfg.valor) {
          diasP75 = parseFloat(cfg.valor);
          console.log(`ℹ️ ${conv}: Usando diasPercentil75 desde ConfiguracionSistema: ${diasP75}`);
        }
      }
      
      // Si aún no hay valor, usar 1 para evitar división por cero
      if (!diasP75 || isNaN(diasP75) || diasP75 <= 0) {
        console.warn(`⚠️ ${conv}: diasPercentil75 no disponible, usando 1.`);
        diasP75 = 1;
      }

      const peso = Number(pesoGrd ?? 0);
      const precio = Number(precioBaseTramo ?? 0);
      const factor = (peso * precio) / diasP75;
      const resultado = factor * dias;
      
      console.log(`✅ ${conv}: ((${peso} × ${precio}) / ${diasP75}) × ${dias} = ${resultado}`);
      return resultado;
    }

    // ========== DEFAULT ==========
    return (typeof pagoDemoraInput === 'number' && !isNaN(pagoDemoraInput)) ? pagoDemoraInput : 0;
  } catch (err) {
    console.error('calcularPagoDemoraRescate - error:', err);
    return (typeof pagoDemoraInput === 'number' && !isNaN(pagoDemoraInput)) ? pagoDemoraInput : 0;
  }
}

