context('Init admin & local docker endpoint', () => {
  beforeEach(() => {
    cy.restoreLocalStorage();
  });
  describe('Initialise admin user and endpoint', function () {
    it('Create admin user and verify success', function () {
      cy.initAdmin('admin', 'portainer');
      cy.url().should('include', 'init/endpoint');
      cy.saveLocalStorage();
    });
    it('Select local docker environment and init', function () {
      cy.initEndpoint();
      cy.url().should('include', 'home');
    });
  });
});
