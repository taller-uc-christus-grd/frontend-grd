/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Comando personalizado para hacer login
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Comando personalizado para hacer logout
       * @example cy.logout()
       */
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login')
  cy.get('input[type="email"]').type(email)
  cy.get('input[type="password"]').type(password)
  cy.get('button[type="submit"]').click()
  // Esperar a que la navegación ocurra
  cy.url().should('not.include', '/login')
})

Cypress.Commands.add('logout', () => {
  // Buscar y hacer clic en el botón de logout si existe
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="logout"]').length > 0) {
      cy.get('[data-testid="logout"]').click()
    } else if ($body.find('button:contains("Cerrar sesión")').length > 0) {
      cy.contains('button', 'Cerrar sesión').click()
    }
  })
})

export {}

