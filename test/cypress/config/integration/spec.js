// Tests to run
context('Tests to run', () => {
  //Browse to homepage before each test
  beforeEach(() => {
    cy.visit('/')
  })
  describe('Describes the test', function() {
    it('Test action', function() {
      cy.get('#username')
      .should('have.value', 'admin')
    })
  })
})
