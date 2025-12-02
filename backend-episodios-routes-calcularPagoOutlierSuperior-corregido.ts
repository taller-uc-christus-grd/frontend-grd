/**
 * CORRECCIÓN PARA: backend-grd/src/routes/episodios.routes.ts
 * 
 * Reemplazar la función calcularPagoOutlierSuperior completa con esta versión corregida.
 */

/**
 * Calcula el pago por outlier superior (US-11) - SOLO para FNS012
 * 
 * Fórmula:
 * Pago Outlier = (Días post carencia × Peso GRD × Precio Base) / Días percentil 75
 * 
 * Donde:
 * - Período de carencia = Punto corte superior + Percentil 50
 * - Días post carencia = Estancia total - Período de carencia
 * - Días percentil 75 = Grd.percentil75 (o puntoCorteSup como fallback)
 */
async function calcularPagoOutlierSuperior(params: {
  convenio?: string | null;
  diasEstada?: number | null;
  pesoGrd?: number | null;
  precioBase?: number | null;
  grdId?: number | null;
  inlierOutlier?: string | null;  // CORRECCIÓN: Cambiar de esFueraDeNorma a inlierOutlier
}): Promise<number> {
  const { convenio, diasEstada, pesoGrd, precioBase, grdId, inlierOutlier } = params;
  
  const conv = (convenio || '').toString().trim().toUpperCase();
  
  // Solo aplicar para FNS012
  if (conv !== 'FNS012') {
    return 0;
  }
  
  // CORRECCIÓN: Determinar si es outlier superior basándose en inlierOutlier
  const esOutlierSuperior = inlierOutlier === 'Outlier Superior';
  
  console.log(`🔍 calcularPagoOutlierSuperior - Verificando condiciones:`, {
    convenio: conv,
    esFNS012: conv === 'FNS012',
    esOutlierSuperior,
    inlierOutlier,
    diasEstada,
    pesoGrd,
    precioBase,
    grdId
  });
  
  if (!esOutlierSuperior) {
    console.log(`ℹ️ FNS012: No se calcula pago outlier porque inlierOutlier = ${inlierOutlier} (no es "Outlier Superior")`);
    return 0;
  }
  
  try {
    // Obtener datos del GRD
    let puntoCorteSuperior: number | null = null;
    let percentil50: number | null = null;
    let percentil75: number | null = null;
    
    if (grdId) {
      const grd = await prisma.grd.findUnique({ where: { id: grdId } });
      if (grd) {
        if (grd.puntoCorteSup) puntoCorteSuperior = Number(grd.puntoCorteSup);
        // CORRECCIÓN: Obtener percentil50 desde GRD (no desde ConfiguracionSistema primero)
        if (grd.percentil50) percentil50 = Number(grd.percentil50);
        // CORRECCIÓN: Obtener percentil75 desde GRD
        if (grd.percentil75) percentil75 = Number(grd.percentil75);
        
        console.log(`📊 GRD encontrado:`, {
          puntoCorteSup: puntoCorteSuperior,
          percentil50: percentil50,
          percentil75: percentil75,
          puntoCorteInf: grd.puntoCorteInf
        });
      }
    }
    
    // Fallback: Si no hay percentil50 en GRD, intentar desde ConfiguracionSistema
    if (percentil50 === null || percentil50 <= 0) {
      const cfgP50 = await prisma.configuracionSistema.findUnique({
        where: { clave: 'percentil50' }
      });
      if (cfgP50 && cfgP50.valor) {
        percentil50 = parseFloat(cfgP50.valor);
        console.log(`✅ Percentil 50 obtenido de ConfiguracionSistema: ${percentil50}`);
      } else {
        console.warn('⚠️ FNS012: percentil50 no disponible ni en GRD ni en ConfiguracionSistema');
      }
    }
    
    // Fallback: Si no hay percentil75 en GRD, usar puntoCorteSup
    if (percentil75 === null || percentil75 <= 0) {
      if (puntoCorteSuperior && puntoCorteSuperior > 0) {
        percentil75 = puntoCorteSuperior;
        console.log(`ℹ️ Usando puntoCorteSup como percentil75: ${percentil75}`);
      } else {
        // Último fallback: ConfiguracionSistema
        const cfgP75 = await prisma.configuracionSistema.findUnique({
          where: { clave: 'diasPercentil75' }
        });
        if (cfgP75 && cfgP75.valor) {
          percentil75 = parseFloat(cfgP75.valor);
        }
      }
    }
    
    // Si faltan valores críticos, retornar 0
    if (puntoCorteSuperior === null || puntoCorteSuperior <= 0) {
      console.warn('⚠️ FNS012: puntoCorteSuperior no disponible');
      return 0;
    }
    
    if (percentil50 === null || percentil50 <= 0) {
      console.warn('⚠️ FNS012: percentil50 no disponible - no se puede calcular pago outlier');
      return 0;
    }
    
    if (percentil75 === null || percentil75 <= 0) {
      console.warn('⚠️ FNS012: percentil75 no disponible, usando 1');
      percentil75 = 1;
    }
    
    // Validar parámetros
    const dias = typeof diasEstada === 'number' && diasEstada > 0 ? diasEstada : 0;
    const peso = typeof pesoGrd === 'number' && pesoGrd > 0 ? pesoGrd : 0;
    const precio = typeof precioBase === 'number' && precioBase > 0 ? precioBase : 0;
    
    // Si no hay días, peso o precio, retornar 0
    if (dias === 0 || peso === 0 || precio === 0) {
      console.log(`ℹ️ FNS012 Outlier: Retornando 0 (días: ${dias}, peso: ${peso}, precio: ${precio})`);
      return 0;
    }
    
    // Calcular período de carencia
    const periodoCarencia = puntoCorteSuperior + percentil50;
    console.log(`📊 FNS012 Outlier - Período de carencia: ${puntoCorteSuperior} + ${percentil50} = ${periodoCarencia}`);
    
    // Calcular días post carencia
    const diasPostCarencia = Math.max(0, dias - periodoCarencia);
    
    if (diasPostCarencia <= 0) {
      console.log(`ℹ️ FNS012 Outlier: Episodio dentro del período de carencia (${dias} ≤ ${periodoCarencia}). Retornando 0.`);
      return 0;
    }
    
    // Aplicar fórmula: (Días post carencia × Peso GRD × Precio Base) / Días percentil 75
    const pagoOutlier = (diasPostCarencia * peso * precio) / percentil75;
    
    console.log(`✅ FNS012 Outlier: (${diasPostCarencia} × ${peso} × ${precio}) / ${percentil75} = ${pagoOutlier}`);
    
    return pagoOutlier;
  } catch (err) {
    console.error('calcularPagoOutlierSuperior - error:', err);
    return 0;
  }
}

