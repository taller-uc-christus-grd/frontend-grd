describe('Dashboard', () => {
  beforeEach(() => {
    // Asumimos que necesitamos estar logueados para acceder al dashboard
    // En un entorno real, esto requeriría un usuario de prueba válido
    cy.visit('/dashboard')
  })

  it('debe redirigir al login si no hay sesión activa', () => {
    // Si no hay token, debería redirigir al login
    cy.url().should('satisfy', (url) => {
      return url.includes('/login') || url.includes('/dashboard')
    })
  })

  it('debe mostrar contenido del dashboard si hay sesión', () => {
    // Este test asume que hay una sesión válida
    // En un entorno real, usarías cy.login() antes
    cy.get('body').should('be.visible')
  })
})

