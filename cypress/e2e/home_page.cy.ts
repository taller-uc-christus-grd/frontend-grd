describe('Página de Inicio (Landing)', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('debe cargar la página de inicio correctamente', () => {
    cy.url().should('include', '/')
    cy.get('body').should('be.visible')
  })

  it('debe tener un enlace o botón para ir al login', () => {
    // Buscar cualquier enlace o botón que lleve al login
    cy.get('body').then(($body) => {
      if ($body.find('a[href*="login"]').length > 0) {
        cy.get('a[href*="login"]').should('be.visible')
      } else if ($body.find('button:contains("Ingresar")').length > 0) {
        cy.contains('button', 'Ingresar').should('be.visible')
      }
    })
  })
})

