# Instrucciones para Verificar qué Devuelve el Backend

## Problema
El `atDetalle` desaparece al recargar, aunque el backend dice que ya lo está devolviendo.

## Cómo Verificar

### Opción 1: Pestaña Network del Navegador (MÁS DIRECTA)

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **"Network"** (Red)
3. Recarga la página o haz clic en "Recargar Episodios"
4. Busca la petición a `/api/episodios/final`
5. Haz clic en esa petición
6. Ve a la pestaña **"Response"** (Respuesta) o **"Preview"** (Vista previa)
7. Busca en el JSON devuelto si hay un campo `atDetalle` (o `at_detalle`, `atDetalle`, etc.)
8. **Toma una captura de pantalla** de la respuesta completa o copia el JSON

### Opción 2: Consola del Navegador

1. Abre la consola (F12 → Console)
2. Recarga la página
3. Busca el log: `🔍 RESPUESTA DEL BACKEND - Primer episodio RAW (COMPLETO):`
4. Expande ese objeto para ver TODAS las propiedades
5. Verifica si `atDetalle` está en `todasLasKeys`
6. Revisa qué muestra `objetoCompleto`

## Qué Buscar

- ¿Aparece `atDetalle` en la respuesta del backend?
- Si aparece, ¿con qué nombre exacto? (puede ser `atDetalle`, `at_detalle`, `atDetalle`, etc.)
- ¿Cuál es el valor que tiene?
- ¿Está `null`, `undefined`, o tiene un valor?

## Si el Backend NO está Devolviendo `atDetalle`

Comparte con el backend el documento `PROMPT_BACKEND_DEVOLVER_AT_DETALLE.md`

## Si el Backend SÍ está Devolviendo `atDetalle` pero con Otro Nombre

Dime exactamente qué nombre tiene el campo y lo ajusto en el frontend para mapearlo correctamente.

