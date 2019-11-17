// Tests to run
context('Tests to run', () => {
  //Browse to homepage before each test
  beforeEach(() => {
    cy.visit('/')
  })
  describe('Init admin', function() {
    it('Create user and verify success', function() {
      cy.get('#username')
      .should('have.value', 'admin')
      cy.get('#password')
      .type('portaineriscool')
      .should('have.value', 'portaineriscool')
      cy.get('#confirm_password')
      .type('portaineriscool')
      .should('have.value', 'portaineriscool')
      cy.get('[type=submit]').click()
      cy.url().should('include', '/init/endpoint')
    })
  })
})
