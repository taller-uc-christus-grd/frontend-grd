// ***********************************************************
// Este archivo es procesado y cargado automáticamente antes
// de los archivos de prueba. Aquí puedes poner comandos globales
// y configuración que quieras que esté disponible para todos
// los tests.
// ***********************************************************

// Importar comandos personalizados si los tienes
// import './commands'

// Alternativamente puedes usar CommonJS syntax:
// require('./commands')

// Ocultar errores de fetch/XHR en la consola durante los tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retornar false previene que Cypress falle el test
  // en caso de errores no controlados
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

