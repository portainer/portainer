// RBAC testing with different authentication options
context('Standard RBAC', () => {
  before(() => {
    cy.server();
    cy.apiAuth('admin', 'portainer');
    cy.setBrowserToken('admin');
    cy.visit('/');
    // cy.frontendAuth('admin', 'portainer');
    // cy.saveUserToken('admin');

    // Wait for auth and redirection to the dashboard
    cy.wait(1000);

    // Not sure if needed
    cy.saveLocalStorage();
  });

  after(() => {
    cy.restoreLocalStorage();
    cy.setBrowserToken('admin');

    // Cleanup remaining users and teams
    cy.apiDeleteUsers();
    cy.apiDeleteTeams();

    // Clean Tokens
    cy.clearUserTokens();
  });

  describe('Endpoint Admin', function () {
    beforeEach(() => {
      // Start cypress server for XHR waiting
      cy.server();
      cy.restoreLocalStorage();
      cy.visit('/');
      cy.wait(1000);
      // Load Admin JWT
      // cy.saveLocalStorage();
      // Set endpoint state and endpointID to bypass selecting endpoint from home
      // Logout Admin
    });

    afterEach(() => {});

    it('User assigned as endpoint-admin against an endpoint', function () {
      // load admin jwt
      // Create user required for test
      cy.apiCreateUser('adam', 'portainer');
      cy.assignAccess('adam', 'user');
      cy.clearBrowserToken();
      cy.visit('/');
      cy.frontendAuth('adam', 'portainer');
      cy.selectEndpoint('local');
      cy.wait(1000);
      // create resources
      // cy.createResources();
      // modify resources
      // delete resources
      // Cleanup user required for test
      cy.apiDeleteUser('adam');
    });
  });
});
