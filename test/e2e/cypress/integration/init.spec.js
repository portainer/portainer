// Tests to run
context('Init admin user test', () => {
  //Browse to homepage before each test
  beforeEach(() => {
    cy.restoreLocalStorage();
  });

  describe('Init admin', function () {
    it('Create user and verify success', function () {
      cy.initAdmin('admin', 'portaineriscool');
      cy.url().should('include', 'init/endpoint');
      cy.saveLocalStorage();
    });
    it('Select endpoint and init', function () {
      cy.initEndpoint();
      cy.url().should('include', 'home');
    });
  });
});
