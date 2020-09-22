context('Standard RBAC tests against docker standalone', () => {
  before(() => {
    cy.visit('/');
  });

  after(() => {});

  describe('Validate endpoint admin functionality', function () {
    beforeEach(() => {
      cy.visit('/');
      cy.auth('frontend', 'admin', 'portainer');
    });

    afterEach(() => {
      // Cleanup remaining users and teams
      cy.deleteUsers();
      cy.deleteTeams();
      // Clean Tokens
      cy.clearUserTokens();
    });

    it('User assigned as endpoint-admin against an endpoint', function () {
      // Create and assign user as the administrator
      cy.createUser('frontend', 'adam', 'portainer');
      cy.assignAccess('local', 'adam', 'user');
      cy.clearBrowserToken();

      // Login and create, read, update, delete resources as user
      cy.visit('/');
      cy.auth('frontend', 'adam', 'portainer');
      cy.selectEndpoint('local');

      // create resources
      cy.modifyResources('frontend', 'create');
      // modify resources
      // delete resources
      cy.modifyResources('frontend', 'delete');
    });
  });
});
