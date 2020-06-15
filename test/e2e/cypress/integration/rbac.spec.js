// RBAC testing with different authentication options
context('RBAC Tests', () => {
  // Test with Internal Authentication
  describe('Standard RBAC', function () {
    before(() => {
      // Start cypress server for XHR waiting
      cy.server();
      cy.frontendAuth('admin', 'portaineriscool');
      // Wait for auth and redirection to the dashboard
      cy.wait(500);
      cy.frontendEnableExtension(Cypress.env('RBAC_KEY'));
      cy.saveLocalStorage();
    });
    beforeEach(() => {
      cy.visit('/');
      cy.restoreLocalStorage();

      // Create users and teams required for test
      cy.apiCreateUser('adam', 'portainer');
      cy.apiCreateUser('eve', 'portainer');
      cy.apiCreateUser('bob', 'portainer');
      cy.apiCreateUser('steve', 'portainer');
      cy.apiCreateTeam('admins');
      cy.apiCreateTeam('helpdesk');
      cy.apiCreateTeam('standard');
      cy.apiCreateTeam('readonly');
    });

    afterEach(() => {
      // Cleanup users and teams required for test
      // cy.apiDeleteUser('adam', 'portainer');
      // cy.apiDeleteUser('eve', 'portainer');
      // cy.apiDeleteUser('bob', 'portainer');
      // cy.apiDeleteUser('steve', 'portainer');
      // cy.apiDeleteTeam('admins');
      // cy.apiDeleteTeam('helpdesk');
      // cy.apiDeleteTeam('standard');
      // cy.apiDeleteTeam('readonly');
    });

    it('User assigned as endpoint-admin against an endpoint', function () {
      cy.assignAccess('adam', 'user', 'Endpoint administrator');
      cy.assignToTeam('adam', 'admins');
      cy.assignToTeam('eve', 'helpdesk');
      cy.assignToTeam('bob', 'standard');
      cy.assignToTeam('steve', 'readonly');
      cy.assignAccess('admins', 'team', 'Endpoint administrator');
      cy.assignAccess('helpdesk', 'team', 'Helpdesk');
      cy.assignAccess('standard', 'team', 'Standard user');
      cy.assignAccess('readonly', 'team', 'Read-only user');
    });

    // TODO: Implement RBAC tests
    // it('User created, user logged in, user assigned as endpoint-admin against an endpoint', function () {
    // });
    // it('User created, user assigned as helpdesk against an endpoint', function () {
    // });
    // it('User created, user logged in, user assigned as helpdesk against an endpoint', function () {
    // });
    // it('User created, user assigned as standard user against an endpoint', function () {
    // });
    // it('User created, user logged in, user assigned as standard user against an endpoint', function () {
    // });
    // it('User created, user assigned as read-only against an endpoint', function () {
    // });
    // it('User created, user logged in, user assigned as read-only against an endpoint', function () {
    // });
  });

  // TODO: Test with OAuth authentication
  // describe('OAuth RBAC', function () {});
  // TODO: Test against LDAP
  // describe('LDAP RBAC', function () {});
});
