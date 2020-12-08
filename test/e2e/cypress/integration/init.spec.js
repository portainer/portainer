context('Init admin, first endpoint & other required endpoints/groups', () => {
  beforeEach(() => {
    cy.restoreLocalStorage();
  });
  describe('Initialise admin user and endpoint', function () {
    it('Create admin user and verify success', function () {
      cy.initAdmin('admin', 'portainer', false);
      cy.url().should('include', 'init/endpoint');
      cy.saveLocalStorage();
    });
    it('Select docker endpoint and init', function () {
      cy.initEndpoint('Docker Local', 'Docker');
      cy.url().should('include', 'home');
    });
    it('Add docker swarm endpoint', function () {
      cy.addNewEndpoint('Docker Swarm', 'Agent', 'e2e-portainer:9001');
    });
    it('Add docker swarm endpoint group', function () {
      cy.addNewEndpointGroup('Docker Swarm', 'Docker Swarm');
    });
  });
});
